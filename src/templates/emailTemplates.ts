export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplates {
  private static getBaseStyles(): string {
    return `
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #007bff; color: white; padding: 20px; text-align: center; }
      .content { padding: 30px 20px; }
      .button { background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
      .url { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
    `;
  }

  static verification(verificationUrl: string, firstName?: string): EmailTemplate {
    const name = firstName ? `, ${firstName}` : '';
    
    return {
      subject: 'Verify Your Email - Celm Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Celm${name}!</h1>
            </div>
            <div class="content">
              <p>Thank you for signing up for Celm. To get started, please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </p>
              <p>If you didn't create an account with Celm, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>If you're having trouble clicking the "Verify Email" button, copy and paste the URL below into your web browser:</p>
              <p class="url">${verificationUrl}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Celm${name}!
        
        Thank you for signing up. Please verify your email address by clicking the link below:
        ${verificationUrl}
        
        If you didn't create an account with Celm, please ignore this email.
      `
    };
  }

  static passwordReset(resetUrl: string, firstName?: string): EmailTemplate {
    const name = firstName ? `, ${firstName}` : '';
    
    return {
      subject: 'Reset Your Password - Celm Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hello${name},</p>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>If you didn't request a password reset, please ignore this email.</p>
              <p><strong>This link will expire in 10 minutes.</strong></p>
            </div>
            <div class="footer">
              <p>If you're having trouble clicking the button, copy and paste the URL below:</p>
              <p class="url">${resetUrl}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello${name},
        
        We received a request to reset your password. Click the link below:
        ${resetUrl}
        
        If you didn't request this, please ignore this email.
        This link will expire in 10 minutes.
      `
    };
  }

  static welcome(firstName?: string): EmailTemplate {
    const name = firstName ? `, ${firstName}` : '';
    
    return {
      subject: 'Welcome to Celm Platform!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Celm${name}!</h1>
            </div>
            <div class="content">
              <p>Your email has been verified successfully. You can now start using the Celm platform!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Celm${name}! Your email has been verified successfully.`
    };
  }

  static businessApproval(businessName: string, firstName?: string): EmailTemplate {
    const name = firstName ? `, ${firstName}` : '';
    
    return {
      subject: 'Business Approved - Celm Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Business Approved!</h1>
            </div>
            <div class="content">
              <p>Hello${name},</p>
              <p>Congratulations! Your business "${businessName}" has been approved and is now active on the Celm platform.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello${name}, Your business "${businessName}" has been approved!`
    };
  }
}