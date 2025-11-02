import nodemailer from 'nodemailer';
import 'dotenv/config';

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

export const sendVerificationEmail = async (
    customerEmail: string, 
    customerName: string,
    verificationCode: string
): Promise<boolean> => {
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return false;
    }
    
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: {
                name: 'Thinktrek',
                address: process.env.EMAIL_USER as string
            },
            to: customerEmail,
            subject: 'Verify Your Email - Thinktrek',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>📧 Email Verification</h1>
                        <p>Thinktrek</p>
                    </div>
                    
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p><strong>Hello ${customerName}!</strong></p>
                        <p>Thank you for registering with Thinktrek. To complete your registration, please verify your email address.</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                            <p><strong>Your verification code is:</strong></p>
                            <h2 style="color: #3b82f6; font-size: 32px; letter-spacing: 5px; margin: 10px 0;">${verificationCode}</h2>
                        </div>
                        
                        <p>Please enter this code on the verification page to activate your account.</p>
                        <p>If you didn't create an account, please ignore this email.</p>
                        <p>Best regards,<br><strong>The Thinktrek Team</strong></p>
                    </div>
                </div>
            `,
            text: `Hello ${customerName}! Your verification code is: ${verificationCode}. Please enter this code to verify your email address. If you didn't create an account, please ignore this email.`
        };

        await transporter.sendMail(mailOptions);
        return true;

    } catch (error: any) {
        return false;
    }
};

export const sendWelcomeEmail = async (
    customerEmail: string, 
    customerName: string
): Promise<boolean> => {
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return false;
    }
    
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: {
                name: 'Thinktrek',
                address: process.env.EMAIL_USER as string
            },
            to: customerEmail,
            subject: 'Welcome to Thinktrek!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>🎉 Welcome to Thinktrek!</h1>
                        <p>Your journey starts here</p>
                    </div>
                    
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p><strong>Hello ${customerName}!</strong></p>
                        <p>Thank you for joining Thinktrek! We're excited to have you as part of our community.</p>
                        <p>Your email has been verified and you can now log in to your account and start exploring our platform.</p>
                        <p>Best regards,<br><strong>The Thinktrek Team</strong></p>
                    </div>
                </div>
            `,
            text: `Welcome ${customerName}! Thank you for joining Thinktrek! Your email has been verified and you can now log in and start exploring our platform.`
        };

        await transporter.sendMail(mailOptions);
        return true;

    } catch (error: any) {
        return false;
    }
};
