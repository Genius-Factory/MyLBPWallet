import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { NumericFormat } from "react-number-format";
import PropTypes from "prop-types";
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

export default function DashBoardPage({ setCurrentExpenses, setCategoryWallet }) {
  const RATE = 89500;
  const CATEGORY_PRICES = {
    Electricity: 7.88,
    Water: 400000,
    Groceries: 895000,
    Fuel: 2455000,
  };
  const [selectedCategory, setSelectedCategory] = useState("Electricity");
  const [lbp, setLbp] = useState("");
  const [usd, setUsd] = useState("");
  const [chartData, setChartData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const api = useApi();

  const categories = [
    { label: "Electricity", icon: Zap },
    { label: "Water", icon: Droplet },
    { label: "Groceries", icon: ShoppingCart },
    { label: "Fuel", icon: Fuel },
  ];

  const getCategoryKey = (label) => label.toLowerCase();

  const handleLbpChange = ({ value }) => {
    setLbp(value);

    if (value === "") {
      setUsd("");
      setCurrentExpenses({ lbp: "", usd: "" });
      return;
    }

    const converted = (Number(value) / RATE).toFixed(2);
    setUsd(converted);
    setCurrentExpenses({ lbp: value, usd: converted });
  };

  const handleAddExpense = () => {
    if (lbp === "") return;

    const categoryKey = getCategoryKey(selectedCategory);
    setCategoryWallet((prev) => ({
      ...prev,
      [categoryKey]: {
        value: String((Number(prev[categoryKey]?.value) || 0) + Number(lbp)),
        usd: ((Number(prev[categoryKey]?.usd) || 0) + Number(usd)).toFixed(2),
        price: CATEGORY_PRICES[selectedCategory],
      },
    }));

    api.post("/api/transactions", {
      title: selectedCategory,
      amount: lbp,
      currency: "LBP",
      type: "expense",
    })
      .then(({ data }) => setTransactions((prev) => [data.transaction, ...prev]))
      .catch(() => toast.error("Could not save this transaction"));

    setLbp("");
    setUsd("");
    setCurrentExpenses({ lbp: "", usd: "" });
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await api.delete(`/api/transactions/${id}`);
      setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));
      toast.success("Transaction deleted");
    } catch {
      toast.error("Could not delete this transaction");
    }
  };

  const handleUpdateTransaction = async (event) => {
    event.preventDefault();
    setIsSavingTransaction(true);
    try {
      const { data } = await api.put(`/api/transactions/${editingTransaction.id}`, {
        title: editingTransaction.title,
        amount: editingTransaction.amount,
      });
      setTransactions((prev) => prev.map((transaction) => (
        transaction.id === data.transaction.id ? data.transaction : transaction
      )));
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
    setCurrentExpenses({ lbp: "", usd: "" });
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

  useEffect(() => {
    fetchTestData();
    api.get("/api/transactions")
      .then(({ data }) => setTransactions(data.transactions))
      .catch(() => toast.error("Could not load recent transactions"));
  }, [api]);

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

      <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
          <span className="text-sm text-slate-500">Latest 50</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No transactions yet.</p>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-3 py-3">Description</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Date</th><th className="px-3 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-4 font-medium text-slate-800">{transaction.title}</td>
                    <td className="px-3 py-4 text-slate-700">{Number(transaction.amount).toLocaleString()} {transaction.currency}</td>
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

DashBoardPage.propTypes = {
  setCurrentExpenses: PropTypes.func.isRequired,
  setCategoryWallet: PropTypes.func.isRequired,
};
