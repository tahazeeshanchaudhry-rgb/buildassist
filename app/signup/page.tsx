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

  return <AuthShell><div className="mb-6"><p className="ba-eyebrow mb-2">Get started</p><h1 className="text-[1.65rem] font-bold tracking-[-.035em] text-[#0F2A44]">Create your account</h1><p className="mt-2 text-sm leading-6 text-[#69798b]">Bring your construction work into one clear workspace.</p></div><form onSubmit={handleSubmit} className="space-y-4"><label className="block"><span className="ba-label">Full name</span><input required type="text" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="ba-field mt-2 px-3.5 py-2.5 text-sm" /></label><label className="block"><span className="ba-label">Email</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="ba-field mt-2 px-3.5 py-2.5 text-sm" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="ba-label">Password</span><input required type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="ba-field mt-2 px-3.5 py-2.5 text-sm" /></label><label className="block"><span className="ba-label">Confirm password</span><input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="ba-field mt-2 px-3.5 py-2.5 text-sm" /></label></div>{error ? <p role="alert" className="ba-alert ba-alert-error">{error}</p> : null}{success ? <p role="status" className="ba-alert ba-alert-success">{success}</p> : null}<button type="submit" disabled={isLoading} className="ba-button ba-button-gold mt-1 w-full">{isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden="true"/>Creating account…</> : <>Create account <span aria-hidden="true">→</span></>}</button></form><p className="mt-6 border-t border-[#edf1f3] pt-5 text-center text-sm text-[#708094]">Already have an account? <Link href="/login" className="font-bold text-[#1E5BFF] hover:underline">Sign in</Link></p></AuthShell>;
}
