import DashBoardPage from "./DashBoardPage"

export default function WalletPage() {
  return (
    <section className="min-h-[420px] rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900 text-center">Wallet</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 hidden">
        Your wallet is empty. Add transactions or balances to see them here.
      </p>
      <h1 className="text-2xl font-semibold shadow-sm">Balance: ????</h1>
      <div className="flex  text-lg rounded-xl  bg-slate-300/90 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]">
          <h1 classname="font-semibold text-center ">Income Expenses Savings</h1>
          <div className="bg-slate-400 rounded-xl">
            <h2 classname="font-semibold">Categories</h2>
            <div className="flex flex-col overflow-y-auto">
                <ul> 
                  <hr class="border-t-2 border-gray-500 my-4 rounded-xl" />
                  <li className="font-semibold">
                      test
                    </li>
                  <hr class="border-t-2 border-gray-500 my-4 rounded-xl" />
                  <li className="text-center">
                      test
                    </li>
                  <hr class="border-t-2 border-gray-500 my-4 rounded-xl" />
                  <li className="text-center">
                      test
                    </li>
                  <hr class="border-t-2 border-gray-500 my-4 rounded-xl" />
                  <li className="text-center">
                      test
                    </li>
                  <hr class="border-t-2 border-gray-500 my-4 rounded-xl" />
                  <li className="text-center">
                      test
                    </li>
                  <hr class="border-t-2 border-gray-500 my-4 rounded-xl" />
                </ul>
                <hr class="border-x-4 border-gray-500 my-4 rounded-xl" />
                <ul className="font-semibold bg-slate-400">
                    <li className="text-center">
                      test
                    </li>
                    <hr class="border-t-2 border-gray-500 my-4 rounded-xl" />
                    <li className="text-center">
                      test
                    </li>
                    <hr class="border-t-2 border-gray-500 my-4 rounded-xl" />
                    <li className="text-center">
                      test
                    </li>
                    <hr class="border-t-2 border-gray-500 my-4 rounded-xl" />
                    <li className="text-center">
                      test
                    </li>
                    <hr class="border-t-2 border-gray-500 my-4 rounded-xl" />
                    <li className="text-center">
                      test
                    </li>
                </ul>
            </div>
            <div className="relative ">
              <h2>test</h2>
            </div>
          </div>          
          
      </div>
    </section>
  )
}
