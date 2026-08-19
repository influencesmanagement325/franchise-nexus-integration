import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileSignature,
  FileText,
  FolderOpen,
  Gauge,
  Lock,
  Map,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Wallet,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { notificationsQuery } from "@/lib/franchise/api";

type NavItem = { to: string; label: string; icon: typeof Gauge; exact?: boolean };

const OVERVIEW: NavItem[] = [
  { to: "/franchise-manager", label: "Control Tower", icon: Gauge, exact: true },
];

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Network",
    items: [
      { to: "/franchise-manager/applications", label: "Applications", icon: ClipboardList },
      { to: "/franchise-manager/franchises", label: "Franchises", icon: Building2 },
      { to: "/franchise-manager/territories", label: "Territories", icon: Map },
      { to: "/franchise-manager/performance", label: "Performance", icon: BarChart3 },
    ],
  },
  {
    label: "Commercial",
    items: [
      { to: "/franchise-manager/royalties", label: "Royalty & Commission", icon: Wallet },
      { to: "/franchise-manager/contracts", label: "Contracts", icon: FileSignature },
      { to: "/franchise-manager/documents", label: "Documents", icon: FolderOpen },
    ],
  },
  {
    label: "Risk & Governance",
    items: [
      { to: "/franchise-manager/compliance", label: "Compliance", icon: Shield },
      { to: "/franchise-manager/fraud", label: "AI Fraud Alerts", icon: ShieldAlert },
      { to: "/franchise-manager/escalations", label: "Escalations", icon: ArrowUpRight },
    ],
  },
];

const BOTTOM: NavItem[] = [
  { to: "/franchise-manager/notifications", label: "Notifications", icon: Bell },
  { to: "/franchise-manager/reports", label: "Reports & Audit", icon: FileText },
  { to: "/franchise-manager/settings", label: "Settings", icon: Settings },
];

const COLLAPSE_KEY = "sv:fm:sidebar:collapsed";

function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  return { collapsed, toggleCollapsed, mobileOpen, setMobileOpen };
}

function SidebarContent({
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: notifications = [] } = useQuery(notificationsQuery);
  const unread = notifications.filter((n) => !n.read).length;
  const [query, setQuery] = useState("");

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const ItemLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item);
    return (
      <Link
        to={item.to}
        onClick={onNavigate}
        title={item.label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group/item relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors duration-150",
          collapsed && "justify-center px-0",
          active
            ? "bg-primary/18 font-medium text-foreground"
            : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
        )}
      >
        {active && (
          <span className="absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full bg-primary" />
        )}
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.label === "Notifications" && unread > 0 ? (
          <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-bold text-primary-foreground">
            {unread}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-border px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          to="/franchise-manager"
          className="flex min-w-0 items-center gap-2"
          onClick={onNavigate}
        >
          <span className="from-primary to-primary-glow grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br font-bold text-primary-foreground">
            SV
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight">
                Software Vala
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                Franchise Manager
              </span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggleCollapsed}
            className="ml-auto hidden h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground lg:grid"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggleCollapsed}
          className="mx-auto mt-3 hidden h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground lg:grid"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {!collapsed && (
        <div className="shrink-0 px-3 pt-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a section…"
              aria-label="Find a section"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-3">
        {!filtered && (
          <div className="space-y-0.5">
            {OVERVIEW.map((item) => (
              <ItemLink key={item.to} item={item} />
            ))}
          </div>
        )}

        {(filtered ?? GROUPS).map((group) => (
          <div key={group.label} className={cn(collapsed && "border-t border-border/60 pt-2")}>
            {!collapsed && (
              <p className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <ItemLink key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}

        {filtered && filtered.length === 0 && (
          <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">No sections match.</p>
        )}
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-border px-2 py-2">
        {BOTTOM.map((item) => (
          <ItemLink key={item.to} item={item} />
        ))}
      </div>

      {!collapsed && (
        <div className="shrink-0 border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
          <p className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Finance / Server access blocked
          </p>
          <p className="mt-1 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            One territory = one franchise
          </p>
        </div>
      )}
    </div>
  );
}

export function FranchiseManagerLayout() {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarState();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-background/80 backdrop-blur-xl transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <button
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu overlay"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-border bg-background shadow-2xl"
            >
              <SidebarContent
                collapsed={false}
                onToggleCollapsed={toggleCollapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="icon3d grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Open navigation"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
          <span className="truncate text-sm font-semibold tracking-tight">Franchise Manager</span>
          <Link
            to="/franchise-manager/notifications"
            className="icon3d ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
          </Link>
        </header>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
