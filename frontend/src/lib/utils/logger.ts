type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
}

class Logger {
  private isDev = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, context?: any): LogMessage {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private print(log: LogMessage) {
    if (!this.isDev && log.level === 'debug') return;

    const colors = {
      info: 'color: #3b82f6; font-weight: bold;',
      warn: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold;',
      debug: 'color: #10b981; font-weight: bold;',
    };

    const prefix = `[VMS ${log.level.toUpperCase()}] [${log.timestamp}]`;

    if (log.level === 'error') {
      console.error(`%c${prefix} %s`, colors.error, log.message, log.context || '');
    } else if (log.level === 'warn') {
      console.warn(`%c${prefix} %s`, colors.warn, log.message, log.context || '');
    } else if (log.level === 'info') {
      console.info(`%c${prefix} %s`, colors.info, log.message, log.context || '');
    } else {
      console.log(`%c${prefix} %s`, colors.debug, log.message, log.context || '');
    }
  }

  info(message: string, context?: any) {
    this.print(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: any) {
    this.print(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: any) {
    this.print(this.formatMessage('error', message, context));
  }

  debug(message: string, context?: any) {
    this.print(this.formatMessage('debug', message, context));
  }
}

export const logger = new Logger();
