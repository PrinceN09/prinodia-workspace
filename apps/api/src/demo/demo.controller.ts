import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Request } from "@nestjs/common";

import { DemoService } from "./demo.service";
import { GenerateDemoDto } from "./dto/demo.dto";
import { RequirePermissions } from "../common/decorators/permissions.decorator";

@Controller("v1/demo")
export class DemoController {
  constructor(private readonly service: DemoService) {}

  /** GET /v1/demo/status — current demo data summary */
  @Get("status")
  @RequirePermissions("DEMO:READ")
  status() {
    return this.service.getStatus();
  }

  /** POST /v1/demo/generate — generate demo data */
  @Post("generate")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("DEMO:MANAGE")
  generate(@Body() dto: GenerateDemoDto, @Request() req: { user?: { id?: string } }) {
    return this.service.generate(dto, req.user?.id);
  }

  /** DELETE /v1/demo/reset — remove all demo data */
  @Delete("reset")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("DEMO:MANAGE")
  reset() {
    return this.service.reset();
  }
}
