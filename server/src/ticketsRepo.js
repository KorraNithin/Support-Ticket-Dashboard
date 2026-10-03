const PAGE_SIZE = 10;

/** Data-access layer: all SQL lives here so routes stay thin. */
export function createTicketsRepo(db) {
  const getStmt = db.prepare('SELECT * FROM tickets WHERE id = ?');

  return {
    PAGE_SIZE,

    create({ title, description, customer_email, priority, status }) {
      const info = db
        .prepare('INSERT INTO tickets (title, description, customer_email, priority, status) VALUES (?,?,?,?,?)')
        .run(title, description, customer_email, priority, status);
      return getStmt.get(info.lastInsertRowid);
    },

    get: (id) => getStmt.get(id),

    update(id, fields) {
      const keys = Object.keys(fields);
      const set = keys.map((k) => `${k} = ?`).join(', ');
      db.prepare(`UPDATE tickets SET ${set}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`).run(
        ...keys.map((k) => fields[k]),
        id
      );
      return getStmt.get(id);
    },

    /** Search + filters + sort + pagination, all combined in one WHERE clause. */
    list({ search, status, priority, sort, page }) {
      const where = [];
      const params = [];
      if (search) {
        const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
        where.push("(title LIKE ? ESCAPE '\\' OR customer_email LIKE ? ESCAPE '\\')");
        params.push(like, like);
      }
      if (status) { where.push('status = ?'); params.push(status); }
      if (priority) { where.push('priority = ?'); params.push(priority); }
      const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const dir = sort === 'oldest' ? 'ASC' : 'DESC';

      const total = db.prepare(`SELECT COUNT(*) AS n FROM tickets ${clause}`).get(...params).n;
      const items = db
        .prepare(`SELECT * FROM tickets ${clause} ORDER BY created_at ${dir}, id ${dir} LIMIT ? OFFSET ?`)
        .all(...params, PAGE_SIZE, (page - 1) * PAGE_SIZE);
      return { items, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
    },

    /** Counts over the entire dataset, independent of any filters. */
    summary() {
      const rows = db.prepare('SELECT status, COUNT(*) AS n FROM tickets GROUP BY status').all();
      const out = { total: 0, open: 0, inProgress: 0, resolved: 0 };
      for (const { status, n } of rows) {
        out.total += n;
        if (status === 'Open') out.open = n;
        else if (status === 'In Progress') out.inProgress = n;
        else out.resolved = n;
      }
      return out;
    },
  };
}
