"use client";

import { useState, useEffect } from "react";
import {
    Clock,
    Image as ImageIcon,
    Video,
    LogOut,
    Maximize2,
    Loader2,
    Calendar,
    CheckCircle2,
    AlertCircle,
    X,
    FolderOpen,
    FileText,
    ChevronRight,
    Download,
    ScrollText,
    Receipt,
    FileCheck,
    File,
    Eye
} from "lucide-react";
import { getMyProjects } from "@/services/projectService";
import type { EntryCategory, Project, ProjectEntry, MediaFile } from "@/services/projectService";
import { MEDIA_BASE_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Document folder configuration
const DOCUMENT_FOLDERS: { key: EntryCategory; label: string; icon: any; color: string; bgColor: string; borderColor: string }[] = [
    { key: 'AGREEMENT', label: 'Agreements', icon: ScrollText, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-900/30', borderColor: 'border-[#C5A059]/10 dark:border-zinc-800' },
    { key: 'PAYMENT_INVOICE', label: 'Payment Invoices', icon: Receipt, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-900/30', borderColor: 'border-[#C5A059]/10 dark:border-zinc-800' },
    { key: 'HANDOVER', label: 'Handover & Certificates', icon: FileCheck, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-900/30', borderColor: 'border-[#C5A059]/10 dark:border-zinc-800' },
];

export default function ClientDashboard() {
    const { user, logout } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedEntry, setSelectedEntry] = useState<ProjectEntry | null>(null);
    const [activeTab, setActiveTab] = useState<'TIMELINE' | 'DOCUMENTS'>('TIMELINE');
    const [openFolder, setOpenFolder] = useState<EntryCategory | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            try {
                const projects = await getMyProjects();
                if (projects && projects.length > 0) {
                    setProject(projects[0]);
                }
            } catch (err: any) {
                setError(err.message || "Failed to load projects");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const getFullUrl = (url: string) => {
        if (!url) return "";
        return url.startsWith("http") ? url : `${MEDIA_BASE_URL}/${url}`;
    };

    const getMediaUrl = (m: any) => m.url || m.path || m.file || m.fileUrl || m.link || "";
    const getMediaType = (m: any) => (m.type || m.fileType || "IMAGE").toUpperCase();

    const getEntryCategory = (entry: any): EntryCategory => {
        return entry.category || 'TIMELINE';
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

    const getEntryMedia = (entry: any): MediaFile[] => {
        if (!entry) return [];
        const media = entry.media || entry.media_files || entry.mediaFiles;
        if (media && Array.isArray(media) && media.length > 0) return media;
        const fileUrl = entry.fileUrl || entry.file_url || entry.url;
        if (fileUrl) {
            return [{
                url: fileUrl,
                type: (entry.fileType || entry.type || (fileUrl.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMAGE')).toUpperCase() as any
            }];
        }
        return [];
    };

    const getGroupedEntries = (entries: any[]) => {
        if (!entries) return [];
        const sortedEntries = [...entries].sort((a, b) => {
            const dateA = new Date(a.createdAt || "").getTime();
            const dateB = new Date(b.createdAt || "").getTime();
            return dateB - dateA;
        });

        const groups: any[] = [];
        sortedEntries.forEach(entry => {
            const entryDate = new Date(entry.createdAt || "").getTime();
            const existingGroup = groups.find(g => {
                const groupDate = new Date(g.createdAt || "").getTime();
                return g.description === entry.description && Math.abs(groupDate - entryDate) < 10000;
            });
            if (existingGroup) {
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
                groups.push({ ...entry, media: getEntryMedia(entry) });
            }
        });
        return groups;
    };

    const getBestCover = (entry: any) => {
        const media = getEntryMedia(entry);
        if (media.length === 0) return null;
        const image = [...media].reverse().find(m => getMediaType(m) === 'IMAGE');
        return image || media[0];
    };

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

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-zinc-950">
                <Loader2 className="h-10 w-10 animate-spin text-black" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-cs-bg dark:bg-zinc-950 p-6 text-center font-jakarta">
                <AlertCircle size={64} className="text-rose-500 mb-6" />
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Access Issue</h1>
                <p className="text-zinc-500 max-w-md mb-8">{error || "We couldn't find an active project linked to your account."}</p>
                <Button onClick={logout} variant="outline" className="rounded-2xl border-zinc-200">
                    <LogOut className="mr-2 h-4 w-4" /> Logout and Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] dark:bg-zinc-950 font-jakarta selection:bg-[#C5A059]/30 selection:text-[#C5A059]">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#1A1A1A]/95 backdrop-blur-xl border-b border-[#C5A059]/20 px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <img
                            src="/assests/logo.png"
                            alt="Logo"
                            className="h-10 w-auto brightness-0 invert"
                            onError={(e) => {
                                const img = e.currentTarget;
                                img.classList.remove('brightness-0', 'invert');
                            }}
                        />
                        <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
                        <h1 className="font-bold text-[#C5A059] uppercase tracking-widest text-[12px] hidden sm:block">Client Portal</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[8px] font-black text-[#C5A059] uppercase tracking-widest">Verified Client</span>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{user?.email?.split('@')[0]}</span>
                        </div>
                        <button onClick={logout} className="h-9 px-4 rounded-full border border-[#C5A059]/40 flex items-center gap-2 text-[#C5A059] hover:bg-[#C5A059] hover:text-white transition-all text-[9px] font-bold uppercase tracking-widest">
                            Exit <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 lg:p-12">
                {/* Project Title Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-[#C5A059] text-white text-[10px] font-bold rounded-sm uppercase tracking-widest">
                            {project.status.replace('_', ' ')}
                        </span>
                        <div className="h-px w-8 bg-zinc-200"></div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Live Sync</span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-bold text-zinc-900 dark:text-white tracking-tight leading-tight mb-4">{project.title}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg leading-relaxed font-normal">{project.description}</p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-white border border-zinc-200 rounded-full w-fit mb-12 mx-auto sm:mx-0 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                    <button
                        onClick={() => { setActiveTab('TIMELINE'); setOpenFolder(null); }}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-[12px] font-bold transition-all ${activeTab === 'TIMELINE' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                    >
                        <Clock size={14} className={activeTab === 'TIMELINE' ? 'text-white dark:text-black' : 'text-zinc-400'} />
                        Timeline
                        <span className={`ml-1 text-xs font-bold ${activeTab === 'TIMELINE' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-500'}`}>{getTimelineEntries().length}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('DOCUMENTS'); setOpenFolder(null); }}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-[12px] font-bold transition-all ${activeTab === 'DOCUMENTS' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                    >
                        <FolderOpen size={14} className={activeTab === 'DOCUMENTS' ? 'text-white dark:text-black' : 'text-zinc-400'} />
                        Documents
                        <span className={`ml-1 text-xs font-bold ${activeTab === 'DOCUMENTS' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-500'}`}>{getTotalDocumentCount()}</span>
                    </button>
                </div>

                {activeTab === 'TIMELINE' ? (
                    <div className="space-y-16 animate-in fade-in duration-700">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Progress Timeline</h3>
                        <div className="grid gap-24 relative before:absolute before:inset-0 before:left-[19px] before:h-full before:w-[2px] before:bg-zinc-100">
                            {getGroupedEntries(getTimelineEntries()).map((entry) => (
                                <div key={entry.id} className="relative pl-14 group">
                                    <div className="absolute left-0 mt-2 h-10 w-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-xl z-10 group-hover:bg-[#C5A059] group-hover:text-white transition-all">
                                        {getEntryMedia(entry).length > 0 && getMediaType(getBestCover(entry)) === 'IMAGE' ? <ImageIcon size={14} /> : <Video size={14} />}
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer" onClick={() => setSelectedEntry(entry)}>
                                        <div className="relative h-[480px] bg-zinc-50 overflow-hidden">
                                            {getEntryMedia(entry).length > 0 ? (
                                                <>
                                                    <img src={getFullUrl(getMediaUrl(getBestCover(entry)))} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-8 pt-24 text-white">
                                                        <div className="flex items-center gap-2 mb-4 text-[#C5A059] text-[10px] font-bold uppercase tracking-widest">
                                                            <Clock size={12} /> {formatDate(entry.createdAt)}
                                                        </div>
                                                        <p className="text-2xl font-bold leading-tight line-clamp-2">{entry.description}</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-zinc-400 italic">{entry.description}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12 animate-in fade-in duration-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Project Documents</h3>
                            {openFolder && <button onClick={() => setOpenFolder(null)} className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">Back to Folders</button>}
                        </div>
                        {!openFolder ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {DOCUMENT_FOLDERS.map(folder => (
                                    <button key={folder.key} onClick={() => setOpenFolder(folder.key)} className="flex items-center gap-6 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-left group">
                                        <div className={`h-20 w-20 rounded-2xl flex items-center justify-center transition-all ${folder.bgColor} group-hover:bg-[#C5A059] group-hover:text-white`}>
                                            <folder.icon size={32} className={`${folder.color} group-hover:text-white transition-colors`} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-base mb-2">{folder.label}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="h-6 px-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{getDocumentCount(folder.key)} Files</span>
                                                <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-700 group-hover:w-12 group-hover:bg-[#C5A059] transition-all"></div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {getDocumentEntries(openFolder).map(entry => (
                                    <div key={entry.id} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-xl hover:border-[#C5A059]/30 transition-all font-jakarta group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-[#C5A059]/10 group-hover:text-[#C5A059]">
                                                <File size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-900 text-sm uppercase tracking-wider">{entry.description}</p>
                                                <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-widest">{formatDate(entry.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const m = getEntryMedia(entry)[0];
                                                    if (m) window.open(getFullUrl(getMediaUrl(m)), '_blank');
                                                }}
                                                className="h-10 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                                            >
                                                <Eye size={14} /> View
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const m = getEntryMedia(entry)[0];
                                                    const ext = getMediaType(m).toLowerCase() === 'image' ? 'jpg' : getMediaType(m).toLowerCase() === 'video' ? 'mp4' : 'pdf';
                                                    triggerDownload(getFullUrl(getMediaUrl(m)), `${entry.description || 'doc'}.${ext}`);
                                                }}
                                                className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-[#C5A059] dark:hover:bg-[#C5A059] hover:text-white dark:hover:text-white transition-all flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1"
                                                title="Download"
                                            >
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Lightbox / Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6" onClick={() => setSelectedEntry(null)}>
                    <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors" onClick={() => setSelectedEntry(null)}>
                        <X size={32} />
                    </button>
                    <div className="max-w-5xl w-full max-h-full overflow-y-auto scrollbar-hide" onClick={e => e.stopPropagation()}>
                        <div className="mb-12 text-center max-w-2xl mx-auto">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#C5A059] mb-6">{formatDate(selectedEntry.createdAt)}</p>
                            <h2 className="text-lg md:text-xl text-zinc-200 font-normal leading-relaxed">{selectedEntry.description}</h2>
                        </div>
                        <div className="grid gap-12">
                            {getEntryMedia(selectedEntry).map((m, i) => (
                                <div key={i} className="relative rounded-2xl overflow-hidden border border-white/10 group/modal-item">
                                    {getMediaType(m) === 'IMAGE' ? (
                                        <img src={getFullUrl(getMediaUrl(m))} alt="" className="w-full h-auto max-h-[80vh] object-contain mx-auto" />
                                    ) : getMediaType(m) === 'VIDEO' ? (
                                        <video src={getFullUrl(getMediaUrl(m))} controls className="w-full h-auto max-h-[80vh]" />
                                    ) : (
                                        <div className="p-20 bg-zinc-900 flex flex-col items-center justify-center">
                                            <FileText size={64} className="text-[#C5A059] mb-4" />
                                            <a href={getFullUrl(getMediaUrl(m))} target="_blank" className="px-8 py-3 bg-[#C5A059] rounded-xl font-bold text-white mb-4">Open Document</a>
                                        </div>
                                    )}

                                    {/* Download icon in Lightbox */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const ext = getMediaType(m).toLowerCase() === 'image' ? 'jpg' : getMediaType(m).toLowerCase() === 'video' ? 'mp4' : 'pdf';
                                            triggerDownload(getFullUrl(getMediaUrl(m)), `bauhaus-export-${i}.${ext}`);
                                        }}
                                        className="absolute top-6 right-6 h-12 w-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-[#C5A059] hover:border-[#C5A059] transition-all opacity-100 md:opacity-0 group-hover/modal-item:opacity-100 shadow-xl"
                                        title="Download"
                                    >
                                        <Download size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <footer className="p-20 mt-20 border-t border-zinc-100 text-center">
                <img src="/assests/logo.png" alt="Bauhaus Logo" className="h-12 mx-auto mb-6 opacity-20 grayscale" />
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-300">© Bauhaus Spaces • Design Excellence</p>
            </footer>
        </div>
    );
}
