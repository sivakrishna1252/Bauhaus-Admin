import { Response } from 'express';
import { prisma } from '../../index.js';
import { ProjectStatus } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.js';
import { sendProjectCompletionSummary } from '../../utils/notifications.js';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to format project entries for frontend
const formatProjectEntries = (project: any) => {
    if (!project || !project.entries) return project;
    return {
        ...project,
        entries: project.entries.map((entry: any) => ({
            ...entry,
            category: entry.category || 'TIMELINE',
            media: entry.fileUrl ? [{
                url: entry.fileUrl,
                type: entry.fileType
            }] : []
        }))
    };
};

// Admin: Create a new project
export const createProject = async (req: AuthRequest, res: Response) => {
    const { title, description, clientId, designer, principalDesigner } = req.body;

    if (!title || !clientId) {
        return res.status(400).json({ message: 'Title and Client are required' });
    }

    try {
        // Verify client exists
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            return res.status(404).json({ message: 'Selected client does not exist' });
        }

        const project = await (prisma.project as any).create({
            data: {
                title,
                description,
                clientId,
                designer,
                principalDesigner,
            },
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Create Project Error:', error);
        res.status(500).json({ message: 'Internal server error', error: String(error) });
    }
};

// Admin: Get all projects
export const getAllProjects = async (req: AuthRequest, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            include: { client: { select: { username: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Client: Get own projects
export const getMyProjects = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    try {
        const projects = await prisma.project.findMany({
            where: { clientId: userId },
            include: { entries: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(projects.map(formatProjectEntries));
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// General: Get project detail
export const getProjectDetail = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const role = req.user?.role;

    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: { entries: true, client: { select: { username: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Access control: Clients can only see their own projects
        if (role === 'CLIENT' && project.clientId !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        res.json(formatProjectEntries(project));
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Update project status
export const updateProjectStatus = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;

    try {
        const project = await prisma.project.update({
            where: { id },
            data: { status: status as ProjectStatus },
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Delete project (Purge everything including files)
export const deleteProject = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    try {
        const project = await (prisma as any).project.findUnique({
            where: { id },
            include: {
                entries: true,
                timelineSteps: {
                    include: {
                        completionFiles: true,
                        feedbackFiles: true
                    }
                }
            }
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Collect all file paths to delete
        const filesToDelete: string[] = [];

        // From project entries
        project.entries.forEach((e: any) => {
            if (e.fileUrl) filesToDelete.push(e.fileUrl);
        });

        // From timeline steps
        project.timelineSteps.forEach((step: any) => {
            step.completionFiles.forEach((f: any) => filesToDelete.push(f.fileUrl));
            step.feedbackFiles.forEach((f: any) => filesToDelete.push(f.fileUrl));
        });

        if (project.finalDocumentUrl) filesToDelete.push(project.finalDocumentUrl);

        // Delete files from storage (Individual unlinks for old flat structure)
        filesToDelete.forEach(filePath => {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
            if (fs.existsSync(absolutePath)) {
                try {
                    fs.unlinkSync(absolutePath);
                } catch (e) {
                    console.error(`Failed to delete file: ${absolutePath}`, e);
                }
            }
        });

        // Delete project folder from storage (New organized structure)
        const projectDir = path.join(process.cwd(), 'uploads', 'projects', id);
        if (fs.existsSync(projectDir)) {
            try {
                fs.rmSync(projectDir, { recursive: true, force: true });
            } catch (e) {
                console.warn(`Could not delete project directory (might be already empty): ${projectDir}`);
            }
        }

        // Delete from database
        await prisma.project.delete({ where: { id } });

        res.json({ message: 'Project and all associated files deleted successfully' });
    } catch (error) {
        console.error('Delete Project Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Helper for file categorization in ZIP
const getFileCategory = (filename: string) => {
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    const images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic'];
    const videos = ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'avi'];
    if (images.includes(ext)) return 'Images';
    if (videos.includes(ext)) return 'Videos';
    return 'Documents';
};

// Admin: Summarize and Email Project to Client
export const summarizeAndEmailProject = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    try {
        const project = await (prisma as any).project.findUnique({
            where: { id },
            include: {
                client: true,
                timelineSteps: {
                    orderBy: [{ type: 'asc' }, { order: 'asc' }],
                    include: {
                        completionFiles: true,
                        feedbackFiles: true
                    }
                },
                entries: {
                    where: { category: { in: ['AGREEMENT', 'HANDOVER', 'PROJECT_DOCUMENT', 'CERTIFICATE'] } }
                }
            }
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Generate the ZIP archive to a temporary file to handle size safely
        const tempZipPath = path.join(process.cwd(), 'uploads', `Summary_Temp_${id}_${Date.now()}.zip`);
        const output = fs.createWriteStream(tempZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        console.log(`Starting to build ZIP for project summary: ${project.title}`);

        // Wait for finalization safely with disk persistence
        const zipFinalized = new Promise<boolean>((resolve, reject) => {
            output.on('close', () => {
                console.log(`ZIP file written to disk, size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
                resolve(true);
            });
            archive.on('error', (err) => {
                console.error('Archiver error:', err);
                reject(err);
            });
            archive.pipe(output);

            // Build summary HTML and populate Archive
            // (Same zip population logic as before)
            const manifest = {
                projectDetail: { id: project.id, title: project.title, description: project.description, status: project.status, createdAt: project.createdAt },
                clientDetail: project.client,
                milestones: project.timelineSteps,
                additionalDocuments: project.entries
            };
            archive.append(JSON.stringify(manifest, null, 2), { name: 'project_summary.json' });

            const addedFiles = new Set<string>();
            const categoryLabels: Record<string, string> = {
                'AGREEMENT': 'Agreements',
                'HANDOVER': 'Handover_Files',
                'PROJECT_DOCUMENT': 'Project_Documents',
                'CLIENT_UPLOAD': 'Client_Submissions',
                'CERTIFICATE': 'Certificates'
            };

            const addProjectFile = (filePath: string, folderName: string) => {
                if (!filePath || addedFiles.has(filePath)) return;
                const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
                if (fs.existsSync(absolutePath)) {
                    const category = getFileCategory(path.basename(filePath));
                    archive.file(absolutePath, { name: `${folderName}/${category}/${path.basename(filePath)}` });
                    addedFiles.add(filePath);
                }
            };

            project.entries.forEach((e: any) => {
                if (e.fileUrl) {
                    const label = categoryLabels[e.category] || 'Other_Documents';
                    addProjectFile(e.fileUrl, `Documents/${label}`);
                }
            });
            project.timelineSteps.forEach((step: any) => {
                const stepFolder = `Timeline/${step.order}_${step.title.replace(/\s+/g, '_')}`;
                step.completionFiles
                    .filter((f: any) => f.rejectionRound === step.rejectCount)
                    .forEach((f: any) => addProjectFile(f.fileUrl, `${stepFolder}/Approved_Work`));
            });
            if (project.finalDocumentUrl) addProjectFile(project.finalDocumentUrl, 'Handover_Report');

            archive.finalize();
        });

        await zipFinalized;

        // Build concise summary HTML for email
        let summaryHtml = '<div style="margin-bottom: 20px; font-family: sans-serif; color: #4B5563;">';

        summaryHtml += '<h3 style="color: #1A1A1A; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #F3F4F6; padding-bottom: 8px;">Project Milestones:</h3>';
        summaryHtml += '<ul style="padding-left: 15px; margin: 0; list-style-type: none;">';

        project.timelineSteps.forEach((s: any) => {
            summaryHtml += `
                <li style="margin-bottom: 12px; position: relative; padding-left: 20px;">
                    <span style="position: absolute; left: 0; color: #C5A059;">•</span>
                    <strong style="color: #1A1A1A; display: block; font-size: 14px;">${s.title}</strong>
                    <span style="font-size: 12px; color: #9CA3AF;">Approved on ${new Date(s.endDate).toLocaleDateString()}</span>
                </li>`;
        });
        summaryHtml += '</ul>';

        if (project.finalDocumentUrl) {
            summaryHtml += '<p style="margin-top: 20px; font-size: 14px; font-style: italic;">All design documents, certificates, and your final handover report are organized within the attached ZIP archive.</p>';
        }

        summaryHtml += '</div>';

        if (project.client?.email) {
            console.log(`Sending summary email with attachment to: ${project.client.email}`);
            await sendProjectCompletionSummary(
                project.client.email,
                project.title,
                summaryHtml,
                [{
                    filename: `Project_Archive_${project.title.replace(/\s+/g, '_')}.zip`,
                    path: tempZipPath // Attach file from disk instead of memory
                }]
            );
            console.log('Summary email sent successfully');

            // Cleanup temp file after sending
            fs.unlink(tempZipPath, (err) => {
                if (err) console.error('Failed to cleanup temp ZIP:', err);
                else console.log('Cleanup: Temp ZIP removed');
            });

            await prisma.project.update({ where: { id }, data: { status: 'COMPLETED' } });
            res.json({ message: 'Project summary and ZIP archive emailed to client' });
        } else {
            res.status(400).json({ message: 'Client email not found' });
        }
    } catch (error: any) {
        console.error('Summarize Project Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to process summary attachment.', error: error.message });
        }
    }
};

// Admin: Archive and Download Project (ZIP)
export const archiveAndDownloadProject = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    try {
        const project = await (prisma as any).project.findUnique({
            where: { id },
            include: {
                client: true,
                entries: true,
                timelineSteps: { include: { completionFiles: true, feedbackFiles: true } }
            }
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        const archive = archiver('zip', { zlib: { level: 9 } });
        const zipName = `Project_Archive_${project.title.replace(/\s+/g, '_')}_${Date.now()}.zip`;

        res.attachment(zipName);
        archive.pipe(res);

        const manifest = {
            projectDetail: { id: project.id, title: project.title, description: project.description, status: project.status, createdAt: project.createdAt },
            clientDetail: project.client,
            milestones: project.timelineSteps,
            additionalDocuments: project.entries
        };
        archive.append(JSON.stringify(manifest, null, 2), { name: 'project_summary.json' });

        const addedFiles = new Set<string>();
        const categoryLabels: Record<string, string> = {
            'AGREEMENT': 'Agreements',
            'HANDOVER': 'Handover_Files',
            'PROJECT_DOCUMENT': 'Project_Documents',
            'CLIENT_UPLOAD': 'Client_Submissions',
            'CERTIFICATE': 'Certificates'
        };

        const addProjectFile = (filePath: string, folderName: string) => {
            if (!filePath || addedFiles.has(filePath)) return;
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
            if (fs.existsSync(absolutePath)) {
                const category = getFileCategory(path.basename(filePath));
                archive.file(absolutePath, { name: `${folderName}/${category}/${path.basename(filePath)}` });
                addedFiles.add(filePath);
            }
        };

        project.entries.forEach((e: any) => {
            if (e.fileUrl) {
                const label = categoryLabels[e.category] || 'Other_Documents';
                addProjectFile(e.fileUrl, `Documents/${label}`);
            }
        });
        project.timelineSteps.forEach((step: any) => {
            const stepFolder = `Timeline/${step.order}_${step.title.replace(/\s+/g, '_')}`;
            // For the FULL archive, we include EVERYTHING (including history) per user request/standard
            // But if they wanted "only accept", the summary email version above handles it.
            // I'll keep the full archive for "Download ZIP" button but maybe the user wants it restricted too?
            // "in doumolaod zip fike abnd mial alos you show separtes"
            // Let's filter here too if they meant only accepted ones.
            step.completionFiles
                .filter((f: any) => f.rejectionRound === step.rejectCount)
                .forEach((f: any) => addProjectFile(f.fileUrl, `${stepFolder}/Approved_Work`));
        });
        if (project.finalDocumentUrl) addProjectFile(project.finalDocumentUrl, 'Handover_Report');

        await archive.finalize();
    } catch (error) {
        console.error('Archive Project Error:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Internal server error' });
    }
};
