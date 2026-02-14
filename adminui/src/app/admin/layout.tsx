"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Settings,
    LogOut,
    ChevronRight,
    Menu,
    X,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

import Image from "next/image";
import logo from "@/assests/logo.png";

const sidebarItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/admin/clients", icon: Users },
    { name: "Projects", href: "/admin/projects", icon: Briefcase },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { user, logout, isLoading } = useAuth();

    // Don't show sidebar on login page
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-cs-bg dark:bg-zinc-950">
                <Loader2 className="h-10 w-10 animate-spin text-cs-primary-200" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-cs-bg dark:bg-zinc-950">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-cs-border bg-white transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-900",
                    !isSidebarOpen && "-translate-x-full lg:translate-x-0 lg:w-20"
                )}
            >
                <div className="flex h-20 items-center justify-between px-6 border-b border-cs-border dark:border-zinc-800">
                    <div className={cn("flex items-center gap-3", !isSidebarOpen && "lg:hidden")}>
                        <Image
                            src={logo}
                            alt="Bauhaus Spaces"
                            width={140}
                            height={40}
                            className="h-10 w-auto invert dark:invert-0"
                        />
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden text-cs-text hover:text-cs-primary-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 p-4 pt-8">
                    {sidebarItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-[#C5A059]/10 text-cs-primary-200 dark:bg-[#C5A059]/20 dark:text-cs-primary-100"
                                        : "text-cs-text hover:bg-cs-bg dark:hover:bg-zinc-800 dark:text-zinc-400"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-cs-primary-100 dark:text-cs-primary-100" : "text-cs-text")} />
                                    <span className={cn(isActive && "font-bold", !isSidebarOpen && "lg:hidden")}>{item.name}</span>
                                </div>
                                {isActive && isSidebarOpen && <ChevronRight className="h-4 w-4" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-cs-border p-4 dark:border-zinc-800">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all font-bold cursor-pointer"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className={cn(!isSidebarOpen && "lg:hidden")}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 transition-all duration-300",
                isSidebarOpen ? "lg:ml-72" : "lg:ml-20"
            )}>
                {/* Header */}
                <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-cs-border bg-white/80 px-8 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-cs-text hover:text-cs-primary-100"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-cs-heading dark:text-white uppercase">Admin</span>
                            <span className="text-xs text-cs-text dark:text-zinc-400">{user?.email || "Interior Designer"}</span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center font-bold text-cs-primary-200">
                            {user?.email?.[0].toUpperCase() || "A"}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
