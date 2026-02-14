import { Response } from 'express';
import { prisma } from '../../index.js';
import { AuthRequest } from '../../middleware/auth.js';
import { EntryCategory } from '@prisma/client';

const VALID_CATEGORIES: string[] = ['TIMELINE', 'AGREEMENT', 'PAYMENT_INVOICE', 'HANDOVER', 'CERTIFICATE'];


// Helper to format entry for frontend (Mapping DB fields to the 'media' array expected by UI)
const formatEntry = (entry: any) => ({
    ...entry,
    category: entry.category || 'TIMELINE',
    media: entry.fileUrl ? [{
        url: entry.fileUrl,
        type: entry.fileType
    }] : []
});


// Admin: Add progress entry (Supporting Many Images, Videos, and PDFs)
export const createProjectEntry = async (req: AuthRequest, res: Response) => {
    const projectId = req.params.id as string;
    const { description, category } = req.body;

    // Validate category if provided
    const entryCategory = category && VALID_CATEGORIES.includes(category) ? category as EntryCategory : 'TIMELINE';

    // Use req.files for multiple uploads from upload.array()
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'Missing files in the "media" field' });
    }

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const entriesData = files.map(file => {
            let fileType: 'IMAGE' | 'VIDEO' | 'PDF' = 'IMAGE';
            if (file.mimetype.startsWith('video/')) {
                fileType = 'VIDEO';
            } else if (file.mimetype === 'application/pdf') {
                fileType = 'PDF';
            }

            return {
                projectId,
                description: description || '',
                fileUrl: file.path.replace(/\\/g, '/'),
                fileType: fileType,
                category: entryCategory,
            };
        });

        // Use createMany if your PRISMA version supports it, otherwise loop
        // Programmatic loop is safer for returning objects
        const createdEntries = [];
        for (const data of entriesData) {
            const entry = await prisma.projectEntry.create({
                data: data as any,
            });
            createdEntries.push(formatEntry(entry));
        }

        res.status(201).json(createdEntries);
    } catch (error) {
        console.error('Entry Create Error:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Client/Admin: View all entries for a project
export const getProjectEntries = async (req: AuthRequest, res: Response) => {
    const projectId = req.params.id as string;
    const userId = req.user?.id;
    const role = req.user?.role;

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (role === 'CLIENT' && project.clientId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this project entries' });
        }

        const entries = await prisma.projectEntry.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });

        res.json(entries.map(formatEntry));
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Admin: Update progress entry
export const updateProjectEntry = async (req: AuthRequest, res: Response) => {
    const entryId = req.params.id as string;
    const { description, category } = req.body;

    const files = req.files as Express.Multer.File[] | undefined;
    const file = req.file || (files && files.length > 0 ? files[0] : undefined);

    try {
        const existingEntry = await prisma.projectEntry.findUnique({ where: { id: entryId } });
        if (!existingEntry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        const data: any = {};
        if (description) data.description = description;
        if (category && VALID_CATEGORIES.includes(category)) data.category = category as EntryCategory;

        if (file) {
            let fileType: 'IMAGE' | 'VIDEO' | 'PDF' = 'IMAGE';
            if (file.mimetype.startsWith('video/')) {
                fileType = 'VIDEO';
            } else if (file.mimetype === 'application/pdf') {
                fileType = 'PDF';
            }

            data.fileUrl = file.path.replace(/\\/g, '/');
            data.fileType = fileType;
        }

        const updatedEntry = await prisma.projectEntry.update({
            where: { id: entryId },
            data,
        });

        res.json(formatEntry(updatedEntry));
    } catch (error) {
        console.error('Entry Update Error:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Admin: Delete progress entry
export const deleteProjectEntry = async (req: AuthRequest, res: Response) => {
    const entryId = req.params.id as string;

    try {
        const existingEntry = await prisma.projectEntry.findUnique({ where: { id: entryId } });
        if (!existingEntry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        await prisma.projectEntry.delete({ where: { id: entryId } });
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Entry Delete Error:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};
