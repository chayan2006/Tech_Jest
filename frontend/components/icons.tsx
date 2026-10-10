import type { ServiceCategory } from "@/frontend/data/services";

// Line icons drawn in currentColor, so they follow the text colour around them.
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const CartIcon = () => (
  <Icon>
    <path d="M3 4h2.2l2.3 10.4a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 8H6.1" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </Icon>
);
export const BellIcon = () => (
  <Icon>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Icon>
);
export const MenuIcon = () => (
  <Icon>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
export const LinkedInIcon = () => (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 10.5V17M8 7.5v.01M12 17v-6.5M12 13.5a2.5 2.5 0 0 1 5 0V17" />
  </Icon>
);
export const ChatIcon = () => (
  <Icon>
    <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.2a8.5 8.5 0 1 1 15.8-4.3z" />
  </Icon>
);

const categoryIcons: Record<ServiceCategory, React.ReactNode> = {
  "Web Development": <path d="M8.5 8 4.5 12l4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13" />,
  "E-Commerce": (
    <>
      <path d="M5.5 8h13l-1 12h-11z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  "AI & Automation": (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3" />
    </>
  ),
  "Business Automation": (
    <>
      <path d="M4.5 12a7.5 7.5 0 0 1 13-5.1M19.5 12a7.5 7.5 0 0 1-13 5.1" />
      <path d="M17.5 3.5V7H14M6.5 20.5V17H10" />
    </>
  ),
  "Mobile Development": (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 17.5h2" />
    </>
  ),
  Design: (
    <>
      <path d="M4 20l1.2-4.4L15.8 5a2 2 0 0 1 2.9 0l.3.3a2 2 0 0 1 0 2.9L8.4 18.8z" />
      <path d="M13.5 7.5l3 3" />
    </>
  ),
  "Digital Solutions": (
    <>
      <path d="M12 4l8 4-8 4-8-4z" />
      <path d="M4 12l8 4 8-4M4 16l8 4 8-4" />
    </>
  ),
  "Maintenance & Support": (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 4.9L4 16.5 7.5 20l5.3-5.3a4 4 0 0 0 4.9-5.4l-2.4 2.4-2.6-.5-.5-2.6z" />
  ),
};

// One icon per catalog category; a category added later in the admin falls back to a plain tile.
export function ServiceIcon({ category }: { category: string }) {
  return (
    <Icon>{categoryIcons[category as ServiceCategory] ?? <rect x="5" y="5" width="14" height="14" rx="2" />}</Icon>
  );
}
