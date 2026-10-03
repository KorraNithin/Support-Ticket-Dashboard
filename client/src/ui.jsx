import React from 'react';

export const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');
export const Badge = ({ kind, value }) => <span className={`badge ${kind}-${slug(value)}`}>{value}</span>;

export const Loading = ({ label = 'Loading…' }) => <p className="state" role="status">{label}</p>;
export const Empty = ({ children }) => <p className="state empty">{children}</p>;
export const ErrorBox = ({ message, onRetry }) => (
  <div className="state error" role="alert">
    <p>{message}</p>
    {onRetry && <button className="btn" onClick={onRetry}>Try again</button>}
  </div>
);

export function Field({ label, error, children, htmlFor, hint }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <small>{hint}</small>}
      {error && <small className="err" id={`${htmlFor}-err`}>{error}</small>}
    </div>
  );
}
