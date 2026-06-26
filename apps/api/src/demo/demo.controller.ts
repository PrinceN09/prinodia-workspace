/**
 * Prinodia Workspace — DemoController
 *
 * REST endpoints for the Demo Environment Generator.
 * All routes are SUPER_ADMIN only and blocked in production.
 *
 * POST   /v1/demo/generate  → generate demo data
 * POST   /v1/demo/reset     → wipe all demo data
 * GET    /v1/demo/export    → export demo data as JSON
 * GET    /v1/demo/status    → count of existing demo records
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { DemoService } from "./demo.service";
import { GenerateDemoDto } from "./dto/demo.dto";

@Controller("v1/demo")
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get("status")
  getStatus() {
    return this.demoService.getStatus();
  }

  @Post("generate")
  @HttpCode(HttpStatus.CREATED)
  generate(@Body() dto: GenerateDemoDto) {
    return this.demoService.generate(dto);
  }

  @Post("reset")
  @HttpCode(HttpStatus.OK)
  reset() {
    return this.demoService.reset();
  }

  @Get("export")
  exportDemo() {
    return this.demoService.exportDemo();
  }
}
