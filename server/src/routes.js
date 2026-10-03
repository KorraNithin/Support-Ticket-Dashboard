import { Router } from 'express';
import { validateTicket, parseListQuery } from './validation.js';
import { validationError, notFound } from './errors.js';

export function ticketsRouter(repo) {
  const r = Router();

  const parseId = (raw) => {
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) throw validationError({ id: 'Ticket id must be a positive integer.' });
    return id;
  };

  // NOTE: /summary must be registered before /:id
  r.get('/summary', (_req, res) => res.json(repo.summary()));

  r.get('/', (req, res) => {
    const { errors, value } = parseListQuery(req.query);
    if (Object.keys(errors).length) throw validationError(errors);
    res.json(repo.list(value));
  });

  r.post('/', (req, res) => {
    const { errors, value } = validateTicket(req.body);
    if (Object.keys(errors).length) throw validationError(errors);
    res.status(201).json(repo.create(value));
  });

  r.get('/:id', (req, res) => {
    const ticket = repo.get(parseId(req.params.id));
    if (!ticket) throw notFound('Ticket');
    res.json(ticket);
  });

  // Only status and priority are editable after creation (per requirements).
  r.patch('/:id', (req, res) => {
    const id = parseId(req.params.id);
    const { errors, value } = validateTicket(req.body, { partial: true });
    if (Object.keys(errors).length) throw validationError(errors);
    if (!repo.get(id)) throw notFound('Ticket');
    res.json(repo.update(id, value));
  });

  return r;
}
