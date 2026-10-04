// Browser-only adaptations of the inspected projects' pure calculations.
// No private project source, records, credentials, or account sessions are bundled.
export const overlaps = (a, b) => a.arrival_date <= b.departure_date && b.arrival_date <= a.departure_date;
export const approvedConflicts = (request, stays) => stays.filter(stay => stay.id !== request.id && stay.status === 'approved' && overlaps(request, stay));
export const staysOnDate = (day, stays) => stays.filter(stay => ['approved', 'pending', 'waitlisted'].includes(stay.status) && stay.arrival_date <= day && day <= stay.departure_date);
export function validStayRange(from, to) {
  const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T12:00:00Z')) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
  return date(from) && date(to) && from < to;
}
export function parseUsernames(value) {
  const names = value.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  if (names.length > 200 || names.some(name => !/^[a-zA-Z0-9._]{1,30}$/.test(name))) throw new Error('Use up to 200 usernames, one per line, with letters, numbers, dots, or underscores (30 characters maximum).');
  return new Set(names);
}
export const compareUsernameSets = (followers, following) => [...following].filter(username => !followers.has(username)).sort();
export const toCsv = rows => 'username\n' + rows.map(value => `"${String(value).replace(/"/g, '""')}"`).join('\n');
