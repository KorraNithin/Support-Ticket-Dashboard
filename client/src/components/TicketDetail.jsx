import React, { useEffect, useState, useCallback } from 'react';
import { api, PRIORITIES, STATUSES, fmtDate } from '../api.js';
import { Loading, ErrorBox, Badge } from '../ui.jsx';

export default function TicketDetail({ id, onChanged }) {
  const [state, setState] = useState({ loading: true, error: null, ticket: null, notFound: false });
  const [draft, setDraft] = useState({ status: '', priority: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    api.get(id)
      .then((ticket) => { setState({ loading: false, error: null, ticket, notFound: false }); setDraft({ status: ticket.status, priority: ticket.priority }); })
      .catch((e) => setState({ loading: false, error: e.message, ticket: null, notFound: e.status === 404 }));
  }, [id]);
  useEffect(load, [load]);

  const { ticket } = state;
  const dirty = ticket && (draft.status !== ticket.status || draft.priority !== ticket.priority);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const updated = await api.update(id, draft);
      setState((s) => ({ ...s, ticket: updated }));
      setMsg({ ok: true, text: 'Changes saved.' });
      onChanged();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setSaving(false); }
  }

  if (state.loading && !ticket) return <Loading label="Loading ticket…" />;
  if (state.notFound) return <div className="state error"><p>Ticket #{id} doesn't exist.</p><a className="btn" href="#/">Back to tickets</a></div>;
  if (state.error) return <ErrorBox message={state.error} onRetry={load} />;

  return (
    <article className="panel detail">
      <a href="#/" className="back">Back to tickets</a>
      <h2>{ticket.title}</h2>
      <p className="t-badges"><Badge kind="priority" value={ticket.priority} /><Badge kind="status" value={ticket.status} /></p>
      <dl>
        <dt>Customer</dt><dd><a href={`mailto:${ticket.customer_email}`}>{ticket.customer_email}</a></dd>
        <dt>Created</dt><dd>{fmtDate(ticket.created_at)}</dd>
        <dt>Last updated</dt><dd>{fmtDate(ticket.updated_at)}</dd>
      </dl>
      <h3>Description</h3>
      <p className="desc">{ticket.description}</p>

      <div className="update">
        <h3>Update ticket</h3>
        <div className="row">
          <div className="field"><label htmlFor="d-status">Status</label>
            <select id="d-status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="field"><label htmlFor="d-priority">Priority</label>
            <select id="d-priority" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div className="actions">
          <button className="btn primary" disabled={!dirty || saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
          {msg && <span className={msg.ok ? 'ok' : 'err'} role="status">{msg.text}</span>}
        </div>
      </div>
    </article>
  );
}
