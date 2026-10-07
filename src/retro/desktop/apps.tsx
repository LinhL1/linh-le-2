import type { ComponentType } from "react";
import { AboutApp } from "./apps/AboutApp";
import { CommunityApp } from "./apps/CommunityApp";
import { ContactApp } from "./apps/ContactApp";
import { ExperienceApp } from "./apps/ExperienceApp";
import { ProjectsApp } from "./apps/ProjectsApp";
import { TerminalApp } from "./apps/TerminalApp";
import type { IconName } from "./icons";
import type { AppId } from "./useDesktop";

export interface AppDefinition {
  id: AppId;
  /** Window title bar text. */
  title: string;
  /** Desktop icon label. */
  label: string;
  icon: IconName;
  width: number;
  height: number;
  Component: ComponentType;
  bodyClassName?: string;
}

// Desktop icon order.
export const APPS: AppDefinition[] = [
  { id: "about", title: "About Me", label: "About Me", icon: "about", width: 600, height: 520, Component: AboutApp },
  { id: "experience", title: "Experience", label: "Experience", icon: "experience", width: 560, height: 500, Component: ExperienceApp },
  { id: "community", title: "Community", label: "Community", icon: "community", width: 580, height: 500, Component: CommunityApp },
  { id: "projects", title: "Projects", label: "Projects", icon: "projects", width: 640, height: 520, Component: ProjectsApp },
  { id: "contact", title: "Contact", label: "Contact", icon: "contact", width: 460, height: 420, Component: ContactApp },
  {
    id: "terminal",
    title: "Terminal",
    label: "Terminal",
    icon: "terminal",
    width: 620,
    height: 400,
    Component: TerminalApp,
    bodyClassName: "retro-window__body--terminal",
  },
];

export const APP_BY_ID = Object.fromEntries(APPS.map((a) => [a.id, a])) as Record<AppId, AppDefinition>;
