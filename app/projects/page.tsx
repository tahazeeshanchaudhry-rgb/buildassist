"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProjectForm from "../components/ProjectForm";
import { createClient } from "../../lib/supabase/client";
import { createProject, listProjects, type ProjectValues } from "../../lib/projects";
import type { Project } from "../../types/project";

const supabase = createClient();

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      const { data, error: projectsError } = await listProjects(supabase);
      if (projectsError) setError("Unable to load your projects.");
      else setProjects(data ?? []);
      setIsLoading(false);
    }

    void loadProjects();
  }, []);

  async function handleCreate(values: ProjectValues) {
    const { data, error: createError } = await createProject(supabase, values);
    if (createError || !data) return { error: "Unable to create the project. Please try again." };
    setProjects((current) => [data, ...current]);
    setShowForm(false);
    return {};
  }

  return <main className="flex min-h-screen bg-[#f7f8fa] text-slate-900"><Sidebar activeItem="projects" onNewChat={() => undefined} /><section className="flex min-w-0 flex-1 flex-col"><div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-4xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-3xl font-bold tracking-tight">Projects</h1><p className="mt-2 text-sm text-slate-500">Keep your construction work organized in one place.</p></div><button type="button" onClick={() => { setError(""); setShowForm(true); }} className="rounded-xl bg-[#f4a300] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df9300]">+ New Project</button></div>{showForm ? <div className="mt-8"><ProjectForm submitLabel="Create project" onSubmit={handleCreate} onCancel={() => setShowForm(false)} /></div> : null}{error ? <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}{isLoading ? <p className="mt-10 text-sm text-slate-500">Loading projects...</p> : projects.length === 0 && !showForm ? <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h2 className="text-lg font-semibold text-slate-800">No projects yet</h2><p className="mt-2 text-sm text-slate-500">Create your first project to get started.</p><button type="button" onClick={() => setShowForm(true)} className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100">Create a project</button></div> : <div className="mt-8 grid gap-4 md:grid-cols-2">{projects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"><div className="flex items-start justify-between gap-3"><h2 className="truncate text-lg font-semibold text-slate-800">{project.name}</h2><span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700">{project.status.replace("_", " ")}</span></div><p className="mt-3 min-h-10 text-sm leading-6 text-slate-500">{project.description || "No description provided."}</p><p className="mt-4 text-xs text-slate-400">Created {formatDate(project.created_at)}</p></Link>)}</div>}</div></div></section></main>;
}
