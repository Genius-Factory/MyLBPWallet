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

export default function AdminDashboard() {
  
  const items = Array.from({ lengh: 50 }, (_, i) => `List Item ${i + 1}`);

  return(
    <div className='Main flex flex-col gap-y-6 p-2 b\lool. b300 rounded-xl bg-slate-300'>
      <h1 className='text-lg font-bold text-center max-w-md mt-2'>Admin Dashboard</h1>
       <div className='relative flex h-64 flex-col justify-between max-w-sm overflow-y-auto rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-[0_24px_60px_-35px_rgba(14,165,233,0.55)] backdrop-blur-sm max-h-48 w-100 '>
          <h1 className='text-lg font-bold mb-2 text-center bg-slate-100 rounded-xl'>Actions</h1>
            
              <div className='bg-slate-100 flex flex-col border border-slate-50 rounded-xl px-4 py-3'>
                    <button className='bg-slate-300 flex flex-col border border-slate-50 rounded-xl px-4 py-3 hover:bg-gray-100'>Add➕</button>
                    <button className='bg-slate-300 flex flex-col border border-slate-50 rounded-xl px-4 py-3 hover:bg-gray-100'>Edit➡️</button>
                    <button className='bg-slate-300 flex flex-col border border-slate-50 rounded-xl px-4 py-3 hover:bg-gray-100'>Ban🔨</button>
                    <button className='bg-slate-300 flex flex-col border border-slate-50 rounded-xl px-4 py-3 hover:bg-gray-100'>Delete ❌</button>
              </div>           
       </div>
       <div className='relative flex h-64 flex-col justify-between max-w-sm overflow-y-auto rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-[0_24px_60px_-35px_rgba(14,165,233,0.55)] backdrop-blur-sm max-h-48 w-100'>
        <div className='flex flex-col justify-between sticky z-10 top-0 bg-slate-100 rounded-xl'>
          <h2 className='text-lg font-bold mb-2 text-center bg-slate-10'>Users</h2>
          <ul>  
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
       </div>
    </div>
  </div>
  )
}