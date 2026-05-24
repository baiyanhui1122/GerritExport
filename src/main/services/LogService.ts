import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

export class LogService {
  private readonly logFile: string

  constructor() {
    const dir = join(app.getPath('userData'), 'logs')
    mkdirSync(dir, { recursive: true })
    this.logFile = join(dir, 'urovo-export.log')
  }

  info(message: string, detail?: unknown): void {
    this.write('INFO', message, detail)
  }

  error(message: string, detail?: unknown): void {
    this.write('ERROR', message, detail)
  }

  private write(level: string, message: string, detail?: unknown): void {
    const tail = detail ? ` ${this.stringify(detail)}` : ''
    appendFileSync(this.logFile, `[${new Date().toISOString()}] [${level}] ${message}${tail}\n`, 'utf8')
  }

  private stringify(detail: unknown): string {
    if (detail instanceof Error) return detail.stack || detail.message
    try {
      return JSON.stringify(detail)
    } catch {
      return String(detail)
    }
  }
}
