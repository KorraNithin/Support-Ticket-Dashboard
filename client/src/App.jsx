import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import Summary from './components/Summary.jsx';
import TicketList from './components/TicketList.jsx';
import TicketForm from './components/TicketForm.jsx';
import TicketDetail from './components/TicketDetail.jsx';

/** Tiny hash router: '#/', '#/new', '#/tickets/:id' (survives refresh, no dependency). */
function useRoute() {
  const parse = () => window.location.hash.replace(/^#/, '') || '/';
  const [path, setPath] = useState(parse);
  useEffect(() => {
    const h = () => setPath(parse());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return path;
}

export default function App() {
  const path = useRoute();
  const [summary, setSummary] = useState({ data: null, error: false });
  const [version, setVersion] = useState(0); // bump to refetch summary + list after a change

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    api.summary().then((data) => setSummary({ data, error: false })).catch(() => setSummary((s) => ({ ...s, error: true })));
  }, [version]);

  const detail = path.match(/^\/tickets\/(\d+)$/);
  let view;
  if (path === '/new') view = <TicketForm onCreated={(t) => { refresh(); window.location.hash = `#/tickets/${t.id}`; }} />;
  else if (detail) view = <TicketDetail key={detail[1]} id={detail[1]} onChanged={refresh} />;
  else view = <TicketList refreshKey={version} />;

  return (
    <div className="app">
      <header className="top">
        <a href="#/" className="brand">Support Desk</a>
        <a href="#/new" className="btn primary">New ticket</a>
      </header>
      <main>
        <Summary data={summary.data} error={summary.error} />
        {view}
      </main>
    </div>
  );
}
