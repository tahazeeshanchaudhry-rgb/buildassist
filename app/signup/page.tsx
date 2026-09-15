"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import AuthShell from "../components/AuthShell";
import { createClient } from "../../lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    const { data, error: signUpError } = await createClient().auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
    if (signUpError) {
      setError("Unable to create your account. Please check your details and try again.");
      setIsLoading(false);
      return;
    }
    if (data.session) {
      router.replace("/assistant");
      router.refresh();
      return;
    }

    setSuccess("Check your email to confirm your account, then sign in.");
    setIsLoading(false);
  }

  return <AuthShell><h1 className="text-2xl font-bold tracking-tight">Create your account</h1><p className="mt-2 text-sm text-slate-500">Start managing your construction work with BuildAssist.</p><form onSubmit={handleSubmit} className="mt-7 space-y-4"><label className="block"><span className="text-sm font-semibold text-slate-700">Full name</span><input required type="text" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label><label className="block"><span className="text-sm font-semibold text-slate-700">Email</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label><label className="block"><span className="text-sm font-semibold text-slate-700">Password</span><input required type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label><label className="block"><span className="text-sm font-semibold text-slate-700">Confirm password</span><input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label>{error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}{success ? <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}<button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#f4a300] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#df9300] disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? "Creating account..." : "Create account"}</button></form><p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-semibold text-amber-700 hover:text-amber-800">Sign in</Link></p></AuthShell>;
}
