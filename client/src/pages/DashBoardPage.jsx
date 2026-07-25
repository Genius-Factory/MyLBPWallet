import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { NumericFormat } from "react-number-format";
import { Droplet, Fuel, ShoppingCart, Zap } from "lucide-react";
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

/*
  This is The DashBoard Page For The Lbp Wallet Website.
  It Contains all of the Important Features Of The Website

  Written by: Ganafer
*/

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
  const [lbp, setLbp] = useState("");
  const [usd, setUsd] = useState("");
  const [chartData, setChartData] = useState(null);

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

    setUsd((Number(value) / RATE).toFixed(2));
  };

  const handleUsdChange = ({ value }) => {
    setUsd(value);

    if (value === "") {
      setLbp("");
      return;
    }

    setLbp((Number(value) * RATE).toFixed(0));
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
  }, []);

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
 
    <div className="Main flex flex-col gap-y-6 p-4">
      <div className="bg-slate-300 rounded-xl px-4 py-4"> 
        <div className='flex items-center space-x-4 sm: w-2/1 flex-col gap-8'>
          <label className="text-sm font-medium text-slate-700 ">LBP To USD Conversion</label>
          <div className="bg-slate-200 h-10 w-72 rounded-xl px-16" id="NumberBox">
            <NumericFormat
              placeholder='Enter LBP amount'
              className='bg-transparent border-none outline-none p-2 w-full h-full focus:ring-0'
              value={lbp}
              thousandSeparator="," 
              valueIsNumericString={true}
              allowNegative={false}
              onValueChange={handleLbpChange}
            />
          </div>
          <div className="bg-slate-200 h-10 w-72 rounded-xl flex items-center justify-center" id="NumberBox">
            <p className=' text-center' id="Number-Paragraph">Result: ${usd || '0.00'} USD</p>
          </div>
        </div>
        <br />
        <div className="flex gap-4 sm: flex-col w-2/1 justify-center">
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100 sm: w-1/11 text-sm">
            Electricity ⚡
          </button>
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100 sm: w-1/11 text-sm">
            Water 💧
          </button>
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100 sm: w-1/10 text-sm">
            Groceries 🛒
          </button>
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100 sm: w-1/10 text-sm">
            Fuel ⛽
          </button>
        </div>
      </div>

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
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>{label}</span>
                <Icon size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
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
   </div> 
  );
}
