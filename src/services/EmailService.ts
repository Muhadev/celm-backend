import nodemailer from 'nodemailer';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/AppError';
import { EmailTemplates } from '@/templates/emailTemplates';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service configured successfully');
    } catch (error) {
      logger.error('Email service configuration error:', error);
    }
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `${config.email.from.name} <${config.email.from.email}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`);
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      throw new AppError('Failed to send email', 500);
    }
  }

  async sendVerificationEmail(email: string, token: string, firstName?: string): Promise<void> {
    const verificationUrl = `${config.cors.allowedOrigins[0]}/verify-email?token=${token}`;
    const template = EmailTemplates.verification(verificationUrl, firstName);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, firstName?: string): Promise<void> {
    const resetUrl = `${config.cors.allowedOrigins[0]}/reset-password?token=${token}`;
    const template = EmailTemplates.passwordReset(resetUrl, firstName);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const template = EmailTemplates.welcome(firstName);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendBusinessApprovalEmail(email: string, businessName: string, firstName?: string): Promise<void> {
    const template = EmailTemplates.businessApproval(businessName, firstName);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

// Export both ways to ensure compatibility
export { EmailService };
export default EmailService;