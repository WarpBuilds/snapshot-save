import * as core from '@actions/core'

// Define the interface for logging
export interface Logger {
  info(message: string): void
  debug(message: string): void
  warn(message: string): void
  error(message: string): void
}

// Log class that implements the Logger interface
export class Log implements Logger {
  private logger = core

  constructor(logger = core) {
    this.logger = logger
  }

  info(message: string): void {
    this.logger.info(message)
  }

  debug(message: string): void {
    this.logger.debug(message)
  }

  warn(message: string): void {
    this.logger.warning(message)
  }

  error(message: string): void {
    this.logger.error(message)
  }
}
