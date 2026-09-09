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
