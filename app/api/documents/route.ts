import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

async function unavailableResponse() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  return NextResponse.json({ error: "This legacy document endpoint is no longer available." }, { status: 410 });
}

export async function GET() {
  return unavailableResponse();
}

export async function POST() {
  return unavailableResponse();
}
