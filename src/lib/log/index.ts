import fs from "fs/promises";
import path from "path";

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

  async info(message: string) {
    await this.log("info", message);
  }

  async error(message: string) {
    await this.log("error", message);
  }

  async debug(message: string) {
    await this.log("debug", message);
  }
}

export default new Logger();
