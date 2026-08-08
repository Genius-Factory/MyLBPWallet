import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Database, RefreshCw, Table2 } from 'lucide-react'
import { useApi } from '../hooks/useApi'

const PAGE_SIZE = 25

function formatValue(value) {
  if (value === null) return 'NULL'
  if (value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function DatabasePage() {
  const api = useApi()
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState('')
  const [tableData, setTableData] = useState(null)
  const [page, setPage] = useState(0)
  const [loadingTables, setLoadingTables] = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [error, setError] = useState('')

  const totalPages = useMemo(() => {
    if (!tableData?.total) return 1
    return Math.max(Math.ceil(tableData.total / PAGE_SIZE), 1)
  }, [tableData])

  const loadTables = async () => {
    setError('')
    setLoadingTables(true)

    try {
      const response = await api.get('/api/database/tables')
      const nextTables = response.data.tables || []

      setTables(nextTables)
      setSelectedTable((current) => current || nextTables[0]?.table_name || '')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load database tables.')
    } finally {
      setLoadingTables(false)
    }
  }

  useEffect(() => {
    loadTables()
  }, [])

  useEffect(() => {
    if (!selectedTable) return

    const loadRows = async () => {
      setError('')
      setLoadingRows(true)

      try {
        const response = await api.get(`/api/database/tables/${selectedTable}`, {
          params: {
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
          },
        })

        setTableData(response.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load table records.')
      } finally {
        setLoadingRows(false)
      }
    }

    loadRows()
  }, [api, page, selectedTable])

  const selectTable = (tableName) => {
    setSelectedTable(tableName)
    setPage(0)
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase text-blue-600">
              <Database size={16} />
              Database
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Tables and Records</h1>
          </div>

          <button
            type="button"
            onClick={loadTables}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-900">Tables</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {tables.length}
            </span>
          </div>

          <div className="flex max-h-[520px] flex-col gap-1 overflow-y-auto">
            {loadingTables ? (
              <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                Loading tables...
              </div>
            ) : tables.length === 0 ? (
              <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                No tables found.
              </div>
            ) : (
              tables.map((table) => (
                <button
                  key={table.table_name}
                  type="button"
                  onClick={() => selectTable(table.table_name)}
                  className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                    selectedTable === table.table_name
                      ? 'bg-blue-100 font-semibold text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Table2 size={16} className="shrink-0" />
                    <span className="truncate">{table.table_name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">{table.estimated_rows}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{selectedTable || 'Select a table'}</h2>
              <p className="text-sm text-slate-500">
                {tableData ? `${tableData.total} records` : 'Choose a table to inspect rows and columns.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(value - 1, 0))}
                disabled={page === 0 || loadingRows}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-24 text-center text-sm text-slate-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(value + 1, totalPages - 1))}
                disabled={page + 1 >= totalPages || loadingRows}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Columns</h3>
            <div className="flex flex-wrap gap-2">
              {tableData?.columns?.length ? (
                tableData.columns.map((column) => (
                  <span
                    key={column.column_name}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                  >
                    <strong>{column.column_name}</strong> {column.data_type}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No columns loaded.</span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {tableData?.columns?.map((column) => (
                    <th
                      key={column.column_name}
                      className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700"
                    >
                      {column.column_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loadingRows ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={tableData?.columns?.length || 1}>
                      Loading records...
                    </td>
                  </tr>
                ) : tableData?.rows?.length ? (
                  tableData.rows.map((row, index) => (
                    <tr key={`${selectedTable}-${page}-${index}`} className="hover:bg-slate-50">
                      {tableData.columns.map((column) => (
                        <td
                          key={column.column_name}
                          className="max-w-xs whitespace-nowrap px-4 py-3 text-slate-700"
                          title={formatValue(row[column.column_name])}
                        >
                          <span className="block truncate">{formatValue(row[column.column_name])}</span>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={tableData?.columns?.length || 1}>
                      No records in this table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
