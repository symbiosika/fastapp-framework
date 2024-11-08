import nodemailer from "nodemailer";
import * as v from "valibot";
import log from "../log";

const emailSchema = v.object({
  sender: v.optional(v.string()),
  recipients: v.array(v.pipe(v.string(), v.email())),
  subject: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  text: v.optional(v.string()),
  html: v.optional(v.string()),
});

export interface EmailOptions {
  sender?: string;
  recipients: string[];
  subject: string;
  text?: string;
  html?: string;
}

class SMTPService {
  private transporter: nodemailer.Transporter;
  private logEnabled: boolean = false;

  constructor() {
    this.logEnabled = process.env.SMTP_DEBUG === "true";
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private log(message: string): void {
    if (this.logEnabled) {
      log.debug(`[SMTPService] Log: ${message}`);
    }
  }

  private error(message: string): void {
    if (this.logEnabled) {
      log.error(`[SMTPService] Error: ${message}`);
    }
  }

  async sendMail({
    sender,
    recipients,
    subject,
    text,
    html,
  }: EmailOptions): Promise<boolean> {
    try {
      v.parse(emailSchema, {
        sender,
        recipients,
        subject,
        text,
        html,
      });

      if (!text && !html) {
        throw new Error("Text or HTML body is required");
      }

      const info = await this.transporter.sendMail({
        from: sender || process.env.SMTP_DEFAULT_SENDER,
        to: recipients.join(", "),
        subject,
        text,
        html,
      });

      this.log(`Message sent: ${info.messageId}`);
      this.log(JSON.stringify(info));
      return true;
    } catch (error) {
      this.error(`Failed to send email: ${error}`);
      return false;
    }
  }
}

export const smtpService = new SMTPService();
