import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../db/db-connection";
import { magicLinkSessions, users, type UsersSelect } from "../db/db-schema";
import { nanoid } from "nanoid";
import { smtpService } from "../email";
import { generateJwt } from ".";
import { _GLOBAL_SERVER_CONFIG } from "../../store";

const EXPIRE_TIME = 15 * 60 * 1000; // 15 minutes

/**
 * Create a Magic Link Token
 */
export const createMagicLinkToken = async (
  email: string,
  purpose: "login" | "email_verification" | "password_reset"
): Promise<string> => {
  // Check if user exists
  const userResult = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const user = userResult[0];

  // Generate a unique token
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + EXPIRE_TIME); // token expires after 15 minutes

  // Store the token in the database
  await getDb().insert(magicLinkSessions).values({
    userId: user.id,
    token,
    expiresAt: expiresAt.toISOString(),
    purpose,
  });

  return token;
};

/**
 * Create a Magic Login Link
 * @param email
 * @param redirectUrl
 */
export const createMagicLoginLink = async (
  email: string,
  redirectUrl?: string
): Promise<string> => {
  const token = await createMagicLinkToken(email, "login");
  const frontendUrl = _GLOBAL_SERVER_CONFIG.baseUrl || "http://localhost:3000";
  const magicLink = `${frontendUrl}/manage/#/magic-login?token=${encodeURIComponent(token)}&redirectUrl=${encodeURIComponent(redirectUrl || "")}`;

  return magicLink;
};

/**
 * Send Magic Link to the users Email address
 */
export const sendMagicLink = async (
  email: string,
  redirectUrl?: string
): Promise<void> => {
  const magicLink = await createMagicLoginLink(email, redirectUrl);

  await smtpService.sendMail({
    sender: process.env.SMTP_FROM,
    recipients: [email],
    subject: "Your Login Link" + _GLOBAL_SERVER_CONFIG.appName,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a4a4a;">Login to ${_GLOBAL_SERVER_CONFIG.appName}</h2>
            <p>Hello,</p>
            <p>You've requested to log in to your account. Click the button below to securely access your account:</p>
            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td align="center" valign="middle" style="border-radius: 5px; background-color: #007bff;">
                  <a
                    href="${magicLink}"
                    role="button"
                    style="
                      display: inline-block;
                      font-size: 16px;
                      font-weight: 600;
                      color: #ffffff;
                      text-decoration: none;
                      padding: 12px 25px;
                      border: 1px solid #007bff;
                      border-radius: 5px;
                      background-color: #007bff;
                    "
                  >
                    Log In Now
                  </a>
                </td>
              </tr>
            </table>
            <p>If you didn't request this login link, you can safely ignore this email.</p>
            <p>This link will expire in 15 minutes for security reasons.</p>
            <p>Best regards,<br>The ${_GLOBAL_SERVER_CONFIG.appName} Team</p>
          </div>
        </body>
      </html>
    `,
  });
};

/**
 * Send Verification Email to the users Email address
 */
export const sendVerificationEmail = async (email: string) => {
  // Create a token
  const token = await createMagicLinkToken(email, "email_verification");

  // Construct the magic link URL
  const frontendUrl = _GLOBAL_SERVER_CONFIG.baseUrl || "http://localhost:3000";
  const magicLink = `${frontendUrl}/manage/#/verify-email?token=${encodeURIComponent(token)}`;

  // /manage/#/verify-email?token=yXbEh56HRUJfvlC8ey9c__ITa20F-B1c&redirectUrl=

  await smtpService.sendMail({
    sender: process.env.SMTP_FROM,
    recipients: [email],
    subject: "Verify your Email " + _GLOBAL_SERVER_CONFIG.appName,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a4a4a;">Verify your Email</h2>
            <p>Hello,</p>
            <p>You've requested to verify your email. Click the button below to securely confirm your email:</p>
            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td align="center" valign="middle" style="border-radius: 5px; background-color: #007bff;">
                  <a
                    href="${magicLink}"
                    role="button"
                    style="
                      display: inline-block;
                      font-size: 16px;
                      font-weight: 600;
                      color: #ffffff;
                      text-decoration: none;
                      padding: 12px 25px;
                      border: 1px solid #007bff;
                      border-radius: 5px;
                      background-color: #007bff;
                    "
                  >
                    Verify Email
                  </a>
                </td>
              </tr>
            </table>
            <p>If you didn't request this verification link, you can safely ignore this email.</p>
            <p>This link will expire in 15 minutes for security reasons.</p>
            <p>Best regards,<br>The ${_GLOBAL_SERVER_CONFIG.appName} Team</p>
          </div>
        </body>
      </html>
    `,
  });
};

/**
 * Verify Email Token
 */
export const verifyEmailToken = async (token: string) => {
  // Find the magic link record
  const nowMinusExpireTime = new Date(Date.now() - EXPIRE_TIME).toISOString();
  const magicLinkResult = await getDb()
    .select()
    .from(magicLinkSessions)
    .where(
      and(
        eq(magicLinkSessions.token, token),
        gt(magicLinkSessions.expiresAt, nowMinusExpireTime)
      )
    );

  if (magicLinkResult.length === 0) {
    throw new Error("Invalid or expired magic link");
  }
  const userId = magicLinkResult[0].userId;

  const user = await getDb().select().from(users).where(eq(users.id, userId));
  if (user.length === 0) {
    throw new Error("User not found");
  }

  if (!user[0].emailVerified) {
    await getDb()
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, userId));
  }

  return {
    user: user[0],
    tokenId: magicLinkResult[0].id,
  };
};

/**
 * Delete Magic Link Token
 */
export const deleteMagicLinkToken = async (tokenId: string) => {
  await getDb()
    .delete(magicLinkSessions)
    .where(eq(magicLinkSessions.id, tokenId));
};

/**
 * Verify Magic Link Token and Authenticate User
 */
export const verifyMagicLink = async (
  token: string
): Promise<{ user: UsersSelect; token: string }> => {
  // Verify the email token
  const { user, tokenId } = await verifyEmailToken(token);

  // Generate a session token (JWT)
  const { token: sessionToken } = await generateJwt(
    user,
    _GLOBAL_SERVER_CONFIG.jwtExpiresAfter
  );
  await deleteMagicLinkToken(tokenId);

  return { user, token: sessionToken };
};

/**
 * Verify Magic Link Token and Authenticate User
 */
export const verifyEmail = async (
  token: string
): Promise<{ user: UsersSelect; token: string }> => {
  // Verify the email token
  const { user, tokenId } = await verifyEmailToken(token);

  // Update the user's emailVerified status
  await getDb()
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.id, user.id));

  // Generate a session token (JWT)
  const { token: sessionToken } = await generateJwt(
    user,
    _GLOBAL_SERVER_CONFIG.jwtExpiresAfter
  );
  await deleteMagicLinkToken(tokenId);

  return { user, token: sessionToken };
};

/**
 * Creates a reset password link for the user
 */
export const createResetPasswordLink = async (
  email: string
): Promise<string> => {
  const token = await createMagicLinkToken(email, "password_reset");
  const frontendUrl = _GLOBAL_SERVER_CONFIG.baseUrl || "http://localhost:3000";
  // Example path /manage/#/reset-password?token=...
  const resetLink = `${frontendUrl}/manage/#/reset-password?token=${encodeURIComponent(token)}`;
  return resetLink;
};

/**
 * Send a Reset Password Email
 */
export const sendResetPasswordLink = async (email: string): Promise<void> => {
  const resetLink = await createResetPasswordLink(email);

  await smtpService.sendMail({
    sender: process.env.SMTP_FROM,
    recipients: [email],
    subject: "Reset Your Password " + _GLOBAL_SERVER_CONFIG.appName,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a4a4a;">Reset Your Password</h2>
            <p>Hello,</p>
            <p>You (or someone else) requested a password reset. If this was you, please click the link below to set a new password:</p>
            <p><a href="${resetLink}">Reset Password</a></p>
            <p>The link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
            <p>Best regards,<br>The ${_GLOBAL_SERVER_CONFIG.appName} Team</p>
          </div>
        </body>
      </html>
    `,
  });
};

// Neue Funktion zum Verifizieren eines Password-Reset-Tokens
export const verifyPasswordResetToken = async (
  token: string
): Promise<{ userId: string }> => {
  const nowMinusExpireTime = new Date(Date.now() - EXPIRE_TIME).toISOString();
  const magicLinkResult = await getDb()
    .select()
    .from(magicLinkSessions)
    .where(
      and(
        eq(magicLinkSessions.token, token),
        eq(magicLinkSessions.purpose, "password_reset"),
        gt(magicLinkSessions.expiresAt, nowMinusExpireTime)
      )
    );

  if (magicLinkResult.length === 0) {
    throw new Error("Invalid or expired password reset token");
  }

  // Token ist gültig - lösche ihn sofort, damit er nicht wiederverwendet werden kann
  await deleteMagicLinkToken(magicLinkResult[0].id);

  return { userId: magicLinkResult[0].userId };
};
