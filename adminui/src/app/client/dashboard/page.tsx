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
    File as FileIcon,
    Eye,
    Check,
    Upload,
    Info,
    Award,
    MoreVertical
} from "lucide-react";
import { getMyProjects, getProjectTimeline, submitTimelineFeedback, createProjectEntry } from "@/services/projectService";
import type { EntryCategory, Project, ProjectEntry, MediaFile, TimelineStep } from "@/services/projectService";
import { MEDIA_BASE_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Document folder configuration
const DOCUMENT_FOLDERS: { key: EntryCategory; label: string; icon: any; color: string; bgColor: string; borderColor: string }[] = [
    { key: 'AGREEMENT', label: 'Official Agreements', icon: ScrollText, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-900/30', borderColor: 'border-[#C5A059]/10 dark:border-zinc-800' },
    { key: 'PAYMENT_INVOICE', label: 'Invoice History', icon: Receipt, color: 'text-zinc-600 dark:text-zinc-400', bgColor: 'bg-zinc-50 dark:bg-zinc-900/30', borderColor: 'border-zinc-200 dark:border-zinc-800' },
    { key: 'PROJECT_DOCUMENT', label: 'Approved Designs', icon: FileCheck, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50/50 dark:bg-emerald-900/10', borderColor: 'border-emerald-100 dark:border-emerald-900/20' },
    { key: 'HANDOVER', label: 'Certificates & Handover', icon: Award, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50/50 dark:bg-amber-900/10', borderColor: 'border-amber-100 dark:border-amber-900/20' },
    { key: 'CLIENT_UPLOAD', label: 'Shared with Team', icon: Upload, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50/50 dark:bg-blue-900/10', borderColor: 'border-blue-100 dark:border-blue-900/20' },
];

export default function ClientDashboard() {
    const { user, logout } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedEntry, setSelectedEntry] = useState<ProjectEntry | null>(null);
    const [activeTab, setActiveTab] = useState<'TIMELINE' | 'DOCUMENTS' | 'FEED'>('TIMELINE');
    const [openFolder, setOpenFolder] = useState<EntryCategory | null>(null);
    const [timeline, setTimeline] = useState<TimelineStep[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackFiles, setFeedbackFiles] = useState<File[]>([]);
    const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean, stepId: string | null, status: 'APPROVED' | 'REJECTED', feedback: string }>({ isOpen: false, stepId: null, status: 'APPROVED', feedback: '' });

    // Client Upload State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadDocs, setUploadDocs] = useState<File[]>([]);
    const [uploadDesc, setUploadDesc] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                const projects = await getMyProjects();
                if (projects && projects.length > 0) {
                    const p = projects[0];
                    setProject(p);
                    const tl = await getProjectTimeline(p.id);
                    setTimeline(tl);
                }
            } catch (err: any) {
                setError(err.message || "Failed to load data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const handleFeedback = (stepId: string, status: 'APPROVED' | 'REJECTED') => {
        setFeedbackModal({ isOpen: true, stepId, status, feedback: '' });
    };

    const handleFeedbackSubmit = async () => {
        if (!feedbackModal.stepId) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('status', feedbackModal.status);
            formData.append('clientFeedback', feedbackModal.feedback);
            feedbackFiles.forEach(file => {
                formData.append('media', file);
            });

            await submitTimelineFeedback(feedbackModal.stepId, formData);
            // Refresh timeline
            if (project) {
                const tl = await getProjectTimeline(project.id);
                setTimeline(tl);
            }
            setFeedbackModal({ isOpen: false, stepId: null, status: 'APPROVED', feedback: '' });
            setFeedbackFiles([]);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClientUpload = async () => {
        if (!project || (uploadDocs.length === 0 && !uploadDesc)) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('description', uploadDesc);
            formData.append('category', 'CLIENT_UPLOAD');
            uploadDocs.forEach(file => {
                formData.append('media', file);
            });
            await createProjectEntry(project.id, formData);

            // Refresh project data
            const projects = await getMyProjects();
            if (projects && projects.length > 0) setProject(projects[0]);

            setIsUploadModalOpen(false);
            setUploadDocs([]);
            setUploadDesc("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsUploading(false);
        }
    };

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

    const getUnifiedFeed = () => {
        if (!project) return [];
        const feed: any[] = [];

        // 1. Project Entries (TIMELINE category)
        project.entries.filter(e => e.category === 'TIMELINE').forEach(e => {
            feed.push({
                id: e.id,
                type: 'ENTRY',
                date: new Date(e.createdAt),
                description: e.description,
                media: getEntryMedia(e)
            });
        });

        // 2. Timeline Step Completion Files
        timeline.forEach(step => {
            step.completionFiles.forEach(cf => {
                feed.push({
                    id: cf.id,
                    type: 'COMPLETION',
                    date: new Date(cf.createdAt),
                    description: `Milestone Completed: ${step.title}`,
                    media: [{ url: cf.fileUrl, type: cf.fileType }]
                });
            });

            // 3. Timeline Step Daily Logs
            step.dailyLogs.forEach(log => {
                feed.push({
                    id: log.id,
                    type: 'LOG',
                    date: new Date(log.logDate),
                    description: `Update for ${step.title}: ${log.description}`,
                    media: []
                });
            });
        });

        return feed.sort((a, b) => b.date.getTime() - a.date.getTime());
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

    if (error || !project || (!project.isFinalized && user?.role !== 'ADMIN')) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-cs-bg dark:bg-zinc-950 p-6 text-center font-jakarta">
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-[#C5A059]/20 blur-[100px] rounded-full"></div>
                    <Clock size={120} strokeWidth={0.5} className="text-[#C5A059] relative animate-pulse" />
                </div>
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">Project Setup in Progress</h1>
                <p className="text-zinc-500 max-w-md mb-12 text-lg leading-relaxed">
                    Our team is currently finalizing your project roadmap and design phases. You'll receive an email notification as soon as your personalized portal is ready.
                </p>
                <div className="flex gap-4">
                    <Button onClick={logout} variant="outline" className="rounded-2xl border-zinc-200 h-12 px-8 font-bold uppercase tracking-widest text-[10px]">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] dark:bg-zinc-950 font-jakarta selection:bg-[#C5A059]/30 selection:text-[#C5A059]">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#1A1A1A]/95 backdrop-blur-xl border-b border-[#C5A059]/20 px-4 md:px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-6">
                        <img
                            src="/assests/logo.png"
                            alt="Logo"
                            className="h-8 md:h-10 w-auto brightness-0 invert"
                            onError={(e) => {
                                const img = e.currentTarget;
                                img.classList.remove('brightness-0', 'invert');
                            }}
                        />
                        <div className="h-6 md:h-8 w-px bg-white/10 hidden sm:block"></div>
                        <h1 className="font-bold text-[#C5A059] uppercase tracking-widest text-[10px] md:text-[14px] hidden sm:block">Client Portal</h1>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] md:text-[14px] font-black text-[#C5A059] uppercase tracking-widest">Verified Client</span>
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{user?.email?.split('@')[0]}</span>
                        </div>
                        <button onClick={logout} className="h-8 px-3 sm:h-9 sm:px-4 rounded-full border border-[#C5A059]/40 flex items-center gap-2 text-[#C5A059] hover:bg-[#C5A059] hover:text-white transition-all text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
                            <span className="hidden sm:inline">Exit</span> <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 lg:p-12">
                {/* Project Title Section */}
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <span className="px-2 md:px-3 py-0.5 md:py-1 bg-[#C5A059] text-white text-[9px] md:text-[10px] font-bold rounded-sm uppercase tracking-widest">
                            {project.status.replace('_', ' ')}
                        </span>
                        <div className="h-px w-6 md:w-8 bg-zinc-200"></div>
                        <span className="text-[9px] md:text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Live Sync</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-4">{project.title}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-base md:text-lg leading-relaxed font-normal">{project.description}</p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-2xl md:rounded-full w-full sm:w-fit mb-8 md:mb-12 mx-auto sm:mx-0 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => { setActiveTab('TIMELINE'); setOpenFolder(null); }}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-xl md:rounded-full text-[11px] md:text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'TIMELINE' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50'}`}
                    >
                        <Clock size={14} className={activeTab === 'TIMELINE' ? 'text-white dark:text-black' : 'text-zinc-400'} />
                        Milestones
                    </button>
                    <button
                        onClick={() => { setActiveTab('FEED'); setOpenFolder(null); }}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-xl md:rounded-full text-[11px] md:text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'FEED' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50'}`}
                    >
                        <ImageIcon size={14} className={activeTab === 'FEED' ? 'text-white dark:text-black' : 'text-zinc-400'} />
                        Feed
                    </button>
                    <button
                        onClick={() => { setActiveTab('DOCUMENTS'); setOpenFolder(null); }}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-xl md:rounded-full text-[11px] md:text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'DOCUMENTS' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50'}`}
                    >
                        <FolderOpen size={14} className={activeTab === 'DOCUMENTS' ? 'text-white dark:text-black' : 'text-zinc-400'} />
                        Files
                    </button>
                </div>

                {activeTab === 'TIMELINE' ? (
                    <div className="space-y-12 animate-in fade-in duration-700">
                        {/* Phase Switcher (Design vs Execution) */}
                        {['DESIGN', 'PROJECT'].map((type) => {
                            // No sorting — stages stay in original API order
                            const steps = timeline.filter(s => s.type === type);
                            if (steps.length === 0) return null;

                            return (
                                <div key={type} className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-[0.3em]">
                                            {type === 'DESIGN' ? '01. Design Timeline' : '02. Project Timeline'}
                                        </h3>
                                        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
                                    </div>

                                    {/* Progress Tracker with vertical line */}
                                    <div className="relative pl-4">
                                        {steps.map((step, idx) => {
                                            const isLast = idx === steps.length - 1;
                                            // Line going DOWN from this step: green if approved, red if rejected, dashed gray otherwise
                                            const lineIsGreen = step.status === 'APPROVED';
                                            const lineIsRed = step.status === 'REJECTED';

                                            // Dot colors
                                            const dotBg = step.status === 'APPROVED' ? 'bg-emerald-500'
                                                : step.status === 'IN_REVIEW' ? 'bg-amber-500'
                                                    : step.status === 'REJECTED' ? 'bg-rose-500'
                                                        : 'bg-zinc-300 dark:bg-zinc-600';
                                            const dotRing = step.status === 'APPROVED' ? 'ring-emerald-100'
                                                : step.status === 'IN_REVIEW' ? 'ring-amber-100'
                                                    : step.status === 'REJECTED' ? 'ring-rose-100'
                                                        : 'ring-zinc-100 dark:ring-zinc-800';
                                            const dotExtra = step.status === 'APPROVED' ? 'shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                                : step.status === 'IN_REVIEW' ? 'animate-pulse'
                                                    : step.status === 'REJECTED' ? 'shadow-[0_0_12px_rgba(225,29,72,0.3)]'
                                                        : '';

                                            // Requirement 8: Sequence Enforcement
                                            const isLocked = idx > 0 && steps[idx - 1].status !== 'APPROVED';

                                            return (
                                                <div key={step.id} className={`relative flex gap-3 md:gap-5 transition-all ${isLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                                    {/* Left: Dot + Connecting Line */}
                                                    <div className="flex flex-col items-center shrink-0" style={{ width: '16px md:20px' }}>
                                                        {/* Dot */}
                                                        <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full ring-4 z-10 mt-6 md:mt-6 transition-all ${dotBg} ${dotRing} ${dotExtra}`}></div>
                                                        {/* Connecting line to next step */}
                                                        {!isLast && (
                                                            lineIsGreen ? (
                                                                <div className="w-0.5 flex-1 min-h-[40px] bg-emerald-400 transition-all"></div>
                                                            ) : lineIsRed ? (
                                                                <div className="w-0.5 flex-1 min-h-[40px] bg-rose-400 transition-all"></div>
                                                            ) : (
                                                                <div className="flex-1 min-h-[40px] flex justify-center">
                                                                    <div className="w-px border-l-2 border-dashed border-zinc-200 dark:border-zinc-700 h-full"></div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>

                                                    {/* Right: Step Card */}
                                                    <div className={`flex-1 mb-4 p-4 md:p-6 rounded-2xl border transition-all ${step.status === 'APPROVED' ? 'bg-white dark:bg-zinc-900 border-emerald-500/30' :
                                                        step.status === 'REJECTED' ? 'bg-rose-50/20 border-rose-200' :
                                                            step.status === 'IN_REVIEW' ? 'bg-amber-50/20 border-amber-200' :
                                                                'bg-white border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm'
                                                        }`}>
                                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                            <div className="space-y-3 flex-1">
                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                    <h4 className={`font-black uppercase tracking-wider text-sm md:text-base ${step.status === 'REJECTED' ? 'text-rose-600' : 'text-zinc-900 dark:text-white'}`}>{step.title}</h4>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
                                                                            {new Date(step.startDate).toLocaleDateString()} - {new Date(step.endDate).toLocaleDateString()}
                                                                        </span>
                                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${step.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                                            step.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-700' :
                                                                                step.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                                                                    'bg-zinc-100 text-zinc-400'
                                                                            }`}>
                                                                            {step.status === 'IN_REVIEW' ? 'Awaiting Review' : step.status === 'APPROVED' ? 'Approved' : step.status === 'REJECTED' ? 'Rejected' : 'In Queue'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {step.paymentTag && (
                                                                    <div className="inline-block px-3 py-1 bg-zinc-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md w-fit">
                                                                        {step.paymentTag}
                                                                    </div>
                                                                )}
                                                                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{step.description}</p>

                                                                {/* Multiple Delays History */}
                                                                {step.delays && step.delays.length > 0 && (
                                                                    <div className="space-y-3 mt-4">
                                                                        {step.delays.slice().reverse().map((delay, dIdx) => {
                                                                            const revIdx = step.delays!.length - dIdx;
                                                                            return (
                                                                                <div key={delay.id} className="flex items-start gap-4 p-4 md:p-5 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl shadow-sm-soft">
                                                                                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                                                                                        <AlertCircle size={20} />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                                                                                                {revIdx === 1 ? '1st' : revIdx === 2 ? '2nd' : revIdx === 3 ? '3rd' : `${revIdx}th`} Delay of this Stage
                                                                                            </p>
                                                                                            <span className="h-1 w-1 rounded-full bg-amber-200"></span>
                                                                                            <span className="text-[9px] text-zinc-400 font-bold uppercase">{new Date(delay.createdAt).toLocaleDateString()}</span>
                                                                                        </div>
                                                                                        <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium italic leading-relaxed">"{delay.reason}"</p>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {/* Milestone Journey Thread */}
                                                                <div className="mt-8 relative pl-5 md:pl-6 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-10 md:space-y-12">
                                                                    {(step.iterations && step.iterations.length > 0 ? step.iterations : Array.from({ length: step.rejectCount + 1 }, (_, i) => ({ iterationNumber: i + 1 }))).map((iteration: any, i: number) => {
                                                                        const roundNum = iteration.iterationNumber || (i + 1);
                                                                        const roundIdx = roundNum - 1;
                                                                        const adminFiles = step.completionFiles?.filter(f => f.rejectionRound === roundIdx) || [];
                                                                        const clientFiles = step.feedbackFiles?.filter(f => f.rejectionRound === roundNum) || [];
                                                                        const isLatest = step.iterations ? (i === step.iterations.length - 1) : (roundIdx === step.rejectCount);

                                                                        // Iteration feedback logic
                                                                        const adminFeedback = iteration.adminFeedback;
                                                                        const clientFeedback = iteration.clientFeedback;

                                                                        if (adminFiles.length === 0 && !isLatest && !adminFeedback) return null;

                                                                        return (
                                                                            <div key={iteration.id || i} className="relative space-y-5 md:space-y-6 pb-2">
                                                                                {/* Indicator Dot */}
                                                                                <div className={`absolute -left-[30px] md:-left-[33px] top-1.5 h-3.5 w-3.5 md:h-4 md:w-4 rounded-full border-2 md:border-4 border-white dark:border-zinc-950 shadow-sm z-10 transition-all ${isLatest && step.status === 'APPROVED' ? 'bg-emerald-500 scale-110 shadow-emerald-500/20 shadow-lg' :
                                                                                        isLatest && step.status === 'REJECTED' ? 'bg-rose-500 ring-4 ring-rose-500/20' :
                                                                                            isLatest && step.status === 'IN_REVIEW' ? 'bg-amber-500 animate-pulse' :
                                                                                                'bg-zinc-300'
                                                                                    }`}></div>

                                                                                {/* Iteration Header Badge */}
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg ${isLatest ? 'bg-zinc-900 text-white dark:bg-zinc-800' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900/50'
                                                                                        }`}>
                                                                                        Iteration {roundNum}
                                                                                    </span>
                                                                                    {iteration.status && (
                                                                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${iteration.status === 'APPROVED' ? 'text-emerald-500' :
                                                                                                iteration.status === 'REJECTED' ? 'text-rose-500' : 'text-amber-500'
                                                                                            }`}>
                                                                                            • {iteration.status.replace('_', ' ')}
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Admin Submission Content */}
                                                                                <div className="space-y-4 pt-1">
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                        <div className="h-[1px] w-4 bg-zinc-200 dark:bg-zinc-800"></div>
                                                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Admin Submission</span>
                                                                                    </div>

                                                                                    {adminFeedback && (
                                                                                        <div className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800/60 shadow-sm-soft">
                                                                                            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium italic">
                                                                                                "{adminFeedback}"
                                                                                            </p>
                                                                                        </div>
                                                                                    )}

                                                                                    {adminFiles.length > 0 && (
                                                                                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                                                                                            {adminFiles.map((cf, idx) => {
                                                                                                const url = getFullUrl(cf.fileUrl);
                                                                                                return (
                                                                                                    <div key={cf.id} className="group relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800/60 shadow-sm hover:shadow-xl transition-all duration-500 md:hover:scale-[1.02]">
                                                                                                        <div className="w-full h-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                                                                                                            {cf.fileType === 'IMAGE' ? (
                                                                                                                <img src={url} className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-110" />
                                                                                                            ) : cf.fileType === 'VIDEO' ? (
                                                                                                                <Video size={24} className="text-[#C5A059]/40" />
                                                                                                            ) : (
                                                                                                                <FileText size={24} className="text-[#C5A059]/40" />
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300 backdrop-blur-[2px]">
                                                                                                            <button onClick={() => window.open(url, '_blank')} className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:scale-110 shadow-xl transition-all"><Maximize2 size={16} /></button>
                                                                                                            <button onClick={() => triggerDownload(url, `Work_R${roundNum}_${idx}`)} className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:scale-110 shadow-xl transition-all"><Download size={16} /></button>
                                                                                                        </div>
                                                                                                        {/* Mobile view/download buttons (visible overlay) */}
                                                                                                        <div className="absolute top-2 right-2 flex gap-1.5 md:hidden">
                                                                                                            <button onClick={() => window.open(url, '_blank')} className="h-7 w-7 rounded-lg bg-white/95 text-zinc-900 flex items-center justify-center shadow-md active:scale-95 transition-all"><Eye size={13} /></button>
                                                                                                            <button onClick={() => triggerDownload(url, `Work_R${roundNum}_${idx}`)} className="h-7 w-7 rounded-lg bg-[#C5A059] text-white flex items-center justify-center shadow-md active:scale-95 transition-all"><Download size={13} /></button>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Client Feedback Content */}
                                                                                {(clientFeedback || clientFiles.length > 0) && (
                                                                                    <div className="mt-6 pl-6 border-l-2 border-zinc-100 dark:border-zinc-800 pt-2 space-y-4">
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Client Interaction</span>
                                                                                        </div>

                                                                                        {clientFeedback && (
                                                                                            <div className={`p-5 rounded-3xl border shadow-sm ${iteration.status === 'APPROVED' ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30' : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800/60'}`}>
                                                                                                <p className={`text-sm italic leading-relaxed font-semibold ${iteration.status === 'APPROVED' ? 'text-emerald-800 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                                                                    "{clientFeedback}"
                                                                                                </p>
                                                                                            </div>
                                                                                        )}

                                                                                        {clientFiles.length > 0 && (
                                                                                            <div className="flex flex-wrap gap-2">
                                                                                                {clientFiles.map((ff, idx) => (
                                                                                                    <div key={ff.id} className="group/fb relative h-20 w-20 md:h-24 md:w-24 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800/60 shadow-sm transition-all hover:scale-110 hover:shadow-xl hover:border-[#C5A059]/30">
                                                                                                        <div className="w-full h-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                                                                                                            {ff.fileType === 'IMAGE' ? (
                                                                                                                <img src={getFullUrl(ff.fileUrl)} className="w-full h-full object-cover" />
                                                                                                            ) : (
                                                                                                                <FileText size={20} className="text-zinc-400" />
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <div className="absolute inset-0 bg-zinc-900/60 opacity-0 md:group-hover/fb:opacity-100 flex items-center justify-center gap-2 transition-opacity cursor-pointer backdrop-blur-sm">
                                                                                                            <button onClick={(e) => { e.stopPropagation(); window.open(getFullUrl(ff.fileUrl), '_blank'); }} className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-[#C5A059] transition-all"><Maximize2 size={16} /></button>
                                                                                                            <button onClick={(e) => { e.stopPropagation(); triggerDownload(getFullUrl(ff.fileUrl), `Feedback_${roundNum}_${idx}`); }} className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-[#C5A059] transition-all"><Download size={16} /></button>
                                                                                                        </div>
                                                                                                        {/* Mobile view/download buttons */}
                                                                                                        <div className="absolute top-1 right-1 flex gap-1 md:hidden">
                                                                                                            <button onClick={() => window.open(getFullUrl(ff.fileUrl), '_blank')} className="h-6 w-6 rounded-md bg-white/95 text-zinc-900 flex items-center justify-center shadow-md"><Eye size={11} /></button>
                                                                                                            <button onClick={() => triggerDownload(getFullUrl(ff.fileUrl), `Feedback_${roundNum}_${idx}`)} className="h-6 w-6 rounded-md bg-[#C5A059] text-white flex items-center justify-center shadow-md"><Download size={11} /></button>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>


                                                                {/* Final Outcome */}
                                                                {step.status === 'APPROVED' && (
                                                                    <div className="mt-8 flex items-center gap-4 p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 rounded-3xl shadow-sm">
                                                                        <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10">
                                                                            <Check size={24} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">Milestone Successfully Approved</p>
                                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">This phase is complete and work on the next stage has priority.</p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {step.dailyLogs && step.dailyLogs.length > 0 && (
                                                                    <div className="mt-4 space-y-2">
                                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Daily Updates</p>
                                                                        {step.dailyLogs.map(log => (
                                                                            <div key={log.id} className="flex gap-4 pl-2 border-l border-zinc-100">
                                                                                <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">{new Date(log.logDate).toLocaleDateString()}</span>
                                                                                <p className="text-xs text-zinc-600 dark:text-zinc-300">{log.description}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                            </div>

                                                            {/* Action buttons */}
                                                            <div className="flex flex-row md:flex-col gap-2 shrink-0 pt-2 md:pt-0">
                                                                {step.status === 'IN_REVIEW' ? (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleFeedback(step.id, 'APPROVED')}
                                                                            disabled={isSubmitting}
                                                                            className="flex-1 md:flex-none bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-[10px] font-black uppercase tracking-widest px-4 md:px-6 h-9"
                                                                        >
                                                                            <CheckCircle2 size={13} className="mr-1.5" /> Approve
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleFeedback(step.id, 'REJECTED')}
                                                                            disabled={isSubmitting}
                                                                            className="flex-1 md:flex-none text-zinc-500 hover:text-rose-600 hover:border-rose-300 text-[10px] font-black uppercase tracking-widest h-9"
                                                                        >
                                                                            <X size={13} className="mr-1.5" /> Reject
                                                                        </Button>
                                                                    </>
                                                                ) : step.status === 'APPROVED' ? (
                                                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-[9px] uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                                                        <CheckCircle2 size={13} /> Milestone Approved
                                                                    </div>
                                                                ) : step.status === 'REJECTED' ? (
                                                                    <div className="flex items-center gap-2 text-rose-600 font-bold text-[9px] uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                                                                        <X size={13} /> Redo Required
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest px-3 py-1.5">In Queue</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Final Document Section */}
                        {project.finalDocumentUrl && (
                            <div className="mt-20 p-8 rounded-3xl bg-zinc-900 text-white flex flex-col items-center text-center">
                                <FileCheck className="h-12 w-12 text-[#C5A059] mb-4" />
                                <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Project Completed</h3>
                                <p className="text-zinc-400 mb-8 max-w-md">Your project documents and final summary are ready for download.</p>
                                <Button
                                    onClick={() => triggerDownload(getFullUrl(project.finalDocumentUrl!), 'Final_Handover.pdf')}
                                    className="bg-[#C5A059] hover:bg-[#A38548] text-white px-12 py-6 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all"
                                >
                                    Download Handover Document
                                </Button>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'FEED' ? (
                    <div className="space-y-16 animate-in fade-in duration-700">
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Live Progress Feed</h3>
                            <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-4">
                                <Info size={20} className="text-emerald-500 shrink-0" />
                                <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                                    Below is your project's full journey—including daily site updates, milestone completion documents, and manager logs.
                                </p>
                            </div>
                        </div>

                        <div className="max-w-3xl mx-auto space-y-8 relative before:absolute before:inset-0 before:left-[15px] before:top-2 before:h-[calc(100%-16px)] before:w-[1.5px] before:bg-zinc-100 dark:before:bg-zinc-800">
                            {getUnifiedFeed().length === 0 ? (
                                <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                    <ImageIcon className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em]">No updates yet</p>
                                </div>
                            ) : (
                                getUnifiedFeed().map((entry) => (
                                    <div key={entry.id} className="relative pl-8 md:pl-10 group animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Timeline Indicator */}
                                        <div className={`absolute left-0 mt-1 h-8 w-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-md z-10 transition-all md:group-hover:scale-110 md:group-hover:rotate-12 ${entry.type === 'ENTRY' ? 'text-[#C5A059]' :
                                            entry.type === 'COMPLETION' ? 'text-emerald-500' : 'text-[#C5A059]'
                                            }`}>
                                            {entry.type === 'ENTRY' ? <ImageIcon size={14} /> :
                                                entry.type === 'COMPLETION' ? <CheckCircle2 size={14} /> : <FileText size={14} />}
                                        </div>

                                        <div className="space-y-3">
                                            {/* Header Info */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] md:text-[10px] font-black text-[#C5A059] uppercase tracking-[0.2em]">{formatDate(entry.date)}</span>
                                                    <span className={`text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border ${entry.type === 'ENTRY' ? 'bg-[#C5A059]/5 text-[#C5A059] border-[#C5A059]/20' :
                                                        entry.type === 'COMPLETION' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-zinc-50 text-zinc-500 border-zinc-100'
                                                        }`}>
                                                        {entry.type === 'ENTRY' ? 'Update' :
                                                            entry.type === 'COMPLETION' ? 'Stage' : 'Log'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content Card */}
                                            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                                <div className={`p-4 md:p-5 ${entry.media && entry.media.length > 0 ? 'space-y-4' : ''}`}>
                                                    <p className="text-sm md:text-base font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-200 leading-tight">{entry.description}</p>

                                                    {entry.media && entry.media.length > 0 && (
                                                        <div className={`grid gap-2 ${entry.media.length === 1 ? 'grid-cols-1' : entry.media.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                                                            {entry.media.map((m: any, idx: number) => (
                                                                <div
                                                                    key={idx}
                                                                    className="relative aspect-[4/3] rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 group/media shadow-sm"
                                                                >
                                                                    {getMediaType(m) === 'IMAGE' ? (
                                                                        <img
                                                                            src={getFullUrl(getMediaUrl(m))}
                                                                            alt=""
                                                                            className="w-full h-full object-cover transition-transform duration-700 md:group-hover/media:scale-105"
                                                                        />
                                                                    ) : getMediaType(m) === 'VIDEO' ? (
                                                                        <div className="w-full h-full bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center justify-center gap-2">
                                                                            <Video size={20} className="text-[#C5A059]/40" />
                                                                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Video</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-full h-full bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center justify-center gap-2">
                                                                            <FileText size={20} className="text-[#C5A059]/40" />
                                                                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Document</span>
                                                                        </div>
                                                                    )}

                                                                    {/* Action Overlay */}
                                                                    <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                                        <button
                                                                            onClick={() => {
                                                                                const type = getMediaType(m);
                                                                                if (type === 'IMAGE' || type === 'VIDEO') {
                                                                                    setSelectedEntry(entry);
                                                                                } else {
                                                                                    window.open(getFullUrl(getMediaUrl(m)), '_blank');
                                                                                }
                                                                            }}
                                                                            className="h-9 w-9 rounded-full bg-white text-[#C5A059] flex items-center justify-center hover:scale-110 shadow-lg"
                                                                            title="View"
                                                                        >
                                                                            <Maximize2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => triggerDownload(getFullUrl(getMediaUrl(m)), `Update_${idx}`)}
                                                                            className="h-9 w-9 rounded-full bg-white text-[#C5A059] flex items-center justify-center hover:scale-110 shadow-lg"
                                                                            title="Download"
                                                                        >
                                                                            <Download size={16} />
                                                                        </button>
                                                                    </div>
                                                                    {/* Mobile view/download buttons */}
                                                                    <div className="absolute top-2 right-2 flex gap-1.5 md:hidden">
                                                                        <button
                                                                            onClick={() => {
                                                                                const type = getMediaType(m);
                                                                                if (type === 'IMAGE' || type === 'VIDEO') setSelectedEntry(entry);
                                                                                else window.open(getFullUrl(getMediaUrl(m)), '_blank');
                                                                            }}
                                                                            className="h-7 w-7 rounded-lg bg-white/95 text-zinc-900 flex items-center justify-center shadow-md active:scale-95 transition-all"
                                                                        >
                                                                            <Eye size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => triggerDownload(getFullUrl(getMediaUrl(m)), `Update_${idx}`)}
                                                                            className="h-7 w-7 rounded-lg bg-[#C5A059] text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                                                                        >
                                                                            <Download size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12 animate-in fade-in duration-700">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Your Documents</h3>
                                <p className="text-sm text-zinc-500">Centralized repository for all agreements, technical drawings, and official certificates.</p>
                            </div>
                            {openFolder && <button onClick={() => setOpenFolder(null)} className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">Back to Folders</button>}
                        </div>
                        {!openFolder ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {DOCUMENT_FOLDERS.map(folder => (
                                    <button key={folder.key} onClick={() => setOpenFolder(folder.key)} className="flex items-center gap-4 md:gap-6 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-xl active:scale-98 md:hover:scale-[1.02] transition-all duration-300 text-left group">
                                        <div className={`h-14 w-14 md:h-20 md:w-20 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${folder.bgColor} group-active:bg-[#C5A059] group-active:text-white md:group-hover:bg-[#C5A059] md:group-hover:text-white shrink-0`}>
                                            <folder.icon size={28} className={`${folder.color} group-active:text-white md:group-hover:text-white transition-colors`} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-wider text-xs md:text-base mb-1 md:mb-2">{folder.label}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="h-5 px-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{getDocumentCount(folder.key)} Files</span>
                                                <div className="h-px w-6 md:w-8 bg-zinc-200 dark:bg-zinc-700 md:group-hover:w-12 md:group-hover:bg-[#C5A059] transition-all"></div>
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
                                                <FileIcon size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-900 text-sm uppercase tracking-wider">{entry.description}</p>
                                                <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-widest">{formatDate(entry.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 md:gap-3">
                                            <button
                                                onClick={() => {
                                                    const m = getEntryMedia(entry)[0];
                                                    if (m) window.open(getFullUrl(getMediaUrl(m)), '_blank');
                                                }}
                                                className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-[#C5A059] text-white hover:bg-[#A38548] flex items-center justify-center shadow-md active:scale-95 transition-all"
                                                title="View"
                                            >
                                                <Eye size={16} className="md:w-[18px] md:h-[18px]" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const m = getEntryMedia(entry)[0];
                                                    const ext = getMediaType(m).toLowerCase() === 'image' ? 'jpg' : getMediaType(m).toLowerCase() === 'video' ? 'mp4' : 'pdf';
                                                    triggerDownload(getFullUrl(getMediaUrl(m)), `${entry.description || 'doc'}.${ext}`);
                                                }}
                                                className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center shadow-sm"
                                                title="Download"
                                            >
                                                <Download size={16} className="md:w-[18px] md:h-[18px]" />
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

            {/* Feedback Modal */}
            {feedbackModal.isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className={`text-2xl font-black uppercase tracking-widest ${feedbackModal.status === 'APPROVED' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {feedbackModal.status === 'APPROVED' ? 'Approve Milestone' : 'Request Revision'}
                                </h3>
                                <button onClick={() => setFeedbackModal({ isOpen: false, stepId: null, status: 'APPROVED', feedback: '' })} className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm font-medium">
                                {feedbackModal.status === 'APPROVED'
                                    ? "Great! If you have any additional notes before we proceed to the next step, please leave them below."
                                    : "Please provide specific feedback on what needs to be changed or revised."}
                            </p>

                            <textarea
                                value={feedbackModal.feedback}
                                onChange={e => setFeedbackModal({ ...feedbackModal, feedback: e.target.value })}
                                className="w-full h-32 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 text-sm mb-4 resize-none"
                                placeholder={feedbackModal.status === 'APPROVED' ? "Optional notes..." : "Required: Describe what we need to fix..."}
                            />

                            {/* Requirement 5: Client Upload Feedback Files */}
                            <div className="mb-8">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 whitespace-nowrap">Attach Reference Images or Documents (Optional)</label>
                                <div className="relative border-2 border-dashed border-zinc-100 rounded-2xl p-6 text-center hover:border-[#C5A059]/30 transition-all cursor-pointer">
                                    <input
                                        type="file"
                                        multiple
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setFeedbackFiles([...feedbackFiles, ...Array.from(e.target.files)]);
                                            }
                                        }}
                                    />
                                    <Upload size={24} className="mx-auto text-zinc-300 mb-2" />
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Click to add files</p>
                                </div>
                                {feedbackFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {feedbackFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                                <span className="text-[10px] font-bold text-zinc-600 truncate max-w-[100px]">{f.name}</span>
                                                <button onClick={() => setFeedbackFiles(feedbackFiles.filter((_, idx) => idx !== i))} className="text-zinc-400 hover:text-rose-500"><X size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button onClick={() => setFeedbackModal({ isOpen: false, stepId: null, status: 'APPROVED', feedback: '' })} variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleFeedbackSubmit}
                                    disabled={isSubmitting || (feedbackModal.status === 'REJECTED' && !feedbackModal.feedback.trim())}
                                    className={`flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-white shadow-lg ${feedbackModal.status === 'APPROVED' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'}`}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Confirm'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black uppercase tracking-widest text-[#C5A059]">Upload Documents</h3>
                                <button onClick={() => setIsUploadModalOpen(false)} className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <p className="text-zinc-500 mb-6 text-sm font-medium">Use this area to upload images or documents for our team to review.</p>

                            <div className="space-y-6">
                                <div className="relative border-2 border-dashed border-zinc-100 rounded-2xl p-8 text-center hover:border-[#C5A059]/30 transition-all cursor-pointer bg-zinc-50/50">
                                    <input
                                        type="file"
                                        multiple
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setUploadDocs([...uploadDocs, ...Array.from(e.target.files)]);
                                            }
                                        }}
                                    />
                                    <Upload size={32} className="mx-auto text-[#C5A059] mb-4 opacity-40" />
                                    <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">Drop Files or Click to Browse</p>
                                </div>

                                {uploadDocs.length > 0 && (
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                                        {uploadDocs.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-zinc-100 shadow-sm">
                                                <FileIcon size={12} className="text-[#C5A059]" />
                                                <span className="text-[10px] font-bold text-zinc-600 truncate max-w-[120px]">{f.name}</span>
                                                <button onClick={() => setUploadDocs(uploadDocs.filter((_, idx) => idx !== i))} className="text-zinc-400 hover:text-rose-500"><X size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Notes (Optional)</label>
                                    <textarea
                                        value={uploadDesc}
                                        onChange={e => setUploadDesc(e.target.value)}
                                        className="w-full h-24 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 text-sm resize-none"
                                        placeholder="Add a description or note about these files..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button onClick={() => setIsUploadModalOpen(false)} variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleClientUpload}
                                        disabled={isUploading || (uploadDocs.length === 0 && !uploadDesc.trim())}
                                        className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest bg-[#C5A059] text-white shadow-lg shadow-[#C5A059]/20 hover:bg-[#A38548]"
                                    >
                                        {isUploading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Start Upload'}
                                    </Button>
                                </div>
                            </div>
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
