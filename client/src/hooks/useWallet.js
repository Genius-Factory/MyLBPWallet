import { useCallback, useEffect, useState } from 'react'
import { useApi } from './useApi'
import { apiError } from '../lib/api'

export function useWallet(month, type, page) {
  const api = useApi()
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState({ key: '', data: null, error: '' })
  const key = `${month}:${type}:${page}:${revision}`
  const refresh = useCallback(() => setRevision(value => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    Promise.all([
      api.get('/api/transactions', { params: { month, type, page, limit: 25 }, signal: controller.signal }),
      api.get('/api/transactions/budget', { params: { month }, signal: controller.signal }),
    ]).then(([transactions, budget]) => {
      if (active) setState({ key, data: { ...transactions.data, budget: budget.data.budget }, error: '' })
    }).catch(error => {
      if (active) setState({ key, data: null, error: apiError(error, 'Could not load your wallet.') })
    })
    return () => { active = false; controller.abort() }
  }, [api, month, type, page, key])

  const current = state.key === key
  return {
    api, refresh,
    data: current ? state.data : null,
    error: current ? state.error : '',
    loading: !current,
  }
}