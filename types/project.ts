import type { Database, ProjectStatus } from "./database";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type { ProjectStatus };
