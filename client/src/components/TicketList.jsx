import React, { useEffect, useState, useCallback } from 'react';
import { api, PRIORITIES, STATUSES, fmtDate } from '../api.js';
import { Badge, Loading, Empty, ErrorBox } from '../ui.jsx';

const DEFAULTS = { search: '', status: '', priority: '', sort: 'newest', page: 1 };

export default function TicketList({ refreshKey }) {
  const [q, setQ] = useState(DEFAULTS);
  const [searchInput, setSearchInput] = useState('');
  const [state, setState] = useState({ loading: true, error: null, data: null });

  // Debounce typing so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQ((p) => (p.search === searchInput.trim() ? p : { ...p, search: searchInput.trim(), page: 1 })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api.list(q)
      .then((data) => !cancelled && setState({ loading: false, error: null, data }))
      .catch((e) => !cancelled && setState({ loading: false, error: e.message, data: null }));
    return () => { cancelled = true; };
  }, [q, refreshKey]);
  useEffect(load, [load]);

  const set = (patch) => setQ((p) => ({ ...p, ...patch, page: 1 }));
  const { data } = state;
  const filtered = q.search || q.status || q.priority;
  const reset = () => { setSearchInput(''); setQ(DEFAULTS); };

  return (
    <section aria-label="Tickets">
      <div className="toolbar">
        <input type="search" placeholder="Search title or customer email" value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} aria-label="Search tickets" />
        <select value={q.status} onChange={(e) => set({ status: e.target.value })} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={q.priority} onChange={(e) => set({ priority: e.target.value })} aria-label="Filter by priority">
          <option value="">All priorities</option>
          {PRIORITIES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={q.sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort by created date">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {state.loading && !data && <Loading label="Loading tickets…" />}
      {state.error && <ErrorBox message={state.error} onRetry={load} />}

      {data && (
        <div className={state.loading ? 'dim' : ''} aria-busy={state.loading}>
          {data.items.length === 0 ? (
            <Empty>
              {filtered ? 'No tickets match these filters.' : 'No tickets yet. Create the first one.'}{' '}
              {filtered && <button className="link" onClick={reset}>Clear filters</button>}
            </Empty>
          ) : (
            <ul className="tickets">
              {data.items.map((t) => (
                <li key={t.id}>
                  <a href={`#/tickets/${t.id}`} className="ticket">
                    <span className="t-title">{t.title}</span>
                    <span className="t-meta">{t.customer_email} · {fmtDate(t.created_at)}</span>
                    <span className="t-badges"><Badge kind="priority" value={t.priority} /><Badge kind="status" value={t.status} /></span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <nav className="pager" aria-label="Pagination">
            <button className="btn" disabled={data.page <= 1} onClick={() => setQ({ ...q, page: q.page - 1 })}>Previous</button>
            <span>Page {data.page} of {data.totalPages} ({data.total} {data.total === 1 ? 'ticket' : 'tickets'})</span>
            <button className="btn" disabled={data.page >= data.totalPages} onClick={() => setQ({ ...q, page: q.page + 1 })}>Next</button>
          </nav>
        </div>
      )}
    </section>
  );
}
