import { Global, Module } from "@nestjs/common";

import { AppLogger } from "./logger.service";

/**
 * Global logging module.
 * Exports AppLogger so every module can inject it without re-importing.
 *
 * Usage in any service:
 *   constructor(private readonly logger: AppLogger) {
 *     this.logger.setContext(MyService.name);
 *   }
 */
@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggingModule {}
