import type { ReactNode, SVGProps } from "react";

export type IconName = "assistant" | "projects" | "documents" | "plus" | "logout" | "chat" | "arrow" | "upload" | "file" | "trash" | "edit" | "check" | "clock" | "building" | "chevron";

const paths: Record<IconName, ReactNode> = {
  assistant: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></>,
  projects: <><rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M8 8h3v3H8zM14 8h3v3h-3zM8 14h3v3H8zM14 14h3v3h-3z"/></>,
  documents: <><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V4.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h6"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
  chat: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h8M8 14h5"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16.5v2A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-2"/></>,
  file: <><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V4.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h4"/></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></>,
  edit: <><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5a2.1 2.1 0 0 0-3-3L4 16.5Z"/><path d="m14.5 7.5 3 3"/></>,
  check: <><path d="m5 12 4.5 4.5L19 7"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  building: <><path d="M4 20V7l8-4 8 4v13M2.5 20h19"/><path d="M8 9h1M15 9h1M8 13h1M15 13h1M10 20v-3h4v3"/></>,
  chevron: <><path d="m7 10 5 5 5-5"/></>,
};

type IconProps = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

export default function Icon({ name, size = 18, ...props }: IconProps) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name]}</svg>;
}
