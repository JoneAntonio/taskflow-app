import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Inbox,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Target,
  Tag,
  Sparkles,
  TimerReset,
  Search,
  Users,
  Users2,
  LayoutGrid,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Aparece também na navegação inferior no telemóvel */
  showOnMobile?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, showOnMobile: true },
  { label: "Inbox", href: "/inbox", icon: Inbox, showOnMobile: true },
  { label: "Hoje", href: "/hoje", icon: CalendarCheck, showOnMobile: true },
  { label: "Próximas", href: "/proximas", icon: CalendarRange },
  { label: "Calendário", href: "/calendario", icon: CalendarDays, showOnMobile: true },
];

export const organizeNav: NavItem[] = [
  { label: "Método SMART", href: "/projetos", icon: Target },
  { label: "Etiquetas", href: "/etiquetas", icon: Tag },
];

export const focusNav: NavItem[] = [
  { label: "Matriz de Eisenhower", href: "/matriz", icon: LayoutGrid },
  { label: "Hábitos", href: "/habitos", icon: Sparkles },
  { label: "Pomodoro", href: "/pomodoro", icon: TimerReset },
];

export const teamNav: NavItem[] = [
  { label: "Equipas", href: "/equipas", icon: Users2 },
  { label: "Maturidade da Equipa", href: "/equipa", icon: Users },
];

export const mobileNav: NavItem[] = [
  ...primaryNav.filter((item) => item.showOnMobile),
  { label: "Pesquisa", href: "/pesquisa", icon: Search, showOnMobile: true },
];
