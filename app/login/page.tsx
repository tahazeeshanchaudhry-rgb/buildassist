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

  return <AuthShell><div className="mb-7"><p className="ba-eyebrow mb-2">Secure project workspace</p><h1 className="text-[1.65rem] font-bold tracking-[-.035em] text-[#0F2A44]">Welcome back</h1><p className="mt-2 text-sm leading-6 text-[#69798b]">Sign in to continue to your construction assistant.</p></div><form onSubmit={handleSubmit} className="space-y-5"><label className="block"><span className="ba-label">Email</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="ba-field mt-2 px-3.5 py-3 text-sm" /></label><label className="block"><span className="ba-label">Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="ba-field mt-2 px-3.5 py-3 text-sm" /></label>{error ? <p role="alert" className="ba-alert ba-alert-error">{error}</p> : null}<button type="submit" disabled={isLoading} className="ba-button ba-button-gold w-full">{isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden="true"/>Signing in…</> : <>Sign in <span aria-hidden="true">→</span></>}</button></form><p className="mt-7 border-t border-[#edf1f3] pt-5 text-center text-sm text-[#708094]">New to BuildAssist? <Link href="/signup" className="font-bold text-[#1E5BFF] hover:underline">Create an account</Link></p></AuthShell>;
}
