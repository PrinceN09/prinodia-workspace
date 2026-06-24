import { Test, TestingModule } from "@nestjs/testing";
import { PermissionsService } from "./permissions.service";
import { PrismaService } from "../../prisma/prisma.service";

const mockPrisma = {
  userRoleAssignment: { findMany: jest.fn() },
  role: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  permission: { findMany: jest.fn() },
};

describe("PermissionsService", () => {
  let service: PermissionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  describe("resolvePermissionsForUser", () => {
    it("should resolve permissions from active role assignments", async () => {
      mockPrisma.userRoleAssignment.findMany.mockResolvedValueOnce([
        {
          role: {
            permissions: [
              { permission: { key: "AUTH:LOGIN" } },
              { permission: { key: "USER:READ_OWN" } },
            ],
          },
        },
      ]);

      const result = await service.resolvePermissionsForUser("user-123");
      expect(result).toContain("AUTH:LOGIN");
      expect(result).toContain("USER:READ_OWN");
    });

    it("should fall back to User.role enum when no role assignments exist", async () => {
      mockPrisma.userRoleAssignment.findMany.mockResolvedValueOnce([]);
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: "EMPLOYEE" });
      mockPrisma.role.findUnique.mockResolvedValueOnce({
        permissions: [
          { permission: { key: "AUTH:LOGIN" } },
          { permission: { key: "CHANNEL:SEND_MESSAGE" } },
        ],
      });

      const result = await service.resolvePermissionsForUser("user-456");
      expect(result).toContain("AUTH:LOGIN");
      expect(result).toContain("CHANNEL:SEND_MESSAGE");
    });

    it("should return cached permissions on second call", async () => {
      mockPrisma.userRoleAssignment.findMany.mockResolvedValue([
        { role: { permissions: [{ permission: { key: "AUTH:LOGIN" } }] } },
      ]);

      await service.resolvePermissionsForUser("user-789");
      await service.resolvePermissionsForUser("user-789");

      // findMany called only once — second call hits cache
      expect(mockPrisma.userRoleAssignment.findMany).toHaveBeenCalledTimes(1);
    });

    it("should query DB again after cache is invalidated", async () => {
      mockPrisma.userRoleAssignment.findMany.mockResolvedValue([
        { role: { permissions: [{ permission: { key: "AUTH:LOGIN" } }] } },
      ]);

      await service.resolvePermissionsForUser("user-aaa");
      service.invalidateCache("user-aaa");
      await service.resolvePermissionsForUser("user-aaa");

      expect(mockPrisma.userRoleAssignment.findMany).toHaveBeenCalledTimes(2);
    });

    it("should deduplicate permissions when user has multiple roles with overlapping permissions", async () => {
      mockPrisma.userRoleAssignment.findMany.mockResolvedValueOnce([
        { role: { permissions: [{ permission: { key: "AUTH:LOGIN" } }] } },
        { role: { permissions: [{ permission: { key: "AUTH:LOGIN" } }, { permission: { key: "USER:CREATE" } }] } },
      ]);

      const result = await service.resolvePermissionsForUser("user-bbb");
      const loginCount = result.filter((p) => p === "AUTH:LOGIN").length;
      expect(loginCount).toBe(1); // No duplicates
    });
  });

  describe("invalidateCache", () => {
    it("should not throw when invalidating a user not in cache", () => {
      expect(() => service.invalidateCache("non-existent-user")).not.toThrow();
    });
  });
});
