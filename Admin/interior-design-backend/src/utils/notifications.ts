import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Standard SMTP transporter configuration
// Note: Actual credentials should be in .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },

});


export const sendDelayNotification = async (clientEmail: string, projectTitle: string, stepTitle: string, newDate: string, reason: string) => {
    if (!clientEmail) return;

    const fromAddress = process.env.SMTP_USER;
    const mailOptions = {
        from: fromAddress,
        to: clientEmail,
        subject: `[${projectTitle}] Schedule Update: ${stepTitle}`,
        text: `The deadline for "${stepTitle}" in project "${projectTitle}" has been updated to ${newDate}.\n\nReason: ${reason}\n\nThank you for your patience.`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1A1A1A; border-radius: 10px; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
                <div style="text-align: center; border-bottom: 2px solid #C5A059; padding-bottom: 20px; margin-bottom: 20px;">
                    <h2 style="color: #C5A059; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Timeline Update</h2>
                </div>
                <p style="font-size: 16px;">Hello,</p>
                <p style="font-size: 15px; line-height: 1.6;">We wanted to inform you that the schedule for <strong>${stepTitle}</strong> in project <strong>${projectTitle}</strong> has been adjusted to ensure our quality standards are met.</p>
                <div style="background-color: #FDFBF7; border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; margin-bottom: 10px;"><strong>Project:</strong> <span style="font-weight: bold;">${projectTitle}</span></p>
                    <p style="margin: 0; margin-bottom: 10px;"><strong>New Completion Date:</strong> <span style="color: #C5A059; font-weight: bold;">${newDate}</span></p>
                    <p style="margin: 0; margin-bottom: 5px;"><strong>Reason:</strong> ${reason.includes('(Note:') ? reason.split('(Note:')[0] : reason}</p>
                    ${reason.includes('(Note:') ? `
                    <p style="margin: 10px 0 0 0; padding-top: 10px; border-top: 1px dashed #E5E7EB; color: #EF4444; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                        ⚠️ Delay Frequency: ${reason.split('(Note:')[1].replace(')', '').trim()}
                    </p>` : ''}
                </div>
                <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">Thank you for your continued trust in Bauhaus Spaces.<br/>Best Regards,<br/><strong>The Design Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Delay email sent to ${clientEmail}`);
    } catch (error) {
        console.error('Email sending failed:', error);
    }
};

export const sendReviewRequestNotification = async (clientEmail: string, projectTitle: string, stepTitle: string, rejectCount?: number) => {
    if (!clientEmail) return;

    const fromAddress = process.env.SMTP_USER;
    const isRevision = rejectCount && rejectCount > 0;
    const subject = isRevision ? `[${projectTitle}] [Revision #${rejectCount}] Work Ready for Review: ${stepTitle}` : `[${projectTitle}] New Work Ready for Review: ${stepTitle}`;

    const mailOptions = {
        from: fromAddress,
        to: clientEmail,
        subject: subject,
        text: `We have ${isRevision ? 'updated' : 'completed'} the work for "${stepTitle}" in project "${projectTitle}". Please log in to your dashboard to review and provide feedback.`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1A1A1A; border-radius: 10px; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
                <div style="text-align: center; border-bottom: 2px solid #C5A059; padding-bottom: 20px; margin-bottom: 20px;">
                    <h2 style="color: #C5A059; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Review Requested</h2>
                </div>
                <p style="font-size: 16px;">Hello,</p>
                <p style="font-size: 15px; line-height: 1.6;">${isRevision ? `We have finalized the revisions for <strong>${stepTitle}</strong> in project <strong>${projectTitle}</strong> (Round ${rejectCount + 1}).` : `Exciting news! The work for <strong>${stepTitle}</strong> in project <strong>${projectTitle}</strong> is now ready for your professional review and feedback.`}</p>
                <p style="font-size: 15px; line-height: 1.6; color: #6B7280;">Please log in to your portal to inspect the latest updates and provide your approval or requests for revision.</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${process.env.CLIENT_PORTAL_URL || 'http://localhost:5003'}" style="background-color: #C5A059; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(197, 160, 89, 0.4);">Open Portal</a>
                </div>
                <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">Best Regards,<br/><strong>The Design Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Review request email sent to ${clientEmail}`);
    } catch (error) {
        console.error('Email sending failed:', error);
    }
};

export const sendPasswordResetNotification = async (email: string, resetLink: string) => {
    if (!email) return;

    const fromAddress = process.env.SMTP_USER;
    const mailOptions = {
        from: fromAddress,
        to: email,
        subject: `Password Reset Request - Bauhaus Spaces`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1A1A1A; border-radius: 10px; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
                <div style="text-align: center; border-bottom: 2px solid #C5A059; padding-bottom: 20px; margin-bottom: 20px;">
                    <h2 style="color: #C5A059; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Password Reset</h2>
                </div>
                <p style="font-size: 16px;">Hello,</p>
                <p style="font-size: 15px; line-height: 1.6;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetLink}" style="background-color: #1A1A1A; color: #C5A059; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; font-size: 12px; border: 1px solid #C5A059; letter-spacing: 1px;">Reset Password</a>
                </div>
                <p style="font-size: 12px; color: #9CA3AF; margin-top: 30px;">This link will expire in 1 hour.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Reset Email failed:', error);
    }
}

export const sendOTPNotification = async (email: string, otp: string) => {
    if (!email) return;

    const fromAddress = process.env.SMTP_USER;
    const mailOptions = {
        from: fromAddress,
        to: email,
        subject: `Login Verification Code: ${otp} - Bauhaus Spaces`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1A1A1A; border-radius: 10px; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
                <div style="text-align: center; border-bottom: 2px solid #C5A059; padding-bottom: 20px; margin-bottom: 20px;">
                    <h1 style="color: #1A1A1A; margin: 0; text-transform: uppercase; letter-spacing: 4px; font-weight: 300;">BAUHAUS</h1>
                    <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 10px; letter-spacing: 3px; text-transform: uppercase;">Spaces &amp; Interiors</p>
                </div>
                <div style="padding: 20px 0;">
                    <p style="font-size: 16px; margin-bottom: 25px;">Hello,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #4B5563;">Use the verification code below to complete your login to the admin panel. This code will expire in 10 minutes.</p>
                    
                    <div style="background-color: #FDFBF7; border: 2px solid #C5A059; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                        <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #1A1A1A;">${otp}</span>
                    </div>

                    <p style="font-size: 13px; color: #9CA3AF; margin-top: 30px;">If you did not request this code, please secure your account immediately or contact support.</p>
                </div>
                <p style="font-size: 14px; color: #6B7280; margin-top: 30px; border-top: 1px solid #F3F4F6; padding-top: 20px;">
                    Warm Regards,<br/>
                    <strong style="color: #1A1A1A;">Bauhaus Admin System</strong>
                </p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
    } catch (error) {
        console.error('OTP Email failed:', error);
    }
}

export const sendAdminFeedbackNotification = async (projectTitle: string, stepTitle: string, status: string, feedback: string, rejectCount?: number) => {
    const adminEmail = process.env.SMTP_USER;
    const isRejection = status === 'REJECTED';
    const isMultipleRejection = isRejection && rejectCount && rejectCount > 1;

    let subject = `[${projectTitle}] Client Feedback: ${stepTitle} [${status}]`;
    if (isMultipleRejection) {
        subject = `⚠️ [${projectTitle}] REJECTED AGAIN (${rejectCount}x): ${stepTitle}`;
    } else if (isRejection) {
        subject = `❌ [${projectTitle}] STAGE REJECTED: ${stepTitle}`;
    } else {
        subject = `✅ [${projectTitle}] STAGE APPROVED: ${stepTitle}`;
    }

    const mailOptions = {
        from: adminEmail,
        to: process.env.RECEIVER_EMAIL || adminEmail,
        subject: subject,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1A1A1A; border-radius: 10px; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
                <div style="text-align: center; border-bottom: 2px solid ${isRejection ? '#EF4444' : '#C5A059'}; padding-bottom: 20px; margin-bottom: 20px;">
                    <h2 style="color: ${isRejection ? '#EF4444' : '#C5A059'}; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
                        ${isRejection ? 'Revision Required' : 'Stage Approved'}
                    </h2>
                </div>
                <p style="font-size: 16px;">Hello Team,</p>
                <p style="font-size: 15px; line-height: 1.6;">
                    ${isMultipleRejection
                ? `Unfortunately, the client has <strong>rejected</strong> the milestone <strong>${stepTitle}</strong> for project <strong>${projectTitle}</strong> again. This is the <strong>${rejectCount}${getOrdinalSuffix(rejectCount)}</strong> time this stage has been rejected.`
                : isRejection
                    ? `The client has requested revisions for the milestone: <strong>${stepTitle}</strong> in project <strong>${projectTitle}</strong>.`
                    : `Great news! The client has <strong>approved</strong> the milestone: <strong>${stepTitle}</strong> for project <strong>${projectTitle}</strong>.`
            }
                </p>
                <div style="background-color: ${isRejection ? '#FFF5F5' : '#FDFBF7'}; border: 1px solid ${isRejection ? '#FEB2B2' : '#E5E7EB'}; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; margin-bottom: 10px;"><strong>Project:</strong> <span style="font-weight: bold;">${projectTitle}</span></p>
                    <p style="margin: 0; margin-bottom: 10px;"><strong>Status:</strong> <span style="color: ${status === 'APPROVED' ? '#10B981' : '#EF4444'}; font-weight: bold;">${status}</span></p>
                    ${isRejection && rejectCount ? `<p style="margin: 0; margin-bottom: 10px;"><strong>Rejection Count:</strong> <span style="color: #EF4444; font-weight: bold;">${rejectCount}</span></p>` : ''}
                    <p style="margin: 0;"><strong>Client Feedback:</strong> <br/><i style="color: #4A5568;">"${feedback || 'No comments provided.'}"</i></p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.ADMIN_PORTAL_URL || 'https://www.pm.bauhauspaces.com'}" style="background-color: #1A1A1A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">View Project Dashboard</a>
                </div>
                <p style="font-size: 14px; color: #6B7280; margin-top: 30px; border-top: 1px solid #EEE; padding-top: 20px;">Best Regards,<br/><strong>Bauhaus System</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Admin feedback email sent to ${adminEmail}`);
    } catch (error) {
        console.error('Admin Email failed:', error);
    }
}

// Helper for ordinals (1st, 2nd, 3rd, etc)
function getOrdinalSuffix(i: number) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) return "st";
    if (j == 2 && k != 12) return "nd";
    if (j == 3 && k != 13) return "rd";
    return "th";
}

export const sendBulkScheduleUpdateNotification = async (clientEmail: string, projectTitle: string, updates: string, globalReason: string) => {
    if (!clientEmail) return;

    const fromAddress = process.env.SMTP_USER;
    const mailOptions = {
        from: fromAddress,
        to: clientEmail,
        subject: `Revised Project Timeline: ${projectTitle}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1A1A1A; border-radius: 10px; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
                <div style="text-align: center; border-bottom: 2px solid #C5A059; padding-bottom: 20px; margin-bottom: 20px;">
                    <h2 style="color: #C5A059; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Schedule Revised</h2>
                </div>
                <p style="font-size: 16px;">Hello,</p>
                <p style="font-size: 15px; line-height: 1.6;">We have updated the project schedule for <strong>${projectTitle}</strong> to better reflect the current progress and ensure the highest quality of work.</p>
                ${globalReason ? `
                <div style="background-color: #FDFBF7; border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; margin-bottom: 5px;"><strong>Reason for Revisions:</strong></p>
                    <p style="margin: 0; color: #C5A059; font-weight: bold; white-space: pre-wrap; line-height: 1.5;">${globalReason}</p>
                </div>
                ` : ''}

                <h4 style="margin-top: 25px; border-bottom: 1px solid #EEE; padding-bottom: 10px;">Updated Milestones:</h4>
                <div style="font-size: 14px; line-height: 1.8;">
                    ${updates}
                </div>

                <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">Thank you for your understanding. Please check your portal for the full detailed timeline.<br/>Best Regards,<br/><strong>The Design Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Bulk update email sent to ${clientEmail}`);
    } catch (error) {
        console.error('Bulk Email sending failed:', error);
    }
};

export const sendProjectInitializedNotification = async (clientEmail: string, projectTitle: string, username?: string, pin?: string, milestonesHtml?: string) => {
    if (!clientEmail) return;

    const fromAddress = process.env.SMTP_USER;
    const credentialSection = username ? `
        <div style="background-color: #FDFBF7; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin: 0 0 15px 0; color: #1A1A1A; text-transform: uppercase; font-size: 13px; letter-spacing: 1px;">Your Login Credentials:</h4>
            <div style="margin-top: 15px;">
                <p style="margin: 5px 0; font-size: 14px; color: #1A1A1A;"><strong>Username:</strong> <span style="color: #C5A059;">${username}</span></p>
                <p style="margin: 5px 0; font-size: 14px; color: #1A1A1A;"><strong>Access PIN:</strong> <span style="color: #C5A059;">${pin || 'Already Shared'}</span></p>
            </div>
        </div>
    ` : '';

    const milestoneSection = milestonesHtml ? `
        <div style="margin: 25px 0; padding: 20px; background-color: #F8F9FA; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; font-size: 14px; color: #1A1A1A; text-transform: uppercase;">Planned Milestones:</h4>
            <div style="font-size: 13px; color: #4B5563;">
                ${milestonesHtml}
            </div>
        </div>
    ` : '';

    const mailOptions = {
        from: fromAddress,
        to: clientEmail,
        subject: `WELCOME TO BAUHAUS: Your Project is Ready`,
        html: `
            <div style="font-family: 'Outfit', sans-serif, Arial; padding: 40px 20px; background-color: #F3F4F6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
                    <div style="background-color: #1A1A1A; padding: 30px; text-align: center;">
                        <h1 style="color: #C5A059; margin: 0; text-transform: uppercase; letter-spacing: 4px; font-weight: 300; font-size: 28px;">BAUHAUS</h1>
                        <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 10px; letter-spacing: 3px; text-transform: uppercase;">Spaces & Interiors</p>
                    </div>
                    
                    <div style="padding: 40px;">
                        <h2 style="color: #1A1A1A; font-size: 20px; margin-top: 0; font-weight: 600;">Welcome to your design journey.</h2>
                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">Hello,</p>
                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">Great news! Your project <strong>${projectTitle}</strong> setup is now complete. We have finalized the roadmap and are ready to bring your vision to life.</p>
                        
                        ${credentialSection}
                        
                        ${milestoneSection}

                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">You can log in to your personal portal to track progress, review design concepts, and provide real-time feedback as we move through each stage.</p>

                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${process.env.CLIENT_PORTAL_URL || 'https://www.pm.bauhauspaces.com'}" style="background-color: #C5A059; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; text-transform: uppercase; font-size: 13px; letter-spacing: 1.5px; display: inline-block; transition: background 0.3s; box-shadow: 0 4px 14px rgba(197, 160, 89, 0.4);">Access Project Portal</a>
                        </div>

                        <p style="font-size: 14px; color: #9CA3AF; margin-top: 40px; border-top: 1px solid #F3F4F6; padding-top: 20px;">
                            Warm Regards,<br/>
                            <strong style="color: #1A1A1A;">The Bauhaus Design Team</strong>
                        </p>
                    </div>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Project Initialized email sent to ${clientEmail}`);
    } catch (error) {
        console.error('Project Initialized email failed:', error);
    }
};

export const sendNewMilestoneNotification = async (clientEmail: string, projectTitle: string, milestoneTitle: string) => {
    if (!clientEmail) return;

    const fromAddress = process.env.SMTP_USER;
    const mailOptions = {
        from: fromAddress,
        to: clientEmail,
        subject: `[${projectTitle}] New Milestone Added: ${milestoneTitle}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1A1A1A; border-radius: 10px; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
                <div style="text-align: center; border-bottom: 2px solid #C5A059; padding-bottom: 20px; margin-bottom: 20px;">
                    <h2 style="color: #C5A059; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Milestone Added</h2>
                </div>
                <p style="font-size: 16px;">Hello,</p>
                <p style="font-size: 15px; line-height: 1.6;">We have added a new milestone to your project <strong>${projectTitle}</strong>: <strong>${milestoneTitle}</strong>.</p>
                <p style="font-size: 15px; line-height: 1.6; color: #6B7280;">Log in to your portal to see the updated timeline and details.</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${process.env.CLIENT_PORTAL_URL || 'http://localhost:5003'}" style="background-color: #C5A059; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(197, 160, 89, 0.4);">Open Portal</a>
                </div>
                <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">Best Regards,<br/><strong>The Design Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`New milestone email sent to ${clientEmail}`);
    } catch (error) {
        console.error('Email sending failed:', error);
    }
};
export const sendClientWelcomeCredentials = async (clientEmail: string, username: string, pin: string) => {
    if (!clientEmail) return;

    const fromAddress = process.env.SMTP_USER;
    const mailOptions = {
        from: fromAddress,
        to: clientEmail,
        subject: `Welcome to Bauhaus Spaces – Your Account Credentials`,
        html: `
            <div style="font-family: 'Outfit', sans-serif, Arial; padding: 40px 20px; background-color: #F3F4F6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
                    <div style="background-color: #1A1A1A; padding: 30px; text-align: center;">
                        <h1 style="color: #C5A059; margin: 0; text-transform: uppercase; letter-spacing: 4px; font-weight: 300; font-size: 28px;">BAUHAUS</h1>
                        <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 10px; letter-spacing: 3px; text-transform: uppercase;">Spaces &amp; Interiors</p>
                    </div>

                    <div style="padding: 40px;">
                        <h2 style="color: #1A1A1A; font-size: 20px; margin-top: 0; font-weight: 600;">Your account has been created.</h2>
                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">Hello <strong>${username}</strong>,</p>
                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">We are excited to let you know that your Bauhaus Spaces client account has been set up. Below are your login credentials to access your personal project portal.</p>

                        <div style="background-color: #FDFBF7; border: 2px solid #C5A059; border-radius: 12px; padding: 24px; margin: 28px 0;">
                            <h4 style="margin: 0 0 16px 0; color: #1A1A1A; text-transform: uppercase; font-size: 12px; letter-spacing: 1.5px;">Your Login Credentials</h4>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px 0; font-size: 14px; color: #6B7280; width: 120px;">Username</td>
                                    <td style="padding: 10px 0; font-size: 16px; font-weight: bold; color: #1A1A1A; font-family: monospace; letter-spacing: 1px;">${username}</td>
                                </tr>
                                <tr style="border-top: 1px solid #F3E7D3;">
                                    <td style="padding: 10px 0; font-size: 14px; color: #6B7280;">Access PIN</td>
                                    <td style="padding: 10px 0; font-size: 22px; font-weight: bold; color: #C5A059; font-family: monospace; letter-spacing: 6px;">${pin}</td>
                                </tr>
                            </table>
                        </div>

                        <p style="color: #4B5563; font-size: 14px; line-height: 1.6; background-color: #FFF5F5; border: 1px solid #FED7D7; border-radius: 8px; padding: 12px 16px;">
                            🔒 <strong>Please keep these credentials safe.</strong> Do not share your PIN with anyone. If you think your account has been compromised, please contact us immediately.
                        </p>

                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin-top: 20px;">Use these credentials to log in to your personal portal to track progress, review designs, and provide feedback.</p>

                        <div style="text-align: center; margin: 36px 0;">
                            <a href="${process.env.CLIENT_PORTAL_URL || 'http://localhost:5003'}" style="background-color: #C5A059; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; text-transform: uppercase; font-size: 13px; letter-spacing: 1.5px; display: inline-block; box-shadow: 0 4px 14px rgba(197, 160, 89, 0.4);">Access Your Portal</a>
                        </div>

                        <p style="font-size: 14px; color: #9CA3AF; margin-top: 40px; border-top: 1px solid #F3F4F6; padding-top: 20px;">
                            Warm Regards,<br/>
                            <strong style="color: #1A1A1A;">The Bauhaus Design Team</strong>
                        </p>
                    </div>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome credentials email sent to ${clientEmail}`);
    } catch (error) {
        console.error('Welcome credentials email failed:', error);
    }
};

export const sendClientPinUpdated = async (clientEmail: string, username: string, newPin: string) => {
    if (!clientEmail) return;

    const fromAddress = process.env.SMTP_USER;
    const mailOptions = {
        from: fromAddress,
        to: clientEmail,
        subject: `Your Bauhaus Spaces PIN Has Been Updated`,
        html: `
            <div style="font-family: 'Outfit', sans-serif, Arial; padding: 40px 20px; background-color: #F3F4F6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
                    <div style="background-color: #1A1A1A; padding: 30px; text-align: center;">
                        <h1 style="color: #C5A059; margin: 0; text-transform: uppercase; letter-spacing: 4px; font-weight: 300; font-size: 28px;">BAUHAUS</h1>
                        <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 10px; letter-spacing: 3px; text-transform: uppercase;">Spaces &amp; Interiors</p>
                    </div>

                    <div style="padding: 40px;">
                        <h2 style="color: #1A1A1A; font-size: 20px; margin-top: 0; font-weight: 600;">Your PIN has been changed.</h2>
                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">Hello <strong>${username}</strong>,</p>
                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">Your Bauhaus Spaces account access PIN has been updated by our team. Please use the new PIN shown below the next time you log in.</p>

                        <div style="background-color: #FDFBF7; border: 2px solid #C5A059; border-radius: 12px; padding: 24px; margin: 28px 0;">
                            <h4 style="margin: 0 0 16px 0; color: #1A1A1A; text-transform: uppercase; font-size: 12px; letter-spacing: 1.5px;">Your Updated Credentials</h4>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px 0; font-size: 14px; color: #6B7280; width: 120px;">Username</td>
                                    <td style="padding: 10px 0; font-size: 16px; font-weight: bold; color: #1A1A1A; font-family: monospace; letter-spacing: 1px;">${username}</td>
                                </tr>
                                <tr style="border-top: 1px solid #F3E7D3;">
                                    <td style="padding: 10px 0; font-size: 14px; color: #6B7280;">New PIN</td>
                                    <td style="padding: 10px 0; font-size: 22px; font-weight: bold; color: #C5A059; font-family: monospace; letter-spacing: 6px;">${newPin}</td>
                                </tr>
                            </table>
                        </div>

                        <p style="color: #4B5563; font-size: 14px; line-height: 1.6; background-color: #FFF5F5; border: 1px solid #FED7D7; border-radius: 8px; padding: 12px 16px;">
                            🔒 <strong>If you did not request this change</strong>, please contact your project manager immediately. Your security is our priority.
                        </p>

                        <div style="text-align: center; margin: 36px 0;">
                            <a href="${process.env.CLIENT_PORTAL_URL || 'http://localhost:5003'}" style="background-color: #C5A059; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; text-transform: uppercase; font-size: 13px; letter-spacing: 1.5px; display: inline-block; box-shadow: 0 4px 14px rgba(197, 160, 89, 0.4);">Log In to Portal</a>
                        </div>

                        <p style="font-size: 14px; color: #9CA3AF; margin-top: 40px; border-top: 1px solid #F3F4F6; padding-top: 20px;">
                            Warm Regards,<br/>
                            <strong style="color: #1A1A1A;">The Bauhaus Design Team</strong>
                        </p>
                    </div>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`PIN updated email sent to ${clientEmail}`);
    } catch (error) {
        console.error('PIN updated email failed:', error);
    }
};

export const sendProjectCompletionSummary = async (clientEmail: string, projectTitle: string, summaryHtml: string, attachments?: any[]) => {
    if (!clientEmail) return;

    const fromAddress = process.env.SMTP_USER;
    const mailOptions = {
        from: fromAddress,
        to: clientEmail,
        subject: `PROJECT COMPLETE: Final Summary for ${projectTitle}`,
        attachments: attachments,
        html: `
            <div style="font-family: 'Outfit', sans-serif, Arial; padding: 40px 20px; background-color: #F3F4F6;">
                <div style="max-width: 650px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
                    <div style="background-color: #1A1A1A; padding: 30px; text-align: center;">
                        <span style="color: #C5A059; border: 1px solid #C5A059; padding: 5px 15px; border-radius: 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; display: inline-block;">Completion Statement</span>
                        <h1 style="color: #FFFFFF; margin: 10px 0 0 0; text-transform: uppercase; letter-spacing: 4px; font-weight: 300; font-size: 24px;">Project Finished</h1>
                    </div>
                    
                    <div style="padding: 40px;">
                        <h2 style="color: #1A1A1A; font-size: 20px; margin-top: 0; font-weight: 600;">Your dream space is ready.</h2>
                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">Hello,</p>
                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">We are thrilled to announce that all stages of <strong>${projectTitle}</strong> have been successfully completed and approved.</p>
                        
                        <div style="margin: 30px 0; padding: 25px; background-color: #FDFBF7; border: 1px solid #F3E7D3; border-radius: 12px;">
                            <h4 style="margin: 0 0 15px 0; color: #C5A059; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; border-bottom: 1px solid #F3E7D3; padding-bottom: 10px;">Project Journey Summary:</h4>
                            <div style="font-size: 14px; color: #4B5563; line-height: 1.8;">
                                ${summaryHtml}
                            </div>
                        </div>

                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">It has been an absolute pleasure working with you to bring this vision to life. Attached to this email is a comprehensive ZIP archive containing all your project documents, approved milestones, and final handover files for your records.</p>
                        <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">You can still access your portal to view any detail or download files individually if needed.</p>

                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${process.env.CLIENT_PORTAL_URL || 'http://localhost:5003'}" style="background-color: #1A1A1A; color: #C5A059; border: 1px solid #C5A059; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; text-transform: uppercase; font-size: 13px; letter-spacing: 1.5px; display: inline-block; transition: background 0.3s;">Archive Project Portal</a>
                        </div>

                        <p style="font-size: 14px; color: #9CA3AF; margin-top: 40px; border-top: 1px solid #F3F4F6; padding-top: 20px; text-align: center;">
                            Thank you for choosing Bauhaus.<br/>
                            <strong style="color: #1A1A1A;">The Bauhaus Design Team</strong>
                        </p>
                    </div>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Completion summary email sent to ${clientEmail}`);
    } catch (error) {
        console.error('Completion summary email failed:', error);
    }
};
