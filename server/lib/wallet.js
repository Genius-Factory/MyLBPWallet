const TIME_ZONE = 'Asia/Beirut';

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}
function today(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = name => parts.find(item => item.type === name).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && value >= '1900-01-01' && value <= '9999-12-31'
    && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function monthValue(value = today().slice(0, 7)) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value) || !validDate(`${value}-01`)) {
    throw badRequest('Choose a valid month (YYYY-MM).');
  }
  return value;
}
function dateRange(query, now = new Date()) {
  const date = today(now);
  if (query.month !== undefined) return { start: `${monthValue(query.month)}-01`, interval: '1 month' };
  switch (query.period) {
    case undefined:
    case 'this-month': return { start: `${date.slice(0, 7)}-01`, interval: '1 month' };
    case 'today': return { start: date, interval: '1 day' };
    case 'previous-month': {
      const previous = new Date(`${date.slice(0, 7)}-01T00:00:00Z`);
      previous.setUTCMonth(previous.getUTCMonth() - 1);
      return { start: previous.toISOString().slice(0, 10), interval: '1 month' };
    }
    case 'all': return null;
    default: throw badRequest('Unknown date period.');
  }
}
function money(value, allowZero = false) {
  const text = typeof value === 'number' || typeof value === 'string' ? String(value) : '';
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(text) || (!allowZero && Number(text) === 0)) {
    throw badRequest(`Enter a ${allowZero ? 'non-negative' : 'positive'} amount with at most 12 whole digits and 2 decimal places.`);
  }
  return text;
}
function configuredRate() {
  const value = process.env.LBP_PER_USD || '89500';
  if (!/^\d{1,12}(\.\d{1,6})?$/.test(value) || Number(value) <= 0) throw new Error('Invalid LBP_PER_USD configuration');
  return value;
}
function transactionInput(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 180) throw badRequest('Enter a description of 1–180 characters.');
  const amount = money(body.amount);
  const currency = body.currency ?? 'LBP';
  const type = body.type ?? 'expense';
  const date = body.date ?? today();
  if (!['LBP', 'USD'].includes(currency)) throw badRequest('Choose LBP or USD.');
  if (!['income', 'expense'].includes(type)) throw badRequest('Choose income or expense.');
  if (!validDate(date)) throw badRequest('Choose a valid transaction date.');
  if (body.notes != null && (typeof body.notes !== 'string' || body.notes.length > 2000)) throw badRequest('Notes must be at most 2,000 characters.');
  return { title, amount, currency, type, date, notes: body.notes?.trim() || null };
}
function integer(value, fallback, max) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > max) throw badRequest('Invalid page, limit, or transaction ID.');
  return Number(value);
}
module.exports = { today, validDate, monthValue, dateRange, money, configuredRate, transactionInput, integer, badRequest };