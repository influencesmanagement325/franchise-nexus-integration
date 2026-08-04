import { useState } from "react";
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
  Settings,
  Shield,
  ShieldAlert,
  Wallet,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { notificationsQuery } from "@/lib/franchise/api";

const NAV = [
  { to: "/franchise-manager", label: "Control Tower", icon: Gauge, exact: true },
  { to: "/franchise-manager/applications", label: "Applications", icon: ClipboardList },
  { to: "/franchise-manager/franchises", label: "Franchises", icon: Building2 },
  { to: "/franchise-manager/territories", label: "Territories", icon: Map },
  { to: "/franchise-manager/performance", label: "Performance", icon: BarChart3 },
  { to: "/franchise-manager/royalties", label: "Royalty & Commission", icon: Wallet },
  { to: "/franchise-manager/contracts", label: "Contracts", icon: FileSignature },
  { to: "/franchise-manager/documents", label: "Documents", icon: FolderOpen },
  { to: "/franchise-manager/compliance", label: "Compliance", icon: Shield },
  { to: "/franchise-manager/fraud", label: "AI Fraud Alerts", icon: ShieldAlert },
  { to: "/franchise-manager/escalations", label: "Escalations", icon: ArrowUpRight },
  { to: "/franchise-manager/notifications", label: "Notifications", icon: Bell },
  { to: "/franchise-manager/reports", label: "Reports & Audit", icon: FileText },
  { to: "/franchise-manager/settings", label: "Settings", icon: Settings },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: notifications = [] } = useQuery(notificationsQuery);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <span className="gradient-brand rounded-xl p-2 text-primary-foreground">
          <Building2 className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-display truncate text-sm font-semibold text-sidebar-accent-foreground">
            Software Vala
          </p>
          <p className="truncate text-xs text-sidebar-foreground/70">Franchise Manager</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="fm-nav-active"
                    className="absolute inset-y-1 left-0 w-1 rounded-full bg-sidebar-primary"
                  />
                ) : null}
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.label === "Notifications" && unread > 0 ? (
                  <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                    {unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border px-4 py-3 text-xs text-sidebar-foreground/70">
        <p className="flex items-center gap-2">
          <Lock className="size-3.5" />
          Finance / Server access blocked
        </p>
        <p className="mt-1 flex items-center gap-2">
          <AlertTriangle className="size-3.5" />
          One territory = one franchise
        </p>
      </div>
    </div>
  );
}

export function FranchiseManagerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border"
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  <Shield className="size-3" />
                  Regional Control Tower
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/franchise-manager/notifications">
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <Bell className="size-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <span className="gradient-brand grid size-6 place-items-center rounded-full text-[10px] font-semibold text-primary-foreground">
                  FM
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  Franchise Manager
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
