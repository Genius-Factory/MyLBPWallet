import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useApi } from "../hooks/useApi";

export default function WalletPage() {
  const api = useApi();
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expenses: 0, expensesUsd: 0, balance: 0 });
  const [budget, setBudget] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      const [{ data: transactionData }, { data: budgetData }] = await Promise.all([
        api.get("/api/transactions", { params: { period: "this-month", type: "all" } }),
        api.get("/api/transactions/budget"),
      ]);
      setTransactions(transactionData.transactions || []);
      setTotals({ income: 0, expenses: 0, expensesUsd: 0, balance: 0, ...(transactionData.totals || {}) });
      const savedBudget = budgetData.budget?.amount;
      setBudget(savedBudget ?? "");
      setBudgetInput(savedBudget ?? "");
    } catch {
      toast.error("Could not load wallet data");
    }
  }, [api]);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  const saveBudget = async (event) => {
    event.preventDefault();
    const amount = Number(budgetInput);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid monthly budget");
      return;
    }
    setIsSavingBudget(true);
    try {
      const { data } = await api.put("/api/transactions/budget", { amount });
      setBudget(data.budget.amount);
      setBudgetInput(data.budget.amount);
      toast.success("Monthly budget saved");
    } catch {
      toast.error("Could not save monthly budget");
    } finally {
      setIsSavingBudget(false);
    }
  };

  const remainingBudget = Number(budget || 0) - Number(totals.expensesUsd || 0);
  const hasBudget = budget !== "";

  return (
    <section className="min-h-[420px] rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-center text-2xl font-semibold text-slate-900">Wallet</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">This month&apos;s wallet totals are loaded from your saved transactions.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[["Total income", totals.income, "text-emerald-700"], ["Total expenses", totals.expenses, "text-rose-700"], ["Balance", totals.balance, totals.balance < 0 ? "text-rose-700" : "text-slate-900"]].map(([label, amount, color]) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-xl font-bold ${color}`}>{Number(amount).toLocaleString()} LBP</p>
          </article>
        ))}
      </div>
      <div className="mt-6 grid gap-6 rounded-xl bg-slate-300/90 p-4 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-200 p-4">
          <h2 className="text-lg font-semibold">Monthly expenses</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">${Number(totals.expensesUsd || 0).toFixed(2)} USD</p>
          <p className="mt-1 text-sm text-slate-600">Calculated from saved expenses this month.</p>
          <p className="mt-3 text-sm text-slate-600">{transactions.length} saved transaction{transactions.length === 1 ? "" : "s"} this month</p>
        </div>
        <div className="rounded-xl bg-slate-200 p-4">
          <h2 className="text-lg font-semibold">Savings &amp; remaining budget</h2>
          <form onSubmit={saveBudget}>
            <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="monthly-budget">Monthly budget (USD)</label>
            <input id="monthly-budget" type="number" min="0" step="0.01" value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} placeholder="Enter monthly budget" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            <button type="submit" disabled={isSavingBudget} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400">{isSavingBudget ? "Saving..." : "Save budget"}</button>
          </form>
          <div className="mt-3 grid gap-2 text-sm text-slate-700">
            <p>Savings: <span className="font-semibold">{hasBudget ? `$${Math.max(remainingBudget, 0).toFixed(2)}` : "Set a budget"}</span></p>
            <p>Remaining budget: <span className={`font-semibold ${remainingBudget < 0 ? "text-red-600" : "text-emerald-700"}`}>{hasBudget ? `$${remainingBudget.toFixed(2)}` : "Set a budget"}</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}