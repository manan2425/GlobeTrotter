import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends a 6-digit OTP email using Nodemailer.
 * Automatically handles Gmail App Passwords and standard SMTP services.
 */
export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<{ sent: boolean; simulated: boolean }> {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  let pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  
  if (pass) {
    // Strip spaces if Gmail app password format (e.g., "xnga eexg vquh mqxm" -> "xngaeexgvquhmqxm")
    pass = pass.replace(/\s+/g, '');
  }

  const isGmail = user && user.endsWith('@gmail.com');
  const smtpHost = process.env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : undefined);
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpFrom = process.env.SMTP_FROM || (user ? `"GlobeTrotter Security" <${user}>` : '"GlobeTrotter Security" <noreply@globetrotter.com>');

  // Check if real SMTP credentials are configured
  if (smtpHost && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: user,
          pass: pass
        }
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
            .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 12px; }
            .otp-box { background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 12px; padding: 16px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0369a1; margin: 24px 0; }
            .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div style="font-size: 36px;">✈️</div>
              <div class="title">GlobeTrotter Security</div>
              <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Password Reset Request</p>
            </div>
            <p style="font-size: 14px; color: #334155; line-height: 1.5;">
              Hello,<br><br>
              We received a request to reset your password for your <strong>GlobeTrotter</strong> account (<code>${toEmail}</code>).
            </p>
            <div class="otp-box">${otpCode}</div>
            <p style="font-size: 13px; color: #475569; text-align: center;">
              This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>
            <div class="footer">
              If you did not request a password reset, please ignore this email.
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject: `🔒 ${otpCode} is your GlobeTrotter verification code`,
        html: htmlContent
      });

      console.log(`✉️ Real OTP Email delivered successfully to ${toEmail} via ${smtpHost}`);
      return { sent: true, simulated: false };
    } catch (err) {
      console.error('❌ Error delivering SMTP email:', err);
    }
  }

  // Fallback for local development when SMTP is not configured
  console.log(`\n==============================================`);
  console.log(`🔑 [DEV MODE] OTP Verification Code for ${toEmail}: [ ${otpCode} ]`);
  console.log(`==============================================\n`);
  return { sent: true, simulated: true };
}
