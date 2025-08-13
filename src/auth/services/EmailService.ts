import nodemailer from 'nodemailer';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/AppError';
import { EmailTemplates } from '../templates/emailTemplates';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
  from?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.user && config.email.pass ? {
        user: config.email.user,
        pass: config.email.pass,
      } : undefined,
    });
  }

  // Send email
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: options.from || `${config.email.fromName} <${config.email.from}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent successfully to ${options.to}`, {
        messageId: result.messageId,
        subject: options.subject
      });
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw new AppError('Failed to send email', 500);
    }
  }

  // Send verification email
  async sendVerificationEmail(email: string, token: string, sessionToken: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}&session=${sessionToken}`;
    const template = EmailTemplates.verificationEmail(verificationUrl);

    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    logger.info(`Verification email sent to: ${email}`);
  }

  // Send welcome email
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    const template = EmailTemplates.welcomeEmail(firstName, dashboardUrl);

    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    logger.info(`Welcome email sent to: ${email}`);
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    const template = EmailTemplates.passwordResetEmail(resetUrl);

    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    logger.info(`Password reset email sent to: ${email}`);
  }

  // Send business verification email (for future use)
  async sendBusinessVerificationEmail(email: string, businessName: string, verificationCode: string): Promise<void> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
          <h1>🏢 Business Verification Required</h1>
        </div>
        <div style="padding: 30px;">
          <h2>Verify Your Business: ${businessName}</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
            ${verificationCode}
          </div>
          <p>Enter this code in your dashboard to complete business verification.</p>
          <p>This code expires in 24 hours.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `🏢 Business Verification Code for ${businessName}`,
      html,
      text: `Business Verification Code: ${verificationCode} (Expires in 24 hours)`
    });

    logger.info(`Business verification email sent to: ${email} for business: ${businessName}`);
  }

  // Send notification email (for future use)
  async sendNotificationEmail(email: string, subject: string, message: string): Promise<void> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
          <h1>📢 ${subject}</h1>
        </div>
        <div style="padding: 30px;">
          <div style="color: #374151; line-height: 1.6;">
            ${message}
          </div>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px; text-align: center; font-size: 14px; color: #6B7280;">
          <p>This is an automated message from Celm Platform.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: message.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });

    logger.info(`Notification email sent to: ${email}`);
  }

  // Verify email service configuration
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }

  // Send bulk emails (for future marketing use)
  async sendBulkEmails(emails: string[], subject: string, html: string, text?: string): Promise<void> {
    const promises = emails.map(email => 
      this.sendEmail({
        to: email,
        subject,
        html,
        text
      })
    );

    try {
      await Promise.all(promises);
      logger.info(`Bulk emails sent successfully to ${emails.length} recipients`);
    } catch (error) {
      logger.error('Bulk email sending failed:', error);
      throw new AppError('Failed to send bulk emails', 500);
    }
  }
}