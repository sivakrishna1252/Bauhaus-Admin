import { Response } from 'express';
import { prisma } from '../../index.js';
import { AuthRequest } from '../../middleware/auth.js';
import {
    sendDelayNotification,
    sendReviewRequestNotification,
    sendAdminFeedbackNotification,
    sendBulkScheduleUpdateNotification,
    sendProjectInitializedNotification,
    sendNewMilestoneNotification
} from '../../utils/notifications.js';
import { organizeFileToProject, getFileTypeFromMimetype } from '../../utils/fileUtils.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Admin: Create timeline steps
export const createTimelineStep = async (req: AuthRequest, res: Response) => {
    const projectId = req.params.projectId as string;
    const { type, title, description, startDate, endDate, order, paymentTag } = req.body;

    if (!type || !title || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const project = await (prisma as any).project.findUnique({
            where: { id: projectId },
            include: { client: true }
        });
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Auto-calculate order if not provided
        let stepOrder = order;
        if (stepOrder === undefined || stepOrder === null) {
            const existingSteps = await (prisma as any).timelineStep.count({
                where: { projectId, type }
            });
            stepOrder = existingSteps; // 0-based: first step = 0, second = 1, etc.
        }

        const step = await (prisma as any).timelineStep.create({
            data: {
                projectId,
                type,
                title,
                description,
                paymentTag,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                order: stepOrder,
                status: 'PENDING'
            } as any
        });

        // Requirement 11: If project is already finalized, notify client about the new milestone
        if (project.isFinalized && project.client?.email) {
            await sendNewMilestoneNotification(project.client.email, project.title, title);
        }

        res.status(201).json(step);
    } catch (error: any) {
        console.error('Create Timeline Step Error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message, stack: error.stack });
    }
};

// Admin: Update timeline step (Deadline change with reason)
export const updateTimelineStep = async (req: AuthRequest, res: Response) => {
    const stepId = req.params.id as string;
    const { title, description, startDate, endDate, delayReason, status, order, paymentTag } = req.body;

    try {
        const step = await (prisma as any).timelineStep.findUnique({
            where: { id: stepId },
            include: { project: { include: { client: true } } }
        });
        if (!step) {
            return res.status(404).json({ message: 'Step not found' });
        }

        // Requirement 9: Lock approved stages
        if (step.status === 'APPROVED' && (!status || status === 'APPROVED')) {
            return res.status(400).json({ message: 'Approved milestones are locked and cannot be modified' });
        }

        const data: any = {};
        if (title) data.title = title;
        if (description) data.description = description;
        if (paymentTag !== undefined) data.paymentTag = paymentTag;
        if (startDate) data.startDate = new Date(startDate);
        if (endDate) {
            const newEndDate = new Date(endDate);
            if (newEndDate.getTime() !== new Date(step.endDate).getTime()) {
                if (delayReason) {
                    data.delayReason = delayReason;
                    data.delayCount = (step.delayCount || 0) + 1;
                    
                    // Create delay record
                    data.delays = {
                        create: {
                            delayNumber: data.delayCount,
                            reason: delayReason
                        }
                    };
                }
            }
            data.endDate = newEndDate;
        }
        if (status) data.status = status;
        if (order !== undefined) data.order = order;

        const updatedStep = await prisma.timelineStep.update({
            where: { id: stepId },
            data
        });

        // Optional: Send specialized notification for individual manual update if needed
        const dCount = (updatedStep as any).delayCount || 0;
        if (dCount > 1 && (step as any).project?.client?.email) {
            const formattedDate = new Date(updatedStep.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            await sendDelayNotification(
                (step as any).project.client.email,
                updatedStep.title,
                formattedDate,
                `${delayReason || 'Schedule update'} (Note: This is the ${dCount === 2 ? '2nd' : dCount + 'th'} time this stage has been delayed)`
            );
        }

        res.json(updatedStep);
    } catch (error) {
        console.error('Update Timeline Step Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Mark task as done (Admin uploads work for review)
export const completeTimelineStep = async (req: AuthRequest, res: Response) => {
    const stepId = req.params.id as string;
    const files = req.files as Express.Multer.File[];
    const { description } = req.body;

    // Requirement 9: Lock approved stages
    const stepExists = await (prisma as any).timelineStep.findUnique({ where: { id: stepId } });
    if (stepExists?.status === 'APPROVED') {
        return res.status(400).json({ message: 'Approved milestones are locked' });
    }

    try {
        const completionFilesData = (files && files.length > 0) ? files.map(file => {
            const stepName = stepExists.title.replace(/\s+/g, '_');
            const subFolder = `timeline/${stepName}/completion`;
            const persistentPath = organizeFileToProject(stepExists.projectId, file.path, subFolder);

            return {
                fileUrl: persistentPath,
                fileType: getFileTypeFromMimetype(file.mimetype),
            };
        }) : [];

        const updatedStep = await (prisma as any).timelineStep.update({
            where: { id: stepId },
            include: {
                project: { include: { client: true } },
                completionFiles: true,
                iterations: true
            },
            data: {
                status: 'IN_REVIEW',
                description: description || undefined,
                ...(completionFilesData.length > 0 && {
                    completionFiles: {
                        create: completionFilesData.map(f => ({
                            ...f,
                            rejectionRound: stepExists.rejectCount || 0
                        }))
                    }
                }),
                iterations: {
                    create: {
                        iterationNumber: (stepExists.rejectCount || 0) + 1,
                        adminFeedback: description || null,
                        status: 'IN_REVIEW'
                    }
                }
            }
        });

        // Send "Review Requested" email to client
        if (updatedStep.project?.client?.email) {
            await sendReviewRequestNotification(
                updatedStep.project.client.email,
                updatedStep.title,
                updatedStep.rejectCount
            );
        }
        res.json(updatedStep);
    } catch (error) {
        console.error('Complete Timeline Step Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Client: Approve/Reject timeline step
export const feedbackTimelineStep = async (req: AuthRequest, res: Response) => {
    const stepId = req.params.id as string;
    const { status, clientFeedback } = req.body; // APPROVED or REJECTED
    const files = req.files as Express.Multer.File[]; // Requirement 5: Client multi-upload

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid feedback status' });
    }

    try {
        const step = await (prisma as any).timelineStep.findUnique({
            where: { id: stepId },
            include: { completionFiles: true, project: true }
        });

        if (!step) return res.status(404).json({ message: 'Step not found' });

        const updatedStep = await (prisma as any).timelineStep.update({
            where: { id: stepId },
            include: { 
                feedbackFiles: true, 
                project: true,
                iterations: {
                    orderBy: { iterationNumber: 'desc' },
                    take: 1
                }
            },
            data: {
                status: status,
                clientFeedback,
                rejectCount: status === 'REJECTED' ? (step.rejectCount || 0) + 1 : undefined
            }
        });

        // Update the current iteration record
        if (updatedStep.iterations && updatedStep.iterations.length > 0) {
            await (prisma as any).timelineStepIteration.update({
                where: { id: updatedStep.iterations[0].id },
                data: {
                    clientFeedback: clientFeedback || null,
                    status: status
                }
            });
        }

        // Requirement 4: Save files into Documents on access/approval
        if (status === 'APPROVED') {
            const projectEntriesData = step.completionFiles.map((f: any) => ({
                projectId: step.projectId,
                description: `APPROVED: ${step.title} - ${path.basename(f.fileUrl)}`,
                fileUrl: f.fileUrl,
                fileType: f.fileType,
                category: 'PROJECT_DOCUMENT'
            }));

            if (projectEntriesData.length > 0) {
                await (prisma as any).projectEntry.createMany({
                    data: projectEntriesData
                });
            }
        }

        // Requirement 5: Handle client uploaded feedback files
        if (files && files.length > 0) {
            const feedbackFilesData = files.map(file => {
                const stepName = step.title.replace(/\s+/g, '_');
                const subFolder = `timeline/${stepName}/feedback`;
                const persistentPath = organizeFileToProject(step.projectId, file.path, subFolder);

                // Update file.path for subsequent maps (e.g. feedbackEntriesData)
                file.path = persistentPath;

                return {
                    fileUrl: persistentPath,
                    fileType: getFileTypeFromMimetype(file.mimetype),
                };
            });

            // Save to TimelineFeedbackFile for specific step tracking
            await (prisma as any).timelineStep.update({
                where: { id: stepId },
                data: {
                    feedbackFiles: {
                        create: feedbackFilesData.map(f => ({
                            ...f,
                            rejectionRound: updatedStep.rejectCount || 0
                        }))
                    }
                }
            });

            // Also keep as ProjectEntry for the unified feed (consistency)
            const feedbackEntriesData = files.map(file => ({
                projectId: step.projectId,
                description: `CLIENT FEEDBACK on ${step.title}: ${clientFeedback || 'Check images'}`,
                fileUrl: file.path.replace(/\\/g, '/'),
                fileType: (file.mimetype.startsWith('image') ? 'IMAGE' : file.mimetype.startsWith('video') ? 'VIDEO' : 'PDF') as any,
                category: 'CLIENT_UPLOAD'
            }));

            await (prisma as any).projectEntry.createMany({
                data: feedbackEntriesData
            });
        }

        // Notify admin about feedback
        await sendAdminFeedbackNotification(updatedStep.title, status, clientFeedback, updatedStep.rejectCount);

        res.json(updatedStep);
    } catch (error) {
        console.error('Feedback Timeline Step Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Add daily work log to a step
export const addDailyLog = async (req: AuthRequest, res: Response) => {
    const stepId = req.params.id as string;
    const { description } = req.body;

    if (!description) {
        return res.status(400).json({ message: 'Log description is required' });
    }

    try {
        const log = await prisma.dailyWorkLog.create({
            data: {
                timelineStepId: stepId,
                description
            }
        });
        res.status(201).json(log);
    } catch (error) {
        console.error('Add Daily Log Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// General: Get timeline with daily logs
export const getProjectTimelineWithLogs = async (req: AuthRequest, res: Response) => {
    const projectId = req.params.projectId as string;

    try {
        const steps = await (prisma as any).timelineStep.findMany({
            where: { projectId },
            include: {
                dailyLogs: { orderBy: { logDate: 'desc' } },
                completionFiles: { orderBy: { createdAt: 'desc' } },
                feedbackFiles: { orderBy: { createdAt: 'desc' } },
                iterations: { orderBy: { iterationNumber: 'asc' } },
                delays: { orderBy: { delayNumber: 'asc' } }
            },
            orderBy: [{ type: 'asc' }, { order: 'asc' }]
        });
        res.json(steps);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Generate Final PDF Document
export const generateFinalDocument = async (req: AuthRequest, res: Response) => {
    const projectId = req.params.id as string;

    try {
        const project = await (prisma as any).project.findUnique({
            where: { id: projectId },
            include: {
                client: true,
                timelineSteps: {
                    include: { dailyLogs: true },
                    orderBy: [{ type: 'asc' }, { order: 'asc' }]
                }
            }
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        const doc = new (PDFDocument as any)();
        const filename = `Bauhaus_Handover_${project.title.replace(/\s+/g, '_')}.pdf`;
        const uploadsDir = path.join(process.cwd(), 'uploads', 'projects', projectId, 'handover');
        const filePath = path.join(uploadsDir, filename);

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // --- PDF Header ---
        doc.rect(0, 0, doc.page.width, 100).fill('#1A1A1A');
        doc.fillColor('#C5A059').fontSize(30).font('Helvetica-Bold').text('BAUHAUS', 0, 35, { align: 'center', characterSpacing: 5 });
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica').text('SPACES & INTERIORS', 0, 75, { align: 'center', characterSpacing: 2 });

        doc.moveDown(4);

        // --- Document Title ---
        doc.fillColor('#1A1A1A').fontSize(22).font('Helvetica-Bold').text('Project Completion Report', { align: 'center' });
        doc.moveDown();
        doc.strokeColor('#C5A059').lineWidth(1).moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y).stroke();
        doc.moveDown(2);

        // --- Project Details ---
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A1A1A').text('PROJECT DETAILS', { characterSpacing: 1 });
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Bold').text(`Title: `, { continued: true }).font('Helvetica').text(project.title);
        doc.fontSize(14).font('Helvetica-Bold').text(`Client: `, { continued: true }).font('Helvetica').text(project.client.username);
        doc.fontSize(14).font('Helvetica-Bold').text(`Address: `, { continued: true }).font('Helvetica').text(project.client.address || 'N/A');
        doc.fontSize(14).font('Helvetica-Bold').text(`Date: `, { continued: true }).font('Helvetica').text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));
        doc.moveDown(2);

        // --- Timeline ---
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#C5A059').text('EXECUTION TIMELINE', { characterSpacing: 1 });
        doc.moveDown();

        project.timelineSteps.forEach((step: any, index: number) => {
            const stepY = doc.y;
            if (stepY > 650) doc.addPage();

            doc.fontSize(11).font('Helvetica-Bold').fillColor('#1A1A1A').text(`${index + 1}. ${step.title}`, { underline: true });
            doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text(`${step.type} Phase | Approved on ${new Date(step.endDate).toLocaleDateString()}`);

            if (step.description) {
                doc.fontSize(10).font('Helvetica-Oblique').fillColor('#4B5563').text(`Summary: ${step.description}`, { indent: 15 });
            }

            if (step.dailyLogs && step.dailyLogs.length > 0) {
                doc.moveDown(0.5);
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#1A1A1A').text('Daily Progress Logs:', { indent: 15 });
                step.dailyLogs.forEach((log: any) => {
                    doc.fontSize(8).font('Helvetica').fillColor('#4B5563').text(`• ${new Date(log.logDate).toLocaleDateString()}: ${log.description}`, { indent: 25 });
                });
            }
            doc.moveDown(1.5);
        });

        // --- Footer Message ---
        doc.addPage();
        doc.moveDown(5);
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#1A1A1A').text('Thank You for Choosing Bauhaus', { align: 'center' });
        doc.moveDown();
        doc.fontSize(11).font('Helvetica').fillColor('#4B5563').text('It has been our privilege to bring your vision to life. This project journey has been a testament to collaborative creativity and precision engineering.', { align: 'center' });
        doc.moveDown(3);
        doc.strokeColor('#C5A059').lineWidth(0.5).moveTo(200, doc.y).lineTo(doc.page.width - 200, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1A1A1A').text('The Bauhaus Spaces Team', { align: 'center' });

        doc.end();

        stream.on('finish', async () => {
            // Correct relative URL for serving static content
            const finalDocumentUrl = `uploads/projects/${projectId}/handover/${filename}`;
            await (prisma as any).project.update({
                where: { id: projectId },
                data: { finalDocumentUrl }
            });

            // Save to documents folder as well - entry creation
            await (prisma as any).projectEntry.create({
                data: {
                    projectId,
                    description: `Final Project Handover Summary - Generated on ${new Date().toLocaleDateString()}`,
                    fileUrl: finalDocumentUrl.replace(/\\/g, '/'),
                    fileType: 'PDF',
                    category: 'HANDOVER'
                }
            });

            res.json({ message: 'Document generated successfully', url: finalDocumentUrl });
        });

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Delete timeline step
export const deleteTimelineStep = async (req: AuthRequest, res: Response) => {
    const stepId = req.params.id as string;
    try {
        await prisma.timelineStep.delete({ where: { id: stepId } });
        res.json({ message: 'Step deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const bulkUpdateTimeline = async (req: AuthRequest, res: Response) => {
    const projectId = req.params.projectId || req.body.projectId;
    const { updates, globalReason, notifyAction } = req.body;

    if (!Array.isArray(updates)) {
        return res.status(400).json({ message: 'Updates must be an array' });
    }

    try {
        const oldSteps = await (prisma as any).timelineStep.findMany({
            where: { projectId: projectId }
        });

        const results = [];
        let emailContent = '<ul>';
        let hasChanges = false;
        let changedTitles: string[] = [];

        for (const update of updates) {
            const oldStep = oldSteps.find((s: any) => s.id === update.id);
            const data: any = {};
            if (update.startDate) data.startDate = new Date(update.startDate);
            if (update.endDate) data.endDate = new Date(update.endDate);
            if (update.title) data.title = update.title;
            if (update.status) data.status = update.status;
            if (update.order !== undefined) data.order = update.order;
            if (update.description !== undefined) data.description = update.description;

            if (update.delayReason) {
                data.delayReason = update.delayReason;
                // Only increment delayCount if it's a direct delay (not a cascading shift)
                const isShift = update.delayReason.toLowerCase().includes('shifted due to');
                if (!isShift && oldStep && update.endDate && new Date(update.endDate).getTime() !== new Date(oldStep.endDate).getTime()) {
                    data.delayCount = (oldStep.delayCount || 0) + 1;
                    
                    // Create delay record
                    data.delays = {
                        create: {
                            delayNumber: data.delayCount,
                            reason: update.delayReason
                        }
                    };
                }
            }

            const updatedStep = await (prisma as any).timelineStep.update({
                where: { id: update.id },
                data
            });
            results.push(updatedStep);

            if (notifyAction === 'INITIALIZE') {
                emailContent += `<li style="margin-bottom: 10px;"><strong>${updatedStep.title}</strong>: ${new Date(updatedStep.startDate).toDateString()} to ${new Date(updatedStep.endDate).toDateString()}</li>`;
            } else if (oldStep) {
                const oldStart = new Date(oldStep.startDate).toDateString();
                const oldEnd = new Date(oldStep.endDate).toDateString();
                const newStart = new Date(updatedStep.startDate).toDateString();
                const newEnd = new Date(updatedStep.endDate).toDateString();

                if (oldStart !== newStart || oldEnd !== newEnd || oldStep.title !== updatedStep.title) {
                    hasChanges = true;
                    changedTitles.push(updatedStep.title);
                    const dCount = (updatedStep as any).delayCount || 0;
                    const delayNote = dCount > 1
                        ? `<br/><span style="color: #EF4444; font-size: 11px; font-weight: bold;">[DELAYED ${dCount} TIMES]</span>`
                        : '';

                    emailContent += `<li style="margin-bottom: 15px;"><strong>${updatedStep.title}</strong>${delayNote}<br/>
                        <span style="color: #6B7280; text-decoration: line-through; font-size: 13px;">Previous: ${oldStart} to ${oldEnd}</span><br/>
                        <span style="color: #C5A059; font-weight: bold;">Updated: ${newStart} to ${newEnd}</span>
                    </li>`;
                }
            }
        }

        if (notifyAction !== 'INITIALIZE' && !hasChanges) {
            emailContent = ''; // If nothing actually changed, don't generate the list
        } else {
            emailContent += '</ul>';
        }

        if (hasChanges || globalReason || notifyAction === 'INITIALIZE') {
            const project = await (prisma as any).project.findUnique({
                where: { id: projectId },
                include: { client: true }
            });

            if (project?.client?.email) {
                if (notifyAction === 'INITIALIZE') {
                    console.log(`[NOTIFY] Sending Initialization mail to ${project.client.email}`);
                    console.log(`[NOTIFY] Credentials - User: ${project.client.username}, PIN: ${project.client.welcomePin ? 'EXISTS' : 'NULL'}`);

                    await sendProjectInitializedNotification(
                        project.client.email,
                        project.title,
                        project.client.username,
                        project.client.welcomePin || undefined,
                        emailContent
                    );
                    // Update project status to IN_PROGRESS and clear plain PIN
                    await (prisma as any).project.update({
                        where: { id: projectId },
                        data: { status: 'IN_PROGRESS', isFinalized: true }
                    });
                    await (prisma as any).client.update({
                        where: { id: project.clientId },
                        data: { welcomeSent: true }
                    });
                } else if (hasChanges && emailContent) {
                    await sendBulkScheduleUpdateNotification(
                        project.client.email,
                        project.title,
                        emailContent,
                        globalReason
                    );
                }
            }
        }

        res.json({ message: 'Timeline updated successfully', results });
    } catch (error: any) {
        console.error('Bulk Update Error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Admin: Mark project setup as complete (Sends "Project Ready" email)
export const initializeProject = async (req: AuthRequest, res: Response) => {
    const projectId = req.params.projectId;

    try {
        const project = await (prisma as any).project.findUnique({
            where: { id: projectId },
            include: { client: true }
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Get all milestones for this project to include in email
        const steps = await prisma.timelineStep.findMany({
            where: { projectId: projectId as string },
            orderBy: [{ type: 'asc' }, { order: 'asc' }]
        });

        // Send email notification if client has an email
        if (project.client?.email) {
            let milestonesList = '<ul>';
            steps.forEach(step => {
                milestonesList += `<li style="margin-bottom: 8px;"><strong>${step.title}</strong> - Expected ${new Date(step.endDate).toLocaleDateString()}</li>`;
            });
            milestonesList += '</ul>';

            console.log(`[INITIALIZE] Sending mail to ${project.client.email}`);
            console.log(`[INITIALIZE] PIN found in DB: ${project.client.welcomePin || 'NONE'}`);

            await sendProjectInitializedNotification(
                project.client.email,
                project.title,
                project.client.username,
                project.client.welcomePin || undefined,
                milestonesList
            );

            // Clear plain PIN after sending welcome email
            await (prisma as any).client.update({
                where: { id: project.clientId },
                data: { welcomeSent: true }
            });
        }

        // Always mark project as finalized, regardless of email status
        await (prisma as any).project.update({
            where: { id: projectId },
            data: { status: 'IN_PROGRESS', isFinalized: true }
        });

        res.json({ message: 'Project initialized and marked as finalized successfully' });
    } catch (error: any) {
        console.error('Initialize Project Error:', error);
        res.status(500).json({ message: error?.message || 'Internal server error', detail: error?.toString() });
    }
};

// Admin: Clear all timeline steps for a project
export const clearProjectTimeline = async (req: AuthRequest, res: Response) => {
    const projectId = req.params.projectId as string;
    try {
        // Schema has onDelete: Cascade on DailyWorkLog and TimelineCompletionFile,
        // so deleting timeline steps will automatically cascade to related records.
        await (prisma as any).timelineStep.deleteMany({ where: { projectId } });
        res.json({ message: 'All milestones deleted' });
    } catch (error: any) {
        console.error('Clear Timeline Error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
