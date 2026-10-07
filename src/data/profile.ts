// Bio, stats and contact details shared by the classic site (AboutSection, ContactSection)
// and the retro desktop. Edit here and both update.

export const bio = {
  headline: "Builder, just bringing ideas into life in many forms.",
  paragraphs: [
    "As an undergraduate CS student with a background in both creative and technical disciplines, I try to bring a unique perspective to the projects I contribute to. From working with non-profit organizations, student-led initiatives, and personal projects, I care about the functionality, design, and impact of my work. What started with a passion for making fun websites turned into a habit for trying new things...from exploring AI to cybersecurity, I’ve developed an interest for understanding problems, thinking about the people I’m building for, and approaching work not only through a functional lens, but with security and safety in mind.",
    "When I'm not working on projects, you'll probably find me at an event. If not you'll catch me running, journaling, or doodling.",
  ],
};

export const funFact = {
  label: "Fun Fact",
  title: "I am also a florist!",
  body: "Big on gift-giving, I make floral arrangements and handmade cards :)",
  link: "https://delicatedainty.com/",
};

export interface Stat {
  label: string;
  value: string;
}

export const stats: Stat[] = [
  { label: "Focus", value: "Cybersecurity" },
  { label: "Interest", value: "Threat hunting, Full-stack Development, UI/UX Design" },
  { label: "Based in", value: "Boston, MA" },
  { label: "Education", value: "B.S in Computer Science" },
  { label: "Stack/Tools", value: "TypeScript, React/JS, Laravel/PHP, Python, HTML/CSS, Bash, Git/Github" },
];

export const contact = {
  email: "lvnh.le11@gmail.com",
  blurb:
    "Have a project in mind or just want to say hello? I'd love to hear from you. Drop me a message and I'll get back to you soon :)",
};

export interface Social {
  name: string;
  url: string;
}

export const socials: Social[] = [
  { name: "GitHub", url: "https://github.com/LinhL1" },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/linh-le-50751024b/" },
  { name: "Substack", url: "https://substack.com/@liinh" },
];
