/**
 * Prinodia Canvas v1.6.0 — CanvasModule
 *
 * Live collaborative workspace: boards, elements, participants, comments,
 * exports, share links. Integrates with Meet, Chat, People, Realtime.
 *
 * Depends on: PrismaModule, IdentityModule (AuditService).
 */

import { Module } from "@nestjs/common";

import { CanvasCommentsService } from "./canvas-comments.service";
import { CanvasElementsService } from "./canvas-elements.service";
import { CanvasExportsService } from "./canvas-exports.service";
import { CanvasParticipantsService } from "./canvas-participants.service";
import { CanvasSharesService } from "./canvas-shares.service";
import { CanvasController } from "./canvas.controller";
import { CanvasService } from "./canvas.service";

@Module({
  controllers: [CanvasController],
  providers: [
    CanvasService,
    CanvasElementsService,
    CanvasParticipantsService,
    CanvasCommentsService,
    CanvasExportsService,
    CanvasSharesService,
  ],
  exports: [
    CanvasService,
    CanvasElementsService,
    CanvasParticipantsService,
    CanvasCommentsService,
    CanvasExportsService,
    CanvasSharesService,
  ],
})
export class CanvasModule {}
