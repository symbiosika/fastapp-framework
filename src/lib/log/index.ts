import fs from "fs/promises";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import path from "path";
import { appLogs } from "../db/db-schema";
import { getDb } from "../db/db-connection";

class Logger {
  private logFilePath: string;
  private maxFileSize: number = 1 * 1024 * 1024; // 1MB
  private maxFiles: number = 10;
  private writeDebugFiles: boolean;

  constructor() {
    this.logFilePath = path.join(process.cwd(), "logs", "app.log");
    this.writeDebugFiles = process.env.WRITE_DEBUG_FILES === "true";
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory() {
    try {
      await fs.mkdir(path.dirname(this.logFilePath), { recursive: true });
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        console.error("Error creating log directory:", error);
      }
    }
  }

  private async rotateFiles() {
    console.log("Rotating log files");
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldPath = `${this.logFilePath}.${i}`;
      const newPath = `${this.logFilePath}.${i + 1}`;
      try {
        await fs.rename(oldPath, newPath);
      } catch (error: any) {
        if (error.code !== "ENOENT") {
          console.error("Error rotating log files:", error);
        }
      }
    }
    try {
      await fs.rename(this.logFilePath, `${this.logFilePath}.1`);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        console.error("Error renaming log file:", error);
      }
    }
  }

  private async writeToFile(message: string) {
    if (this.writeDebugFiles) {
      try {
        const stats = await fs.stat(this.logFilePath);
        if (stats.size > this.maxFileSize) {
          await this.rotateFiles();
        }
      } catch (error: any) {
        if (error.code !== "ENOENT") {
          console.error("Error checking log file size:", error);
        }
      }
      try {
        await fs.appendFile(this.logFilePath, message + "\n");
      } catch (error: any) {
        console.error("Error writing to log file:", error);
      }
    }
  }

  private async log(level: string, message: string) {
    const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
    await this.writeToFile(logMessage);
  }

  async info(...messages: string[]) {
    for (const message of messages) {
      await this.log("info", message);
    }
  }

  async error(...messages: string[]) {
    for (const message of messages) {
      await this.log("error", message);
    }
  }

  async debug(...messages: (string | object | undefined)[]) {
    for (const message of messages) {
      if (typeof message === "object") {
        await this.log("debug", JSON.stringify(message));
      } else {
        await this.log("debug", message + "");
      }
    }
  }

  async logToDB(data: {
    level?: "debug" | "info" | "warn" | "error";
    source?: string;
    category?: string;
    sessionId?: string;
    message: string;
    metadata?: Record<string, any>;
    version?: number;
  }) {
    const level = data.level ?? "info";
    const source = data.source ?? "default";
    const category = data.category ?? "default";

    // First, log to console/file as usual
    await this.log(
      level,
      `[${data.source}] [${data.category}] ${data.message}`
    );

    // Then write to database
    try {
      await getDb()
        .insert(appLogs)
        .values({
          level: level,
          source: source,
          category: category,
          sessionId: data.sessionId,
          message: data.message,
          metadata: data.metadata ?? {},
          version: data.version ?? 0,
        });
    } catch (error) {
      console.error("Error writing to database:", error);
      // Log to file but don't recursively call logToDB
      await this.writeToFile(`Error writing to database: ${error}`);
    }
  }

  async logAChat(chatId: string, ...messages: ChatCompletionMessageParam[]) {
    if (messages.length === 0) {
      await this.debug(`(${chatId}) No messages to log.`);
      return;
    }
    for (const message of messages) {
      const content = message.content?.toString() ?? "";
      const contentSnippet = content.substring(0, 100).replace(/\n/g, " ");
      await this.debug(`(${chatId}) ${message.role}: ${contentSnippet}`);
    }
  }
}

export default new Logger();
