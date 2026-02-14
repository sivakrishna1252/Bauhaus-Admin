import { Response } from 'express';
import { prisma } from '../../index.js';
import { ProjectStatus } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.js';

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
    const { title, description, clientId } = req.body;

    if (!title || !clientId) {
        return res.status(400).json({ message: 'Title and Client are required' });
    }

    try {
        // Verify client exists
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            return res.status(404).json({ message: 'Selected client does not exist' });
        }

        const project = await prisma.project.create({
            data: {
                title,
                description,
                clientId,
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

// Admin: Delete project
export const deleteProject = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    try {
        await prisma.project.delete({ where: { id } });
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
