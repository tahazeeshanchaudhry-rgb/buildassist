import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProjectStatus } from "../types/database";

type ProjectClient = SupabaseClient<Database>;

export type ProjectValues = {
  name: string;
  description: string;
  status: ProjectStatus;
};

export async function listProjects(client: ProjectClient) {
  return client.from("projects").select("*").order("created_at", { ascending: false });
}

export async function getProject(client: ProjectClient, id: string) {
  return client.from("projects").select("*").eq("id", id).maybeSingle();
}

export async function createProject(client: ProjectClient, values: ProjectValues) {
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return { data: null, error: userError ?? new Error("User is not authenticated.") };

  return client.from("projects").insert({ user_id: user.id, ...values }).select().single();
}

export async function updateProject(client: ProjectClient, id: string, values: ProjectValues) {
  return client.from("projects").update(values).eq("id", id).select().single();
}

export async function deleteProject(client: ProjectClient, id: string) {
  return client.from("projects").delete().eq("id", id);
}
