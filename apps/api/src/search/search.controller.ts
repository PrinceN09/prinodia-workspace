import { Controller, Get, Query } from "@nestjs/common";

import { SearchQueryDto } from "./dto/search.dto";
import { SearchService } from "./search.service";
import { RequirePermissions } from "../common/decorators/permissions.decorator";

@Controller("v1/search")
export class SearchController {
  constructor(private readonly service: SearchService) {}

  /** GET /v1/search?q=term — global search across entities */
  @Get()
  @RequirePermissions("SEARCH:READ")
  search(@Query() query: SearchQueryDto) {
    return this.service.search(query);
  }
}
