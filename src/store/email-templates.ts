import type { EmailTemplateFunction } from "../types";

export const stdTemplateMagicLink: EmailTemplateFunction = async (data) => {
  return {
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a4a4a;">Login to ${data.appName}</h2>
            <p>Hello,</p>
            <p>You've requested to log in to your account. Click the button below to securely access your account:</p>
            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td align="center" valign="middle" style="border-radius: 5px; background-color: #007bff;">
                  <a
                    href="${data.link}"
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
            <p>Best regards,<br>The ${data.appName} Team</p>
          </div>
        </body>
      </html>
    `,
    subject: `Your Login Link for ${data.appName}`,
  };
};

export const stdTemplateVerifyEmail: EmailTemplateFunction = async (data) => {
  return {
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
                    href="${data.link}"
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
            <p>Best regards,<br>The ${data.appName} Team</p>
          </div>
        </body>
      </html>
    `,
    subject: `Verify your email for ${data.appName}`,
  };
};

export const stdTemplatePasswordReset: EmailTemplateFunction = async (data) => {
  return {
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a4a4a;">Reset Your Password</h2>
            <p>Hello,</p>
            <p>You (or someone else) requested a password reset. If this was you, please click the link below to set a new password:</p>
            <p><a href="${data.link}">Reset Password</a></p>
            <p>The link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
            <p>Best regards,<br>The ${data.appName} Team</p>
          </div>
        </body>
      </html>
    `,
    subject: `Reset your password for ${data.appName}`,
  };
};

export const stdTemplateInviteToOrganization: EmailTemplateFunction = async (
  data
) => {
  return {
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a4a4a;">Invitation to Join ${data.appName}</h2>
            <p>Hello,</p>
            <p>You have been invited to join ${data.appName}. Please click the link below to register and join:</p>
            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td align="center" valign="middle" style="border-radius: 5px; background-color: #007bff;">
                  <a
                    href="${data.link}"
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
                    Register Now
                  </a>
                </td>
              </tr>
            </table>
            <p>If you did not expect this invitation, you can ignore this email.</p>
            <p>Best regards,<br>The ${data.appName} Team</p>
          </div>
        </body>
      </html>
    `,
    subject: `Invitation to Join ${data.appName}`,
  };
};
