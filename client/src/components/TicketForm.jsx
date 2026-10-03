import React, { useState } from 'react';
import { api, PRIORITIES, STATUSES, EMAIL_RE } from '../api.js';
import { Field } from '../ui.jsx';

const EMPTY = { title: '', description: '', customer_email: '', priority: 'Medium', status: 'Open' };

/** Client-side mirror of the server rules (server remains the source of truth). */
function validate(v) {
  const e = {};
  if (!v.title.trim()) e.title = 'Title is required.';
  else if (v.title.trim().length > 120) e.title = 'Title must be 120 characters or fewer.';
  if (!v.description.trim()) e.description = 'Description is required.';
  if (!v.customer_email.trim()) e.customer_email = 'Customer email is required.';
  else if (!EMAIL_RE.test(v.customer_email.trim())) e.customer_email = 'Enter a valid email address.';
  return e;
}

export default function TicketForm({ onCreated }) {
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const on = (k) => (e) => setV({ ...v, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const errs = validate(v);
    setErrors(errs); setFormError('');
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const t = await api.create(v);
      onCreated(t);
    } catch (err) {
      setErrors(err.details || {});
      setFormError(Object.keys(err.details || {}).length ? 'Fix the highlighted fields and try again.' : err.message);
    } finally { setSaving(false); }
  }

  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <h2>New ticket</h2>
      {formError && <p className="banner error" role="alert">{formError}</p>}
      <Field label="Title" htmlFor="title" error={errors.title} hint={`${v.title.length}/120`}>
        <input id="title" value={v.title} onChange={on('title')} aria-describedby="title-err" aria-invalid={!!errors.title} />
      </Field>
      <Field label="Description" htmlFor="description" error={errors.description}>
        <textarea id="description" rows="5" value={v.description} onChange={on('description')} aria-invalid={!!errors.description} />
      </Field>
      <Field label="Customer email" htmlFor="customer_email" error={errors.customer_email}>
        <input id="customer_email" type="email" value={v.customer_email} onChange={on('customer_email')} aria-invalid={!!errors.customer_email} />
      </Field>
      <div className="row">
        <Field label="Priority" htmlFor="priority" error={errors.priority}>
          <select id="priority" value={v.priority} onChange={on('priority')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
        </Field>
        <Field label="Status" htmlFor="status" error={errors.status}>
          <select id="status" value={v.status} onChange={on('status')}>{STATUSES.map((p) => <option key={p}>{p}</option>)}</select>
        </Field>
      </div>
      <div className="actions">
        <button className="btn primary" disabled={saving}>{saving ? 'Creating…' : 'Create ticket'}</button>
        <a className="btn" href="#/">Cancel</a>
      </div>
    </form>
  );
}
