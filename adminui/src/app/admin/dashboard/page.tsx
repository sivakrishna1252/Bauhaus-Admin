"use client";

import { useEffect, useState } from "react";
import {
    Users,
    Briefcase,
    TrendingUp,
    Clock,
    Plus,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getDashboardStats, getAllClients } from "@/services/adminService";
import { getAllProjects } from "@/services/projectService";
import Link from "next/link";


interface DashboardStats {
    totalClients: number;
    activeProjects: number;
    pendingProjects: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                // Fetching full lists to calculate accurate stats on the frontend
                const [projects, clients] = await Promise.all([
                    getAllProjects(),
                    getAllClients()
                ]);

                const activeProjectsCount = projects.filter((p: any) => p.status === "IN_PROGRESS").length;
                const notStartedCount = projects.filter((p: any) => p.status === "PENDING").length;
                const delayedCount = projects.filter((p: any) => p.status === "DELAYED").length;
                const activeClientsCount = clients.filter((c: any) => !c.isBlocked).length;

                setStats({
                    totalClients: activeClientsCount,
                    activeProjects: activeProjectsCount,
                    pendingProjects: notStartedCount + delayedCount
                });
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            name: "Total Clients",
            value: stats?.totalClients || "0",
            icon: Users,
            change: "Active clients",
            color: "bg-zinc-700 border-2 border-zinc-200 dark:border-zinc-500",
            iconText: "text-white",
            href: "/admin/clients"
        },
        {
            name: "Active Projects",
            value: stats?.activeProjects || "0",
            icon: Briefcase,
            change: "In progress",
            color: "bg-[#C5A059]",
            href: "/admin/projects?status=IN_PROGRESS"
        },
        {
            name: "Not Started",
            value: stats?.pendingProjects || "0",
            icon: Clock,
            change: "Pending or Delayed",
            color: "bg-zinc-700 border-2 border-zinc-200 dark:border-zinc-500",
            iconText: "text-white",
            href: "/admin/projects?status=PENDING"
        },
    ];


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-cs-primary-200" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-cs-heading dark:text-white">Dashboard Overview</h1>
                    <p className="text-cs-text dark:text-zinc-400">Welcome back, Admin. Here's what's happening today.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/admin/projects">
                        <Button className="h-11 bg-cs-primary-100 hover:bg-cs-primary-200 text-white shadow-lg shadow-cs-primary-100/20">
                            <Plus className="mr-2 h-4 w-4" /> New Project
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat) => (
                    <Link key={stat.name} href={stat.href} className="block transition-transform active:scale-95">
                        <div className="group relative overflow-hidden rounded-2xl border border-cs-border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 h-full">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-cs-text dark:text-zinc-400">{stat.name}</p>
                                    <p className="mt-1 text-2xl font-bold text-cs-heading dark:text-white">{stat.value}</p>
                                </div>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color} ${stat.iconText || "text-white"} shadow-lg`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-zinc-500">
                                <span className="font-medium">{stat.change}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Quick Links */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-cs-heading dark:text-white">Quick Access</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/admin/clients" className="block">
                            <div className="p-6 rounded-2xl border border-cs-border bg-white hover:border-cs-primary-100 hover:bg-[#C5A059]/5 transition-all dark:border-zinc-800 dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-shadow">
                                <Users className="h-8 w-8 text-black dark:text-zinc-200 mb-2" />
                                <h3 className="font-bold text-cs-heading dark:text-zinc-200">Manage Clients</h3>
                                <p className="text-sm text-cs-text">Add or block client access</p>
                            </div>
                        </Link>
                        <Link href="/admin/projects" className="block">
                            <div className="p-6 rounded-2xl border border-cs-border bg-white hover:border-cs-primary-100 hover:bg-[#C5A059]/5 transition-all dark:border-zinc-800 dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-shadow">
                                <Briefcase className="h-8 w-8 text-cs-primary-100 mb-2" />
                                <h3 className="font-bold text-cs-heading dark:text-zinc-200">Track Projects</h3>
                                <p className="text-sm text-cs-text">Update project timelines</p>
                            </div>
                        </Link>
                    </div>
                </div>


            </div>
        </div>
    );
}
