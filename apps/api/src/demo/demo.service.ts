/**
 * Prinodia Workspace — DemoService
 *
 * Generates realistic demo data for development and sales demonstrations.
 * SAFETY: Blocked in production (NODE_ENV === 'production').
 * IDEMPOTENT: Organisations tagged with [DEMO] prefix; users use @demo.prinodia.app domain.
 */

import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

import { PrismaService } from "../prisma/prisma.service";
import { OrgSize, OrgType } from "./dto/demo.dto";

import type { GenerateDemoDto } from "./dto/demo.dto";
import type { Department, Division, Ministry, Position, User } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEMO_TAG = "[DEMO]";
const DEMO_EMAIL_DOMAIN = "demo.prinodia.app";
const DEMO_PASSWORD = "Demo@2024!";
const BCRYPT_ROUNDS = 10;

// ─── Internal config types ────────────────────────────────────────────────────

interface SizeConfig {
  deptCount: number;
  divPerDept: number;
  usersPerDiv: number;
}

interface OrgConfig {
  name: string;
  codePrefix: string;
  deptNames: string[];
  emailSlug: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Guard ────────────────────────────────────────────────────────────────

  private guardProd(): void {
    if (process.env["NODE_ENV"] === "production") {
      throw new ForbiddenException("Demo generator is not available in production.");
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  async getStatus() {
    this.guardProd();
    const [organisations, users, documents, notifications, auditLogs] = await Promise.all([
      this.prisma.ministry.count({
        where: { description: { startsWith: DEMO_TAG } },
      }),
      this.prisma.user.count({
        where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
      }),
      this.prisma.document.count({
        where: { contentText: DEMO_TAG },
      }),
      this.prisma.notification.count({
        where: { data: { equals: { demo: true } } },
      }),
      this.prisma.auditLog.count({
        where: { ipAddress: "0.0.0.0", entityType: "demo" },
      }),
    ]);
    return { organisations, users, documents, notifications, auditLogs };
  }

  async generate(dto: GenerateDemoDto) {
    this.guardProd();

    const orgConfig = this.getOrgConfig(dto.orgType);
    const sizeConfig = this.getSizeConfig(dto.size);

    // Idempotency check — one demo org per type
    const existing = await this.prisma.ministry.findFirst({
      where: { description: { startsWith: `${DEMO_TAG} ${dto.orgType}` } },
    });
    if (existing) {
      return {
        alreadyExists: true,
        message: `Demo data for ${dto.orgType} already exists. Use Reset to start fresh.`,
        organization: existing.name,
      };
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

    this.logger.log(`Generating demo environment: ${dto.orgType} / ${dto.size}`);

    // Generation pipeline
    const ministry = await this.createMinistry(orgConfig, dto.orgType);
    const departments = await this.createDepartments(ministry.id, orgConfig, sizeConfig);
    const divisions = await this.createDivisions(departments, sizeConfig);
    const positions = await this.createPositions(ministry.id, departments, divisions);
    const users = await this.createUsers(
      ministry.id,
      departments,
      divisions,
      sizeConfig,
      passwordHash,
      orgConfig,
    );

    const adminUser = users[0]!;

    await this.createAssignments(users, positions, adminUser.id);
    await this.createChannels(ministry.id, departments, adminUser.id, users);
    await this.createDocuments(ministry.id, adminUser.id);
    await this.createNotifications(users);
    await this.createAuditLogs(users);

    this.logger.log(`Demo environment ready: ${ministry.name} (${users.length} users)`);

    return {
      success: true,
      message: `Demo environment generated for ${orgConfig.name}.`,
      summary: {
        organization: ministry.name,
        departments: departments.length,
        divisions: divisions.length,
        positions: positions.length,
        users: users.length,
        adminEmail: adminUser.email,
        demoPassword: DEMO_PASSWORD,
      },
    };
  }

  async reset() {
    this.guardProd();

    const demoMinistries = await this.prisma.ministry.findMany({
      where: { description: { startsWith: DEMO_TAG } },
      select: { id: true, name: true },
    });

    const demoUsers = await this.prisma.user.findMany({
      where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
      select: { id: true },
    });

    if (demoMinistries.length === 0 && demoUsers.length === 0) {
      return { deleted: false, message: "No demo data found." };
    }

    const userIds = demoUsers.map((u) => u.id);
    const ministryIds = demoMinistries.map((m) => m.id);

    // Delete audit logs and notifications first (not cascade from user delete)
    await this.prisma.auditLog.deleteMany({
      where: { ipAddress: "0.0.0.0", entityType: "demo" },
    });

    // Users cascade-delete: sessions, assignments, notifications, channel members, etc.
    if (userIds.length > 0) {
      await this.prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    // Ministries cascade-delete: departments, divisions, channels, documents, positions
    if (ministryIds.length > 0) {
      await this.prisma.ministry.deleteMany({ where: { id: { in: ministryIds } } });
    }

    return {
      deleted: true,
      message: `Reset complete. Removed ${demoMinistries.length} organisation(s) and ${demoUsers.length} user(s).`,
    };
  }

  async exportDemo() {
    this.guardProd();

    const ministries = await this.prisma.ministry.findMany({
      where: { description: { startsWith: DEMO_TAG } },
      include: {
        departments: {
          include: { divisions: true },
        },
      },
    });

    const users = await this.prisma.user.findMany({
      where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userType: true,
        status: true,
        ministryId: true,
        departmentId: true,
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      demoPassword: DEMO_PASSWORD,
      organisations: ministries,
      users,
    };
  }

  // ─── Config helpers ────────────────────────────────────────────────────────

  private getSizeConfig(size: OrgSize): SizeConfig {
    const map: Record<OrgSize, SizeConfig> = {
      [OrgSize.SMALL]: { deptCount: 2, divPerDept: 1, usersPerDiv: 2 },
      [OrgSize.MEDIUM]: { deptCount: 3, divPerDept: 2, usersPerDiv: 3 },
      [OrgSize.LARGE]: { deptCount: 5, divPerDept: 3, usersPerDiv: 4 },
      [OrgSize.GOVERNMENT_MINISTRY]: { deptCount: 4, divPerDept: 2, usersPerDiv: 3 },
    };
    return map[size];
  }

  private getOrgConfig(orgType: OrgType): OrgConfig {
    const map: Record<OrgType, OrgConfig> = {
      [OrgType.GOVERNMENT]: {
        name: "Ministère de la Gouvernance Numérique",
        codePrefix: "DEMO-GOV",
        deptNames: [
          "Direction des Systèmes d'Information",
          "Direction Administrative",
          "Direction Financière",
          "Direction Juridique",
          "Direction des Ressources Humaines",
        ],
        emailSlug: "gouvernance",
      },
      [OrgType.ENTERPRISE]: {
        name: "Prinodia Enterprise Corp",
        codePrefix: "DEMO-ENT",
        deptNames: ["Engineering", "Product", "Marketing", "Finance", "People & Culture"],
        emailSlug: "enterprise",
      },
      [OrgType.EDUCATION]: {
        name: "Université Prinodia",
        codePrefix: "DEMO-EDU",
        deptNames: [
          "Faculté des Sciences",
          "Faculté de Lettres",
          "Administration",
          "Recherche & Innovation",
          "Vie Étudiante",
        ],
        emailSlug: "universite",
      },
      [OrgType.HEALTHCARE]: {
        name: "Hôpital Central Prinodia",
        codePrefix: "DEMO-HLT",
        deptNames: ["Médecine Interne", "Chirurgie", "Urgences", "Administration", "Pharmacie"],
        emailSlug: "hopital",
      },
      [OrgType.NGO]: {
        name: "ONG Prinodia Impact",
        codePrefix: "DEMO-NGO",
        deptNames: ["Programmes", "Communication", "Administration", "Partenariats", "Terrain"],
        emailSlug: "ong",
      },
    };
    return map[orgType];
  }

  // ─── Data generators ───────────────────────────────────────────────────────

  private async createMinistry(orgConfig: OrgConfig, orgType: OrgType): Promise<Ministry> {
    const suffix = Date.now().toString(36).toUpperCase().slice(-5);
    return this.prisma.ministry.create({
      data: {
        name: orgConfig.name,
        code: `${orgConfig.codePrefix}-${suffix}`,
        nameTranslations: {},
        description: `${DEMO_TAG} ${orgType} — Organisation de démonstration Prinodia Workspace.`,
        isActive: true,
      },
    });
  }

  private async createDepartments(
    ministryId: string,
    orgConfig: OrgConfig,
    config: SizeConfig,
  ): Promise<Department[]> {
    const names = orgConfig.deptNames.slice(0, config.deptCount);
    const results: Department[] = [];
    for (let i = 0; i < names.length; i++) {
      results.push(
        await this.prisma.department.create({
          data: {
            ministryId,
            name: names[i]!,
            code: `DEPT-${(i + 1).toString().padStart(2, "0")}`,
            nameTranslations: {},
            isActive: true,
          },
        }),
      );
    }
    return results;
  }

  private async createDivisions(
    departments: Department[],
    config: SizeConfig,
  ): Promise<Division[]> {
    const divLabels = ["Division A", "Division B", "Division C"];
    const results: Division[] = [];
    for (const dept of departments) {
      for (let i = 0; i < config.divPerDept; i++) {
        const suffix = dept.id.slice(-4);
        results.push(
          await this.prisma.division.create({
            data: {
              departmentId: dept.id,
              name: divLabels[i] ?? `Division ${i + 1}`,
              code: `DIV-${suffix}-${i + 1}`,
              nameTranslations: {},
              isActive: true,
            },
          }),
        );
      }
    }
    return results;
  }

  private async createPositions(
    ministryId: string,
    departments: Department[],
    divisions: Division[],
  ): Promise<Position[]> {
    const results: Position[] = [];
    const minSuffix = ministryId.slice(-4);

    // Ministry-level executive
    results.push(
      await this.prisma.position.create({
        data: {
          title: "Directeur Général",
          code: `POS-EXEC-${minSuffix}`,
          level: "EXECUTIVE",
          ministryId,
          headcount: 1,
          isActive: true,
          titleTranslations: {},
        },
      }),
    );

    // Director per department
    for (const dept of departments) {
      const suffix = dept.id.slice(-4);
      results.push(
        await this.prisma.position.create({
          data: {
            title: "Directeur",
            code: `POS-DIR-${suffix}`,
            level: "DIRECTOR",
            ministryId,
            departmentId: dept.id,
            headcount: 1,
            isActive: true,
            titleTranslations: {},
          },
        }),
      );
    }

    // Officer per division
    for (const div of divisions) {
      const suffix = div.id.slice(-4);
      results.push(
        await this.prisma.position.create({
          data: {
            title: "Agent",
            code: `POS-OFF-${suffix}`,
            level: "OFFICER",
            ministryId,
            divisionId: div.id,
            headcount: 10,
            isActive: true,
            titleTranslations: {},
          },
        }),
      );
    }

    return results;
  }

  private async createUsers(
    ministryId: string,
    departments: Department[],
    divisions: Division[],
    config: SizeConfig,
    passwordHash: string,
    orgConfig: OrgConfig,
  ): Promise<User[]> {
    const users: User[] = [];
    const slug = orgConfig.emailSlug;

    // Admin
    users.push(
      await this.prisma.user.create({
        data: {
          email: `admin.${slug}@${DEMO_EMAIL_DOMAIN}`,
          passwordHash,
          firstName: "Admin",
          lastName: orgConfig.name.split(" ").slice(-1)[0] ?? "Demo",
          displayName: `Administrateur — ${orgConfig.name}`,
          role: "MINISTRY_ADMIN",
          userType: "DIRECTOR",
          status: "ACTIVE",
          preferredLanguage: "fr",
          ministryId,
        },
      }),
    );

    // HR manager
    users.push(
      await this.prisma.user.create({
        data: {
          email: `rh.${slug}@${DEMO_EMAIL_DOMAIN}`,
          passwordHash,
          firstName: "Responsable",
          lastName: "RH",
          displayName: "Responsable Ressources Humaines",
          role: "DEPARTMENT_ADMIN",
          userType: "DEPARTMENT_ADMIN",
          status: "ACTIVE",
          preferredLanguage: "fr",
          ministryId,
          departmentId: departments[0]?.id ?? null,
        },
      }),
    );

    // IT admin
    users.push(
      await this.prisma.user.create({
        data: {
          email: `it.${slug}@${DEMO_EMAIL_DOMAIN}`,
          passwordHash,
          firstName: "Admin",
          lastName: "Informatique",
          displayName: "Administrateur IT",
          role: "DEPARTMENT_ADMIN",
          userType: "IT_ADMINISTRATOR",
          status: "ACTIVE",
          preferredLanguage: "fr",
          ministryId,
        },
      }),
    );

    // Department directors
    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i]!;
      users.push(
        await this.prisma.user.create({
          data: {
            email: `directeur.dept${i + 1}.${slug}@${DEMO_EMAIL_DOMAIN}`,
            passwordHash,
            firstName: `Directeur`,
            lastName: `Dept${i + 1}`,
            displayName: `Directeur — ${dept.name}`,
            role: "DEPARTMENT_ADMIN",
            userType: "DIRECTOR",
            status: "ACTIVE",
            preferredLanguage: "fr",
            ministryId,
            departmentId: dept.id,
          },
        }),
      );
    }

    // Employees per division
    let empIndex = 1;
    for (const div of divisions) {
      for (let j = 0; j < config.usersPerDiv; j++) {
        const idx = empIndex.toString().padStart(3, "0");
        users.push(
          await this.prisma.user.create({
            data: {
              email: `agent${idx}.${slug}@${DEMO_EMAIL_DOMAIN}`,
              passwordHash,
              firstName: "Agent",
              lastName: idx,
              displayName: `Agent ${idx}`,
              role: "EMPLOYEE",
              userType: "GOVERNMENT_EMPLOYEE",
              status: "ACTIVE",
              preferredLanguage: "fr",
              ministryId,
              divisionId: div.id,
            },
          }),
        );
        empIndex++;
      }
    }

    return users;
  }

  private async createAssignments(
    users: User[],
    positions: Position[],
    assignedById: string,
  ): Promise<void> {
    const adminUser = users[0];
    if (!adminUser) return;

    const execPosition = positions.find((p) => p.level === "EXECUTIVE");
    if (execPosition) {
      await this.prisma.employeeAssignment
        .create({
          data: {
            userId: adminUser.id,
            positionId: execPosition.id,
            startDate: new Date("2024-01-01"),
            isPrimary: true,
            isActive: true,
            assignedById,
          },
        })
        .catch(() => {
          // ignore duplicates
        });
    }

    // Assign directors to director positions
    const directorPositions = positions.filter((p) => p.level === "DIRECTOR");
    const directorUsers = users.filter(
      (u) => u.userType === "DIRECTOR" && u.role !== "MINISTRY_ADMIN",
    );

    for (let i = 0; i < Math.min(directorPositions.length, directorUsers.length); i++) {
      const pos = directorPositions[i]!;
      const user = directorUsers[i]!;
      await this.prisma.employeeAssignment
        .create({
          data: {
            userId: user.id,
            positionId: pos.id,
            startDate: new Date("2024-01-01"),
            isPrimary: true,
            isActive: true,
            assignedById,
          },
        })
        .catch(() => {});
    }
  }

  private async createChannels(
    ministryId: string,
    departments: Department[],
    createdById: string,
    users: User[],
  ): Promise<void> {
    const suffix = ministryId.slice(-6);

    // General channel
    const general = await this.prisma.channel
      .create({
        data: {
          name: "général",
          slug: `general-${suffix}`,
          description: "Canal général de communication",
          type: "PUBLIC",
          ministryId,
          createdById,
          memberCount: Math.min(users.length, 20),
        },
      })
      .catch(() => null);

    if (general) {
      // Add first 15 users as members
      await this.prisma.channelMember
        .createMany({
          data: users.slice(0, 15).map((u) => ({
            channelId: general.id,
            userId: u.id,
            isAdmin: u.role === "MINISTRY_ADMIN",
            joinedAt: new Date(),
            lastReadAt: new Date(),
          })),
          skipDuplicates: true,
        })
        .catch(() => {});
    }

    // Announcements channel scoped to first department
    const firstDept = departments[0];
    if (firstDept) {
      await this.prisma.channel
        .create({
          data: {
            name: "annonces",
            slug: `annonces-${suffix}`,
            description: "Annonces officielles de l'organisation",
            type: "ANNOUNCEMENT",
            ministryId,
            departmentId: firstDept.id,
            createdById,
            memberCount: 5,
          },
        })
        .catch(() => {});
    }
  }

  private async createDocuments(ministryId: string, authorId: string): Promise<void> {
    const docs = [
      {
        title: "Rapport Annuel 2024",
        type: "REPORT" as const,
        status: "PUBLISHED" as const,
        classification: "INTERNAL" as const,
      },
      {
        title: "Note de Service — Procédures Internes",
        type: "MEMO" as const,
        status: "DRAFT" as const,
        classification: "INTERNAL" as const,
      },
      {
        title: "Circulaire Administrative n°001",
        type: "CIRCULAR" as const,
        status: "APPROVED" as const,
        classification: "PUBLIC" as const,
      },
    ];

    for (const doc of docs) {
      const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const slug = `${doc.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 60)}-${uniqueSuffix}`;

      await this.prisma.document
        .create({
          data: {
            title: doc.title,
            slug,
            type: doc.type,
            status: doc.status,
            classification: doc.classification,
            content: {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Contenu de démonstration Prinodia Workspace." }],
                },
              ],
            },
            contentText: DEMO_TAG,
            wordCount: 5,
            authorId,
            ministryId,
            tags: ["démo", "exemple"],
          },
        })
        .catch(() => {});
    }
  }

  private async createNotifications(users: User[]): Promise<void> {
    const notifications = [
      {
        type: "MENTION" as const,
        title: "Vous avez été mentionné(e)",
        body: "Un collègue vous a mentionné dans le canal #général.",
      },
      {
        type: "TASK_ASSIGNED" as const,
        title: "Nouvelle tâche assignée",
        body: 'Une tâche vous a été assignée : "Réviser le rapport Q1 2024".',
      },
      {
        type: "FILE_SHARED" as const,
        title: "Fichier partagé",
        body: '"Rapport Annuel 2024" a été partagé avec vous.',
      },
      {
        type: "SYSTEM" as const,
        title: "Bienvenue dans Prinodia Workspace",
        body: "Votre compte a été créé avec succès. Bonne exploration !",
      },
    ];

    for (const user of users.slice(0, 8)) {
      for (const notif of notifications) {
        await this.prisma.notification
          .create({
            data: {
              userId: user.id,
              type: notif.type,
              title: notif.title,
              body: notif.body,
              data: { demo: true },
              isRead: false,
            },
          })
          .catch(() => {});
      }
    }
  }

  private async createAuditLogs(users: User[]): Promise<void> {
    const actions = [
      "LOGIN_SUCCESS",
      "DOCUMENT_CREATED",
      "DOCUMENT_PUBLISHED",
      "USER_UPDATED",
      "CHANNEL_MEMBER_ADDED",
    ] as const;

    for (const user of users.slice(0, 6)) {
      for (const action of actions) {
        await this.prisma.auditLog
          .create({
            data: {
              userId: user.id,
              action,
              entityType: "demo",
              entityId: user.id,
              metadata: { demo: true, generated: "DemoService" },
              ipAddress: "0.0.0.0",
              userAgent: "Prinodia Demo Generator/1.0",
            },
          })
          .catch(() => {});
      }
    }
  }
}
