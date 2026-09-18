import {
  Bell,
  Building2,
  Flame,
  Globe,
  Heart,
  KeyRound,
  LayoutGrid,
  MessageSquareText,
  Megaphone,
  Plus,
  Smartphone,
  Target,
  TrendingUp,
  Video,
  type LucideIcon,
} from "lucide-react";

const registry: Record<string, LucideIcon> = {
  apps: Smartphone,
  ads: Megaphone,
  organic: Video,
  onboardings: LayoutGrid,
  trending: TrendingUp,
  rising: Flame,
  heart: Heart,
  key: KeyRound,
  plus: Plus,
  reviews: MessageSquareText,
  target: Target,
  mcp: Building2,
  globe: Globe,
  bell: Bell,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = registry[name] ?? Smartphone;
  return <Cmp className={className} strokeWidth={1.8} aria-hidden />;
}
