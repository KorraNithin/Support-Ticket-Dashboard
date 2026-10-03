import React from 'react';

/** Whole-dataset counts. `version` changes after edits so the numbers refresh. */
export default function Summary({ data, error }) {
  const items = [
    ['Total', data?.total, 'all'],
    ['Open', data?.open, 'open'],
    ['In Progress', data?.inProgress, 'in-progress'],
    ['Resolved', data?.resolved, 'resolved'],
  ];
  return (
    <section className="summary" aria-label="Ticket summary">
      {items.map(([label, n, k]) => (
        <div key={label} className={`stat stat-${k}`}>
          <span className="stat-n">{error ? '–' : n ?? '…'}</span>
          <span className="stat-l">{label}</span>
        </div>
      ))}
    </section>
  );
}
