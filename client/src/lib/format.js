export function beirutDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Beirut', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const get = name => parts.find(part => part.type === name).value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function money(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, currencyDisplay: currency === 'LBP' ? 'code' : 'symbol',
    maximumFractionDigits: currency === 'LBP' ? 0 : 2,
  }).format(Number(amount))
}

export function dateLabel(date) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`))
}

export function monthLabel(month) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${month}-01T00:00:00Z`))
}

// Budget values and rounded USD totals have at most two decimal places.
export function remainingBudget(budget, expenses) {
  const cents = value => {
    const [whole, fraction = ''] = String(value).split('.')
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2))
  }
  const difference = cents(budget) - cents(expenses)
  const absolute = difference < 0n ? -difference : difference
  return `${difference < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`
}