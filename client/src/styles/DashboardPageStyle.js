//ViewingMonth Style
export const ViewingMonth = [
    "relative isolate w-full max-w-md",
    "overflow-hidden rounded-3xl border border-white bg-gradient-to-br ",
    "from-slate-200 via-slate-100 to-white p-7 ",
    "shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] sm:p-8"  
  ].join(" ");
//Balance style
export const ArticaleBalance = [
    "relative isolate w-full max-w-md overflow-hidden",
    "rounded-3xl border border-white bg-gradient-to-br from-slate-200",
    "via-slate-100 to-white p-7 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] sm:p-8"
  ].join(" ");
//DataBox Style wallet-balance-label
export const DataStyle = [
 "rounded-xl border border-amber-200",
 "bg-amber-50 p-4 text-sm",
 "text-amber-800"
].join(" ");
//PointerHolder style
export const Pointer_Holder = [
 "pointer-events-none absolute -right-16",
 "-top-24 -z-10 h-64 w-64 rounded-full", 
 "border-[32px] border-white/40" 
].join(" ")
//Expneses Displayer
export const Expenses_Displayer_Label = [
 "mt-10 break-all text-4xl font-semibold tracking-tight tabular-nums", 
 "sm:text-5xl ${Number(data.totals.expenses) < 0 ? 'text-black' : 'text-rose-600'}`}>"
].join(" ")
//expneses pointer event
export const Expenses_Pointer = [
  "pointer-events-none absolute",
  "right-16 -top-24 -z-10 h-64 w-64",
  "rounded-full border-[32px] border-white/40" 
].join(" ")
export const Wallet_Expneses_label = [
  "relative isolate w-full",
  "max-w-md overflow-hidden rounded-3xl border  border-white bg-gradient-to-br",
  "from-slate-200 via-slate-100 to-white p-7 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] sm:p-8" 
].join(" ")
export const legendary_error = [
  "rounded-xl border",
  "border-amber-200",
  "bg-amber-50 p-4 text-sm" ,
   "text-amber-800"
].join(" ")
export const error_box_style = [
  "error-box",
  "flex", 
  "flex-wrap", 
  "items-center", 
  "justify-between gap-3" 
].join(" ")