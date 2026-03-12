import fs from 'fs';
import path from 'path';

/**
 * Moves a file from its current location to a structured project folder.
 * Resulting structure: uploads/projects/[projectId]/[subFolder]/[filename]
 */
export const organizeFileToProject = (projectId: string, currentPath: string, subFolder: string = '') => {
    if (!currentPath) return currentPath;

    const fileName = path.basename(currentPath);
    // Construct the target directory relative to the app root
    const relativeTargetDir = path.join('uploads', 'projects', projectId, subFolder);
    const absoluteTargetDir = path.join(process.cwd(), relativeTargetDir);

    // Ensure the structure exists
    if (!fs.existsSync(absoluteTargetDir)) {
        fs.mkdirSync(absoluteTargetDir, { recursive: true });
    }

    const relativeTargetPath = path.join(relativeTargetDir, fileName).replace(/\\/g, '/');
    const absoluteTargetPath = path.join(process.cwd(), relativeTargetPath);
    const absoluteSourcePath = path.isAbsolute(currentPath) ? currentPath : path.join(process.cwd(), currentPath);

    try {
        if (fs.existsSync(absoluteSourcePath)) {
            fs.renameSync(absoluteSourcePath, absoluteTargetPath);
            return relativeTargetPath;
        }
    } catch (error) {
        console.error(`Error organizing file to project ${projectId}:`, error);
    }

    return currentPath.replace(/\\/g, '/');
};

/**
 * Helper to determine file type category from mimetype
 */
export const getFileTypeFromMimetype = (mimetype: string): 'IMAGE' | 'VIDEO' | 'PDF' => {
    if (mimetype.startsWith('video/')) return 'VIDEO';
    if (mimetype === 'application/pdf') return 'PDF';
    return 'IMAGE';
};
