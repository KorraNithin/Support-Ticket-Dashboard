import { openDb } from './db.js';

const subjects = [
  ['Cannot log in after password reset', 'The reset link works but the new password is rejected on the login page.'],
  ['Invoice shows wrong amount', 'Our March invoice has an extra seat charged that we removed in February.'],
  ['Export to CSV times out', 'Exporting more than 5,000 rows fails with a gateway timeout.'],
  ['Request: dark mode', 'Several team members would like a dark theme for night shifts.'],
  ['Email notifications not arriving', 'Assignment notifications stopped arriving on Monday. Spam folder checked.'],
  ['Two-factor code never received', 'SMS codes are not delivered to a +44 number.'],
  ['Dashboard loads slowly', 'The main dashboard takes 20+ seconds to render for our large workspace.'],
  ['Cannot delete a project', 'Delete button is greyed out even though I am the workspace owner.'],
  ['API returns 500 on bulk update', 'PATCH /items with more than 50 ids returns 500 intermittently.'],
  ['Add teammate to billing contacts', 'Please add finance@example.com as a billing contact.'],
  ['Mobile app crashes on launch', 'Since the latest update the Android app closes immediately.'],
  ['Data missing after migration', 'Attachments from before 2023 are not visible after the migration.'],
  ['SSO setup question', 'Do you support SAML with Okta? Need steps for configuration.'],
  ['Refund request', 'Charged twice for the annual plan on the 3rd.'],
  ['Typo in welcome email', 'The welcome email says "Wellcome" in the header.'],
];
const people = ['ana', 'ben', 'chloe', 'dev', 'elena', 'farid', 'grace', 'hiro', 'isla', 'jon'];
const domains = ['acme.com', 'globex.io', 'initech.co', 'umbrella.org', 'hooli.net'];
const priorities = ['Low', 'Medium', 'High'];
const statuses = ['Open', 'In Progress', 'Resolved'];

const db = openDb();
db.exec('DELETE FROM tickets');
const insert = db.prepare(
  'INSERT INTO tickets (title, description, customer_email, priority, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?)'
);
const now = Date.now();
const DAY = 86_400_000;
const COUNT = 38;

db.transaction(() => {
  for (let i = 0; i < COUNT; i++) {
    const [title, description] = subjects[i % subjects.length];
    const email = `${people[(i * 3) % people.length]}.${i}@${domains[i % domains.length]}`;
    const created = new Date(now - (COUNT - i) * 0.7 * DAY - i * 3_600_000).toISOString();
    const updated = new Date(Math.min(now, Date.parse(created) + (i % 4) * 3_600_000)).toISOString();
    insert.run(`${title}${i >= subjects.length ? ` (#${i + 1})` : ''}`, description, email,
      priorities[(i * 2 + (i >> 2)) % 3], statuses[(i + (i >> 3)) % 3], created, updated);
  }
})();
console.log(`Seeded ${COUNT} tickets.`);
