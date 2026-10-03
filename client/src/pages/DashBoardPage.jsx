import { useCallback, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { NumericFormat } from "react-number-format";
import { Pencil, Trash2, Droplet, Fuel, ShoppingCart, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { useApi } from "../hooks/useApi";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashBoardPage() {
  const RATE = 89500;
  const [selectedCategory, setSelectedCategory] = useState("Electricity");
  const [lbp, setLbp] = useState("");
  const [usd, setUsd] = useState("");
  const [chartData, setChartData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState("this-month");
  const [type, setType] = useState("all");
  const [totals, setTotals] = useState({ income: 0, expenses: 0, balance: 0 });
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeSource, setIncomeSource] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeNotes, setIncomeNotes] = useState("");
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const api = useApi();

  const categories = [
    { label: "Electricity", icon: Zap },
    { label: "Water", icon: Droplet },
    { label: "Groceries", icon: ShoppingCart },
    { label: "Fuel", icon: Fuel },
  ];

  const handleLbpChange = ({ value }) => {
    setLbp(value);

    if (value === "") {
      setUsd("");
      return;
    }

    const converted = (Number(value) / RATE).toFixed(2);
    setUsd(converted);
  };

  const handleAddExpense = () => {
    if (lbp === "") return;

    api.post("/api/transactions", {
      title: selectedCategory,
      amount: lbp,
      currency: "LBP",
      type: "expense",
    })
      .then(() => loadTransactions())
      .catch(() => toast.error("Could not save this transaction"));

    setLbp("");
    setUsd("");
  };

  const handleAddIncome = async (event) => {
    event.preventDefault();
    const amount = Number(incomeAmount);

    if (!incomeSource.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an income source and a positive amount");
      return;
    }

    setIsSavingIncome(true);
    try {
      await api.post("/api/transactions", {
        title: incomeSource.trim(),
        amount,
        currency: "LBP",
        type: "income",
        notes: incomeNotes.trim() || null,
      });
      await loadTransactions();
      setIncomeSource("");
      setIncomeAmount("");
      setIncomeNotes("");
      setShowIncomeForm(false);
      toast.success("Income source added");
    } catch {
      toast.error("Could not save this income");
    } finally {
      setIsSavingIncome(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await api.delete(`/api/transactions/${id}`);
      //will set the transactions to the current transtion that is being made and the filyer it to check if it has an id or not
      setTransactions((currentTransactions) => currentTransactions.filter((transaction) => transaction.id !== id));
      await loadTransactions();
      toast.success("Transaction deleted");
    } catch {
      toast.error("Could not delete this transaction");
    }
  };

  const handleUpdateTransaction = async (event) => {
    event.preventDefault();
    setIsSavingTransaction(true);
    try {
      await api.put(`/api/transactions/${editingTransaction.id}`, {
        title: editingTransaction.title,
        amount: editingTransaction.amount,
      });
      await loadTransactions();
      setEditingTransaction(null);
      toast.success("Transaction updated");
    } catch {
      toast.error("Could not update this transaction");
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const handleCategoryClick = (label) => {
    setSelectedCategory(label);
    setLbp("");
    setUsd("");
  };

  const fetchTestData = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/live-prices");
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const result = await response.json();

      setChartData({
        labels: result.labels,
        datasets: [
          {
            label: "Market Rates",
            data: result.values,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 2,
            tension: 0.2,
          },
        ],
      });
    } catch (err) {
      console.error("Error drawing test data: ", err);
    }
  };

  const loadTransactions = useCallback(async () => {
    try {
      const { data } = await api.get("/api/transactions", { params: { period, type } });
      setTransactions(data.transactions || []);
      setTotals(data.totals || { income: 0, expenses: 0, balance: 0 });
      setCategoryTotals(data.categories || []);
    } catch {
      toast.error("Could not load transactions");
    }
  }, [api, period, type]);

  useEffect(() => {
    fetchTestData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const visibleCategories = useMemo(
    () => categoryTotals.filter((entry) => type === "all" || entry.type === type),
    [categoryTotals, type]
  );

  const incomeSources = useMemo(
    () => categoryTotals.filter((entry) => entry.type === "income"),
    [categoryTotals]
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxRotation: 35,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 18,
          usePointStyle: true,
        },
      },
      title: { display: true, text: "Prices as of Today" },
    },
  };



  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Overview</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Your money at a glance</h1>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Date filter">
            {[['today', 'Today'], ['this-month', 'This month'], ['previous-month', 'Previous month']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${period === value ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Transaction type filter">
          {[['all', 'All transactions'], ['income', 'Income only'], ['expense', 'Expenses only']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${type === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Total income", totals.income, "text-emerald-700"],
            ["Total expenses", totals.expenses, "text-rose-700"],
            ["Balance", totals.balance, totals.balance >= 0 ? "text-slate-900" : "text-rose-700"],
          ].map(([label, amount, color]) => (
            <article key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <p className={`mt-2 text-2xl font-bold ${color}`}>{Number(amount).toLocaleString()} LBP</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Breakdown</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Category totals</h2>
          </div>
          <span className="text-sm text-slate-500">Filtered period</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCategories.length === 0 ? (
            <p className="col-span-full py-4 text-sm text-slate-500">No category totals for this filter.</p>
          ) : visibleCategories.map((entry) => (
            <article key={`${entry.type}-${entry.category}`} className="rounded-lg bg-slate-100 p-4">
              <p className="font-medium text-slate-800">{entry.category}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{Number(entry.total).toLocaleString()} LBP</p>
              <p className="text-xs capitalize text-slate-500">{entry.type}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-slate-300 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,420px)_1fr] lg:items-start">
          <div className="flex w-full max-w-md flex-col gap-6">
            <label className="text-sm font-medium text-slate-700">
              LBP To USD Conversion
            </label>

            <div className="h-12 rounded-xl bg-slate-200">
              <NumericFormat
                placeholder="Enter LBP amount"
                className="h-full w-full bg-transparent p-3 text-base outline-none placeholder:text-slate-400 focus:ring-0"
                value={lbp}
                thousandSeparator=","
                valueIsNumericString={true}
                allowNegative={false}
                onValueChange={handleLbpChange}
              />
            </div>

            <div className="flex min-h-12 items-center justify-center rounded-xl bg-slate-200 px-3">
              <p className="text-center text-base">Result: ${usd || "0.00"} USD</p>
            </div>

            <button
              type="button"
              onClick={handleAddExpense}
              disabled={lbp === ""}
              className="min-h-12 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Add expense to {selectedCategory}
            </button>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => handleCategoryClick(label)}
                className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedCategory === label
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-slate-50 hover:bg-white"
                }`}
              >
                <span>{label}</span>
                <Icon size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-600">Income</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Income sources</h2>
          </div>
          <button type="button" onClick={() => setShowIncomeForm((visible) => !visible)} className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
            {showIncomeForm ? "Close form" : "+ Add income"}
          </button>
        </div>

        {showIncomeForm && (
          <form onSubmit={handleAddIncome} className="mt-5 grid gap-3 rounded-lg bg-emerald-50 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_1fr_auto] lg:items-end">
            <label className="text-sm font-medium text-slate-700">Source<input required value={incomeSource} onChange={(event) => setIncomeSource(event.target.value)} placeholder="Salary, freelance, gift..." className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-emerald-500" /></label>
            <label className="text-sm font-medium text-slate-700">Amount (LBP)<input required min="0.01" step="0.01" type="number" value={incomeAmount} onChange={(event) => setIncomeAmount(event.target.value)} placeholder="0" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-emerald-500" /></label>
            <label className="text-sm font-medium text-slate-700">Note (optional)<input value={incomeNotes} onChange={(event) => setIncomeNotes(event.target.value)} placeholder="Paycheck for September" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-emerald-500" /></label>
            <button disabled={isSavingIncome} type="submit" className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-400">{isSavingIncome ? "Saving..." : "Save income"}</button>
          </form>
        )}

        <div className="mt-6 divide-y divide-slate-100">
          {incomeSources.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-6 text-sm text-slate-500">No income sources recorded for this period.</p>
          ) : incomeSources.map((source, index) => {
            const percentage = Number(totals.income) > 0 ? (Number(source.total) / Number(totals.income)) * 100 : 0;
            const barColors = ["bg-blue-600", "bg-emerald-600", "bg-violet-500", "bg-amber-500"];
            return (
              <article key={source.category} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <p className="font-semibold text-slate-800">{source.category}</p>
                  <div className="flex items-center gap-3 text-right"><span className="font-medium text-slate-700">{Number(source.total).toLocaleString()} LBP</span><span className="w-12 text-xs text-slate-500">{percentage.toFixed(1)}%</span></div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${source.category} share of income`} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100"><div className={`h-full rounded-full ${barColors[index % barColors.length]}`} style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
              </article>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm"><span className="font-medium text-slate-600">Total income</span><span className="font-bold text-slate-900">{Number(totals.income).toLocaleString()} LBP</span></div>
      </section>
          
      <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
          <span className="text-sm text-slate-500">Latest 50</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
              <p className="font-semibold text-slate-700">No transactions yet</p>
              <p className="mt-1 text-sm text-slate-500">Your income and expenses will appear here once you add them.</p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-3 py-3">Description</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Date</th><th className="px-3 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-4 font-medium text-slate-800">{transaction.title}</td>
                    <td className="px-3 py-4 text-slate-600">{transaction.category || "Uncategorized"}</td>
                    <td className="px-3 py-4 text-slate-700">{Number(transaction.amount).toLocaleString()} {transaction.currency}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${transaction.type === "income" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-slate-500">{new Date(transaction.spent_at).toLocaleDateString()}</td>
                    <td className="px-3 py-4 text-right">
                      <button type="button" title="Edit transaction" aria-label="Edit transaction" onClick={() => setEditingTransaction({ ...transaction })} className="mr-3 text-blue-600 hover:text-blue-800"><Pencil size={17} /></button>
                      <button type="button" title="Delete transaction" aria-label="Delete transaction" onClick={() => handleDeleteTransaction(transaction.id)} className="text-red-600 hover:text-red-800"><Trash2 size={17} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {editingTransaction && (
          <form onSubmit={handleUpdateTransaction} className="mt-5 grid gap-3 rounded-lg bg-slate-100 p-4 sm:grid-cols-[1fr_180px_auto_auto] sm:items-end">
            <label className="text-sm font-medium text-slate-700">Description<input required value={editingTransaction.title} onChange={(event) => setEditingTransaction({ ...editingTransaction, title: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-blue-500" /></label>
            <label className="text-sm font-medium text-slate-700">Amount (LBP)<input required min="0.01" step="0.01" type="number" value={editingTransaction.amount} onChange={(event) => setEditingTransaction({ ...editingTransaction, amount: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-blue-500" /></label>
            <button disabled={isSavingTransaction} type="submit" className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400">Save</button>
            <button type="button" onClick={() => setEditingTransaction(null)} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          </form>
        )}
        <div className="xl">

        </div>
      </section>

      <section className="rounded-xl bg-slate-300 p-4 sm:p-6 lg:p-8">
        <h3 className="mb-6 text-center text-xl font-bold">
          Live Economic Indexes
        </h3>

        <div className="grid gap-6 lg:grid-cols-2">
          {categories.map(({ label }) => (
            <article key={label} className="min-w-0">
              <h2 className="mb-3 text-center text-lg font-bold">{label}</h2>
              <div className="h-72 w-full min-w-0 rounded-lg bg-white p-3 sm:h-80 lg:h-[350px]">
                {chartData ? (
                  <Line data={chartData} options={options} />
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-slate-500">
                    Loading market analytics data...
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
