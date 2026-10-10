import { test, expect } from '@playwright/test'

const initial = [
  { id: 1, title: 'Monthly salary', amount: '1200.00', currency: 'USD', type: 'income', date: '2026-09-01', notes: 'September', category: 'Salary', lbp_per_usd: '89500' },
  { id: 2, title: 'Groceries', amount: '4475000.00', currency: 'LBP', type: 'expense', date: '2026-09-12', notes: 'Weekly shop', category: 'Food', lbp_per_usd: '89500' },
]
async function fixture(page, options = {}) {
  let transactions = options.empty ? [] : structuredClone(initial)
  let budget = options.noBudget ? null : { amount: '600.00', currency: 'USD' }
  let failSave = Boolean(options.failSave)
  let failLoad = Boolean(options.failLoad)
  let failBudget = Boolean(options.failBudget)
  let posts = 0
  let reads = 0
  await page.route('**/api/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const body = method === 'POST' || method === 'PUT' ? request.postDataJSON() : null
    const respond = (data, status = 200) => route.fulfill({ status, json: data })
    if (!request.headers().authorization) return respond({ error: 'Missing test token' }, 401)
    if (url.pathname.endsWith('/budget')) {
      if (method === 'PUT') {
        if (failBudget) return respond({ error: 'Budget temporarily unavailable.' }, 503)
        budget = { amount: Number(body.amount).toFixed(2), currency: 'USD' }
      }
      return respond({ budget })
    }
    if (method === 'POST') {
      posts++
      if (options.saveDelay) await new Promise(resolve => setTimeout(resolve, options.saveDelay))
      if (failSave) return respond({ error: 'Could not save. Try again.' }, 503)
      const transaction = { ...body, id: 100 + posts, lbp_per_usd: '89500' }
      transactions.push(transaction)
      return respond({ transaction }, 201)
    }
    if (method === 'DELETE') {
      transactions = transactions.filter(item => item.id !== Number(url.pathname.split('/').pop()))
      return route.fulfill({ status: 204 })
    }
    if (method === 'PUT') {
      transactions = transactions.map(item => item.id === Number(url.pathname.split('/').pop()) ? { ...item, ...body } : item)
      return respond({ transaction: transactions.find(item => item.id === Number(url.pathname.split('/').pop())) })
    }
    reads++
    if (failLoad) return respond({ error: 'Wallet temporarily unavailable.' }, 503)
    const month = url.searchParams.get('month')
    if (options.slowMonth === month) await new Promise(resolve => setTimeout(resolve, 500))
    const matching = transactions.filter(item => item.date.startsWith(month))
    const income = matching.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount) / (item.currency === 'LBP' ? 89500 : 1), 0)
    const expenses = matching.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount) / (item.currency === 'LBP' ? 89500 : 1), 0)
    const type = url.searchParams.get('type')
    const visible = matching
      .filter(item => type === 'all' || item.type === type)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    return respond({
      transactions: visible, totals: {
        income: income.toFixed(2), expenses: expenses.toFixed(2), balance: (income - expenses).toFixed(2),
        incomeLbp: String(income * 89500), expensesLbp: String(expenses * 89500), balanceLbp: String((income - expenses) * 89500),
        transactionCount: matching.length, excludedCount: 0,
      },
      pagination: { page: 1, pages: 1, limit: 25, total: visible.length },
      rate: { lbpPerUsd: '89500', source: 'configured' },
    })
  })
  return {
    saveWorks: () => { failSave = false }, loadWorks: () => { failLoad = false }, budgetWorks: () => { failBudget = false },
    posts: () => posts, reads: () => reads,
  }
}
async function openTracker(page) {
  await page.goto('/dashboard')
  await page.getByLabel('Viewing month').fill('2026-09')
  await expect(page.getByRole('heading', { name: 'Transaction history' })).toBeVisible()
}
test('desktop overview, filter, editing, deletion confirmation and persistence', async ({ page }) => {
  await fixture(page)
  await openTracker(page)
  await expect(page.getByText('$1,200.00', { exact: true })).toBeVisible()
  await expect(page.getByRole('listitem').first()).toContainText('Groceries')
  await expect(page.getByText('Category: Food')).toBeVisible()
  await page.getByRole('combobox', { name: 'Show' }).selectOption('expense')
  await expect(page.getByRole('button', { name: 'Edit Monthly salary' })).toHaveCount(0)
  await expect(page.getByText('$1,200.00', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit Groceries' }).click()
  await page.getByLabel('Description', { exact: true }).fill('Food shopping')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('button', { name: 'Delete Food shopping' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Delete Food shopping' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete Food shopping' }).click()
  await page.getByRole('button', { name: 'Keep entry' }).click()
  await expect(page.getByRole('button', { name: 'Delete Food shopping' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete Food shopping' }).click()
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Delete Food shopping' })).toHaveCount(0)
  await page.screenshot({ path: '../.artifacts/tracker-desktop.png', fullPage: true })
})
test('failed transaction retains input and prevents duplicate submissions', async ({ page }) => {
  const api = await fixture(page, { failSave: true, saveDelay: 150 })
  await openTracker(page)
  await page.getByLabel('Description', { exact: true }).fill('Taxi')
  await page.getByLabel('Amount', { exact: true }).fill('10')
  await page.getByRole('button', { name: 'Add expense', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Saving…', exact: true })).toBeDisabled()
  await expect(page.getByRole('alert')).toContainText('Could not save')
  await expect(page.getByLabel('Description', { exact: true })).toHaveValue('Taxi')
  await expect(page.getByLabel('Amount', { exact: true })).toHaveValue('10')
  expect(api.posts()).toBe(1)
  api.saveWorks()
  await page.getByRole('button', { name: 'Add expense', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Edit Taxi' })).toBeVisible()
  await expect(page.getByLabel('Amount', { exact: true })).toHaveValue('')
})
test('budget failure preserves input; zero budget persists and shows overspending', async ({ page }) => {
  const api = await fixture(page, { noBudget: true, failBudget: true })
  await openTracker(page)
  await page.getByLabel('Budget (USD)').fill('0')
  await page.getByRole('button', { name: 'Save budget' }).click()
  await expect(page.getByRole('alert')).toContainText('Budget temporarily unavailable')
  await expect(page.getByLabel('Budget (USD)')).toHaveValue('0')
  api.budgetWorks()
  await page.getByRole('button', { name: 'Save budget' }).click()
  await expect(page.getByText('Over budget', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Over budget', { exact: true })).toBeVisible()
})
test('load errors show retry, never false zero totals', async ({ page }) => {
  const api = await fixture(page, { failLoad: true })
  await page.goto('/dashboard')
  await expect(page.getByRole('alert')).toContainText('Wallet temporarily unavailable')
  await expect(page.getByText('Total income', { exact: true })).toHaveCount(0)
  api.loadWorks()
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText('Total income', { exact: true })).toBeVisible()
})
test('late responses from an old month cannot overwrite the selected month', async ({ page }) => {
  await fixture(page, { slowMonth: '2026-08' })
  await openTracker(page)
  await page.getByLabel('Viewing month').fill('2026-08')
  await page.getByLabel('Viewing month').fill('2026-09')
  await expect(page.getByText('$1,200.00', { exact: true })).toBeVisible()
  await page.waitForTimeout(650)
  await expect(page.getByText('$1,200.00', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Viewing month')).toHaveValue('2026-09')
})
test('mobile layout, keyboard focus and empty state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await fixture(page, { empty: true, noBudget: true })
  await openTracker(page)
  await expect(page.getByText('No transactions to show')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByLabel('Description', { exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Groceries', exact: true })).toBeFocused()
  await page.screenshot({ path: '../.artifacts/tracker-mobile.png', fullPage: true })
})
test('private requests wait for Clerk readiness', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('test-auth-delay', '800'))
  const api = await fixture(page)
  await page.goto('/dashboard')
  await expect(page.getByText('Loading your account…')).toBeVisible()
  expect(api.reads()).toBe(0)
  await expect(page.getByRole('heading', { name: 'Transaction history' })).toBeVisible()
})
test('signed-out guard redirects legacy wallet URL to sign-in', async ({ page }) => {
  await fixture(page)
  await page.addInitScript(() => localStorage.setItem('test-signed-out', 'true'))
  await page.goto('/wallet')
  await expect(page).toHaveURL(/sign-in/)
  await expect(page.getByText('Sign in form')).toBeVisible()
})
test('members cannot open admin pages and old wallet links open the tracker', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('test-member', 'true'))
  await fixture(page)
  await page.goto('/admin-dashboard')
  await expect(page).toHaveURL(/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Transaction history' })).toBeVisible()
  await expect(page.getByText('Admin', { exact: true })).toHaveCount(0)
  await page.goto('/wallet')
  await expect(page).toHaveURL(/dashboard$/)
})