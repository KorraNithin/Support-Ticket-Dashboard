export const PRIORITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['Open', 'In Progress', 'Resolved'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates a ticket payload. Returns { errors, value }.
 * partial=true (PATCH) only validates fields that are present, and only
 * allows status/priority to change.
 */
export function validateTicket(body, { partial = false } = {}) {
  const errors = {};
  const value = {};
  const b = body && typeof body === 'object' ? body : {};

  if (!partial) {
    const title = typeof b.title === 'string' ? b.title.trim() : '';
    if (!title) errors.title = 'Title is required.';
    else if (title.length > 120) errors.title = 'Title must be 120 characters or fewer.';
    else value.title = title;

    const description = typeof b.description === 'string' ? b.description.trim() : '';
    if (!description) errors.description = 'Description is required.';
    else value.description = description;

    const email = typeof b.customer_email === 'string' ? b.customer_email.trim() : '';
    if (!email) errors.customer_email = 'Customer email is required.';
    else if (!EMAIL_RE.test(email) || email.length > 254) errors.customer_email = 'Enter a valid email address.';
    else value.customer_email = email;
  }

  if (b.priority !== undefined || !partial) {
    const priority = b.priority === undefined ? 'Medium' : b.priority;
    if (!PRIORITIES.includes(priority)) errors.priority = `Priority must be one of: ${PRIORITIES.join(', ')}.`;
    else value.priority = priority;
  }
  if (b.status !== undefined || !partial) {
    const status = b.status === undefined ? 'Open' : b.status;
    if (!STATUSES.includes(status)) errors.status = `Status must be one of: ${STATUSES.join(', ')}.`;
    else value.status = status;
  }

  if (partial && Object.keys(errors).length === 0 && Object.keys(value).length === 0) {
    errors.body = 'Provide at least one of: status, priority.';
  }
  return { errors, value };
}

/** Parses list query params with safe defaults. */
export function parseListQuery(q) {
  const errors = {};
  const page = q.page === undefined ? 1 : Number(q.page);
  if (!Number.isInteger(page) || page < 1) errors.page = 'page must be a positive integer.';
  if (q.status && !STATUSES.includes(q.status)) errors.status = `status must be one of: ${STATUSES.join(', ')}.`;
  if (q.priority && !PRIORITIES.includes(q.priority)) errors.priority = `priority must be one of: ${PRIORITIES.join(', ')}.`;
  const sort = q.sort === undefined ? 'newest' : q.sort;
  if (!['newest', 'oldest'].includes(sort)) errors.sort = 'sort must be "newest" or "oldest".';
  return {
    errors,
    value: { page, sort, status: q.status || '', priority: q.priority || '', search: (q.search || '').toString().trim() },
  };
}
