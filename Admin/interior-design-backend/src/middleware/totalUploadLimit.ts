import fs from 'fs';

const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
};

const safeUnlink = (p?: string) => {
    if (!p) return;
    try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {
        // ignore cleanup errors
    }
};

export const enforceTotalUploadLimit = (maxBytes: number) => {
    return (req: any, res: any, next: any) => {
        const files = (req.files || []) as Array<{ size?: number; path?: string }>;
        if (!Array.isArray(files) || files.length === 0) return next();

        const total = files.reduce((acc, f) => acc + (typeof f.size === 'number' ? f.size : 0), 0);
        if (total <= maxBytes) return next();

        // cleanup files already written to disk by multer
        files.forEach(f => safeUnlink(f.path));

        return res.status(413).json({
            message: `Upload limit exceeded. Your total files are ${formatBytes(total)}. Max allowed is ${formatBytes(maxBytes)}. Please compress your images/videos/documents and try again (large uploads can impact server stability).`
        });
    };
};

