export class EmailTemplates {
  static verificationEmail(verificationUrl: string): { subject: string; html: string; text: string } {
    return {
      subject: 'Verify Your Email - Celm Platform',
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - Celm</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background-color: #f4f4f4;
              }
              .email-container { 
                max-width: 600px; 
                margin: 20px auto; 
                background: white; 
                border-radius: 10px; 
                overflow: hidden; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); 
                color: white; 
                padding: 40px 20px; 
                text-align: center; 
              }
              .header h1 { 
                font-size: 28px; 
                margin-bottom: 10px; 
                font-weight: 700; 
              }
              .header p { 
                font-size: 16px; 
                opacity: 0.9; 
              }
              .content { 
                padding: 40px 30px; 
              }
              .content h2 { 
                color: #1F2937; 
                margin-bottom: 20px; 
                font-size: 24px; 
              }
              .content p { 
                margin-bottom: 20px; 
                color: #4B5563; 
                font-size: 16px; 
              }
              .verify-button { 
                display: inline-block;
                background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s;
              }
              .verify-button:hover { 
                transform: translateY(-2px); 
              }
              .link-text { 
                background-color: #F3F4F6; 
                padding: 15px; 
                border-radius: 8px; 
                word-break: break-all; 
                color: #4F46E5; 
                font-size: 14px;
                margin: 20px 0;
              }
              .warning { 
                background-color: #FEF3C7; 
                border-left: 4px solid #F59E0B; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 4px;
              }
              .footer { 
                background-color: #F9FAFB; 
                text-align: center; 
                padding: 30px 20px; 
                color: #6B7280; 
                font-size: 14px; 
                border-top: 1px solid #E5E7EB;
              }
              .social-links { 
                margin: 20px 0; 
              }
              .social-links a { 
                color: #4F46E5; 
                text-decoration: none; 
                margin: 0 10px; 
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>🎉 Welcome to Celm!</h1>
                <p>Your business journey starts here</p>
              </div>
              
              <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Thank you for joining Celm! We're excited to help you grow your business online. To get started, please verify your email address by clicking the button below.</p>
                
                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="verify-button">✅ Verify Email Address</a>
                </div>
                
                <div class="warning">
                  <strong>⏰ Important:</strong> This verification link will expire in 2 hours for security reasons.
                </div>
                
                <p>If the button above doesn't work, copy and paste this link into your browser:</p>
                <div class="link-text">${verificationUrl}</div>
                
                <p>If you didn't create an account with Celm, please ignore this email and no action is required.</p>
                
                <p style="margin-top: 30px;">
                  <strong>What's next?</strong><br>
                  After verification, you'll complete your business profile and start building your online presence.
                </p>
              </div>
              
              <div class="footer">
                <p><strong>Celm Platform</strong> - Empowering Businesses Online</p>
                <div class="social-links">
                  <a href="#">Help Center</a> | 
                  <a href="#">Contact Support</a> | 
                  <a href="#">Privacy Policy</a>
                </div>
                <p>&copy; ${new Date().getFullYear()} Celm Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Welcome to Celm!
        
        Thank you for joining our platform. Please verify your email address by visiting:
        ${verificationUrl}
        
        This link will expire in 2 hours.
        
        If you didn't create an account with Celm, please ignore this email.
        
        Best regards,
        The Celm Team
      `
    };
  }

  static welcomeEmail(firstName: string, dashboardUrl: string): { subject: string; html: string; text: string } {
    return {
      subject: `🎉 Welcome to Celm, ${firstName}! Your business is now online`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Celm!</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background-color: #f4f4f4;
              }
              .email-container { 
                max-width: 600px; 
                margin: 20px auto; 
                background: white; 
                border-radius: 10px; 
                overflow: hidden; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
                color: white; 
                padding: 40px 20px; 
                text-align: center; 
              }
              .content { padding: 40px 30px; }
              .feature-card { 
                background: #F8FAFC; 
                border: 1px solid #E2E8F0; 
                border-radius: 8px; 
                padding: 20px; 
                margin: 20px 0; 
                border-left: 4px solid #10B981;
              }
              .feature-card h3 { 
                color: #1F2937; 
                margin-bottom: 10px; 
                font-size: 18px;
              }
              .dashboard-button { 
                display: inline-block;
                background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s;
              }
              .dashboard-button:hover { 
                transform: translateY(-2px); 
              }
              .footer { 
                background-color: #F9FAFB; 
                text-align: center; 
                padding: 30px 20px; 
                color: #6B7280; 
                font-size: 14px; 
                border-top: 1px solid #E5E7EB;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>🎉 Welcome to Celm, ${firstName}!</h1>
                <p>Your business is now online and ready to grow</p>
              </div>
              
              <div class="content">
                <h2>🚀 Your Business Journey Begins!</h2>
                <p>Congratulations! Your Celm business account has been successfully created. You now have access to powerful tools that will help you grow your business online.</p>
                
                <div class="feature-card">
                  <h3>🏪 Business Dashboard</h3>
                  <p>Manage your business profile, track performance, and update your information all from one central location.</p>
                </div>
                
                <div class="feature-card">
                  <h3>🌐 Online Presence</h3>
                  <p>Your business is now discoverable online. Customers can find and connect with you through our platform.</p>
                </div>
                
                <div class="feature-card">
                  <h3>📊 Analytics & Insights</h3>
                  <p>Get valuable insights about your business performance and customer engagement.</p>
                </div>
                
                <div class="feature-card">
                  <h3>🛠️ Business Tools</h3>
                  <p>Access a suite of tools designed to help you manage and grow your business effectively.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${dashboardUrl}" class="dashboard-button">🎯 Access Your Dashboard</a>
                </div>
                
                <div style="background-color: #EBF8FF; border: 1px solid #BEE3F8; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #2B6CB0; margin-bottom: 10px;">💡 Pro Tip</h3>
                  <p style="color: #2D3748; margin: 0;">Complete your business profile to improve your visibility and attract more customers!</p>
                </div>
                
                <p>If you have any questions or need assistance getting started, our support team is here to help. Don't hesitate to reach out!</p>
                
                <p style="margin-top: 30px;">
                  <strong>Welcome aboard!</strong><br>
                  The Celm Team
                </p>
              </div>
              
              <div class="footer">
                <p><strong>Celm Platform</strong> - Empowering Businesses Online</p>
                <p>&copy; ${new Date().getFullYear()} Celm Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Welcome to Celm, ${firstName}!
        
        Congratulations! Your business account has been successfully created.
        
        You now have access to:
        • Business Dashboard - Manage your profile and performance
        • Online Presence - Be discoverable by customers
        • Analytics & Insights - Track your business growth
        • Business Tools - Everything you need to succeed
        
        Access your dashboard: ${dashboardUrl}
        
        If you need help, our support team is ready to assist you.
        
        Welcome aboard!
        The Celm Team
      `
    };
  }

  static passwordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
    return {
      subject: '🔐 Reset Your Celm Password',
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - Celm</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background-color: #f4f4f4;
              }
              .email-container { 
                max-width: 600px; 
                margin: 20px auto; 
                background: white; 
                border-radius: 10px; 
                overflow: hidden; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); 
                color: white; 
                padding: 40px 20px; 
                text-align: center; 
              }
              .content { padding: 40px 30px; }
              .reset-button { 
                display: inline-block;
                background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s;
              }
              .reset-button:hover { 
                transform: translateY(-2px); 
              }
              .warning-box { 
                background-color: #FEF3C7; 
                border: 1px solid #F59E0B; 
                border-radius: 8px; 
                padding: 20px; 
                margin: 25px 0; 
              }
              .security-info { 
                background-color: #FEE2E2; 
                border-left: 4px solid #EF4444; 
                padding: 20px; 
                margin: 25px 0; 
                border-radius: 4px;
              }
              .link-text { 
                background-color: #F3F4F6; 
                padding: 15px; 
                border-radius: 8px; 
                word-break: break-all; 
                color: #EF4444; 
                font-size: 14px;
                margin: 20px 0;
              }
              .footer { 
                background-color: #F9FAFB; 
                text-align: center; 
                padding: 30px 20px; 
                color: #6B7280; 
                font-size: 14px; 
                border-top: 1px solid #E5E7EB;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>Secure your Celm account</p>
              </div>
              
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset the password for your Celm account. If you made this request, click the button below to create a new password.</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="reset-button">🔑 Reset My Password</a>
                </div>
                
                <div class="warning-box">
                  <strong>⏰ Time Sensitive:</strong> This password reset link will expire in <strong>15 minutes</strong> for your security.
                </div>
                
                <p>If the button above doesn't work, copy and paste this link into your browser:</p>
                <div class="link-text">${resetUrl}</div>
                
                <div class="security-info">
                  <h3 style="color: #DC2626; margin-bottom: 15px;">🛡️ Security Information</h3>
                  <ul style="color: #374151; margin-left: 20px;">
                    <li style="margin-bottom: 8px;">This link can only be used once</li>
                    <li style="margin-bottom: 8px;">The link expires in 15 minutes</li>
                    <li style="margin-bottom: 8px;">If you didn't request this reset, ignore this email</li>
                    <li style="margin-bottom: 8px;">Your current password remains unchanged until you create a new one</li>
                  </ul>
                </div>
                
                <p><strong>Didn't request this reset?</strong><br>
                If you didn't request a password reset, please ignore this email. Your account is secure and no changes have been made.</p>
                
                <p style="margin-top: 30px;">If you continue to have problems or have security concerns, please contact our support team immediately.</p>
              </div>
              
              <div class="footer">
                <p><strong>Celm Platform Security Team</strong></p>
                <p>Contact us: security@celm.com | Support: help@celm.com</p>
                <p>&copy; ${new Date().getFullYear()} Celm Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Password Reset Request - Celm Platform
        
        We received a request to reset your Celm account password.
        
        Reset your password: ${resetUrl}
        
        IMPORTANT SECURITY INFORMATION:
        • This link expires in 15 minutes
        • This link can only be used once
        • If you didn't request this reset, ignore this email
        
        If you have security concerns, contact: security@celm.com
        
        Celm Security Team
      `
    };
  }
}