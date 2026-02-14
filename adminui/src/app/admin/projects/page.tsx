"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Plus,
    Search,
    Filter,
    ArrowUpRight,
    MoreVertical,
    Calendar,
    User,
    Loader2,
    Briefcase,
    Layers,
    FileText,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getAllProjects, createProject, deleteProject } from "@/services/projectService";
import { getAllClients } from "@/services/adminService";

interface Project {
    id: string;
    title: string;
    description: string;
    status: "PENDING" | "IN_PROGRESS" | "DELAYED" | "COMPLETED";
    clientId: string;
    client: {
        username: string;
    };
    entries?: any[];
    createdAt: string;
    updatedAt: string;
}

interface Client {
    id: string;
    username: string;
}

const statusStyles = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    DELAYED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const searchParams = useSearchParams();
    // Parse search params for initial filter
    const statusParam = searchParams.get("status")?.toUpperCase();
    const clientParam = searchParams.get("client");

    type StatusFilter = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
    const initialStatus = (["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"].includes(statusParam || "")
        ? statusParam
        : "ALL") as StatusFilter;

    const [filter, setFilter] = useState<StatusFilter>(initialStatus);

    // Create Project Form State
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [clientId, setClientId] = useState("");
    const [status, setStatus] = useState<"PENDING" | "IN_PROGRESS" | "DELAYED" | "COMPLETED">("PENDING");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [projectsData, clientsData] = await Promise.all([
                    getAllProjects(),
                    getAllClients()
                ]);
                setProjects(projectsData);
                setClients(clientsData);
            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) {
            setFormError("Please select a client");
            return;
        }
        setIsSubmitting(true);
        setFormError("");
        try {
            const newProject = await createProject({
                title,
                description,
                clientId
            });

            // Backend might not return the full project with client object, so we handle it
            const selectedClient = clients.find(c => c.id === clientId);
            const projectWithClient = {
                ...newProject,
                client: { username: selectedClient?.username || "Unknown" },
                status: status || "PENDING" // Use status from form as it might be set
            };

            setProjects([projectWithClient, ...projects]);
            setIsCreating(false);
            setTitle("");
            setDescription("");
            setClientId("");
            setStatus("PENDING");
        } catch (err: any) {
            setFormError(err.message || "Failed to create project");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return;

        try {
            await deleteProject(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
        } catch (err: any) {
            alert(err.message || "Failed to delete project");
        }
    };


    const filteredProjects = projects.filter(project => {
        const titleVal = project.title || "";
        const clientVal = project.client?.username || "";
        const matchesSearch = titleVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clientVal.toLowerCase().includes(searchTerm.toLowerCase());


        const matchesFilter = filter === "ALL" || project.status === filter;
        const matchesClient = !clientParam || project.clientId === clientParam;

        return matchesSearch && matchesFilter && matchesClient;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-cs-heading dark:text-white">Project Catalog</h1>
                    <p className="text-cs-text dark:text-zinc-400">Track and manage every interior transformation.</p>
                </div>

                <Sheet open={isCreating} onOpenChange={setIsCreating}>
                    <SheetTrigger asChild>
                        <Button className="bg-cs-primary-100 hover:bg-cs-primary-200 text-white shadow-lg shadow-cs-primary-100/20">
                            <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle className="text-2xl font-bold text-cs-heading">Start New Project</SheetTitle>
                            <SheetDescription>Assign a new design journey to one of your registered clients.</SheetDescription>
                        </SheetHeader>
                        <form onSubmit={handleCreateProject} className="space-y-6 mt-8 px-4">
                            {formError && (
                                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium">
                                    {formError}
                                </div>
                            )}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium text-cs-heading">Project Title</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cs-text" />
                                    <Input
                                        placeholder="e.g. Modern Villa Renovation"
                                        className="pl-12 h-11 border-cs-border"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium text-cs-heading">Assign to Client</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cs-text z-10" />
                                    <Select value={clientId} onValueChange={setClientId} required>
                                        <SelectTrigger className="w-full pl-12 h-11 border-cs-border bg-white text-sm focus:ring-1 focus:ring-cs-primary-100 rounded-lg">
                                            <SelectValue placeholder="Select a client..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-cs-border rounded-xl">
                                            {clients.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.username}</SelectItem>
                                            ))}
                                        </SelectContent>

                                    </Select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium text-cs-heading">Project Status</label>
                                <div className="relative">
                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cs-text z-10" />
                                    <Select value={status} onValueChange={(val) => setStatus(val as any)} required>
                                        <SelectTrigger className="w-full pl-12 h-11 border-cs-border bg-white text-sm focus:ring-1 focus:ring-cs-primary-100 rounded-lg">
                                            <SelectValue placeholder="Select status..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-cs-border rounded-xl">
                                            <SelectItem value="PENDING">Not Started</SelectItem>
                                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                            <SelectItem value="DELAYED">Delayed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium text-cs-heading">Project Description</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-3 h-4 w-4 text-cs-text" />
                                    <textarea
                                        className="w-full pl-12 pt-2.5 min-h-[100px] border border-cs-border rounded-lg bg-white text-sm focus:ring-1 focus:ring-cs-primary-100 outline-none"
                                        placeholder="Describe the scope and vision..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <SheetFooter className="pt-4 px-0">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 bg-cs-primary-100 hover:bg-cs-primary-200 text-white font-bold text-lg"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Launch Project"}
                                </Button>
                            </SheetFooter>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cs-text" />
                    <Input
                        placeholder="Search projects..."
                        className="pl-10 h-10 sm:h-11 border-cs-border focus:ring-cs-primary-100 dark:bg-zinc-900 dark:border-zinc-800 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-cs-border dark:bg-zinc-900 dark:border-zinc-800 overflow-x-auto scrollbar-hide w-full sm:w-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter("ALL")}
                        className={`flex-shrink-0 px-3 h-8 sm:h-9 text-xs sm:text-sm ${filter === "ALL" ? "bg-[#C5A059]/10 text-cs-primary-200 dark:bg-zinc-800 dark:text-white font-bold shadow-sm" : "text-cs-text hover:text-cs-heading"}`}
                    >
                        All
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter("PENDING")}
                        className={`flex-shrink-0 px-3 h-8 sm:h-9 text-xs sm:text-sm ${filter === "PENDING" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold shadow-sm" : "text-cs-text hover:text-cs-heading"}`}
                    >
                        Not Started
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter("IN_PROGRESS")}
                        className={`flex-shrink-0 px-3 h-8 sm:h-9 text-xs sm:text-sm ${filter === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold shadow-sm" : "text-cs-text hover:text-cs-heading"}`}
                    >
                        In Progress
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter("COMPLETED")}
                        className={`flex-shrink-0 px-3 h-8 sm:h-9 text-xs sm:text-sm ${filter === "COMPLETED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold shadow-sm" : "text-cs-text hover:text-cs-heading"}`}
                    >
                        Completed
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter("DELAYED")}
                        className={`flex-shrink-0 px-3 h-8 sm:h-9 text-xs sm:text-sm ${filter === "DELAYED" ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 font-bold shadow-sm" : "text-cs-text hover:text-cs-heading"}`}
                    >
                        Delayed
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-10 w-10 animate-spin text-cs-primary-200" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <div key={project.id} className="group relative flex flex-col rounded-2xl border border-cs-border bg-white transition-all hover:shadow-xl hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyles[project.status as keyof typeof statusStyles]}`}>
                                        {project.status.replace('_', ' ')}
                                    </span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-cs-text hover:text-cs-primary-100 outline-none dark:hover:text-cs-primary-100">
                                                <MoreVertical size={20} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/10 cursor-pointer"
                                                onClick={() => handleDeleteProject(project.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Project
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <h3 className="text-xl font-bold text-cs-heading mb-1 dark:text-white group-hover:text-cs-primary-100 transition-colors dark:group-hover:text-cs-primary-100">
                                    {project.title}
                                </h3>

                                <div className="flex items-center gap-2 text-sm text-cs-text dark:text-zinc-400 mb-6">
                                    <User size={14} className="text-cs-primary-100" />
                                    <span>{project.client.username}</span>
                                </div>


                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-cs-text font-medium flex items-center gap-1.5"><Layers size={14} />{project.entries?.length || 0} Updates</span>
                                        <span className="font-bold text-cs-heading dark:text-zinc-200 uppercase text-[10px]">Portal Ready</span>
                                    </div>
                                </div>

                            </div>

                            <div className="mt-auto border-t border-cs-border p-4 flex items-center justify-between bg-cs-bg/30 dark:border-zinc-800 dark:bg-zinc-800/30">
                                <div className="flex items-center gap-1.5 text-xs text-cs-text dark:text-zinc-500">
                                    <Calendar size={14} />
                                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                                </div>
                                <Link
                                    href={`/admin/projects/${project.id}`}
                                    className="inline-flex items-center gap-1 text-sm font-bold text-cs-primary-100 hover:text-cs-primary-200 dark:text-cs-primary-100"
                                >
                                    View Feed <ArrowUpRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                    {filteredProjects.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-20 text-center">
                            <div className="h-20 w-20 bg-cs-bg rounded-full flex items-center justify-center mb-6 dark:bg-zinc-800">
                                <Briefcase className="h-10 w-10 text-cs-text opacity-20" />
                            </div>
                            <h3 className="text-2xl font-bold text-cs-heading dark:text-white">No projects found</h3>
                            <p className="text-cs-text dark:text-zinc-400 max-w-sm mt-2">Create your first project to start tracking the transformation.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
