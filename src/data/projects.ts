import sheDriveImg from "@/assets/projects/shedrive.png";
import impromptu from "@/assets/projects/impromptu.png";
import mmi from "@/assets/projects/mmi.png";
import phishstx from "@/assets/projects/phishstx.png";
import informed from "@/assets/projects/informed.png";
import jot from "@/assets/projects/jot.png";
import progress from "@/assets/projects/progress.png";
import auralink from "@/assets/projects/auralink.png";
import toodly from "@/assets/projects/toodly.png";
import glade from "@/assets/projects/glade.png";
import sprout from "@/assets/projects/sprout.jpg";



export interface ProjectCaseStudy {
  role: string;
  problem: string;
  approach: string[];
  impact: string;
}

export interface Project {
  title: string;
  type: string;
  category: "personal" | "hackathon" | "other";
  description: string;
  year: string;
  link?: string;
  image?: string;
  tools?: string[];
  /** Shown in the homepage top-picks carousel. Everything still appears on /projects. */
  featured?: boolean;
  /** PM-style deep dive shown in the focused project dialog. Falls back to `description` when absent. */
  caseStudy?: ProjectCaseStudy;
}

export const projects: Project[] = [
  {
    title: "OrgMap AI",
    type: "AI Project Management / Project Intelligence",
    category: "hackathon",
    description:
      "joint hackathon project: Turn meeting minutes, whiteboard photos and architecture diagrams into one live map of your project: who owns what, what's blocked, what was decided, and what's overdue.",
    year: "September 2026",
    link: "https://github.com/saquer916/guava-hackathon",
    image: progress,
    tools: ["Cloudinary AI", "TypeScript", "HTML", "CSS"]
  },
  {
    title: "Sprout",
    type: "AI Voice Agent",
    category: "hackathon",
    description:
      "joint hackathon project: AI-assisted inbound-call triage prototype using Guava Voice AI and OpenEMR. It gathers structured history, applies transparent safety policies, recommends a routing disposition, and supports human-controlled scheduling decisions. It is not a diagnostic system and is not approved for clinical use.",
    year: "September 2026",
    link: "https://github.com/saquer916/guava-hackathon",
    image: sprout,
    tools: ["Python", "OpenERM", "Guava Voice AI"]
  },
  {
    title: "Glade",
    type: "PWA/Mobile APP",
    category: "personal",
    description:
      "Daily gratitude app. Local to your device, works offline, perfect for the commute.",
    year: "July 2026",
    link: "https://github.com/LinhL1/glade",
    image: glade,
    tools: ["JavaScript", "HTML", "CSS"]
  },
  {
    title: "Toodly",
    type: "Web Browser Extension",
    category: "personal",
    description:
      "All in one browser extension to manage your evergreen task list and work sessions. Mosaics to track your productivity. Handy pomodoro built in.",
    year: "June 2026",
    link: "https://github.com/LinhL1/toodly",
    image: toodly,
    tools: ["JavaScript", "HTML", "CSS"],
    featured: true,
    caseStudy: {
      role: "Solo builder — product scoping, design, and engineering",
      problem:
        "Task managers and pomodoro timers usually live in separate tabs or apps, adding friction at the exact moments you're trying to stay focused.",
      approach: [
        "Scoped the extension around one core loop — an always-evergreen task list plus a built-in pomodoro timer — so focus tracking never leaves the browser chrome",
        "Designed \"mosaics\" as a lightweight, at-a-glance productivity view instead of a heavier analytics dashboard, keeping the tool fast to check mid-task",
        "Chose a browser extension over a standalone web app specifically to minimize the switching cost during real work sessions",
      ],
      impact:
        "Shipped a fully working extension that consolidates task tracking and focus sessions into a single always-available surface.",
    },
  },
  {
    title: "Jot",
    type: "Web Browser Extension",
    category: "personal",
    description:
      "Common placing + quick notes extension tool",
    year: "April 2026",
    link: "https://github.com/LinhL1/jot-extension",
    image: jot,
    tools: ["JavaScript", "HTML", "CSS", "Gemini API"],
    featured: true,
    caseStudy: {
      role: "Solo builder — product scoping, design, and engineering",
      problem:
        "Quick notes, reflection, quotes get lost across scattered notes apps, docs, and sticky notes.",
      approach: [
        "Focused the extension on two core jobs: fast capture of quick notes and reliable recall of commonly-used (\"common placing\") snippets",
        "Integrated the Gemini API to help surface and organize notes with less manual tagging from the user, also useful for further dev of features",
        "Kept the interaction model to a couple of clicks so it never interrupts the task the user is actually trying to do",
      ],
      impact:
        "Built and shipped a working extension that cuts the friction of reusing common text and capturing quick notes while browsing.",
    },
  },
  {
    title: "Auralink",
    type: "Music Hack Space 2026: Biometric Instrument",
    category: "hackathon",
    description:
      "Joint hackathon project: An adaptive bio-music instrument that translates interpersonal biometrics into generative, synchronized musical structures",
    year: "2026",
    link: "https://github.com/willdaly/Auralink",
    image: auralink,
    tools: ["Python", "Google Deepmind Magenta"]
  },
  {
    title: "INformed",
    type: "Gamified Educational Web App",
    category: "other",
    description:
      "A web/mobile application for the IN Network, providing a gamified learning experience to educate individuals on misinformation and digital media.",
    year: "MAY 2026",
    link: "https://innetwork-informed.vercel.app/",
    image: informed,
    tools: ["React", "TypeScript", "Framer Motion", "Tailwind CSS"],
    featured: true,
    caseStudy: {
      role: "Product design & frontend engineering for the IN Network's education initiative",
      problem:
        "The IN Network needed an engaging way to teach media literacy — static articles and traditional courses weren't holding attention, especially with younger audiences.",
      approach: [
        "Partnered with the IN Network to translate their misinformation-literacy curriculum into a gamified flow with clear progress and feedback loops",
        "Prioritized a lightweight, mobile-first experience so it could be picked up in short sessions instead of requiring a sit-down course",
        "Used Framer Motion to add responsive feedback that reinforces correct/incorrect calls without breaking the flow",
      ],
      impact:
        "Delivered a deployed, publicly usable web app that gives the IN Network a self-serve education tool they can point learners to directly.",
    },
  },
  {
    title: "Impromptu",
    type: "Hack the Beanpot: Best Gemini API Integration",
    category: "hackathon",
    description:
      "Joint hackathon project: A fun daily scavenger hunt to keep friends connected through shared mini side quests.",
    year: "FEB 2026",
    link: "https://github.com/LinhL1/Impromptu",
    image: impromptu,
    tools: ["React", "Firebase", "Gemini API", "ElevenLabs API"]

  },
  {
    title: "She Drive",
    type: "Mobile Application",
    category: "other",
    description:
      "A collaborative side project: A full-stack mobile app focused on providing women with a safe and flexible transportation option (Morocco based)",
    year: "JAN 2026",
    link: "https://github.com/haliait/SheDrive",
    image: progress,
    tools: ["Flutter", "Laravel", "Google Maps API", "MySQL"]

  },
  {
    title: "Me, My-Shelf, and I",
    type: "Creative Web App",
    category: "personal",
    description:
      "A cozy digital reading nook to track read books, reading goals, and notes. All you need for an enjoyable reading session in one place.",
    year: "JAN 2026",
    link: "https://just-myshelf.lovable.app/",
    image: mmi,
    tools: ["Lovable", "React", "Supabase"]
  },
  {
    title: "PhishSTX",
    type: "AI/ML",
    category: "other",
    description:
      "An AI4ALL collaborative project: Trained ML models to develop an email phishing detector using NLP techniques.",
    year: "JAN 2026",
    link: "https://phish-stx-deda6n8vytgxa5jzqmmref.streamlit.app/",
    image: phishstx,
    tools: ["Python", "Pandas", "Numpy", "Scikit-learn", "Streamlit"]

  },

];
