import { Link } from 'react-router-dom'
import { ArrowRight, Wallet } from 'lucide-react'

export default function HomePage() {
  return (
    <section className="mx-auto max-w-2xl py-16 text-center sm:py-24">
      <span className="inline-flex rounded-2xl bg-blue-50 p-4 text-blue-600"><Wallet size={32} aria-hidden="true" /></span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-blue-600">A little clarity, every month</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Your money.<br />One simple place.</h1>
      <p className="mx-auto mt-6 max-w-lg text-lg leading-8 text-slate-500">Keep track of income and expenses in LBP and USD, set a monthly budget, and see what’s left.</p>
      <Link to="/sign-up" className="btn-primary mt-8 inline-flex items-center gap-2 px-6 py-3">Create your wallet <ArrowRight size={17} aria-hidden="true" /></Link>
      <p className="mt-4 text-sm text-slate-500">Already have an account? <Link className="font-medium text-blue-700 underline" to="/sign-in">Sign in</Link></p>
    </section>
  )
}