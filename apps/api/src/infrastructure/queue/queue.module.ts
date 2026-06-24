/**
 * GovSphere — Queue Module
 *
 * Placeholder for BullMQ job queue infrastructure.
 * Will be used for:
 *   - Email delivery (Sprint 1: password reset, welcome emails)
 *   - Audit log export jobs (Phase 9)
 *   - File virus scanning pipeline (Sprint 3)
 *   - Notification delivery (Sprint 4)
 *   - Data retention cleanup (Phase 9)
 *
 * Currently a scaffold. BullMQ wiring happens when the first queue consumer
 * is implemented.
 *
 * @see https://docs.nestjs.com/techniques/queues
 *
 * TODO Sprint 2: Register the first queue:
 *   BullModule.registerQueue({ name: 'email' })
 */

import { Module } from "@nestjs/common";

@Module({})
export class QueueModule {}
