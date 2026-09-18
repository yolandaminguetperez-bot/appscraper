export type NavItem = {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: "Explore",
    items: [
      { label: "Overview", href: "/dashboard/overview", icon: "onboardings" },
      { label: "Apps", href: "/dashboard/apps", icon: "apps" },
      { label: "Ads", href: "/dashboard/ads", icon: "ads" },
      { label: "Organic", href: "/dashboard/organic", icon: "organic" },
      { label: "Onboardings", href: "/dashboard/onboardings", icon: "onboardings" },
      { label: "Trending", href: "/dashboard/trending", icon: "trending" },
      { label: "Rising", href: "/dashboard/rising", icon: "rising" },
    ],
  },
  {
    title: "Favorites",
    items: [
      {
        label: "All favorites",
        href: "/dashboard/favorites",
        icon: "heart",
        children: [
          { label: "Apps", href: "/dashboard/favorites/apps", icon: "apps" },
          { label: "Ads", href: "/dashboard/favorites/ads", icon: "ads" },
          { label: "Organic", href: "/dashboard/favorites/organic", icon: "organic" },
        ],
      },
    ],
  },
  {
    title: "ASO tracking",
    items: [
      { label: "Keyword Explorer", href: "/dashboard/keywords", icon: "key" },
      {
        label: "Your Apps",
        href: "/dashboard/your-apps",
        icon: "apps",
        children: [{ label: "Add App", href: "/dashboard/your-apps/new", icon: "plus" }],
      },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Review Analytics", href: "/dashboard/reviews", icon: "reviews" },
      { label: "Competitor Tracking", href: "/dashboard/competitors", icon: "target" },
      { label: "Store Rankings", href: "/dashboard/rankings", icon: "trending" },
    ],
  },
  {
    title: "AI agents",
    items: [
      { label: "MCP", href: "/dashboard/mcp", icon: "mcp" },
      { label: "API", href: "/dashboard/api", icon: "key" },
    ],
  },
];
