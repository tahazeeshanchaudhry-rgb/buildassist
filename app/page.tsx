import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  redirect(claimsData?.claims?.sub ? "/assistant" : "/login");
}
