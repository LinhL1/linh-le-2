
import bouqets_baner from "@/assets/events/bouquet_banter.jpg";
import coworking from "@/assets/events/sl-coworking.png";



export interface CommunityEvent {
  title: string;
  date: string;
  role: string;
  affiliation?: string;
  location?: string;
  description: string;
  image: string;
  imageAlt: string;
  // Ink color of the round date postmark on the photo.
  // Defaults to "light" (white ink, for darker photos); use "dark" for light/pale photos.
  postmarkInk?: "light" | "dark";
  // Optional external link shown on the back of the card (event page, recap, photo album...).
  link?: string;
  // Display text for the link; defaults to "Visit".
  linkLabel?: string;
}

export const communityIntro =
  "I love creating experiences where people feel welcome, the space is intentional, and everyone leaves having had a good time. Here are a few events I've hosted with communities I've been lucky to build with...";

// To add an event: drop a photo in src/assets/events/, import it above,
// and append an entry here. Cards render in array order.
export const events: CommunityEvent[] = [
  {
    title: "Networking Social: Bouquets & Banter",
    date: "July 2026",
    role: "Host",
    affiliation: "Rewriting the Code",
    location: "Boston, MA",
    description:
      "I got to organize and host the RTC Gather Boston: Bouquets & Banter, a community event for RTC that brought local women in tech together to build meaningful connections through a fun, creative experience.",
    image: bouqets_baner,
    imageAlt: "Bouquet social netwoking event",
  },
  {
    title: "Soft Launch Virtual Co-working Sessions",
    date: "June 2026",
    role: "Organizer & Host",
    affiliation: "Independent",
    location: "Remote",
    description:
      "Admiring how coworking events bring together creative and ambitious people, I wanted to recreate that experience in an accessible format...so I launched my own recurring virtual sessions where participants could build, connect, and simply enjoy working alongside like-minded people.",
    image: coworking,
    imageAlt: "Event two",
    postmarkInk: "dark",
    link: "https://luma.com/softlaunch.co", 
    linkLabel: "Event page",
  },

];
