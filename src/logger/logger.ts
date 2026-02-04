export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export class Logger {
  constructor(private context?: string) {}
  private static colors = {
    reset: '\x1b[0m',
    gray: '\x1b[90m',    
    blue: '\x1b[36m',     
    yellow: '\x1b[33m',   
    red: '\x1b[31m',      
    green: '\x1b[32m',    
  };


  private static levelColor: Record<LogLevel, string> = {
    debug: Logger.colors.gray,
    info: Logger.colors.blue,
    warn: Logger.colors.yellow,
    error: Logger.colors.red,
    success: Logger.colors.green
  };

  private generateId(): string {
    return crypto.randomUUID().slice(0, 8);
  }

 private formatTime(): string {
  return new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour12: false
  });
}

  private format(level: LogLevel, message: string, id: string, data?: unknown): string {
    const time = this.formatTime().padEnd(19); // alinhado
    const lvl = level.toUpperCase().padEnd(7);
    const ctx = (this.context ?? '-').padEnd(12);

    const color = Logger.levelColor[level];

    let base =
    `${color}${time} ` +
    `[${lvl}] ` +
    `[${ctx}] ` +
    `[${id}] ` +
    `${message}${Logger.colors.reset}`;

    if (data !== undefined) {
      const pretty =
      typeof data === 'object'
        ? '\n' + JSON.stringify(data, null, 2)
        : ` ${data}`;

      base += pretty;
      }

      return base;
  }


  private log(level: LogLevel, message: string, data?: unknown): void {
    const id = this.generateId();
    console.log(this.format(level, message, id, data));
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }
  
  success(message: string, data?: unknown): void {
    this.log('success', message, data);
  }


  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}
