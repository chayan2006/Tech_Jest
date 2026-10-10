// The TechJest team. The About page, the site's structured data, and llms.txt all read this list.
export type TeamMember = {
  id: string;
  name: string;
  role: string;
  linkedin: string;
  github?: string;
  founder?: boolean;
  // Square portrait in public/images/team/, shown round on the About page.
  photo?: string;
};

export const team: readonly TeamMember[] = [
  {
    id: "chayan-khatua",
    name: "Chayan Khatua",
    role: "Founder / CEO",
    founder: true,
    linkedin: "https://www.linkedin.com/in/chayan-khatua/",
    github: "https://github.com/chayan2006",
  },
  {
    id: "amit-singh-panwar",
    name: "Amit Singh Panwar",
    role: "Founder / CEO",
    founder: true,
    linkedin: "https://www.linkedin.com/in/amit-singh-panwar-917b16379/",
  },
  {
    id: "arushi-choudhary",
    name: "Arushi Choudhary",
    role: "CTO",
    linkedin: "https://www.linkedin.com/in/arushi-choudhary-184693356/",
  },
  {
    id: "sindhant-dadwal",
    name: "Sindhant Dadwal",
    role: "CFO",
    linkedin: "https://www.linkedin.com/in/sindhant-dadwal-a9a0a337a/",
  },
  {
    id: "nishtha-banerjee",
    name: "Nishtha Banerjee",
    role: "CPO",
    linkedin: "https://www.linkedin.com/in/nishtha-banerjee-392406315/",
  },
  { id: "nayan-roy", name: "Nayan Roy", role: "CMO", linkedin: "https://www.linkedin.com/in/nayan-roy-aaab01379/" },
  {
    id: "chitwandeep-kaur",
    name: "Chitwandeep Kaur",
    role: "Team member",
    linkedin: "https://www.linkedin.com/in/chitwandeep-kaur-28b487420/",
  },
];
