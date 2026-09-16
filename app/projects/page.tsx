"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProjectForm from "../components/ProjectForm";
import { createClient } from "../../lib/supabase/client";
import { createProject, listProjects, type ProjectValues } from "../../lib/projects";
import type { Project } from "../../types/project";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";

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

  return <main className="ba-page flex min-h-dvh flex-col md:flex-row"><Sidebar activeItem="projects" onNewChat={() => undefined} /><section className="min-w-0 flex-1"><div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-10 lg:px-10"><div className="mx-auto max-w-6xl">
    <div className="mb-7 flex flex-col justify-between gap-4 border-b border-[#dfe7eb] pb-6 sm:flex-row sm:items-end"><div><p className="ba-eyebrow mb-2">Workspace / Overview</p><h1 className="ba-page-title">Projects</h1><p className="ba-page-subtitle">Keep your construction work organized in one place.</p></div><button type="button" onClick={() => { setError(""); setShowForm(true); }} className="ba-button ba-button-gold w-full sm:w-auto"><Icon name="plus" size={17} />New Project</button></div>
    {showForm ? <div className="mb-7"><ProjectForm submitLabel="Create project" onSubmit={handleCreate} onCancel={() => setShowForm(false)} /></div> : null}
    {error ? <p role="alert" className="ba-alert ba-alert-error mb-6">{error}</p> : null}
    <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold text-[#30465b]">Your projects</h2><p className="mt-1 text-xs text-[#8390a0]">{isLoading ? "Loading your workspace…" : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`}</p></div></div>
    {isLoading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className="animate-pulse rounded-2xl border border-[#e3e9ec] bg-white p-5"><div className="h-4 w-2/5 rounded bg-slate-100"/><div className="mt-4 h-3 w-full rounded bg-slate-100"/><div className="mt-2 h-3 w-3/4 rounded bg-slate-100"/></div>)}</div> : projects.length === 0 && !showForm ? <div className="ba-empty"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf3f7] text-[#284b68]"><Icon name="building" size={23}/></span><h2 className="mt-4 text-base font-bold text-[#243d54]">No projects yet</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#758395]">Create your first project to keep plans, documents, and construction context together.</p><button type="button" onClick={() => { setError(""); setShowForm(true); }} className="ba-button ba-button-primary mt-5"><Icon name="plus" size={16}/>Create a project</button></div> : <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{projects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} aria-label={`View project ${project.name}`} className="ba-surface ba-card-hover group flex min-h-60 min-w-0 flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf3f7] text-[#2b4d69]"><Icon name="building" size={19}/></span><StatusBadge status={project.status}/></div>
      <h3 className="mt-5 line-clamp-2 break-words text-[1.03rem] font-bold tracking-tight text-[#203b53]">{project.name}</h3><p className="mt-2 line-clamp-2 min-h-10 break-words text-sm leading-5 text-[#718093]">{project.description || "No description provided."}</p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#edf1f3] pt-4"><span className="text-[.7rem] text-[#8793a0]">Created {formatDate(project.created_at)}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E5BFF]">View <Icon name="arrow" size={14}/></span></div>
    </Link>)}</div>}
  </div></div></section></main>;
}
