import fs from "fs/promises";
import { EOL } from "os";

const LOG_PATH = process.env.LOG_PATH ?? "./logs";
const LOG_LEVEL = process.env.LOG_LEVEL?.toLowerCase() ?? "debug";

type LogLevel = "debug" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  warn: 1,
  error: 2,
};

export class Logger {
  private static async writeToFile(message: string): Promise<void> {
    await fs.appendFile(LOG_PATH, message, "utf8");
  }

  private static formatMessage(
    level: LogLevel,
    module: string,
    message: string
  ): string {
    return `[${new Date().toISOString()}] ${level.toUpperCase()} ${module}: ${message}${EOL}`;
  }

  private static shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL as LogLevel];
  }

  public static log(
    level: LogLevel,
    message: string,
    module: string = "App"
  ): void {
    const formattedMessage = this.formatMessage(level, module, message);
    console[level](formattedMessage);

    if (this.shouldLog(level)) {
      this.writeToFile(formattedMessage).catch((err) => {
        console.error(`Failed to write log to file: ${err.message}`);
      });
    }
  }
}

export class ErrorWithLogging extends Error {
  constructor(
    message: string,
    private level: LogLevel = "error",
    private module: string = "App"
  ) {
    super(message);
    this.name = this.constructor.name;
    this.logError();
  }

  private logError(): void {
    Logger.log(this.level, this.message, this.module);
  }
}
