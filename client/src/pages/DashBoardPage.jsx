import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { NumericFormat } from "react-number-format";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

/*
  This is The DashBoard Page For The Lbp Wallet Website.
  It Contains all of the Important Features Of The Website

  Written by: Ghadi
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
      const response = await fetch('http://localhost:4000/api/live-prices');
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      const result = await response.json();
      
      setChartData({
        labels: result.labels,
        datasets: [
          {
            label: 'Market Rates',
            data: result.values,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.2, 
          }
        ]
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
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Prices as Of Today' },
    },
  };

  return (
    <div className="Main flex flex-col gap-y-6 p-4">
      <div className="bg-slate-300 rounded-xl px-4 py-4">
        <div className='flex items-center space-x-4'>
          <label className="text-sm font-medium text-slate-700">LBP To USD Conversion</label>
          <div className="bg-slate-200 h-10 w-72 rounded-xl" id="NumberBox">
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
            <p className='sm:text-lg text-center' id="Number-Paragraph">Result: ${usd || '0.00'} USD</p>
          </div>
        </div>
        <br />
        <div className="flex gap-4">
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100">
            Electricity ⚡
          </button>
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100">
            Water 💧
          </button>
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100">
            Groceries 🛒
          </button>
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100">
            Fuel ⛽
          </button>
        </div>
      </div>

      <div className='bg-slate-300 rounded-xl px-4 py-4 flex flex-col'>
        <h3 className="text-lg font-bold mb-2 text-center">Live Economic Indexes</h3>
        <br className='bg-black'/>
        <h2 className='text-lg font-bold mb-2 text-center'>Electricity</h2>
        <div className='w-full h-[350px] bg-white rounded-lg p-2'>
          {chartData ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Loading market analytics data...
            </div>
          )}
        </div>
        <h2 className='text-lg font-bold mb-2 text-center'>Fuel</h2>
        <div className='w-full h-[350px] bg-white rounded-lg p-2'>
          {chartData ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Loading market analytics data...
            </div>
          )}
        </div>
        <h2 className='text-lg font-bold mb-2 text-center'>Water</h2>
        <div className='w-full h-[350px] bg-white rounded-lg p-2'>
          {chartData ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Loading market analytics data...
            </div>
          )}
        </div>
        <h2 className='text-lg font-bold mb-2 text-center'>Grocieres</h2>
        <div className='w-full h-[350px] bg-white rounded-lg p-2'>
          {chartData ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Loading market analytics data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
