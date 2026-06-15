"use client";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart2, Bell, MessageSquare,
  Users, AlertTriangle, Shield, LogOut, ChevronRight
} from "lucide-react";

const nav = [
  { href: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/offenders", label: "Offenders", icon: Users },
  { href: "/dashboard/emergency", label: "Emergency", icon: AlertTriangle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Cookies.get("token")) router.replace("/auth/login");
  }, [router]);

  const logout = () => { Cookies.remove("token"); router.replace("/auth/login"); };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#030712] selection:bg-[#EC4899]/30 selection:text-white">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={{ x: -250 }} animate={{ x: 0 }}
        className="hidden md:flex w-64 flex-col border-r border-[#8B5CF6]/20 bg-[#050816]/95 backdrop-blur-xl relative z-20"
      >
        <div className="p-6 flex items-center gap-3 border-b border-[hsl(var(--border))]">
          <div className="p-2 rounded-lg brand-gradient shadow-[0_0_20px_rgba(236,72,153,0.25)]">
            <Shield className="text-white w-6 h-6" />
          </div>
          <span className="font-scotch text-white font-bold text-xl tracking-normal">CyberShield</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} className="block outline-none relative group">
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-[#EC4899]/16 to-transparent border-l-2 border-[#FCAF45] rounded-r-lg"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-all relative z-10
                  ${isActive 
                    ? "text-[#FCAF45] font-semibold" 
                    : "text-[hsl(var(--muted-foreground))] group-hover:text-white group-hover:bg-white/[0.03]"}`}>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#EC4899]" : ""}`} />
                    {label}
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-[#FCAF45]/70" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[hsl(var(--border))]">
          <button onClick={logout}
            className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-[hsl(var(--muted-foreground))] border border-transparent hover:border-[#E1306C]/40 hover:text-[#FCAF45] hover:bg-[#E1306C]/10 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#030712] relative pb-24 md:pb-0">
        <div className="sticky top-0 z-30 md:hidden border-b border-[#8B5CF6]/20 bg-[#050816]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg brand-gradient">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-scotch text-lg font-bold text-white">CyberShield</span>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[#FCAF45] hover:bg-white/[0.04]" aria-label="Sign out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-[#833AB4]/[0.06] via-transparent to-[#E1306C]/[0.04] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="px-4 py-6 sm:p-8 max-w-7xl mx-auto relative z-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[#8B5CF6]/20 bg-[#050816]/95 backdrop-blur-xl">
          <div className="grid grid-cols-6">
            {nav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-1 px-1 py-2.5 text-[10px] font-semibold transition-colors ${isActive ? "text-[#FCAF45]" : "text-[hsl(var(--muted-foreground))]"}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#EC4899]" : ""}`} />
                  <span className="truncate max-w-full">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
