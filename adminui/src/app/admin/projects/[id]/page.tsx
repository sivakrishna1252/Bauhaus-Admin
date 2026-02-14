"use client";

import { useState, useEffect, use } from "react";
import {
    ArrowLeft,
    Upload,
    Image as ImageIcon,
    Video,
    Clock,
    Trash2,
    Plus,
    Info,
    Loader2,
    Maximize2,
    MoreVertical,
    Edit,
    ImageIcon as ImagePlus,
    FileText,
    X,
    FolderOpen,
    Download,
    FileCheck,
    Receipt,
    ScrollText,
    Award,
    ChevronRight,
    File
} from "lucide-react";
import {
    getProjectDetail,
    updateProjectStatus,
    createProjectEntry,
    updateProjectEntry,
    deleteProjectEntry
} from "@/services/projectService";
import type { EntryCategory, Project, ProjectEntry, MediaFile } from "@/services/projectService";
import { MEDIA_BASE_URL } from "@/config/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


// Local interfaces removed in favor of projectService imports

// Document folder configuration
const DOCUMENT_FOLDERS: { key: EntryCategory; label: string; icon: any; color: string; bgColor: string }[] = [
    { key: 'AGREEMENT', label: 'Agreements', icon: ScrollText, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-950/30' },
    { key: 'PAYMENT_INVOICE', label: 'Payment Invoices', icon: Receipt, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-950/30' },
    { key: 'HANDOVER', label: 'Handover Documents/Certificates', icon: FileCheck, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-950/30' },
];


export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'TIMELINE' | 'DOCUMENTS'>('TIMELINE');
    const [openFolder, setOpenFolder] = useState<EntryCategory | null>(null);

    useEffect(() => {
        const fetchProject = async () => {
            setIsLoading(true);
            try {
                const data = await getProjectDetail(id);
                setProject(data);
                if (data.status) setStatus(data.status);
            } catch (err) {
                console.error("Failed to load project", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProject();
    }, [id]);


    // Upload Form State
    const [file, setFile] = useState<File | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [description, setDescription] = useState("");
    const [selectedEntry, setSelectedEntry] = useState<ProjectEntry | null>(null);
    const [status, setStatus] = useState<string>("IN_PROGRESS");
    const [uploadCategory, setUploadCategory] = useState<EntryCategory>("TIMELINE");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState("");

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState("");
    const [editStatus, setEditStatus] = useState<string>("IN_PROGRESS");
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editFiles, setEditFiles] = useState<File[]>([]);
    const [currentMedia, setCurrentMedia] = useState<MediaFile[]>([]);
    const [currentEntryMergedIds, setCurrentEntryMergedIds] = useState<string[]>([]);
    const [currentFileUrl, setCurrentFileUrl] = useState<string>("");
    const [currentFileType, setCurrentFileType] = useState<"IMAGE" | "VIDEO" | "PDF">("IMAGE");

    const getEntryMedia = (entry: any): MediaFile[] => {
        if (!entry) return [];

        // 1. Try standard media array
        const media = entry.media || entry.media_files || entry.mediaFiles;
        if (media && Array.isArray(media) && media.length > 0) return media;

        // 2. Try fileUrl fallback (frequent in simple responses)
        const fileUrl = entry.fileUrl || entry.file_url || entry.url;
        if (fileUrl) {
            return [{
                url: fileUrl,
                type: (entry.fileType || entry.type || (fileUrl.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMAGE')).toUpperCase() as any
            }];
        }
        return [];
    };

    const getBestCover = (entry: any) => {
        const media = getEntryMedia(entry);
        if (media.length === 0) return null;
        // Prioritize the LATEST image added (last in array) for the visual cover
        const image = [...media].reverse().find(m => getMediaType(m) === 'IMAGE');
        return image || media[0];
    };

    const getEntryCategory = (entry: any): EntryCategory => {
        return entry.category || 'TIMELINE';
    };

    const getGroupedEntries = (entries: ProjectEntry[]) => {
        if (!entries) return [];

        const sortedEntries = [...entries].sort((a, b) => {
            const dateA = new Date(getEntryDate(a) || "").getTime();
            const dateB = new Date(getEntryDate(b) || "").getTime();
            return dateB - dateA;
        });

        const groups: any[] = [];

        sortedEntries.forEach(entry => {
            const entryDate = new Date(getEntryDate(entry) || "").getTime();
            const existingGroup = groups.find(g => {
                const groupDate = new Date(getEntryDate(g) || "").getTime();
                // Strict 10 second window for true batch uploads only.
                // This ensures separate "Add Update" actions stay as separate cards.
                return g.description === entry.description && Math.abs(groupDate - entryDate) < 10000;
            });

            if (existingGroup) {
                if (!existingGroup._mergedIds) existingGroup._mergedIds = [existingGroup.id];
                if (!existingGroup._mergedIds.includes(entry.id)) {
                    existingGroup._mergedIds.push(entry.id);
                }

                const currentMedia = getEntryMedia(existingGroup);
                const newMedia = getEntryMedia(entry);
                const merged = [...currentMedia];
                newMedia.forEach(m => {
                    if (!merged.find(gm => getMediaUrl(gm) === getMediaUrl(m))) {
                        merged.push(m);
                    }
                });
                existingGroup.media = merged;
            } else {
                groups.push({ ...entry, media: getEntryMedia(entry), _mergedIds: [entry.id] });
            }
        });
        return groups;
    };

    // Filter entries by tab
    const getTimelineEntries = () => {
        if (!project?.entries) return [];
        return project.entries.filter(e => getEntryCategory(e) === 'TIMELINE');
    };

    const getDocumentEntries = (category: EntryCategory) => {
        if (!project?.entries) return [];
        if (category === 'HANDOVER') {
            return project.entries.filter(e => getEntryCategory(e) === 'HANDOVER' || getEntryCategory(e) === 'CERTIFICATE');
        }
        return project.entries.filter(e => getEntryCategory(e) === category);
    };

    const getDocumentCount = (category: EntryCategory) => {
        return getDocumentEntries(category).length;
    };

    const getTotalDocumentCount = () => {
        return DOCUMENT_FOLDERS.reduce((acc, folder) => acc + getDocumentCount(folder.key), 0);
    };

    const getMediaUrl = (m: any) => m.url || m.path || m.file || m.fileUrl || m.link || "";
    const getMediaType = (m: any) => (m.type || m.fileType || "IMAGE").toUpperCase();
    const getEntryDate = (entry: any) => {
        if (!entry) return null;
        return entry.createdAt || entry.created_at || entry.date || entry.timestamp || null;
    };

    const formatDate = (dateString: any) => {
        if (!dateString) return "Recently Updated";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Recently Changed";

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const monthDay = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

        if (isToday) return `Today, ${dayName} • ${time}`;
        if (isYesterday) return `Yesterday, ${dayName} • ${time}`;

        return `${dayName}, ${monthDay} • ${time}`;
    };

    const handleEditClick = (entry: any) => {
        setCurrentEntryId(entry.id);
        setCurrentEntryMergedIds(entry._mergedIds || [entry.id]);
        setEditDescription(entry.description);
        setEditStatus(project?.status || "IN_PROGRESS");
        setCurrentMedia(entry.media);
        setEditFiles([]);
        setIsEditing(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !currentEntryId) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("description", editDescription);

            // Critical: The "Professional" way to manage media is to send the retained items.
            // This handles the "removal" requirement.
            formData.append("existingMedia", JSON.stringify(currentMedia));

            // Append new files for the "additive" requirement.
            if (editFiles.length > 0) {
                editFiles.forEach(f => formData.append("media", f));
            }

            // 1. Update the master entry with the new reality
            const result = await updateProjectEntry(currentEntryId, formData);
            const updatedEntry = Array.isArray(result) ? result[0] : result;

            // 2. FORCE PURGE all redundant entries that were grouped to stop "ghosting".
            // We MUST await these to ensure the DB and State are in total sync.
            if (currentEntryMergedIds.length > 1) {
                const redundantIds = currentEntryMergedIds.filter(id => id !== currentEntryId);
                await Promise.all(redundantIds.map(rid => deleteProjectEntry(rid).catch(() => { })));
            }

            // 3. Update Project Status if changed
            if (editStatus !== project.status) {
                await updateProjectStatus(project.id, editStatus);
            }

            // 4. Update local state to reflect the TRUTH immediately.
            setProject(prev => {
                if (!prev) return null;
                const newMedia = getEntryMedia(updatedEntry);
                return {
                    ...prev,
                    status: editStatus,
                    entries: [
                        {
                            ...updatedEntry,
                            // fallback logic if response is partial or keys are different
                            media: newMedia.length > 0 ? newMedia : currentMedia
                        },
                        ...prev.entries.filter(ent => !currentEntryMergedIds.includes(ent.id))
                    ]
                };
            });

            setIsEditing(false);
            setEditFiles([]);
            setCurrentMedia([]);
            setCurrentEntryMergedIds([]);
        } catch (err: any) {
            alert(err.message || "Failed to edit update");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        // Allow text-only updates or file updates
        if (files.length === 0 && !description) {
            setUploadError("Please add a description or select at least one file");
            return;
        }

        setIsSubmitting(true);
        setUploadError("");

        try {
            const formData = new FormData();
            formData.append("description", description);
            formData.append("category", uploadCategory);

            // Append all files to "media" field
            files.forEach(f => {
                formData.append("media", f);
            });

            const result = await createProjectEntry(id, formData);
            const newEntries = Array.isArray(result) ? result : [result];

            // Assign category to entries locally if not returned from API
            const categorizedEntries = newEntries.map((entry: any) => ({
                ...entry,
                category: entry.category || uploadCategory
            }));

            // If status changed, update project status
            if (status !== project?.status) {
                await updateProjectStatus(id, status);
            }

            if (project) {
                setProject({
                    ...project,
                    status: status, // Update project status
                    entries: [...categorizedEntries, ...project.entries]
                });
            }

            setIsUploading(false);
            setFiles([]);
            setDescription("");
            setUploadCategory("TIMELINE");
        } catch (err: any) {
            setUploadError(err.message || "Failed to upload update");
        } finally {
            setIsSubmitting(false);
        }
    };


    const getFullUrl = (url?: string) => {
        if (!url) return "";
        return url.startsWith("http") ? url : `${MEDIA_BASE_URL}/${url}`;
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;
        try {
            await deleteProjectEntry(entryId);
            if (project) {
                setProject({
                    ...project,
                    entries: project.entries.filter(e => e.id !== entryId)
                });
            }
        } catch (err: any) {
            alert(err.message || "Failed to delete entry");
        }
    };

    const handleRemoveMedia = async (entryId: string, mediaIndex: number) => {
        // This would normally be handled by the updateProjectEntry if we only sent the remaining URLs
        // But for now, we'll just show it in the UI and let the user save.
        if (project) {
            setProject({
                ...project,
                entries: project.entries.map(e =>
                    e.id === entryId
                        ? { ...e, media: e.media.filter((_, i) => i !== mediaIndex) }
                        : e
                )
            });
        }
    };

    const triggerDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed", err);
            window.open(url, '_blank');
        }
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-cs-primary-200" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-cs-heading">Project not found</h2>
                <Link href="/admin/projects" className="text-cs-primary-100 hover:underline mt-4 inline-block">Return to Catalog</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <Link
                        href="/admin/projects"
                        className="inline-flex items-center text-sm font-bold text-cs-primary-100 hover:text-cs-primary-200 transition-colors mb-4 group"
                    >
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Catalog
                    </Link>
                    <h1 className="text-4xl font-bold text-cs-heading dark:text-white">{project.title}</h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="px-3 py-0.5 bg-[#C5A059]/10 text-cs-primary-200 text-xs font-bold rounded-full">
                            {project.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-cs-text flex items-center gap-1.5"><Clock size={14} /> Last refined {new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsUploading(true)}
                        className="bg-cs-primary-100 hover:bg-cs-primary-200 text-white rounded-xl px-6 h-11 shadow-lg shadow-cs-primary-100/20"
                    >
                        <Plus size={20} className="mr-2" /> Add Update
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-cs-bg/50 dark:bg-zinc-900/50 rounded-2xl p-1.5 border border-cs-border dark:border-zinc-800 w-fit">
                <button
                    onClick={() => { setActiveTab('TIMELINE'); setOpenFolder(null); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'TIMELINE'
                        ? 'bg-white dark:bg-zinc-800 text-cs-heading dark:text-white shadow-sm'
                        : 'text-cs-text hover:text-cs-heading'
                        }`}
                >
                    <Clock size={16} />
                    Timeline
                    <span className="ml-1 text-sm font-bold text-black dark:text-white">
                        {getTimelineEntries().length}
                    </span>
                </button>
                <button
                    onClick={() => { setActiveTab('DOCUMENTS'); setOpenFolder(null); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'DOCUMENTS'
                        ? 'bg-white dark:bg-zinc-800 text-cs-heading dark:text-white shadow-sm'
                        : 'text-cs-text hover:text-cs-heading'
                        }`}
                >
                    <FolderOpen size={16} />
                    Documents
                    <span className="ml-1 text-sm font-bold text-black dark:text-white">
                        {getTotalDocumentCount()}
                    </span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'TIMELINE' ? (
                        <>
                            {/* Timeline View */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-cs-heading dark:text-white">Visual Timeline</h2>
                                <span className="text-sm font-medium text-cs-text">{getTimelineEntries().length} Updates</span>
                            </div>

                            <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-cs-primary-100/50 before:via-cs-border before:to-transparent">
                                {getGroupedEntries(getTimelineEntries()).map((entry) => (
                                    <div key={entry.id} className="relative pl-12 group/timeline">
                                        {/* Timeline Dot */}
                                        <span className="absolute left-0 mt-1.5 h-10 w-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center dark:bg-zinc-900 shadow-sm z-10 text-zinc-400 group-hover/timeline:bg-black group-hover:text-white transition-all">
                                            {getEntryMedia(entry).length > 0 ? (
                                                getMediaType(getBestCover(entry)) === 'IMAGE' ? <ImageIcon size={16} /> :
                                                    getMediaType(getBestCover(entry)) === 'VIDEO' ? <Video size={16} /> :
                                                        <FileText size={16} />
                                            ) : <ImageIcon size={16} />}
                                        </span>

                                        <div className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 dark:bg-zinc-900 dark:border-zinc-800">
                                            <div
                                                className="relative h-[480px] w-full overflow-hidden bg-cs-bg dark:bg-zinc-800 cursor-pointer group/media"
                                                onClick={() => setSelectedEntry(entry)}
                                            >
                                                {getEntryMedia(entry).length > 0 ? (
                                                    <>
                                                        {getMediaType(getBestCover(entry)) === 'IMAGE' ? (
                                                            <img
                                                                src={getFullUrl(getMediaUrl(getBestCover(entry)))}
                                                                alt=""
                                                                className="h-full w-full object-cover transition-transform duration-700 group-hover/media:scale-110"
                                                            />
                                                        ) : getMediaType(getBestCover(entry)) === 'VIDEO' ? (
                                                            <div className="relative h-full w-full flex items-center justify-center bg-black">
                                                                <Video size={48} className="text-white/30 z-10" />
                                                                <video
                                                                    src={getFullUrl(getMediaUrl(getBestCover(entry)))}
                                                                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-full w-full flex flex-col items-center justify-center bg-[#C5A059]/10 text-cs-primary-200">
                                                                <FileText size={64} />
                                                                <span className="text-sm font-black uppercase mt-4 tracking-widest">Document Update</span>
                                                            </div>
                                                        )}

                                                        {/* Content Overlay */}
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-10 pt-32 pointer-events-none">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Clock size={14} className="text-white" />
                                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                                                                    {formatDate(getEntryDate(entry))}
                                                                </span>
                                                            </div>
                                                            <p className="text-white font-bold text-2xl leading-tight line-clamp-2 drop-shadow-sm uppercase">
                                                                {entry.description}
                                                            </p>
                                                        </div>

                                                        {/* Badge for more items */}
                                                        {getEntryMedia(entry).length > 1 && (
                                                            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase rounded-full border border-white/20 z-20 tracking-widest">
                                                                +{getEntryMedia(entry).length - 1} More
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex h-full flex-col items-center justify-center text-cs-text bg-cs-bg/50 p-10 text-center">
                                                        <ImageIcon size={48} className="opacity-20 mb-4" />
                                                        <span className="text-sm italic mb-4">No media attached</span>
                                                        <p className="text-cs-heading font-medium">{entry.description}</p>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 z-30" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="secondary" size="icon" className="h-10 w-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full shadow-sm hover:bg-white text-white">
                                                                <MoreVertical size={20} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/10 cursor-pointer"
                                                                onClick={() => handleDeleteEntry(entry.id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Entry
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {getTimelineEntries().length === 0 && (
                                    <div className="relative pl-12 py-10 text-center text-cs-text">
                                        No timeline updates added yet. Add your first update to start the journey.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Documents View - Folder based */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-cs-heading dark:text-white">
                                    {openFolder ? DOCUMENT_FOLDERS.find(f => f.key === openFolder)?.label : 'Project Documents'}
                                </h2>
                                {openFolder && (
                                    <button
                                        onClick={() => setOpenFolder(null)}
                                        className="flex items-center gap-2 text-sm font-medium text-cs-primary-200 hover:text-cs-primary-100 transition-colors"
                                    >
                                        <ArrowLeft size={14} /> Back to Folders
                                    </button>
                                )}
                            </div>

                            {!openFolder ? (
                                /* Folder Grid */
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {DOCUMENT_FOLDERS.map(folder => {
                                        const FolderIcon = folder.icon;
                                        const count = getDocumentCount(folder.key);
                                        return (
                                            <button
                                                key={folder.key}
                                                onClick={() => setOpenFolder(folder.key)}
                                                className={`group relative flex items-center gap-4 p-6 rounded-2xl border border-cs-border dark:border-zinc-800 ${folder.bgColor} hover:shadow-lg transition-all duration-300 hover:scale-[1.02] text-left`}
                                            >
                                                <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${folder.color} bg-white dark:bg-zinc-800 shadow-sm border border-cs-border dark:border-zinc-700`}>
                                                    <FolderIcon size={28} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-cs-heading dark:text-white text-base">{folder.label}</h3>
                                                    <p className="text-sm text-cs-text mt-0.5">{count} {count === 1 ? 'file' : 'files'}</p>
                                                </div>
                                                <ChevronRight size={20} className="text-cs-text group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Inside a Folder - Show entries */
                                <div className="space-y-3">
                                    {getDocumentEntries(openFolder).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="h-20 w-20 rounded-full bg-cs-bg dark:bg-zinc-800 flex items-center justify-center mb-4">
                                                <FolderOpen size={36} className="text-cs-text opacity-30" />
                                            </div>
                                            <p className="text-cs-text font-medium">No documents in this folder yet.</p>
                                            <p className="text-sm text-cs-text/60 mt-1">Upload a document using the "Add Update" button.</p>
                                        </div>
                                    ) : (
                                        getDocumentEntries(openFolder).map(entry => {
                                            const media = getEntryMedia(entry);
                                            const folderConfig = DOCUMENT_FOLDERS.find(f => f.key === openFolder);
                                            const FolderIcon = folderConfig?.icon || File;

                                            return (
                                                <div
                                                    key={entry.id}
                                                    className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-cs-border dark:border-zinc-800 hover:shadow-md transition-all group"
                                                >
                                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${folderConfig?.bgColor} ${folderConfig?.color}`}>
                                                        <FolderIcon size={22} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-cs-heading dark:text-white text-sm truncate">
                                                            {entry.description || 'Untitled Document'}
                                                        </p>
                                                        <p className="text-xs text-cs-text mt-0.5">
                                                            {formatDate(getEntryDate(entry))} • {media.length} {media.length === 1 ? 'file' : 'files'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {media.length > 0 && (
                                                            <button
                                                                onClick={() => setSelectedEntry(entry)}
                                                                className="h-9 w-9 rounded-lg bg-cs-bg dark:bg-zinc-800 flex items-center justify-center text-cs-text hover:bg-cs-primary-100 hover:text-white transition-colors dark:hover:bg-cs-primary-100"
                                                                title="View"
                                                            >
                                                                <Maximize2 size={16} />
                                                            </button>
                                                        )}
                                                        {media.length > 0 && (
                                                            <button
                                                                onClick={() => {
                                                                    const m = media[0];
                                                                    const ext = getMediaType(m).toLowerCase() === 'image' ? 'jpg' : getMediaType(m).toLowerCase() === 'video' ? 'mp4' : 'pdf';
                                                                    triggerDownload(getFullUrl(getMediaUrl(m)), `document-${entry.id}.${ext}`);
                                                                }}
                                                                className="h-9 w-9 rounded-lg bg-cs-bg dark:bg-zinc-800 flex items-center justify-center text-cs-text hover:bg-emerald-500 hover:text-white transition-colors"
                                                                title="Download"
                                                            >
                                                                <Download size={16} />
                                                            </button>
                                                        )}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="h-9 w-9 rounded-lg bg-cs-bg dark:bg-zinc-800 flex items-center justify-center text-cs-text hover:text-cs-heading transition-colors">
                                                                    <MoreVertical size={16} />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-44">
                                                                <DropdownMenuItem
                                                                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
                                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-cs-border bg-cs-bg/30 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <div className="flex items-center gap-2 mb-4">
                            <Info size={18} className="text-cs-primary-100" />
                            <h3 className="font-bold text-cs-heading dark:text-white">Project Brief</h3>
                        </div>
                        <p className="text-sm text-cs-text dark:text-zinc-400 leading-relaxed">
                            {project.description}
                        </p>
                    </div>

                    {/* Add Update Quick Form */}
                    {isUploading && (
                        <div className="rounded-2xl border-2 border-[#C5A059]/30 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200 dark:bg-zinc-900 sticky top-24">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-cs-heading dark:text-white text-lg">New Project Update</h3>
                                <button onClick={() => setIsUploading(false)} className="text-cs-text hover:text-rose-500 outline-none"><Trash2 size={18} /></button>
                            </div>

                            <form onSubmit={handleUpload} className="space-y-4">
                                {uploadError && (
                                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium">
                                        {uploadError}
                                    </div>
                                )}

                                {/* Category Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-cs-text">Category</label>
                                    <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as EntryCategory)}>
                                        <SelectTrigger className="w-full bg-cs-bg/50 border-cs-border">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TIMELINE">
                                                <span className="flex items-center gap-2"><Clock size={14} /> Timeline Update</span>
                                            </SelectItem>
                                            <SelectItem value="AGREEMENT">
                                                <span className="flex items-center gap-2"><ScrollText size={14} /> Agreement</span>
                                            </SelectItem>
                                            <SelectItem value="PAYMENT_INVOICE">
                                                <span className="flex items-center gap-2"><Receipt size={14} /> Payment Invoice</span>
                                            </SelectItem>
                                            <SelectItem value="HANDOVER">
                                                <span className="flex items-center gap-2"><FileCheck size={14} /> Handover & Certificate</span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="relative border-2 border-dashed border-cs-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-cs-primary-100 transition-colors cursor-pointer dark:border-zinc-800 bg-cs-bg/20">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*,application/pdf"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setFiles([...files, ...Array.from(e.target.files)]);
                                            }
                                        }}
                                    />
                                    <Upload size={32} className="text-cs-primary-100 mb-2" strokeWidth={1.5} />
                                    <p className="text-sm font-bold text-cs-heading dark:text-zinc-300">Choose photo, video or PDF</p>
                                    <p className="text-xs text-cs-text mt-1">Multi-upload supported</p>
                                </div>

                                {files.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {files.map((f, i) => (
                                            <div key={i} className="relative group bg-cs-bg dark:bg-zinc-800 rounded-lg p-2 border border-cs-border dark:border-zinc-700 flex items-center gap-2 overflow-hidden">
                                                <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center bg-white dark:bg-zinc-900 rounded border border-cs-border">
                                                    {f.type.startsWith('image') ? <ImageIcon size={14} /> : f.type.startsWith('video') ? <Video size={14} /> : <FileText size={14} />}
                                                </div>
                                                <span className="text-[10px] font-medium truncate flex-1">{f.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                                    className="p-1 hover:text-rose-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Only show status selector for Timeline entries */}
                                {uploadCategory === 'TIMELINE' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-cs-text">Update Status</label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger className="w-full bg-cs-bg/50 border-cs-border">
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PENDING">Not Started</SelectItem>
                                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                                <SelectItem value="DELAYED">Delayed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-cs-text">
                                        {uploadCategory === 'TIMELINE' ? 'Update Description' : 'Document Description'}
                                    </label>
                                    <textarea
                                        className="w-full min-h-[100px] border border-cs-border rounded-xl p-3 text-sm focus:ring-1 focus:ring-cs-primary-100 bg-cs-bg/50 dark:bg-zinc-800 dark:border-zinc-700 outline-none"
                                        placeholder={uploadCategory === 'TIMELINE' ? "What's new in this stage?" : "Brief description of the document..."}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-cs-primary-100 hover:bg-cs-primary-200 text-white font-bold h-11"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : uploadCategory === 'TIMELINE' ? "Publish to Client Feed" : "Upload Document"}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <Sheet open={isEditing} onOpenChange={setIsEditing}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-bold text-cs-heading">Edit Update</SheetTitle>
                        <SheetDescription>Modify the update details and project status.</SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSaveEdit} className="space-y-6 mt-8">
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium text-cs-heading">Update Description</label>
                            <textarea
                                className="w-full min-h-[100px] border border-cs-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-cs-primary-100 bg-white outline-none"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium text-cs-heading">Manage Media</label>

                            {/* Current + New Media Combined Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {/* Show existing media first */}
                                {currentMedia.map((m, idx) => (
                                    <div key={`existing-${idx}`} className="relative h-28 bg-cs-bg rounded-xl overflow-hidden border border-cs-border group shadow-sm">
                                        {getMediaType(m) === 'IMAGE' ? (
                                            <img src={getFullUrl(getMediaUrl(m))} className="h-full w-full object-cover" />
                                        ) : getMediaType(m) === 'VIDEO' ? (
                                            <div className="h-full w-full flex items-center justify-center bg-black">
                                                <Video size={24} className="text-white/30" />
                                                <video src={getFullUrl(getMediaUrl(m))} className="absolute inset-0 h-full w-full object-cover opacity-40" />
                                            </div>
                                        ) : (
                                            <div className="h-full w-full flex flex-col items-center justify-center bg-[#C5A059]/10 text-cs-primary-200">
                                                <FileText size={24} />
                                                <span className="text-[10px] font-black uppercase mt-2">PDF</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setCurrentMedia(currentMedia.filter((_, i) => i !== idx))}
                                            className="absolute top-1.5 right-1.5 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg transform scale-90 hover:scale-100 transition-transform"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-2 py-1 text-[8px] font-bold text-cs-text truncate">
                                            {getMediaUrl(m).split('/').pop()}
                                        </div>
                                    </div>
                                ))}

                                {/* Show newly added files */}
                                {editFiles.map((f, i) => (
                                    <div key={`new-${i}`} className="relative h-28 bg-emerald-50 rounded-xl overflow-hidden border border-emerald-200 group shadow-sm">
                                        <div className="h-full w-full flex flex-col items-center justify-center text-emerald-600">
                                            {f.type.startsWith('image') ? <ImageIcon size={24} /> : f.type.startsWith('video') ? <Video size={24} /> : <FileText size={24} />}
                                            <span className="text-[8px] font-black uppercase mt-2">New Upload</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditFiles(editFiles.filter((_, idx) => idx !== i))}
                                            className="absolute top-1.5 right-1.5 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-emerald-100/90 px-2 py-1 text-[8px] font-bold text-emerald-700 truncate">
                                            {f.name}
                                        </div>
                                    </div>
                                ))}

                                {/* Add More Button in same grid */}
                                <div className="relative h-28 border-2 border-dashed border-cs-border rounded-xl flex flex-col items-center justify-center text-center hover:border-cs-primary-100 hover:bg-cs-bg transition-all cursor-pointer group">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*,application/pdf"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setEditFiles([...editFiles, ...Array.from(e.target.files)]);
                                            }
                                        }}
                                    />
                                    <div className="h-10 w-10 rounded-full bg-cs-bg dark:bg-zinc-800 flex items-center justify-center text-cs-text group-hover:bg-cs-primary-100 group-hover:text-white transition-colors">
                                        <Upload size={20} />
                                    </div>
                                    <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">Add Media</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium text-cs-heading">Project Status</label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger className="w-full bg-white border-cs-border">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Not Started</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="DELAYED">Delayed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <SheetFooter>
                            <Button type="submit" className="w-full bg-cs-primary-100 hover:bg-cs-primary-200 text-white font-bold h-11">
                                Save Changes
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Modal for Full View (Admin) */}
            {selectedEntry && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedEntry(null)}
                >
                    <div
                        className="relative bg-white dark:bg-zinc-900 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedEntry(null)}
                            className="absolute top-4 right-4 z-10 h-10 w-10 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-full flex items-center justify-center text-cs-heading hover:bg-rose-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Modal Content */}
                        <div className="p-8">
                            <div className="mb-10 text-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A059]/10 text-cs-primary-200 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                    <Clock size={12} /> {getEntryCategory(selectedEntry) === 'TIMELINE' ? 'Transformation Update' : DOCUMENT_FOLDERS.find(f => f.key === getEntryCategory(selectedEntry))?.label || 'Document'}
                                </span>
                                <h1 className="text-4xl font-black text-cs-heading dark:text-white tracking-tight">
                                    {formatDate(getEntryDate(selectedEntry))}
                                </h1>
                            </div>

                            {/* Media List */}
                            <div className="space-y-8">
                                {getEntryMedia(selectedEntry).map((m, i) => (
                                    <div key={i} className="rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-800 border border-cs-border dark:border-zinc-800">
                                        {getMediaType(m) === 'IMAGE' ? (
                                            <img
                                                src={getFullUrl(getMediaUrl(m))}
                                                alt=""
                                                className="w-full h-auto object-contain max-h-[70vh]"
                                            />
                                        ) : getMediaType(m) === 'VIDEO' ? (
                                            <video
                                                src={getFullUrl(getMediaUrl(m))}
                                                controls
                                                className="w-full h-auto object-contain max-h-[70vh]"
                                            />
                                        ) : (
                                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                                <div className="h-20 w-20 bg-[#C5A059]/10 rounded-full flex items-center justify-center text-cs-primary-200 mb-4">
                                                    <FileText size={40} />
                                                </div>
                                                <h4 className="text-xl font-bold text-cs-heading mb-2">PDF Document</h4>
                                                <a
                                                    href={getFullUrl(getMediaUrl(m))}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-6 h-11 bg-cs-primary-100 text-white rounded-xl font-bold hover:bg-cs-primary-200 transition-colors shadow-lg shadow-cs-primary-100/20"
                                                >
                                                    <Download size={18} /> Download PDF
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-cs-border dark:border-zinc-800 pt-6 mt-8">
                                <h4 className="text-xs font-bold text-cs-text dark:text-zinc-500 uppercase tracking-widest mb-3">Description</h4>
                                <p className="text-lg text-cs-heading dark:text-zinc-200 font-medium leading-relaxed">
                                    {selectedEntry.description}
                                </p>
                                <div className="flex items-center gap-2 mt-4 text-xs text-cs-text opacity-50 font-bold uppercase">
                                    <Clock size={12} />
                                    <span>Added {formatDate(getEntryDate(selectedEntry))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
