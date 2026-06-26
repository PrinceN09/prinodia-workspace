/**
 * Prinodia Workspace — DemoModule
 *
 * Demo Environment Generator — development use only.
 * Blocked at runtime in production via DemoService#guardProd().
 */

import { Module } from "@nestjs/common";

import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";

@Module({
  controllers: [DemoController],
  providers: [DemoService],
  exports: [DemoService],
})
export class DemoModule {}
