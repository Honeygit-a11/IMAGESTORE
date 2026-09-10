import nodemailer from "nodemailer";
import { env } from "@/lib/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || "localhost",
  port: parseInt(env.SMTP_PORT || "587", 10),
  secure: env.SMTP_PORT === "465",
  auth: env.SMTP_USER
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      }
    : undefined,
});

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify-email?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(token)}`;

  console.log("=================================================");
  console.log(`[SMTP SIMULATION] Verification Email to: ${email}`);
  console.log(`Verification Token: ${token}`);
  console.log(`Verification URL: ${verifyUrl}`);
  console.log("=================================================");

  if (env.SMTP_USER && env.SMTP_PASSWORD) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: "Verify your ImageSpace account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #111827; font-size: 20px; font-weight: 700;">Welcome to ImageSpace</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 24px;">
              Please verify your email address to activate your ImageSpace account and access your image workspaces.
            </p>
            <div style="margin: 24px 0;">
              <a href="${verifyUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #6b7280; font-size: 12px;">
              Or enter verification code directly: <strong style="font-size: 14px; color: #111827;">${token}</strong>
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 24px;">
              This verification link expires in 24 hours. If you did not create an ImageSpace account, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.warn("[Mailer] Could not send verification email via SMTP, logged to console instead.", err);
    }
  }

  return { verifyUrl, token };
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/forgot-password?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(token)}`;

  console.log("=================================================");
  console.log(`[SMTP SIMULATION] Password Reset Email to: ${email}`);
  console.log(`Reset Token: ${token}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log("=================================================");

  if (env.SMTP_USER && env.SMTP_PASSWORD) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: "Reset your ImageSpace password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #111827; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 24px;">
              We received a request to reset your ImageSpace password. Click below to choose a new password.
            </p>
            <div style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #6b7280; font-size: 12px;">
              Reset token: <strong style="font-size: 14px; color: #111827;">${token}</strong>
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 24px;">
              This link is valid for 1 hour. If you did not request a password reset, please secure your account immediately.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.warn("[Mailer] Could not send password reset email via SMTP, logged to console instead.", err);
    }
  }

  return { resetUrl, token };
}

export async function sendWorkspaceInvitationEmail(
  email: string,
  workspaceName: string,
  role: string,
  inviterName: string,
  token: string
) {
  const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invitations/${token}`;

  console.log("=================================================");
  console.log(`[SMTP SIMULATION] Workspace Invitation to: ${email}`);
  console.log(`Workspace: ${workspaceName} (${role}) by ${inviterName}`);
  console.log(`Invitation URL: ${inviteUrl}`);
  console.log("=================================================");

  if (env.SMTP_USER && env.SMTP_PASSWORD) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: `You've been invited to join "${workspaceName}" on ImageSpace`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #111827; font-size: 20px; font-weight: 700;">Workspace Invitation</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 24px;">
              <strong>${inviterName}</strong> has invited you to collaborate on the <strong>${workspaceName}</strong> workspace with the role of <strong>${role}</strong>.
            </p>
            <div style="margin: 24px 0;">
              <a href="${inviteUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #6b7280; font-size: 12px;">
              This invitation expires in <strong>7 days</strong>.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.warn("[Mailer] Could not send invitation email via SMTP, logged to console instead.", err);
    }
  }

  return { inviteUrl, token };
}

export async function sendSecurityAlertEmail(
  email: string,
  eventTitle: string,
  eventMessage: string,
  metadata?: Record<string, string | number | undefined>
) {
  console.log("=================================================");
  console.log(`[SMTP SIMULATION] Security Alert Email to: ${email}`);
  console.log(`Event: ${eventTitle}`);
  console.log(`Details: ${eventMessage}`);
  if (metadata) console.log("Metadata:", metadata);
  console.log("=================================================");

  if (env.SMTP_USER && env.SMTP_PASSWORD) {
    try {
      const metadataRows = metadata
        ? Object.entries(metadata)
            .filter(([, v]) => v !== undefined)
            .map(
              ([k, v]) =>
                `<tr><td style="padding: 4px 8px; color: #6b7280; font-size: 12px;">${k}:</td><td style="padding: 4px 8px; color: #111827; font-size: 12px; font-weight: 600;">${v}</td></tr>`
            )
            .join("")
        : "";

      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: `Security Alert: ${eventTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 12px; background-color: #fffaf0;">
            <h2 style="color: #991b1b; font-size: 18px; font-weight: 700; margin-top: 0;">ImageSpace Security Alert</h2>
            <p style="color: #1f2937; font-size: 14px; line-height: 22px;">
              ${eventMessage}
            </p>
            ${
              metadataRows
                ? `<table style="margin: 16px 0; border-collapse: collapse; background: #ffffff; border-radius: 6px; border: 1px solid #f3f4f6; width: 100%;">${metadataRows}</table>`
                : ""
            }
            <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">
              If this activity was not initiated by you, please sign in to ImageSpace, revoke other active sessions from your Profile, and update your password immediately.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.warn("[Mailer] Could not send security alert email via SMTP, logged to console instead.", err);
    }
  }
}

export async function sendPasswordChangeCodeEmail(email: string, code: string) {
  console.log("=================================================");
  console.log(`[SMTP SIMULATION] Password Change Code Email to: ${email}`);
  console.log(`One-Time Code: ${code}`);
  console.log("=================================================");

  if (env.SMTP_USER && env.SMTP_PASSWORD) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: "ImageSpace Password Change Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #111827; font-size: 20px; font-weight: 700;">Password Change Request</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 24px;">
              You requested to change your ImageSpace account password. Use the verification code below to authorize this change:
            </p>
            <div style="margin: 24px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #111827; background-color: #f3f4f6; padding: 12px 28px; border-radius: 8px; display: inline-block;">
                ${code}
              </span>
            </div>
            <p style="color: #6b7280; font-size: 12px;">
              This code will expire in <strong>15 minutes</strong>. If you did not request this, your password remains unchanged.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.warn("[Mailer] Could not send password change code email via SMTP, logged to console instead.", err);
    }
  }
}


