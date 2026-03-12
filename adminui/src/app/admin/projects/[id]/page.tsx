"use client";

import { useState, useEffect, use, useRef } from "react";
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
    Eye,
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
    File as FileIcon,
    CheckCircle2,
    Check,
    CloudUpload,
    AlertTriangle,
    AlertCircle,
    Calendar
} from "lucide-react";
import {
    getProjectDetail,
    updateProjectStatus,
    createProjectEntry,
    updateProjectEntry,
    deleteProjectEntry,
    getProjectTimeline,
    createTimelineStep,
    updateTimelineStep,
    deleteTimelineStep,
    completeTimelineStep,
    generateFinalDocument,
    bulkUpdateTimeline,
    initializeProject,
    clearProjectTimeline,
    summarizeProject,
    downloadProjectArchive,
    deleteProject
} from "@/services/projectService";
import type { EntryCategory, Project, ProjectEntry, MediaFile, TimelineStep, TimelineType } from "@/services/projectService";
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPopup } from "@/components/ui/admin-popup";


// Local interfaces removed in favor of projectService imports

// Document folder configuration
const DOCUMENT_FOLDERS: { key: EntryCategory; label: string; icon: any; color: string; bgColor: string }[] = [
    { key: 'AGREEMENT', label: 'Agreements', icon: ScrollText, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-950/30' },
    { key: 'PAYMENT_INVOICE', label: 'Payment Invoices', icon: Receipt, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-950/30' },
    { key: 'PROJECT_DOCUMENT', label: 'Approved Work Files', icon: FileCheck, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-950/30' },
    { key: 'HANDOVER', label: 'Handover Documents/Certificates', icon: FileCheck, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-950/30' },
    { key: 'CLIENT_UPLOAD', label: 'Client Documents', icon: Upload, color: 'text-[#C5A059]', bgColor: 'bg-zinc-50 dark:bg-zinc-950/30' },
];


export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [timeline, setTimeline] = useState<TimelineStep[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'TIMELINE' | 'DOCUMENTS'>('TIMELINE');
    const [openFolder, setOpenFolder] = useState<EntryCategory | null>(null);
    const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
    const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [editingStep, setEditingStep] = useState<TimelineStep | null>(null);
    const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', type: 'DESIGN', startDate: '', endDate: '', paymentTag: '' });
    const [delayForm, setDelayForm] = useState({ endDate: '', delayReason: '' });
    const [completeFiles, setCompleteFiles] = useState<File[]>([]);
    const [isTimelineEditing, setIsTimelineEditing] = useState(false);
    const [bulkTimeline, setBulkTimeline] = useState<TimelineStep[]>([]);
    const [globalReason, setGlobalReason] = useState("");
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const finalBoxRef = useRef<HTMLDivElement>(null);
    const [greenLineHeight, setGreenLineHeight] = useState<number | string>(0);
    const [isDeleteTimelineConfirmOpen, setIsDeleteTimelineConfirmOpen] = useState(false);
    const [summaryStatus, setSummaryStatus] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: "" });
    const [isInitializeConfirmOpen, setIsInitializeConfirmOpen] = useState(false);
    const [isInitializingProject, setIsInitializingProject] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeletingProject, setIsDeletingProject] = useState(false);
    const [isDownloadConfirmOpen, setIsDownloadConfirmOpen] = useState(false);
    const [isDownloadingArchive, setIsDownloadingArchive] = useState(false);
    const [statusPopup, setStatusPopup] = useState<{ open: boolean, tone: 'info' | 'success' | 'danger', title: string, description: string }>({
        open: false,
        tone: 'info',
        title: '',
        description: ''
    });
    const [isDelaying, setIsDelaying] = useState(false);

    useEffect(() => {
        const updateLine = () => {
            if (!timelineContainerRef.current) return;
            const targetDot = timelineContainerRef.current.querySelector('.dot-pending');
            const wrapperRect = timelineContainerRef.current.getBoundingClientRect();

            if (targetDot) {
                const dotRect = targetDot.getBoundingClientRect();
                setGreenLineHeight((dotRect.top - wrapperRect.top) + (dotRect.height / 2));
            } else if (finalBoxRef.current) {
                // If project is finished, stop at the final box top
                const finalBoxRect = finalBoxRef.current.getBoundingClientRect();
                setGreenLineHeight(finalBoxRect.top - wrapperRect.top);
            } else {
                setGreenLineHeight('100%');
            }
        };

        const timeoutId = setTimeout(updateLine, 150); // wait for layout
        window.addEventListener('resize', updateLine);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateLine);
        };
    }, [timeline, activeTab, isTimelineEditing, bulkTimeline]);

    const fetchProject = async () => {
        setIsLoading(true);
        try {
            const data = await getProjectDetail(id);
            setProject(data);
            const tlData = await getProjectTimeline(id);
            setTimeline(tlData);
        } catch (err) {
            console.error("Failed to load project", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [id]);

    const openAddMilestone = () => {
        let lastDate = "";
        let lastType: TimelineType = "DESIGN";
        if (timeline.length > 0) {
            // Sort by end date to find the absolute last point in the project
            const sorted = [...timeline].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
            const latestEnd = new Date(sorted[0].endDate);
            // Default to starting the day after the last milestone ends
            const nextStart = new Date(latestEnd);
            nextStart.setDate(nextStart.getDate() + 1);
            lastDate = nextStart.toISOString().split('T')[0];
            lastType = sorted[0].type;
        } else {
            lastDate = new Date().toISOString().split('T')[0];
        }

        setMilestoneForm({
            title: '',
            description: '',
            type: lastType,
            startDate: lastDate,
            endDate: lastDate,
            paymentTag: ''
        });
        setIsTimelineModalOpen(true);
    };

    const handleCreateOrUpdateMilestone = async () => {
        try {
            if (editingStep) {
                await updateTimelineStep(editingStep.id, milestoneForm);
            } else {
                await createTimelineStep(id, milestoneForm);
            }
            setIsTimelineModalOpen(false);
            setEditingStep(null);
            setMilestoneForm({ title: '', description: '', type: 'DESIGN', startDate: '', endDate: '', paymentTag: '' });
            const tlData = await getProjectTimeline(id);
            setTimeline(tlData);
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Unknown error');
        }
    };

    const handleDelayMilestone = async () => {
        if (!editingStep || !delayForm.endDate || !delayForm.delayReason) return;
        try {
            setIsDelaying(true);
            const oldEndDate = new Date(editingStep.endDate);
            const newEndDate = new Date(delayForm.endDate);
            const diffTime = newEndDate.getTime() - oldEndDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                await updateTimelineStep(editingStep.id, delayForm);
            } else {
                // Cascading update: Shift this and all subsequent milestones
                const milestoneIdx = timeline.findIndex(s => s.id === editingStep.id);
                const updates = timeline.map((s, idx) => {
                    if (idx < milestoneIdx || s.type !== editingStep.type) return s;

                    const sStart = new Date(s.startDate);
                    const sEnd = new Date(s.endDate);

                    // Shift both start and end dates for subsequent steps
                    // For the current step, we only change the end date (as per the delay modal)
                    if (s.id === editingStep.id) {
                        return { ...s, endDate: delayForm.endDate, delayReason: delayForm.delayReason };
                    }

                    sStart.setDate(sStart.getDate() + diffDays);
                    sEnd.setDate(sEnd.getDate() + diffDays);
                    return {
                        ...s,
                        startDate: sStart.toISOString(),
                        endDate: sEnd.toISOString(),
                        delayReason: `Shifted due to delay in ${editingStep.title}`
                    };
                });

                const affectedMilestones = timeline
                    .slice(milestoneIdx + 1)
                    .filter(s => s.type === editingStep.type)
                    .map(s => s.title);

                const finalReason = `${delayForm.delayReason}${affectedMilestones.length > 0 ? `\n\nNote: Subsequent stages (${affectedMilestones.join(", ")}) have been shifted forward by ${Math.abs(diffDays)} days to accommodate this change.` : ""}`;

                await bulkUpdateTimeline(id, updates, finalReason);
            }

            setIsDelayModalOpen(false);
            setEditingStep(null);
            setDelayForm({ endDate: '', delayReason: '' });
            const tlData = await getProjectTimeline(id);
            setTimeline(tlData);
        } catch (err: any) {
            setStatusPopup({
                open: true,
                tone: 'danger',
                title: 'Failed to Update Timeline',
                description: err?.message || 'There was a problem adjusting this milestone. Please try again.'
            });
        } finally {
            setIsDelaying(false);
        }
    };

    const [completeDescription, setCompleteDescription] = useState("");

    const handleCompleteMilestone = async () => {
        if (!editingStep) return;
        try {
            setIsUploading(true);
            const formData = new FormData();
            completeFiles.forEach(file => {
                formData.append('media', file);
            });
            if (completeDescription) {
                formData.append('description', completeDescription);
            }
            await completeTimelineStep(editingStep.id, formData);
            setIsCompleteModalOpen(false);
            setEditingStep(null);
            setCompleteFiles([]);
            setCompleteDescription("");
            const tlData = await getProjectTimeline(id);
            setTimeline(tlData);
        } catch (err: any) { alert(err.message); }
        finally {
            setIsUploading(false);
        }
    };

    const handleBulkUpdate = async (notifySetup = false) => {
        try {
            await bulkUpdateTimeline(id, bulkTimeline, project?.isFinalized ? globalReason : "", notifySetup ? 'INITIALIZE' : undefined);
            setIsTimelineEditing(false);
            setGlobalReason("");
            const tlData = await getProjectTimeline(id);
            setTimeline(tlData);
            alert(notifySetup ? "Project setup confirmed and client notified." : (project?.isFinalized ? "Timeline updated and client notified." : "Timeline updated."));
        } catch (err: any) { alert(err.message); }
    };

    const handleInitializeSetup = () => {
        setIsInitializeConfirmOpen(true);
    };

    const performInitializeSetup = async () => {
        setIsInitializingProject(true);
        try {
            await initializeProject(id);
            setIsInitializeConfirmOpen(false);
            await fetchProject();
            setStatusPopup({
                open: true,
                tone: 'success',
                title: 'Client Portal Activated',
                description: 'Project setup has been finalized and the client has received their portal credentials by email.'
            });
        } catch (err: any) {
            setStatusPopup({
                open: true,
                tone: 'danger',
                title: 'Failed to Finalize Setup',
                description: err?.message || 'There was a problem finalizing this project. Please try again in a moment.'
            });
        } finally {
            setIsInitializingProject(false);
        }
    };

    const handleClearTimeline = () => {
        setIsDeleteTimelineConfirmOpen(true);
    };

    const performClearTimeline = async () => {
        try {
            await clearProjectTimeline(id);
            setIsDeleteTimelineConfirmOpen(false);
            fetchProject();
        } catch (err: any) { alert(err.message); }
    };

    const performDeleteProject = async () => {
        setIsDeletingProject(true);
        try {
            await deleteProject(id);
            window.location.href = '/admin/dashboard';
        } catch (err: any) {
            setStatusPopup({
                open: true,
                tone: 'danger',
                title: 'Delete Failed',
                description: err?.message || 'Failed to delete this project. Please try again.'
            });
        } finally {
            setIsDeletingProject(false);
            setIsDeleteConfirmOpen(false);
        }
    };

    const performDownloadArchive = async () => {
        setIsDownloadingArchive(true);
        try {
            await downloadProjectArchive(id, project?.title || 'Project');
        } catch (err: any) {
            setStatusPopup({
                open: true,
                tone: 'danger',
                title: 'Download Failed',
                description: err?.message || 'Failed to start ZIP download. Please try again.'
            });
        } finally {
            setIsDownloadingArchive(false);
            setIsDownloadConfirmOpen(false);
        }
    };

    const isStageLocked = (type: TimelineType) => {
        // Project stages are locked until the admin finalizes the setup
        if (!project?.isFinalized && type === 'PROJECT') return true;

        // Design stages are open for configuration during the setup phase
        if (!project?.isFinalized) return false;

        if (type === 'PROJECT') {
            const designSteps = timeline.filter(s => s.type === 'DESIGN');
            // Project stage remains locked until all Design milestones are approved by the client
            return designSteps.some(s => s.status !== 'APPROVED');
        }
        return false;
    };

    const handleFinalDocument = async () => {
        try {
            await generateFinalDocument(id);
            setStatusPopup({
                open: true,
                tone: 'success',
                title: 'Handover PDF Generated',
                description: 'The final handover document has been created successfully. You can now download it from the client portal and from the ZIP export.'
            });
            await fetchProject();
        } catch (err: any) {
            setStatusPopup({
                open: true,
                tone: 'danger',
                title: 'PDF Generation Failed',
                description: err?.message || 'Failed to generate the final handover document. Please try again.'
            });
        }
    }


    // Upload Form State
    const [file, setFile] = useState<File | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [description, setDescription] = useState("");
    const [selectedEntry, setSelectedEntry] = useState<ProjectEntry | null>(null);
    const [status, setStatus] = useState<string>("IN_PROGRESS");
    const [uploadCategory, setUploadCategory] = useState<EntryCategory>("TIMELINE");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
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
            formData.append("existingMedia", JSON.stringify(currentMedia));

            if (editFiles.length > 0) {
                editFiles.forEach(f => formData.append("media", f));
            }

            const result = await updateProjectEntry(currentEntryId, formData);
            const updatedEntry = Array.isArray(result) ? result[0] : result;

            if (currentEntryMergedIds.length > 1) {
                const redundantIds = currentEntryMergedIds.filter(id => id !== currentEntryId);
                await Promise.all(redundantIds.map(rid => deleteProjectEntry(rid).catch(() => { })));
            }

            setProject(prev => {
                if (!prev) return null;
                const newMedia = getEntryMedia(updatedEntry);
                return {
                    ...prev,
                    entries: [
                        {
                            ...updatedEntry,
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

            if (project) {
                setProject({
                    ...project,
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
            {/* ── Delete All Milestones Confirmation Dialog ── */}
            {isDeleteTimelineConfirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsDeleteTimelineConfirmOpen(false)}
                    />
                    {/* Dialog */}
                    <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Top accent bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-rose-600" />

                        <div className="p-6">
                            {/* Icon + Title */}
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center">
                                    <Trash2 className="h-5 w-5 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-cs-heading dark:text-white">Delete All Milestones</h3>
                                    <p className="text-sm text-cs-text dark:text-zinc-400 mt-1 leading-relaxed">
                                        This will permanently delete <strong>all milestones</strong> from this project. All progress records, completion files, and daily logs tied to these milestones will also be removed.
                                    </p>
                                </div>
                            </div>

                            {/* Warning box */}
                            <div className="mt-5 p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                                    This action cannot be undone. The client will NOT be notified automatically.
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-11 font-bold border-zinc-200 dark:border-zinc-700 text-cs-text dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                    onClick={() => setIsDeleteTimelineConfirmOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 h-11 font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25"
                                    onClick={performClearTimeline}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Yes, Delete All
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


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
                        <span className="text-sm text-cs-text flex items-center gap-1.5"><Clock size={14} /> Last refined {new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsUploading(true)}
                        className="bg-cs-primary-100 hover:bg-cs-primary-200 text-white rounded-xl px-4 min-w-[160px] h-11 font-bold text-xs shadow-lg shadow-cs-primary-100/20"
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
                            {/* Timeline Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
                                <h2 className="text-xl font-bold text-cs-heading dark:text-white">Project Milestones</h2>
                                <div className="flex items-center flex-wrap gap-2">
                                    {isTimelineEditing ? (
                                        <>
                                            <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-xs" onClick={() => { setIsTimelineEditing(false); setBulkTimeline([...timeline]); }}>
                                                Cancel
                                            </Button>
                                            <div className="flex bg-cs-primary-100 rounded-xl overflow-hidden shadow-lg shadow-cs-primary-100/20 h-9">
                                                <Button onClick={() => handleBulkUpdate(false)} className="bg-transparent text-white hover:bg-white/10 rounded-none border-r border-white/20 h-full px-5 font-bold text-xs">
                                                    Save Changes
                                                </Button>
                                                <Button onClick={() => handleBulkUpdate(true)} className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-none border-l border-emerald-500/30 px-3 h-full" title="Save & Notify Client Project is Ready">
                                                    <FileCheck size={16} />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {!project.isFinalized && (
                                                <Button
                                                    onClick={handleInitializeSetup}
                                                    variant="outline"
                                                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 h-9 px-3 rounded-xl font-bold text-xs"
                                                >
                                                    <CheckCircle2 className="mr-1.5" size={14} /> Finalize Setup
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                onClick={() => { setIsTimelineEditing(true); setBulkTimeline([...timeline]); }}
                                                className="border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/5 h-9 px-3 rounded-xl font-bold text-xs"
                                            >
                                                Manage Schedule
                                            </Button>
                                            <Button
                                                onClick={openAddMilestone}
                                                className="bg-cs-primary-100 text-white hover:bg-cs-primary-200 h-9 px-3 rounded-xl font-bold text-xs"
                                            >
                                                <Plus className="mr-1.5" size={14} /> Add Milestone
                                            </Button>
                                            <Button
                                                onClick={handleClearTimeline}
                                                variant="outline"
                                                title="Delete All Milestones"
                                                className="border-rose-500 text-rose-500 hover:bg-rose-50 h-9 w-9 p-0 rounded-xl flex items-center justify-center"
                                            >
                                                <Trash2 size={15} />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {isTimelineEditing && project?.isFinalized && (
                                <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl">
                                    <h4 className="font-bold text-amber-800 dark:text-amber-400 mb-2">Rescheduling Project</h4>
                                    <p className="text-sm text-amber-700 dark:text-amber-500 mb-4">(Optional) Provide a reason that will be sent to the client in the notification email.</p>
                                    <textarea
                                        className="w-full p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-zinc-900 text-sm focus:ring-2 ring-amber-500 transition-all"
                                        placeholder="Reason for schedule update (e.g. Design revisions took longer than expected...)"
                                        rows={3}
                                        value={globalReason}
                                        onChange={(e) => setGlobalReason(e.target.value)}
                                    />
                                </div>
                            )}

                            {(() => {
                                const allFilteredSteps = (isTimelineEditing ? bulkTimeline : timeline).sort((a, b) => {
                                    if (a.type !== b.type) return a.type === 'DESIGN' ? -1 : 1;
                                    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                                });

                                if (allFilteredSteps.length === 0) return (
                                    <div className="text-center py-16 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                        <div className="h-12 w-12 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto mb-4">
                                            <Clock className="h-5 w-5 text-zinc-300" />
                                        </div>
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-widest">No Milestones</h3>
                                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">Add steps to track project progress</p>
                                    </div>
                                );

                                let currentGroupType: string | null = null;
                                let flowCounter = 0;

                                return (
                                    <div className="relative py-4 max-w-3xl mx-auto select-none" ref={timelineContainerRef}>
                                        {/* Center Line (Background Gray) - Hidden on mobile, shown on md+ */}
                                        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800 md:-translate-x-1/2 z-0"></div>
                                        {/* Center Line (Green Progress) - Hidden on mobile, shown on md+ */}
                                        <div
                                            className="absolute left-6 md:left-1/2 top-0 w-0.5 bg-emerald-500 md:-translate-x-1/2 z-0 transition-all duration-700 ease-in-out"
                                            style={{ height: typeof greenLineHeight === 'number' ? `${greenLineHeight}px` : greenLineHeight }}
                                        ></div>

                                        <div className="space-y-8 md:space-y-4">
                                            {allFilteredSteps.map((step, index) => {
                                                const showHeader = step.type !== currentGroupType;
                                                currentGroupType = step.type;
                                                const isLocked = isStageLocked(step.type as TimelineType);
                                                const isLeft = flowCounter % 2 === 0;
                                                flowCounter++;
                                                const bulkIndex = bulkTimeline.findIndex(s => s.id === step.id);

                                                const isCurrentFinished = step.status === 'APPROVED' || step.status === 'IN_REVIEW';
                                                const isPreviousIncomplete = index > 0 && allFilteredSteps.slice(0, index).some(s => s.status !== 'APPROVED');

                                                const showCompleteBtn = project.isFinalized && (step.status === 'PENDING' || step.status === 'REJECTED') && !isPreviousIncomplete;
                                                const showEditBtn = !isCurrentFinished;
                                                const showDelayBtn = project.isFinalized && !isCurrentFinished && !isPreviousIncomplete;
                                                const showDeleteBtn = !isCurrentFinished;
                                                const showDropdown = showEditBtn || showDelayBtn || showDeleteBtn;

                                                return (
                                                    <div key={step.id}>
                                                        {showHeader && (
                                                            <div className="flex justify-center mb-8 relative z-10 first:mt-0 mt-16 text-center">
                                                                <div className="flex items-center gap-3 px-6 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-zinc-300 shadow-none' : 'bg-[#C5A059] shadow-[0_0_8px_rgba(197,160,89,0.4)]'}`} />
                                                                    <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isLocked ? 'text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                                                        {step.type === 'DESIGN' ? 'Design Phase' : 'Project Phase'}
                                                                    </h3>
                                                                    {isLocked && <Info size={12} className="text-zinc-400" />}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className={`relative flex items-center justify-between group mb-12 last:mb-0 ${isLocked ? 'grayscale opacity-50' : ''} ${isLocked && !isTimelineEditing ? 'pointer-events-none' : ''}`}>
                                                            {/* Center Dot - Adjusted for Mobile Left Alignment */}
                                                            <div className={`absolute left-6 md:left-1/2 -translate-x-1/2 z-10 ${step.status !== 'APPROVED' ? 'dot-pending' : ''}`}>
                                                                <div className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-950 shadow-sm ${step.status === 'APPROVED' ? 'bg-emerald-500' :
                                                                    step.status === 'IN_REVIEW' ? 'bg-amber-500 animate-pulse outline outline-4 outline-amber-500/10' :
                                                                        step.status === 'REJECTED' ? 'bg-rose-500' :
                                                                            'bg-zinc-300 dark:bg-zinc-700'
                                                                    }`}></div>
                                                            </div>

                                                            {/* Item Content - Full Width on Mobile, 45% on Desktop */}
                                                            <div className={`w-full md:w-[45%] pl-14 md:pl-0 ${isLeft ? 'md:text-right md:pr-10' : 'md:text-left md:pl-10 md:ml-auto'}`}>
                                                                {step.paymentTag && (
                                                                    <span className={`inline-block px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md text-[9px] font-black uppercase tracking-wider mb-2 ${isLeft ? 'md:ml-auto' : ''}`}>
                                                                        {step.paymentTag}
                                                                    </span>
                                                                )}

                                                                {isTimelineEditing ? (
                                                                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
                                                                        {isCurrentFinished ? (
                                                                            <div className={`w-full bg-transparent font-bold text-sm ${isLeft ? 'text-right' : 'text-left'} text-zinc-500`}>
                                                                                {bulkTimeline[bulkIndex]?.title || ''}
                                                                            </div>
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                className={`w-full bg-transparent font-bold text-sm focus:ring-0 border-none p-0 ${isLeft ? 'text-right' : 'text-left'}`}
                                                                                value={bulkTimeline[bulkIndex]?.title || ''}
                                                                                onChange={(e) => {
                                                                                    const nt = [...bulkTimeline];
                                                                                    nt[bulkIndex].title = e.target.value;
                                                                                    setBulkTimeline(nt);
                                                                                }}
                                                                            />
                                                                        )}
                                                                        <div className={`flex items-center gap-2 ${isLeft ? 'justify-end' : 'justify-start'}`}>
                                                                            {isCurrentFinished ? (
                                                                                <>
                                                                                    <span className="text-[10px] text-zinc-500">{new Date(bulkTimeline[bulkIndex].startDate).toISOString().split('T')[0]}</span>
                                                                                    <span className="text-zinc-400">to</span>
                                                                                    <span className="text-[10px] text-zinc-500">{new Date(bulkTimeline[bulkIndex].endDate).toISOString().split('T')[0]}</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <input type="date" value={new Date(bulkTimeline[bulkIndex].startDate).toISOString().split('T')[0]} onChange={(e) => { const nt = [...bulkTimeline]; nt[bulkIndex].startDate = e.target.value; setBulkTimeline(nt); }} className="text-[10px] bg-white dark:bg-zinc-900 border border-zinc-200 rounded-md px-2 py-1" />
                                                                                    <span className="text-zinc-400">to</span>
                                                                                    <input type="date" value={new Date(bulkTimeline[bulkIndex].endDate).toISOString().split('T')[0]} onChange={(e) => { const nt = [...bulkTimeline]; nt[bulkIndex].endDate = e.target.value; setBulkTimeline(nt); }} className="text-[10px] bg-white dark:bg-zinc-900 border border-zinc-200 rounded-md px-2 py-1" />
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                                                        <h4 className={`font-bold text-base md:text-lg tracking-tight ${step.status === 'REJECTED' ? 'text-rose-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                                            {step.title}
                                                                        </h4>
                                                                        <div className={`flex items-center gap-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest ${isLeft ? 'md:justify-end' : 'md:justify-start'}`}>
                                                                            <Clock size={10} />
                                                                            {new Date(step.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                            {step.startDate !== step.endDate && (
                                                                                <>
                                                                                    <span>—</span>
                                                                                    {new Date(step.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mt-2 font-medium">
                                                                            {step.description}
                                                                        </p>

                                                                        {/* Milestone Journey Thread */}
                                                                        <div className="mt-8 relative pl-6 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-12">
                                                                            {Array.from({ length: step.rejectCount + 1 }, (_, i) => {
                                                                                const round = i;
                                                                                const adminFiles = step.completionFiles?.filter(f => f.rejectionRound === round) || [];
                                                                                const clientFiles = step.feedbackFiles?.filter(f => f.rejectionRound === round + 1) || []; // Feedback for this round happens in the next round index
                                                                                const iterationObj = step.iterations?.find(it => it.iterationNumber === round + 1);
                                                                                const isLatest = round === step.rejectCount;
                                                                                const isHistory = round < step.rejectCount;

                                                                                if (adminFiles.length === 0 && clientFiles.length === 0 && !isLatest && !iterationObj?.adminFeedback && !iterationObj?.clientFeedback) return null;

                                                                                return (
                                                                                    <div key={round} className="relative space-y-6">
                                                                                        {/* Indicator Dot */}
                                                                                        <div className={`absolute -left-[30px] md:-left-[33px] top-1 h-4 w-4 rounded-full border-4 border-white dark:border-zinc-950 shadow-sm z-10 transition-colors ${isLatest && step.status === 'APPROVED' ? 'bg-emerald-500' :
                                                                                            isLatest && step.status === 'REJECTED' ? 'bg-rose-500 ring-4 ring-rose-500/20' :
                                                                                                isLatest && step.status === 'IN_REVIEW' ? 'bg-amber-500 animate-pulse' :
                                                                                                    'bg-zinc-300'
                                                                                            }`}></div>

                                                                                        {/* Admin Submission Part */}
                                                                                        <div className="space-y-3">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${isLatest ? 'bg-[#C5A059] text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                                                                                    Iteration {round + 1}
                                                                                                </span>
                                                                                                {(adminFiles.length > 0 || iterationObj?.adminFeedback) && (
                                                                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Uploaded by Admin</span>
                                                                                                )}
                                                                                            </div>

                                                                                            {iterationObj?.adminFeedback && (
                                                                                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                                                                                                    {iterationObj.adminFeedback}
                                                                                                </p>
                                                                                            )}

                                                                                            {adminFiles.length > 0 ? (
                                                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                                                    {adminFiles.map((f, idx) => (
                                                                                                        <div key={f.id} className={`group/work relative aspect-video rounded-xl overflow-hidden border shadow-sm transition-all ${isHistory ? 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : 'border-[#C5A059]/30'}`}>
                                                                                                            <div className="w-full h-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                                                                                                                {f.fileType === 'IMAGE' ? (
                                                                                                                    <img src={getFullUrl(f.fileUrl)} className="w-full h-full object-cover" />
                                                                                                                ) : f.fileType === 'VIDEO' ? (
                                                                                                                    <Video size={20} className="text-zinc-400" />
                                                                                                                ) : (
                                                                                                                    <FileText size={20} className="text-zinc-400" />
                                                                                                                )}
                                                                                                            </div>
                                                                                                            {/* Hover Overlay - Hidden on Mobile */}
                                                                                                            <div className="hidden md:flex absolute inset-0 bg-black/60 opacity-0 group-hover/work:opacity-100 items-center justify-center gap-2 transition-all duration-300">
                                                                                                                <button onClick={() => window.open(getFullUrl(f.fileUrl), '_blank')} className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:text-[#C5A059]"><Maximize2 size={16} /></button>
                                                                                                                <button onClick={() => triggerDownload(getFullUrl(f.fileUrl), `Work_R${round + 1}_${idx}`)} className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:text-[#C5A059]"><Download size={16} /></button>
                                                                                                            </div>
                                                                                                            {/* Mobile Action Bar */}
                                                                                                            <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-2 py-1.5 flex items-center justify-between border-t border-zinc-100">
                                                                                                                <span className="text-[8px] font-black uppercase text-zinc-500 truncate mr-1">Admin File</span>
                                                                                                                <div className="flex gap-1">
                                                                                                                    <button onClick={() => window.open(getFullUrl(f.fileUrl), '_blank')} className="h-6 w-6 flex items-center justify-center bg-[#C5A059] text-white rounded-md shadow-sm"><Eye size={12} /></button>
                                                                                                                    <button onClick={() => triggerDownload(getFullUrl(f.fileUrl), `Work_R${round + 1}_${idx}`)} className="h-6 w-6 flex items-center justify-center bg-zinc-100 text-zinc-700 rounded-md shadow-sm border border-zinc-200"><Download size={12} /></button>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            ) : isLatest && step.status !== 'APPROVED' && (
                                                                                                <div className="p-4 rounded-xl border-2 border-dashed border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-400">
                                                                                                    <CloudUpload size={20} />
                                                                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Initial Content</p>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>

                                                                                        {/* Client Feedback Part (History or Current Rejection) */}
                                                                                        {(round < step.rejectCount || (isLatest && step.status === 'REJECTED')) && (
                                                                                            <div className="pl-4 border-l-2 border-rose-100 dark:border-rose-900/30 py-2 space-y-4">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">
                                                                                                        {isLatest ? 'Latest Feedback' : `Rejection Feedback #${round + 1}`}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {(iterationObj?.clientFeedback || (isLatest && step.clientFeedback)) && (
                                                                                                    <p className="text-xs text-rose-700 dark:text-rose-400 italic leading-relaxed font-medium bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-100 dark:border-rose-900/40">
                                                                                                        "{iterationObj?.clientFeedback || step.clientFeedback}"
                                                                                                    </p>
                                                                                                )}

                                                                                                {clientFiles.length > 0 && (
                                                                                                     <div className="flex flex-wrap gap-3">
                                                                                                         {clientFiles.map((ff, idx) => (
                                                                                                             <div key={ff.id} className="group/fb relative h-24 w-24 md:h-28 md:w-28 rounded-xl overflow-hidden border border-rose-200 shadow-sm transition-all hover:shadow-xl hover:border-rose-400">
                                                                                                                 <div className="w-full h-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
                                                                                                                     {ff.fileType === 'IMAGE' ? (
                                                                                                                         <img src={getFullUrl(ff.fileUrl)} className="w-full h-full object-cover" />
                                                                                                                     ) : (
                                                                                                                         <FileIcon size={24} className="text-rose-400" />
                                                                                                                     )}
                                                                                                                 </div>
                                                                                                                 {/* Hover Overlay */}
                                                                                                                 <div className="absolute inset-0 bg-rose-500/80 opacity-0 group-hover/fb:opacity-100 flex items-center justify-center gap-2 transition-all duration-300">
                                                                                                                     <button onClick={() => window.open(getFullUrl(ff.fileUrl), '_blank')} className="h-8 w-8 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white hover:text-rose-500 transition-all shadow-sm"><Maximize2 size={16} /></button>
                                                                                                                     <button onClick={() => triggerDownload(getFullUrl(ff.fileUrl), `ClientFeedback_${round + 1}_${idx}`)} className="h-8 w-8 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white hover:text-rose-500 transition-all shadow-sm"><Download size={16} /></button>
                                                                                                                 </div>
                                                                                                                 {/* Mobile View Buttons */}
                                                                                                                 <div className="md:hidden absolute bottom-1 right-1 flex gap-1">
                                                                                                                     <button onClick={() => window.open(getFullUrl(ff.fileUrl), '_blank')} className="h-6 w-6 bg-white/95 rounded shadow-sm flex items-center justify-center text-rose-500"><Eye size={12} /></button>
                                                                                                                     <button onClick={() => triggerDownload(getFullUrl(ff.fileUrl), `ClientFeedback_${round + 1}_${idx}`)} className="h-6 w-6 bg-rose-500 rounded shadow-sm flex items-center justify-center text-white"><Download size={12} /></button>
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

                                                                            {/* Final Success State and Delay Warnings */}
                                                                            {step.status === 'APPROVED' && (
                                                                                <div className="flex items-center gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                                                                                    <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                                                                        <Check size={20} />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Finalized & Approved</p>
                                                                                        <p className="text-xs text-zinc-500 font-medium">All deliverables for this stage meet your standards.</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {step.delayReason && (
                                                                                <div className="flex items-start gap-3 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                                                                                    <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                                                        <AlertTriangle size={14} />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Delay Record</p>
                                                                                        <p className="text-[11px] text-zinc-600 font-medium italic">"{step.delayReason}"</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className={`flex flex-wrap items-center gap-3 mt-6 ${isLeft ? 'md:justify-end' : 'md:justify-start'}`}>
                                                                            {showCompleteBtn && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => { setEditingStep(step); setIsCompleteModalOpen(true); }}
                                                                                    className="h-8 w-24 bg-[#C5A059] text-white hover:bg-[#A38548] text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm active:scale-95 transition-all text-center"
                                                                                >
                                                                                    Complete
                                                                                </Button>
                                                                            )}

                                                                            <span className={`h-8 w-24 flex items-center justify-center rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm ${step.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                                step.status === 'IN_REVIEW' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                                    step.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                                        'bg-zinc-50 text-zinc-500 border-zinc-200'
                                                                                }`}>
                                                                                {step.status.replace('_', ' ')}
                                                                            </span>


                                                                            {showDropdown && (
                                                                                <DropdownMenu>
                                                                                    <DropdownMenuTrigger asChild>
                                                                                        <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                                                                                            <MoreVertical size={14} />
                                                                                        </button>
                                                                                    </DropdownMenuTrigger>
                                                                                    <DropdownMenuContent align={isLeft ? "end" : "start"} className="rounded-xl p-1 border-cs-border">
                                                                                        {showEditBtn && (
                                                                                            <DropdownMenuItem onClick={() => {
                                                                                                setEditingStep(step);
                                                                                                setMilestoneForm({
                                                                                                    title: step.title || '',
                                                                                                    description: step.description || '',
                                                                                                    type: step.type as TimelineType,
                                                                                                    startDate: new Date(step.startDate).toISOString().split('T')[0],
                                                                                                    endDate: new Date(step.endDate).toISOString().split('T')[0],
                                                                                                    paymentTag: step.paymentTag || ''
                                                                                                });
                                                                                                setIsTimelineModalOpen(true);
                                                                                            }} className="text-[11px] font-bold uppercase tracking-tight p-2 cursor-pointer gap-2">
                                                                                                <Edit size={14} className="text-[#C5A059]" /> Edit
                                                                                            </DropdownMenuItem>
                                                                                        )}
                                                                                        {showDelayBtn && (
                                                                                            <>
                                                                                                {showEditBtn && <DropdownMenuSeparator />}
                                                                                                <DropdownMenuItem onClick={() => { setEditingStep(step); setDelayForm({ endDate: new Date(step.endDate).toISOString().split('T')[0], delayReason: '' }); setIsDelayModalOpen(true); }} className="text-[11px] font-bold uppercase tracking-tight p-2 cursor-pointer gap-2">
                                                                                                    <Clock size={14} className="text-amber-500" /> Delay
                                                                                                </DropdownMenuItem>
                                                                                            </>
                                                                                        )}
                                                                                        {showDeleteBtn && (
                                                                                            <>
                                                                                                {(showEditBtn || showDelayBtn) && <DropdownMenuSeparator />}
                                                                                                <DropdownMenuItem
                                                                                                    onClick={() => {
                                                                                                        setStatusPopup({
                                                                                                            open: true,
                                                                                                            tone: 'danger',
                                                                                                            title: 'Delete Milestone',
                                                                                                            description: 'This will permanently delete this milestone and its associated files from the timeline. This action cannot be undone.'
                                                                                                        });
                                                                                                        // attach a one-time confirm handler
                                                                                                        (window as any).__confirmDeleteStepId = step.id;
                                                                                                    }}
                                                                                                    className="text-[11px] font-bold uppercase tracking-tight p-2 text-rose-600 cursor-pointer gap-2"
                                                                                                >
                                                                                                    <Trash2 size={14} /> Delete
                                                                                                </DropdownMenuItem>
                                                                                            </>
                                                                                        )}
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenu>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

            {/* Initialize Project Confirmation Modal */}
            <AdminPopup
                open={isInitializeConfirmOpen}
                tone="info"
                mode="confirm"
                title="Finalize Client Setup"
                description="This will notify the client that their project portal is ready and resend their login PIN/credentials. Make sure all milestones and dates are correct before proceeding."
                confirmLabel={isInitializingProject ? "Sending…" : "Yes, Notify Client"}
                cancelLabel="Cancel"
                loading={isInitializingProject}
                onConfirm={performInitializeSetup}
                onClose={() => setIsInitializeConfirmOpen(false)}
            />

            {/* Delete project confirmation */}
            <AdminPopup
                open={isDeleteConfirmOpen}
                tone="danger"
                mode="confirm"
                title="Delete Project & All Files"
                description="This will permanently delete this project, all milestones, and all uploaded files from the server. This action cannot be undone."
                confirmLabel={isDeletingProject ? "Deleting…" : "Delete Project"}
                cancelLabel="Cancel"
                loading={isDeletingProject}
                onConfirm={performDeleteProject}
                onClose={() => setIsDeleteConfirmOpen(false)}
            />

            {/* Download ZIP confirmation */}
            <AdminPopup
                open={isDownloadConfirmOpen}
                tone="info"
                mode="confirm"
                title="Download Full ZIP"
                description="This will generate and download a ZIP archive containing the approved work files, documents, and summary for this project."
                confirmLabel={isDownloadingArchive ? "Preparing…" : "Download ZIP"}
                cancelLabel="Cancel"
                loading={isDownloadingArchive}
                onConfirm={performDownloadArchive}
                onClose={() => setIsDownloadConfirmOpen(false)}
            />

            {/* Global status / alert popup */}
            <AdminPopup
                open={statusPopup.open}
                tone={statusPopup.tone}
                mode={(window as any).__confirmDeleteStepId ? "confirm" : "alert"}
                title={statusPopup.title}
                description={statusPopup.description}
                confirmLabel={(window as any).__confirmDeleteStepId ? "Delete Milestone" : "OK"}
                cancelLabel="Cancel"
                onConfirm={async () => {
                    const stepId = (window as any).__confirmDeleteStepId as string | undefined;
                    if (stepId) {
                        try {
                            await deleteTimelineStep(stepId);
                            await fetchProject();
                        } catch (err: any) {
                            console.error(err);
                        } finally {
                            (window as any).__confirmDeleteStepId = undefined;
                            setStatusPopup(prev => ({ ...prev, open: false }));
                        }
                    }
                }}
                onClose={() => {
                    (window as any).__confirmDeleteStepId = undefined;
                    setStatusPopup(prev => ({ ...prev, open: false }));
                }}
            />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {timeline.length > 0 && timeline.every(s => s.status === 'APPROVED') && (
                                            <div ref={finalBoxRef} className="mt-16 p-8 bg-white dark:bg-zinc-900 rounded-3xl text-center border-2 border-dashed border-[#C5A059]/30 shadow-[0_20px_50px_rgba(197,160,89,0.1)] relative z-10 transition-all animate-in zoom-in-95 duration-700">
                                                <div className="flex flex-col items-center max-w-lg mx-auto">
                                                    <div className="h-16 w-16 rounded-2xl bg-[#C5A059]/10 flex items-center justify-center mb-6 text-[#C5A059]">
                                                        <Award size={32} />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-widest mb-3">Project Successfully Finalized</h3>
                                                    <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-8">
                                                        Congratulations! All milestones have been approved by the client. You can now generate the handover documents, share a final summary statement, and archive the project data.
                                                    </p>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                                        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                                                            <p className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest">Client Deliverables</p>
                                                            <div className="flex flex-col gap-2">
                                                                <Button
                                                                    onClick={handleFinalDocument}
                                                                    className="w-full bg-[#C5A059] text-white hover:bg-[#A38548] h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#C5A059]/20"
                                                                >
                                                                    <FileCheck size={16} className="mr-2" /> Generate PDF Repo
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    disabled={isSummarizing}
                                                                    onClick={async () => {
                                                                        setIsSummarizing(true);
                                                                        setSummaryStatus({ type: null, text: "" });
                                                                        try {
                                                                            await summarizeProject(id);
                                                                            setStatusPopup({
                                                                                open: true,
                                                                                tone: 'success',
                                                                                title: 'Summary Email Sent',
                                                                                description: 'Project summary and ZIP archive have been emailed to the client successfully.'
                                                                            });
                                                                        } catch (e: any) {
                                                                            const msg = e?.message || "Server took too long to generate the summary. Please try again in a few minutes.";
                                                                            setStatusPopup({
                                                                                open: true,
                                                                                tone: 'danger',
                                                                                title: 'Summary Email Failed',
                                                                                description: msg.includes("Failed to fetch")
                                                                                    ? "Server took too long to respond while generating the summary email. The email may still be processing in the background; please refresh later and try again if needed."
                                                                                    : msg
                                                                            });
                                                                        } finally {
                                                                            setIsSummarizing(false);
                                                                        }
                                                                    }}
                                                                    className="w-full border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/5 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                                                >
                                                                    {isSummarizing ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                    ) : (
                                                                        <ScrollText size={16} className="mr-2" />
                                                                    )}
                                                                    {isSummarizing ? "Sending..." : "Send Email Summary"}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                                                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Administrative Actions</p>
                                                            <div className="flex flex-col gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setIsDownloadConfirmOpen(true)}
                                                                    className="w-full border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                                                >
                                                                    <Download size={16} className="mr-2" /> Download Full ZIP
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setIsDeleteConfirmOpen(true);
                                                                    }}
                                                                    className="w-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                                                >
                                                                    <Trash2 size={16} className="mr-2" /> Delete Total Data
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
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
                                                        <div className="flex-1 min-w-0 pr-2">
                                                            <p className="font-bold text-cs-heading dark:text-white text-sm truncate">
                                                                {entry.description || 'Untitled Document'}
                                                            </p>
                                                            <p className="text-[10px] text-cs-text mt-0.5">
                                                                {formatDate(getEntryDate(entry))} • {media.length} {media.length === 1 ? 'file' : 'files'}
                                                            </p>
                                                            <span className={`inline-block mt-1 text-[8px] font-black uppercase px-2 py-0.5 rounded ${entry.category === 'CLIENT_UPLOAD' ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                                                {entry.category === 'CLIENT_UPLOAD' ? 'Client Upload' : 'Admin Upload'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {media.length > 0 && (
                                                                <button
                                                                    onClick={() => setSelectedEntry(entry)}
                                                                    className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-[#C5A059] text-white hover:bg-[#A38548] flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
                                                                    title="View"
                                                                >
                                                                    <Maximize2 size={16} className="md:w-[18px] md:h-[18px]" />
                                                                </button>
                                                            )}
                                                            {media.length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        const m = media[0];
                                                                        const ext = getMediaType(m).toLowerCase() === 'image' ? 'jpg' : getMediaType(m).toLowerCase() === 'video' ? 'mp4' : 'pdf';
                                                                        triggerDownload(getFullUrl(getMediaUrl(m)), `document-${entry.id}.${ext}`);
                                                                    }}
                                                                    className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center shadow-sm shrink-0"
                                                                    title="Download"
                                                                >
                                                                    <Download size={16} className="md:w-[18px] md:h-[18px]" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 md:relative md:top-0 md:translate-y-0 md:opacity-100 transition-opacity">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="h-9 w-9 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center">
                                                                        <MoreVertical size={18} />
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
                        <div className="mb-4">
                            <h3 className="font-bold text-cs-heading dark:text-white text-lg">Project Brief</h3>
                        </div>
                        <p className="text-sm text-cs-text dark:text-zinc-400 leading-relaxed">
                            {project.description}
                        </p>
                    </div>

                    {/* Add Update Quick Form */}
                    {isUploading && (
                        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:relative md:inset-auto md:bg-transparent md:p-0 md:block animate-in fade-in duration-300">
                            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-2xl p-6 md:p-6 shadow-2xl md:shadow-xl border border-zinc-200 dark:border-zinc-800 md:border-2 md:border-[#C5A059]/30 overflow-y-auto max-h-[90vh] md:max-h-none md:sticky md:top-24 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-cs-heading dark:text-white text-lg">New Project Update</h3>
                                    <button onClick={() => setIsUploading(false)} className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-cs-text hover:text-rose-500 outline-none transition-colors"><Trash2 size={18} /></button>
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
                                            <SelectTrigger className="w-full bg-cs-bg/50 border-cs-border h-11">
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

                                    <div className="relative border-2 border-dashed border-cs-border rounded-xl p-6 md:p-8 flex flex-col items-center justify-center text-center hover:border-cs-primary-100 transition-colors cursor-pointer dark:border-zinc-800 bg-cs-bg/20">
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

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-cs-text">
                                            {uploadCategory === 'TIMELINE' ? 'Update Description' : 'Document Description'}
                                        </label>
                                        <textarea
                                            className="w-full min-h-[100px] md:min-h-[120px] border border-cs-border rounded-xl p-4 text-sm focus:ring-1 focus:ring-cs-primary-100 bg-cs-bg/50 dark:bg-zinc-800 dark:border-zinc-700 outline-none resize-none transition-all"
                                            placeholder={uploadCategory === 'TIMELINE' ? "What's new in this stage?" : "Brief description of the document..."}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                        ></textarea>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-cs-primary-100 hover:bg-cs-primary-200 text-white font-bold h-12 rounded-xl text-sm shadow-lg shadow-cs-primary-100/20 active:scale-95 transition-all"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : uploadCategory === 'TIMELINE' ? "Publish to Client" : "Upload Document"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Sheet open={isEditing} onOpenChange={setIsEditing}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-bold text-cs-heading">Edit Update</SheetTitle>
                        <SheetDescription>Modify the update details and media files.</SheetDescription>
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

                        <SheetFooter>
                            <Button type="submit" className="w-full bg-cs-primary-100 hover:bg-cs-primary-200 text-white font-bold h-11">
                                Save Changes
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Modal for Full View (Admin) */}
            {
                selectedEntry && (
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
                )
            }

            {/* Timeline Modals */}
            <Sheet open={isTimelineModalOpen} onOpenChange={setIsTimelineModalOpen}>
                <SheetContent className="bg-cs-bg sm:max-w-md w-full border-cs-border overflow-y-auto">
                    <SheetHeader className="mb-8">
                        <SheetTitle className="text-2xl font-black text-cs-heading font-serif tracking-tight">{editingStep ? 'Edit Milestone' : 'Add Milestone'}</SheetTitle>
                        <SheetDescription className="text-cs-text italic mt-2">
                            {editingStep ? 'Modify the details of this milestone.' : 'Create a new step in the project or design timeline.'}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6">
                        {/* ... form fields remain same ... */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-cs-heading uppercase tracking-widest">Type</label>
                            <Select value={milestoneForm.type} onValueChange={(v) => setMilestoneForm((p) => ({ ...p, type: v }))}>
                                <SelectTrigger className="w-full bg-white border-cs-border h-11"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="DESIGN">Design Timeline</SelectItem><SelectItem value="PROJECT">Project Timeline</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-cs-heading uppercase tracking-widest">Title</label>
                            <input type="text" value={milestoneForm.title} onChange={e => setMilestoneForm(p => ({ ...p, title: e.target.value }))} className="w-full h-11 px-4 bg-white border border-cs-border rounded-xl" placeholder="E.g. Electrical Wiring" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-cs-heading uppercase tracking-widest">Description</label>
                            <textarea value={milestoneForm.description} onChange={e => setMilestoneForm(p => ({ ...p, description: e.target.value }))} className="w-full min-h-[100px] p-4 bg-white border border-cs-border rounded-xl resize-none" placeholder="Provide details..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-cs-heading uppercase tracking-widest">Start Date</label>
                                <input type="date" value={milestoneForm.startDate} onChange={e => setMilestoneForm(p => ({ ...p, startDate: e.target.value }))} className="w-full h-11 px-4 bg-white border border-cs-border rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-cs-heading uppercase tracking-widest">End Date</label>
                                <input type="date" value={milestoneForm.endDate} onChange={e => setMilestoneForm(p => ({ ...p, endDate: e.target.value }))} className="w-full h-11 px-4 bg-white border border-cs-border rounded-xl" />
                            </div>
                        </div>
                        {/* <div className="space-y-2">
                            <label className="text-xs font-bold text-cs-heading uppercase tracking-widest">Payment Tag (Optional)</label>
                            <input type="text" value={milestoneForm.paymentTag} onChange={e => setMilestoneForm(p => ({ ...p, paymentTag: e.target.value }))} className="w-full h-11 px-4 bg-white border border-cs-border rounded-xl" placeholder="E.g. 50% initial payment" />
                        </div> */}
                        <Button onClick={handleCreateOrUpdateMilestone} className="w-full bg-cs-primary-100 text-white hover:bg-cs-primary-200 h-12 uppercase tracking-widest font-bold text-xs shadow-md">{editingStep ? 'Update Milestone' : 'Create Milestone'}</Button>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
                <SheetContent className="bg-cs-bg sm:max-w-md w-full border-cs-border">
                    {isUploading && (
                        <div className="absolute inset-0 z-10 bg-white/80 dark:bg-zinc-950/80 flex items-center justify-center">
                            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                                <Loader2 className="h-4 w-4 animate-spin text-[#C5A059]" />
                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-700 dark:text-zinc-200">
                                    Uploading files & notifying client…
                                </span>
                            </div>
                        </div>
                    )}
                    <SheetHeader className="mb-8">
                        <SheetTitle className="text-2xl font-black text-cs-heading font-serif tracking-tight">Mark Complete</SheetTitle>
                        <SheetDescription className="text-cs-text italic text-sm mt-2">
                            Upload the completed work for client review. You can select multiple files.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 mt-4">
                        <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#C5A059] transition-colors relative">
                            <input
                                type="file"
                                accept="image/*,video/*,application/pdf"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={e => {
                                    const selectedFiles = Array.from(e.target.files || []);
                                    setCompleteFiles(prev => [...prev, ...selectedFiles]);
                                }}
                            />
                            <Upload className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                            <p className="text-sm font-bold text-zinc-700">Click or drag files to upload</p>
                            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Images, Videos, or PDFs</p>
                        </div>

                        {completeFiles.length > 0 && (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {completeFiles.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-cs-border rounded-xl">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                                <FileIcon size={14} className="text-zinc-500" />
                                            </div>
                                            <span className="text-xs font-bold text-zinc-700 truncate">{f.name}</span>
                                        </div>
                                        <button
                                            onClick={() => setCompleteFiles(prev => prev.filter((_, idx) => idx !== i))}
                                            className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Completion Notes</label>
                            <textarea
                                value={completeDescription}
                                onChange={e => setCompleteDescription(e.target.value)}
                                className="w-full min-h-[100px] p-4 bg-white border border-cs-border rounded-xl resize-none text-sm"
                                placeholder="Describe the work completed or add a note for the client..."
                            />
                        </div>

                        <Button
                            onClick={handleCompleteMilestone}
                            disabled={isUploading}
                            className="w-full bg-[#C5A059] text-white hover:bg-[#A38548] disabled:opacity-60 disabled:cursor-not-allowed h-12 uppercase tracking-widest font-bold text-xs shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {isUploading ? 'Submitting…' : `Submit for Review${completeFiles.length > 0 ? ` (${completeFiles.length} files)` : ""}`}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={isDelayModalOpen} onOpenChange={setIsDelayModalOpen}>
                <SheetContent className="bg-cs-bg sm:max-w-md w-full border-cs-border">
                    {isDelaying && (
                        <div className="absolute inset-0 z-10 bg-white/80 dark:bg-zinc-950/80 flex items-center justify-center">
                            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                                <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-700 dark:text-zinc-200">
                                    Updating schedule & notifying client…
                                </span>
                            </div>
                        </div>
                    )}
                    <SheetHeader className="mb-8">
                        <SheetTitle className="text-2xl font-black text-cs-heading font-serif tracking-tight text-rose-600">Delay Milestone</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-cs-heading uppercase tracking-widest">New End Date</label>
                            <input type="date" value={delayForm.endDate} onChange={e => setDelayForm({ ...delayForm, endDate: e.target.value })} className="w-full h-11 px-4 bg-white border border-cs-border rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-cs-heading uppercase tracking-widest">Reason for Delay</label>
                            <textarea value={delayForm.delayReason} onChange={e => setDelayForm({ ...delayForm, delayReason: e.target.value })} className="w-full min-h-[100px] p-4 bg-white border border-cs-border rounded-xl" placeholder="Provide a reason to inform the client" />
                        </div>

                        {editingStep && delayForm.endDate && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
                                <AlertCircle className="text-amber-500 h-4 w-4 shrink-0 mt-1" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Cascading Schedule Adjustment</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        All stages after <strong>{editingStep.title}</strong> will be automatically shifted to maintain the original project duration.
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleDelayMilestone}
                            disabled={isDelaying || !delayForm.endDate || !delayForm.delayReason}
                            className="w-full bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed h-12 uppercase tracking-widest font-bold text-xs shadow-md"
                        >
                            {isDelaying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {isDelaying ? 'Updating…' : 'Confirm Delay & Notify'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Mobile Floating Action Button */}
            {!isUploading && (
                <div className="fixed bottom-6 right-6 z-50 md:hidden animate-in slide-in-from-bottom-10 duration-500">
                    <button
                        onClick={() => {
                            setIsUploading(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="h-14 w-14 rounded-full bg-cs-primary-100 text-white shadow-2xl shadow-cs-primary-100/40 flex items-center justify-center active:scale-90 transition-transform ring-4 ring-white dark:ring-zinc-950"
                    >
                        <Plus size={28} />
                    </button>
                </div>
            )}
        </div >
    );
}
