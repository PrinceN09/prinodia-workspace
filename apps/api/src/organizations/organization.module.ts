/**
 * Prinodia Workspace — OrganizationModule (v1.0.2)
 *
 * Neutral organization management for all org types:
 * government ministries, enterprises, schools, hospitals, NGOs, churches, etc.
 *
 * Exposes:
 *   GET/POST/PATCH/DELETE /v1/organizations
 *   GET /v1/organizations/:id/dashboard|structure|users
 *
 * Backward compatibility: existing /v1/ministries endpoints are unaffected.
 */

import { Module } from "@nestjs/common";

import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
