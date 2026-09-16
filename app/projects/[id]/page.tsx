"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import ProjectForm from "../../components/ProjectForm";
import { createClient } from "../../../lib/supabase/client";
import { getProject, updateProject, type ProjectValues } from "../../../lib/projects";
import type { Project } from "../../../types/project";
import type { ProjectDocumentListItem } from "../../../types/document";
import Icon from "../../components/Icon";
import StatusBadge from "../../components/StatusBadge";

const supabase = createClient();

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function documentStatusLabel(status: ProjectDocumentListItem["status"]) {
  return status === "ready" ? "Ready" : status === "error" ? "Error" : status[0].toUpperCase() + status.slice(1);
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocumentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [processingDocumentId, setProcessingDocumentId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProject() {
      const { data, error: projectError } = await getProject(supabase, id);
      if (projectError) setError("Unable to load this project.");
      else if (!data) setError("Project not found.");
      else {
        setProject(data);
        const documentsResponse = await fetch(`/api/project-documents?projectId=${encodeURIComponent(id)}`);
        const documentsData: unknown = await documentsResponse.json();
        if (documentsResponse.ok && typeof documentsData === "object" && documentsData !== null && "documents" in documentsData && Array.isArray(documentsData.documents)) {
          setDocuments(documentsData.documents as ProjectDocumentListItem[]);
        }
      }
      setIsLoading(false);
    }

    void loadProject();
  }, [id]);

  async function handleProcess(document: ProjectDocumentListItem) {
    setError("");
    setSuccess("");
    setProcessingDocumentId(document.id);
    try {
      const response = await fetch(`/api/project-documents/${document.id}/process`, { method: "POST" });
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        // A proxy/runtime may return an empty or non-JSON error response.
      }
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Unable to process the PDF. Please try again.";
        throw new Error(message);
      }
      if (typeof data !== "object" || data === null || !("status" in data) || data.status !== "ready") {
        throw new Error("Unable to process the PDF. Please try again.");
      }
      setSuccess("PDF processed successfully.");
      const documentsResponse = await fetch(`/api/project-documents?projectId=${encodeURIComponent(id)}`);
      const documentsData: unknown = await documentsResponse.json();
      if (documentsResponse.ok && typeof documentsData === "object" && documentsData !== null && "documents" in documentsData && Array.isArray(documentsData.documents)) {
        setDocuments(documentsData.documents as ProjectDocumentListItem[]);
      }
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : "Unable to process the PDF.");
    } finally {
      setProcessingDocumentId("");
    }
  }

  async function handleUpdate(values: ProjectValues) {
    const { data, error: updateError } = await updateProject(supabase, id, values);
    if (updateError || !data) return { error: "Unable to update the project. Please try again." };
    setProject(data);
    setIsEditing(false);
    setSuccess("Project updated successfully.");
    return {};
  }

  async function handleDelete() {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setError("");
    setIsDeleting(true);
    const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Unable to delete the project. Please try again.");
      setIsDeleting(false);
      return;
    }
    router.replace("/projects");
    router.refresh();
  }

  return <main className="ba-page flex min-h-dvh flex-col md:flex-row"><Sidebar activeItem="projects" onNewChat={() => undefined} /><section className="min-w-0 flex-1"><div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-10 lg:px-10"><div className="mx-auto max-w-6xl">
    <Link href="/projects" className="inline-flex items-center gap-2 rounded-lg py-1 text-xs font-semibold text-[#64778a] transition hover:text-[#1E5BFF]"><span aria-hidden="true">←</span> All projects</Link>
    {isLoading ? <div className="mt-6 animate-pulse rounded-2xl border border-[#e3e9ec] bg-white p-6"><div className="h-6 w-1/3 rounded bg-slate-100"/><div className="mt-4 h-4 w-2/3 rounded bg-slate-100"/></div> : !project ? <div className="ba-surface mt-6 p-6"><h1 className="text-lg font-bold text-[#203b53]">{error || "Project not found."}</h1><p className="mt-2 text-sm text-[#758395]">This project may not exist or may not be available to your account.</p></div> : <>
      <header className="mt-5 flex flex-col justify-between gap-4 border-b border-[#dfe7eb] pb-6 sm:flex-row sm:items-center"><div className="min-w-0"><p className="ba-eyebrow mb-2">Project overview</p><h1 className="break-words text-2xl font-bold tracking-tight text-[#0F2A44] sm:text-[1.85rem]">{project.name}</h1><div className="mt-3"><StatusBadge status={project.status}/></div></div><div className="flex w-full gap-2 sm:w-auto"><button type="button" onClick={() => { setError(""); setSuccess(""); setIsEditing(true); }} className="ba-button ba-button-secondary flex-1 sm:flex-none"><Icon name="edit" size={15}/>Edit project</button><button type="button" onClick={handleDelete} disabled={isDeleting} className="ba-button flex-1 border border-[#f0d9d7] bg-white text-[#a5423b] hover:bg-[#fff5f4] disabled:opacity-50 sm:flex-none"><Icon name="trash" size={15}/>{isDeleting ? "Deleting…" : "Delete"}</button></div></header>
      {success ? <p role="status" className="ba-alert ba-alert-success mt-5">{success}</p> : null}{error ? <p role="alert" className="ba-alert ba-alert-error mt-5">{error}</p> : null}
      {isEditing ? <div className="mt-6"><ProjectForm initialValues={{ name: project.name, description: project.description ?? "", status: project.status }} submitLabel="Save changes" onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} /></div> : <section className="ba-surface mt-6 p-5 sm:p-6"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf3f7] text-[#385a74]"><Icon name="building" size={16}/></span><h2 className="text-sm font-bold text-[#293f55]">Project details</h2></div><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[#5e7083]">{project.description || "No description provided."}</p><div className="mt-5 grid gap-4 border-t border-[#edf1f3] pt-4 text-sm sm:grid-cols-2"><div><p className="ba-eyebrow">Created</p><p className="mt-1.5 text-xs font-medium text-[#465a6e]">{formatDate(project.created_at)}</p></div><div><p className="ba-eyebrow">Last updated</p><p className="mt-1.5 text-xs font-medium text-[#465a6e]">{formatDate(project.updated_at)}</p></div></div></section>}
      <section className="ba-surface mt-5 overflow-hidden"><div className="flex flex-col gap-3 border-b border-[#edf1f3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="ba-eyebrow">Project files</p><h2 className="mt-1 text-base font-bold text-[#233d54]">Documents</h2></div><Link href={`/documents?projectId=${encodeURIComponent(id)}`} className="ba-button ba-button-secondary min-h-9 self-start px-3 py-2 text-xs sm:self-auto"><Icon name="upload" size={15}/>Upload document</Link></div>
        {documents.length === 0 ? <div className="px-5 py-8 text-center sm:px-6"><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#f1f5f7] text-[#526d83]"><Icon name="documents" size={19}/></span><p className="mt-3 text-sm font-semibold text-[#384e63]">No documents yet</p><p className="mt-1 text-xs text-[#8290a0]">PDFs added to this project will appear here.</p></div> : <div className="divide-y divide-[#edf1f3]">{documents.map((document) => <div key={document.id} className="flex min-w-0 flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fbf4e3] text-[#9a7213]"><Icon name="file" size={18}/></span><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-[#31485e]">{document.name}</p><p className="mt-1 text-xs text-[#8491a0]">Uploaded {formatDate(document.created_at)}</p></div><div className="flex items-center gap-2 self-start sm:self-auto"><StatusBadge status={document.status} label={documentStatusLabel(document.status)}/>{document.status !== "ready" ? <button type="button" onClick={() => void handleProcess(document)} disabled={processingDocumentId === document.id} className="ba-button ba-button-quiet min-h-8 px-2.5 py-1.5 text-xs">{processingDocumentId === document.id ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current"/>Processing…</> : document.status === "error" ? "Retry" : "Process"}</button> : null}</div></div>)}</div>}
      </section>
    </>}
  </div></div></section></main>;
}
