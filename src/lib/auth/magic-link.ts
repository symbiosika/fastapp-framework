import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../db/db-connection";
import { magicLinkSessions, users } from "../db/db-schema";
import { nanoid } from "nanoid";
import { smtpService } from "../email";
import type { UsersEntity } from "../types/shared/db/users";
import { generateJwt } from ".";

const EXPIRE_TIME = 15 * 60 * 1000; // 15 minutes
const JWT_EXPIRE_TIME = 86400; // 1 day

/**
 * Create a Magic Link Token
 */
export const createMagicLinkToken = async (email: string): Promise<string> => {
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
  });

  return token;
};

/**
 * Send Magic Link to the users Email address
 */
export const sendMagicLink = async (email: string): Promise<void> => {
  // Create a token
  const token = await createMagicLinkToken(email);

  // Construct the magic link URL
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const magicLink = `${frontendUrl}/magic-login.html?token=${encodeURIComponent(token)}`;

  await smtpService.sendMail({
    sender: process.env.SMTP_FROM,
    recipients: [email],
    subject:
      "Your Login Link" +
      (process.env.APP_NAME ? " for " + process.env.APP_NAME : ""),
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a4a4a;">Login to ${process.env.APP_NAME || "Our App"}</h2>
            <p>Hello,</p>
            <p>You've requested to log in to your account. Click the button below to securely access your account:</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="background-color: #007bff; border-radius: 5px; padding: 12px 25px;">
                  <a href="${magicLink}" style="color: #ffffff; text-decoration: none; display: inline-block; font-size: 16px;">Log In Now</a>
                </td>
              </tr>
            </table>
            <p>If you didn't request this login link, you can safely ignore this email.</p>
            <p>This link will expire in 15 minutes for security reasons.</p>
            <p>Best regards,<br>The ${process.env.APP_NAME || "App"} Team</p>
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
  const token = await createMagicLinkToken(email);

  // Construct the magic link URL
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const magicLink = `${frontendUrl}/verify-email.html?token=${encodeURIComponent(token)}`;

  await smtpService.sendMail({
    sender: process.env.SMTP_FROM,
    recipients: [email],
    subject:
      "Verify your Email" +
      (process.env.APP_NAME ? " for " + process.env.APP_NAME : ""),
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a4a4a;">Verify your Email</h2>
            <p>Hello,</p>
            <p>You've requested to verify your email. Click the button below to securely access your account:</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="background-color: #007bff; border-radius: 5px; padding: 12px 25px;">
                  <a href="${magicLink}" style="color: #ffffff; text-decoration: none; display: inline-block; font-size: 16px;">Log In Now</a>
                </td>
              </tr>
            </table>
            <p>If you didn't request this login link, you can safely ignore this email.</p>
            <p>This link will expire in 15 minutes for security reasons.</p>
            <p>Best regards,<br>The ${process.env.APP_NAME || "App"} Team</p>
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
): Promise<{ user: UsersEntity; token: string }> => {
  // Verify the email token
  const { user, tokenId } = await verifyEmailToken(token);

  // Generate a session token (JWT)
  const { token: sessionToken } = await generateJwt(user, JWT_EXPIRE_TIME);
  await deleteMagicLinkToken(tokenId);

  return { user, token: sessionToken };
};

/**
 * Verify Magic Link Token and Authenticate User
 */
export const verifyEmail = async (
  token: string
): Promise<{ user: UsersEntity; token: string }> => {
  // Verify the email token
  const { user, tokenId } = await verifyEmailToken(token);

  // Update the user's emailVerified status
  await getDb()
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.id, user.id));

  // Generate a session token (JWT)
  const { token: sessionToken } = await generateJwt(user, JWT_EXPIRE_TIME);
  await deleteMagicLinkToken(tokenId);

  return { user, token: sessionToken };
};
