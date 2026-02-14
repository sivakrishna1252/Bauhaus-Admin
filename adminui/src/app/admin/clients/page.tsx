"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    UserPlus,
    Key,
    Eye,
    Ban,
    CheckCircle2,
    Loader2,
    RefreshCw,
    User,
    Hash,
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
import { Separator } from "@/components/ui/separator";

import { getAllClients, createClient, resetClientPin, blockClient, unblockClient, deleteClient } from "@/services/adminService";
import { getAllProjects } from "@/services/projectService";

interface Client {
    id: string;
    username: string;
    isBlocked: boolean;
    createdAt: string;
    projectStatus?: {
        inProgress: number;
        completed: number;
        delayed: number;
        notStarted: number;
    };
    lastActive?: string;
    pin?: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "blocked">("all");

    // New Client Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newPin, setNewPin] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // Detail View State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [viewPin, setViewPin] = useState("");

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const [clientsData, projectsData] = await Promise.all([
                getAllClients(),
                getAllProjects()
            ]);

            // Map projects to clients to get real-time status counts
            const mappedData = clientsData.map((client: any) => {
                const clientProjects = projectsData.filter((p: any) => p.clientId === client.id);

                return {
                    ...client,
                    projectStatus: {
                        inProgress: clientProjects.filter((p: any) => p.status === "IN_PROGRESS").length,
                        completed: clientProjects.filter((p: any) => p.status === "COMPLETED").length,
                        delayed: clientProjects.filter((p: any) => p.status === "DELAYED").length,
                        notStarted: clientProjects.filter((p: any) => p.status === "PENDING").length,
                    },
                    lastActive: client.lastActive || "Recently"
                };
            });
            setClients(mappedData);
        } catch (err) {
            console.error("Failed to fetch clients", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePin = async () => {
        if (!viewPin || viewPin.length !== 4) {
            alert("PIN must be 4 digits");
            return;
        }
        if (!selectedClient) return;

        try {
            await resetClientPin(selectedClient.id, viewPin);
            alert("PIN updated successfully");
            setViewPin("");
        } catch (err: any) {
            alert(err.message || "Failed to update PIN");
        }
    }

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError("");

        try {
            const newClient = await createClient(newUsername.replace("@", ""), newPin);
            setClients([{
                ...newClient,
                projectStatus: { inProgress: 0, completed: 0, delayed: 0, notStarted: 0 },
                lastActive: "Just now"
            }, ...clients]);
            setIsAdding(false);
            setNewUsername("");
            setNewPin("");
        } catch (err: any) {
            setFormError(err.message || "Failed to add client");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleBlock = async (id: string, currentlyBlocked: boolean) => {
        try {
            if (currentlyBlocked) {
                await unblockClient(id);
            } else {
                await blockClient(id);
            }

            setClients(clients.map(c => c.id === id ? { ...c, isBlocked: !currentlyBlocked } : c));
            // Update selected client if open
            if (selectedClient && selectedClient.id === id) {
                setSelectedClient({ ...selectedClient, isBlocked: !currentlyBlocked });
            }
        } catch (err: any) {
            alert(err.message || "Failed to update client status");
        }
    };

    const handleDeleteClient = async (id: string) => {
        if (!confirm("Are you sure you want to permanently delete this client? This will also delete all their projects and data. This action cannot be undone.")) return;

        try {
            await deleteClient(id);
            setClients(clients.filter(c => c.id !== id));
            if (selectedClient && selectedClient.id === id) {
                setSelectedClient(null);
            }
            alert("Client and associated data deleted successfully");
        } catch (err: any) {
            alert(err.message || "Failed to delete client");
        }
    };


    const filteredClients = clients.filter(client => {
        const username = client.username || "";
        const matchesSearch = username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === "all" ||
            (filter === "active" && !client.isBlocked) ||
            (filter === "blocked" && client.isBlocked);
        return matchesSearch && matchesFilter;
    });


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-cs-heading dark:text-white">Client Management</h1>
                    <p className="text-cs-text dark:text-zinc-400">Manage your customers and their access credentials.</p>
                </div>
                <Sheet open={isAdding} onOpenChange={setIsAdding}>
                    <SheetTrigger asChild>
                        <Button className="bg-cs-primary-100 hover:bg-cs-primary-200 text-white shadow-lg shadow-cs-primary-100/20">
                            <UserPlus className="mr-2 h-4 w-4" /> Add New Client
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle className="text-2xl font-bold text-cs-heading">Register New Client</SheetTitle>
                            <SheetDescription>Create a new account for your customer to access their project portal.</SheetDescription>
                        </SheetHeader>
                        <Separator className="my-6" />
                        <form onSubmit={handleAddClient} className="space-y-6 px-4">
                            {formError && (
                                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium">
                                    {formError}
                                </div>
                            )}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium text-cs-heading">Username</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cs-text" />
                                    <Input
                                        placeholder="johndoe"
                                        className="pl-12 h-11 border-cs-border"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium text-cs-heading">4-Digit PIN</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cs-text" />
                                    <Input
                                        placeholder="1234"
                                        maxLength={4}
                                        className="pl-12 h-11 border-cs-border"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value)}
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
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Client Account"}
                                </Button>
                            </SheetFooter>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Client Details Sheet */}
            <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-bold text-cs-heading">Client Details</SheetTitle>
                        <SheetDescription>Manage client access and view activity.</SheetDescription>
                    </SheetHeader>
                    <Separator className="my-6" />

                    {selectedClient && (
                        <div className="space-y-8 px-4">
                            {/* Profile Info */}
                            <div className="flex items-center gap-4 p-4 bg-cs-bg rounded-xl dark:bg-zinc-800/50">
                                <div className="h-16 w-16 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-2xl font-bold text-cs-primary-100 dark:bg-[#C5A059]/20 dark:text-cs-primary-100">
                                    {selectedClient.username.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-cs-heading dark:text-white">@{selectedClient.username}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-cs-text/80">
                                        <CheckCircle2 size={12} className={selectedClient.isBlocked ? "text-rose-500" : "text-emerald-500"} />
                                        {selectedClient.isBlocked ? "Blocked" : "Active Account"}
                                    </div>
                                </div>
                            </div>


                            {/* Stats */}
                            <div>
                                <h4 className="font-bold text-cs-heading mb-3 dark:text-zinc-200">Projects Overview</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <Link href={`/admin/projects?status=in_progress&client=${selectedClient.id}`} className="p-3 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl dark:bg-[#C5A059]/10 dark:border-[#C5A059]/20 cursor-pointer hover:bg-[#C5A059]/15 dark:hover:bg-[#C5A059]/20 transition-colors">
                                        <p className="text-xs font-medium text-cs-primary-200 dark:text-cs-primary-100">In Progress</p>
                                        <p className="text-2xl font-bold text-cs-primary-200 dark:text-cs-primary-100">{selectedClient.projectStatus?.inProgress || 0}</p>
                                    </Link>
                                    <Link href={`/admin/projects?status=completed&client=${selectedClient.id}`} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl dark:bg-emerald-900/10 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors">
                                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Completed</p>
                                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{selectedClient.projectStatus?.completed || 0}</p>
                                    </Link>
                                    <Link href={`/admin/projects?status=delayed&client=${selectedClient.id}`} className="p-3 bg-amber-50 border border-amber-100 rounded-xl dark:bg-amber-900/10 dark:border-amber-800 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors">
                                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Delayed</p>
                                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{selectedClient.projectStatus?.delayed || 0}</p>
                                    </Link>
                                    <Link href={`/admin/projects?status=not_started&client=${selectedClient.id}`} className="p-3 bg-zinc-100 border border-zinc-200 rounded-xl dark:bg-zinc-800 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Not Started</p>
                                        <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">{selectedClient.projectStatus?.notStarted || 0}</p>
                                    </Link>

                                </div>
                                <div className="mt-3 p-4 border border-cs-border rounded-xl dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
                                    <p className="text-sm font-medium text-cs-text">Last Active</p>
                                    <p className="text-sm font-bold text-cs-heading dark:text-white">{selectedClient.lastActive}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-cs-heading border-b border-cs-border pb-2 dark:border-zinc-800 dark:text-zinc-200">Security Settings</h4>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-sm font-medium text-cs-heading dark:text-zinc-300">Update Security PIN</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cs-text" />
                                                <Input
                                                    placeholder="New 4-digit PIN"
                                                    maxLength={4}
                                                    className="pl-12 h-11 border-cs-border focus:ring-cs-primary-100"
                                                    value={viewPin}
                                                    onChange={(e) => setViewPin(e.target.value)}
                                                />
                                            </div>
                                            <Button onClick={handleUpdatePin} className="h-11 bg-cs-primary-100 hover:bg-cs-primary-200 text-white shadow-sm font-bold">Update</Button>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex flex-col gap-3">
                                        <Button
                                            variant="outline"
                                            className={`w-full h-12 font-bold ${selectedClient.isBlocked ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50" : "border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"}`}
                                            onClick={() => toggleBlock(selectedClient.id, selectedClient.isBlocked)}
                                        >
                                            {selectedClient.isBlocked ? (
                                                <><CheckCircle2 className="mr-2 h-4 w-4" /> Unblock Access</>
                                            ) : (
                                                <><Ban className="mr-2 h-4 w-4" /> Block Access</>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full h-12 font-bold text-cs-text hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200"
                                            onClick={() => handleDeleteClient(selectedClient.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Client Account
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cs-text" />
                    <Input
                        placeholder="Search by name or username..."
                        className="pl-10 border-cs-border focus:ring-cs-primary-100 dark:bg-zinc-900 dark:border-zinc-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-cs-border dark:bg-zinc-900 dark:border-zinc-800">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter("all")}
                        className={filter === "all" ? "bg-[#C5A059]/10 text-cs-primary-200 dark:bg-zinc-800 dark:text-white font-bold" : "text-cs-text"}
                    >
                        All
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter("active")}
                        className={filter === "active" ? "bg-[#C5A059]/10 text-cs-primary-200 dark:bg-zinc-800 dark:text-white font-bold" : "text-cs-text"}
                    >
                        Active
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter("blocked")}
                        className={filter === "blocked" ? "bg-[#C5A059]/10 text-cs-primary-200 dark:bg-zinc-800 dark:text-white font-bold" : "text-cs-text"}
                    >
                        Blocked
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-cs-border bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-cs-primary-200" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-cs-border bg-cs-bg/50 dark:border-zinc-800 dark:bg-zinc-800/50 text-xs sm:text-base">
                                    <th className="p-2 sm:p-4 font-bold text-cs-heading dark:text-zinc-300 whitespace-nowrap">Client</th>
                                    <th className="p-2 sm:p-4 font-bold text-cs-heading dark:text-zinc-300">Projects Status</th>
                                    <th className="hidden sm:table-cell p-2 sm:p-4 font-bold text-cs-heading dark:text-zinc-300">Last Active</th>
                                    <th className="hidden sm:table-cell p-2 sm:p-4 font-bold text-cs-heading dark:text-zinc-300">Status</th>
                                    <th className="p-2 sm:p-4 font-bold text-cs-heading dark:text-zinc-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="border-b border-cs-border hover:bg-cs-bg/30 transition-colors last:border-0 dark:border-zinc-800 dark:hover:bg-zinc-800/30 text-xs sm:text-base">
                                        <td className="p-2 sm:p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center font-bold text-cs-primary-100 dark:bg-[#C5A059]/20 dark:text-cs-primary-100 text-xs sm:text-base">
                                                    {client.username.charAt(0)}
                                                </div>
                                                <span className="font-bold text-cs-heading dark:text-zinc-200">{client.username}</span>
                                            </div>
                                        </td>

                                        <td className="p-2 sm:p-4 text-cs-text dark:text-zinc-400">
                                            <div className="flex flex-col gap-1">
                                                {(client.projectStatus?.inProgress || 0) > 0 && <span className="text-[10px] sm:text-xs font-bold text-cs-primary-200 bg-[#C5A059]/10 px-1.5 py-0.5 rounded-md w-fit dark:bg-[#C5A059]/20 dark:text-cs-primary-100 whitespace-nowrap">In Progress: {client.projectStatus?.inProgress}</span>}
                                                {(client.projectStatus?.delayed || 0) > 0 && <span className="text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md w-fit dark:bg-amber-900/20 dark:text-amber-400 whitespace-nowrap">Delayed: {client.projectStatus?.delayed}</span>}
                                                {(client.projectStatus?.completed || 0) > 0 && <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md w-fit dark:bg-emerald-900/20 dark:text-emerald-400 whitespace-nowrap">Completed: {client.projectStatus?.completed}</span>}
                                                {(client.projectStatus?.notStarted || 0) > 0 && <span className="text-[10px] sm:text-xs font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-md w-fit dark:bg-zinc-800 dark:text-zinc-400 whitespace-nowrap">Not Started: {client.projectStatus?.notStarted}</span>}
                                                {(!client.projectStatus || Object.values(client.projectStatus).every(v => v === 0)) && <span className="text-[10px] sm:text-xs text-zinc-400 whitespace-nowrap">No Projects</span>}
                                            </div>
                                        </td>

                                        <td className="hidden sm:table-cell p-2 sm:p-4 text-sm text-cs-text dark:text-zinc-400 font-medium">
                                            {client.lastActive}
                                        </td>
                                        <td className="hidden sm:table-cell p-2 sm:p-4">
                                            {!client.isBlocked ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold dark:bg-emerald-500/10 whitespace-nowrap">
                                                    <CheckCircle2 size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-full text-xs font-bold dark:bg-rose-500/10 whitespace-nowrap">
                                                    <Ban size={12} /> Blocked
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-2 sm:p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedClient(client)}
                                                    className="text-cs-primary-100 hover:text-cs-primary-200 hover:bg-[#C5A059]/10 font-bold"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" /> View
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClient(client.id)}
                                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredClients.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="h-16 w-16 bg-cs-bg rounded-full flex items-center justify-center mb-4 dark:bg-zinc-800">
                                    <Search className="h-8 w-8 text-cs-text" />
                                </div>
                                <h3 className="text-xl font-bold text-cs-heading dark:text-white">No clients found</h3>
                                <p className="text-cs-text dark:text-zinc-400 max-w-xs mt-2">Try adjusting your search or add a new client to get started.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
