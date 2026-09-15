"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AuthShell from "../components/AuthShell";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const { error: signInError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError("Invalid email or password.");
      setIsLoading(false);
      return;
    }

    router.replace("/assistant");
    router.refresh();
  }

  return <AuthShell><h1 className="text-2xl font-bold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-slate-500">Sign in to continue to your construction assistant.</p><form onSubmit={handleSubmit} className="mt-7 space-y-4"><label className="block"><span className="text-sm font-semibold text-slate-700">Email</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label><label className="block"><span className="text-sm font-semibold text-slate-700">Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label>{error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}<button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#f4a300] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#df9300] disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? "Signing in..." : "Sign in"}</button></form><p className="mt-6 text-center text-sm text-slate-500">New to BuildAssist? <Link href="/signup" className="font-semibold text-amber-700 hover:text-amber-800">Create an account</Link></p></AuthShell>;
}
