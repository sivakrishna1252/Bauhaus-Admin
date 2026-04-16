import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/VivekNookala/Desktop/Bauhaus_admin/Admin/interior-design-backend/.env' });

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.RECEIVER_EMAIL || process.env.SMTP_USER,
    subject: 'SMTP Test',
    text: 'If you see this, SMTP is working!',
};

async function main() {
    try {
        console.log('Using SMTP_USER:', process.env.SMTP_USER);
        console.log('Sending to:', mailOptions.to);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
    } catch (error) {
        console.error('Email sending failed:', error);
    }
}

main();
