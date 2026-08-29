export default function WalletPage({
  //These Variables Will Make The Varibales in The DashBoardPage
  currentExpenses = { lbp: "", usd: "" },
  categoryWallet = {},
  monthlyBudget = "",
  setMonthlyBudget,
}) {
  //This Will Take The CurrentExpenses Function From The DashBoardPage File
  const { lbp, usd } = currentExpenses
  //It Will Check if Lbp And Usd Have Any Values
  const hasExpense = lbp !== "" && usd !== ""

  //This Will Make So If The User Put The Values The BalanceLabel Varbile Will Check If There Is Any Values Other Wise It Will Say "No Current Expense"
  const balanceLabel = hasExpense ? `${lbp} LBP / $${usd} USD` : "No current expense"

  //The WalletEntries Function Will Return  Arrays Of The Category Wallet And Will Map Out The Keys and Values 
  //It Will Check For The Key, Label, Value, Usd, Price If They Have Any Value
  const walletEntries = Object.entries(categoryWallet).map(([key, values]) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: values?.value || "",
    usd: values?.usd || "",
    price: values?.price ?? "",
  }))
  //The Monthly Expenses Will Reduce The WalletEntries Values So It Will Calculate The Total With The Entry
  const monthlyExpenses = walletEntries.reduce(
    (total, entry) => total + (Number(entry.usd) || 0),
    0,
  )
  //The Budget Will Calculate The Monthly Budget
  //The RemainingBudget Will Minus The Budget And The Monthly Expenses 
  //And The HasBudget Varibale Will Check If The Monthly Budget Is None
  const budget = Number(monthlyBudget) || 0
  const remainingBudget = budget - monthlyExpenses
  const hasBudget = monthlyBudget !== ""

  return (

    <section className="min-h-[420px] rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900 text-center">Wallet</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Your wallet displays the latest expense entered on the dashboard.
      </p>
      <h1 className="text-2xl font-semibold shadow-sm">Balance: {balanceLabel}</h1>

      <div className="mt-6 grid gap-6 rounded-xl bg-slate-300/90 p-4 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] sm:grid-cols-2">
        <div className="rounded-xl bg-slate-200 p-4">
          <h2 className="text-lg font-semibold">Current expense</h2>
          <p className="mt-2 text-sm text-slate-700">LBP: {hasExpense ? lbp : 'none'}</p>
          <p className="text-sm text-slate-700">USD: {hasExpense ? `$${usd}` : 'none'}</p>
        </div>

        <div className="rounded-xl bg-slate-200 p-4">
          <h2 className="text-lg font-semibold">Category summary</h2>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            {walletEntries.some((entry) => entry.value !== "") ? (
              walletEntries
                .filter((entry) => entry.value !== "")
                .map((entry) => (
                  <div key={entry.key} className="rounded-lg bg-white p-3">
                    <p className="font-medium text-slate-800">{entry.label}</p>
                    <p>Value: {entry.value} LBP</p>
                    <p>USD: ${entry.usd}</p>
                    <p>Price: {entry.price}</p>
                  </div>
                ))
            ) : (
              <p>Enter a value on the dashboard page to update this wallet summary.</p>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-slate-200 p-4">
          <h2 className="text-lg font-semibold">Monthly expenses</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ${monthlyExpenses.toFixed(2)} USD
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Total from all category values entered this month.
          </p>
          </div>

          <div className="rounded-xl bg-slate-200 p-4">
            <h2 className="text-lg font-semibold">Savings & remaining budget</h2>
            <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="monthly-budget">
              Monthly budget (USD)
            </label>
            <input
              id="monthly-budget"
              type="number"
              min="0"
              step="0.01"
              value={monthlyBudget}
              onChange={(event) => setMonthlyBudget(event.target.value)}
              placeholder="Enter monthly budget"
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <div className="mt-3 grid gap-2 text-sm text-slate-700">
              <p>Savings: <span className="font-semibold">{hasBudget ? `$${Math.max(remainingBudget, 0).toFixed(2)}` : "Set a budget"}</span></p>
              <p>Remaining budget: <span className={`font-semibold ${remainingBudget < 0 ? "text-red-600" : "text-emerald-700"}`}>
                {hasBudget ? `$${remainingBudget.toFixed(2)}` : "Set a budget"}
              </span></p>
          </div>
          </div>
      </div>
    </section>
  )
}
