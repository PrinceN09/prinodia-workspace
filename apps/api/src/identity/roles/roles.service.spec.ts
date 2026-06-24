import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { RolesService } from "./roles.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { PermissionsService } from "../permissions/permissions.service";
import type { AuthenticatedUser } from "../../common/types/auth.types";

const mockPrisma = {
  role: { findUnique: jest.fn(), findMany: jest.fn() },
  userRoleAssignment: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  user: { findUnique: jest.fn(), update: jest.fn() },
};

const mockAuditService = { log: jest.fn() };
const mockPermissionsService = { invalidateCache: jest.fn() };

const superAdmin: AuthenticatedUser = {
  id: "super-1",
  email: "super@gov.cd",
  matriculeNumber: null,
  role: "SUPER_ADMIN",
  roleWeight: 100,
  ministryId: null,
  departmentId: null,
  divisionId: null,
  sessionId: "session-1",
  permissions: ["USER:UPDATE_ROLE"],
  mfaEnabled: true,
};

const ministryAdmin: AuthenticatedUser = {
  ...superAdmin,
  id: "min-admin-1",
  role: "MINISTRY_ADMIN",
  roleWeight: 70,
  ministryId: "ministry-1",
};

const employeeRole = { id: "role-employee", name: "EMPLOYEE", weight: 10 };
const ministryAdminRole = { id: "role-min-admin", name: "MINISTRY_ADMIN", weight: 70 };
const superAdminRole = { id: "role-super", name: "SUPER_ADMIN", weight: 100 };

describe("RolesService", () => {
  let service: RolesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({ role: "EMPLOYEE" });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.userRoleAssignment.create.mockResolvedValue({ id: "assignment-1" });
    mockPrisma.userRoleAssignment.update.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
        { provide: PermissionsService, useValue: mockPermissionsService },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe("assignRoleToUser", () => {
    it("should throw ROLE_NOT_FOUND when role does not exist", async () => {
      mockPrisma.role.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.assignRoleToUser("user-1", { roleId: "bad-id" }, superAdmin, "127.0.0.1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should allow SUPER_ADMIN (weight 100) to assign EMPLOYEE (weight 10)", async () => {
      mockPrisma.role.findUnique.mockResolvedValueOnce(employeeRole);
      mockPrisma.userRoleAssignment.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.assignRoleToUser("target-user", { roleId: employeeRole.id }, superAdmin, "127.0.0.1"),
      ).resolves.toBeDefined();
    });

    it("should throw INSUFFICIENT_WEIGHT when assigner weight <= role weight", async () => {
      mockPrisma.role.findUnique.mockResolvedValueOnce(superAdminRole);

      await expect(
        service.assignRoleToUser("target-user", { roleId: superAdminRole.id }, ministryAdmin, "127.0.0.1"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw SCOPE_VIOLATION when ministry admin assigns to a different ministry", async () => {
      mockPrisma.role.findUnique.mockResolvedValueOnce(employeeRole);

      await expect(
        service.assignRoleToUser(
          "target-user",
          { roleId: employeeRole.id, ministryId: "ministry-DIFFERENT" },
          ministryAdmin,
          "127.0.0.1",
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ROLE_ALREADY_ASSIGNED when the same scoped role exists", async () => {
      mockPrisma.role.findUnique.mockResolvedValueOnce(employeeRole);
      mockPrisma.userRoleAssignment.findFirst.mockResolvedValueOnce({ id: "existing" });

      await expect(
        service.assignRoleToUser("target-user", { roleId: employeeRole.id }, superAdmin, "127.0.0.1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should audit ROLE_ASSIGNED on success", async () => {
      mockPrisma.role.findUnique.mockResolvedValueOnce(employeeRole);
      mockPrisma.userRoleAssignment.findFirst.mockResolvedValueOnce(null);

      await service.assignRoleToUser("target-user", { roleId: employeeRole.id }, superAdmin, "127.0.0.1");

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "ROLE_ASSIGNED" }),
      );
    });

    it("should invalidate permissions cache after assignment", async () => {
      mockPrisma.role.findUnique.mockResolvedValueOnce(employeeRole);
      mockPrisma.userRoleAssignment.findFirst.mockResolvedValueOnce(null);

      await service.assignRoleToUser("target-user", { roleId: employeeRole.id }, superAdmin, "127.0.0.1");

      expect(mockPermissionsService.invalidateCache).toHaveBeenCalledWith("target-user");
    });
  });

  describe("revokeRoleFromUser", () => {
    it("should throw ASSIGNMENT_NOT_FOUND when assignment does not exist", async () => {
      mockPrisma.userRoleAssignment.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.revokeRoleFromUser("user-1", "assignment-999", superAdmin, "127.0.0.1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw INSUFFICIENT_WEIGHT when revoking a role with equal or higher weight", async () => {
      mockPrisma.userRoleAssignment.findFirst.mockResolvedValueOnce({
        id: "assign-1",
        role: superAdminRole, // weight 100 — same as superAdmin
      });

      const anotherSuperAdmin = { ...superAdmin, id: "super-2" };

      await expect(
        service.revokeRoleFromUser("user-1", "assign-1", anotherSuperAdmin, "127.0.0.1"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should audit ROLE_REMOVED on successful revocation", async () => {
      mockPrisma.userRoleAssignment.findFirst.mockResolvedValueOnce({
        id: "assign-1",
        role: employeeRole,
      });

      await service.revokeRoleFromUser("user-1", "assign-1", superAdmin, "127.0.0.1");

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "ROLE_REMOVED" }),
      );
    });
  });
});
