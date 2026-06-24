/**
 * GovSphere — Database Seed
 * Seeds the default roles and permissions for the identity platform.
 * Run with: npx prisma db seed
 */

import * as bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// PERMISSIONS — keyed by RESOURCE:ACTION
// ---------------------------------------------------------------------------
const PERMISSIONS = [
  // Auth
  { key: "AUTH:LOGIN", resource: "AUTH", action: "LOGIN", displayName: "Login to platform" },
  { key: "AUTH:SETUP_MFA", resource: "AUTH", action: "SETUP_MFA", displayName: "Setup MFA" },
  { key: "AUTH:MANAGE_SESSIONS", resource: "AUTH", action: "MANAGE_SESSIONS", displayName: "Manage own sessions" },
  // Users
  { key: "USER:READ_OWN", resource: "USER", action: "READ_OWN", displayName: "Read own profile" },
  { key: "USER:UPDATE_OWN", resource: "USER", action: "UPDATE_OWN", displayName: "Update own profile" },
  { key: "USER:READ_MINISTRY", resource: "USER", action: "READ_MINISTRY", displayName: "Read ministry users" },
  { key: "USER:READ_ALL", resource: "USER", action: "READ_ALL", displayName: "Read all users" },
  { key: "USER:CREATE", resource: "USER", action: "CREATE", displayName: "Create users" },
  { key: "USER:UPDATE_ROLE", resource: "USER", action: "UPDATE_ROLE", displayName: "Assign user roles" },
  { key: "USER:DEACTIVATE", resource: "USER", action: "DEACTIVATE", displayName: "Deactivate users" },
  { key: "USER:UNLOCK", resource: "USER", action: "UNLOCK", displayName: "Unlock locked accounts" },
  // Channels
  { key: "CHANNEL:READ_MEMBER", resource: "CHANNEL", action: "READ_MEMBER", displayName: "Read member channels" },
  { key: "CHANNEL:SEND_MESSAGE", resource: "CHANNEL", action: "SEND_MESSAGE", displayName: "Send messages" },
  { key: "CHANNEL:CREATE_PUBLIC", resource: "CHANNEL", action: "CREATE_PUBLIC", displayName: "Create public channels" },
  { key: "CHANNEL:CREATE_PRIVATE", resource: "CHANNEL", action: "CREATE_PRIVATE", displayName: "Create private channels" },
  { key: "CHANNEL:MANAGE_OWN", resource: "CHANNEL", action: "MANAGE_OWN", displayName: "Manage own channels" },
  { key: "CHANNEL:MANAGE_MINISTRY", resource: "CHANNEL", action: "MANAGE_MINISTRY", displayName: "Manage ministry channels" },
  { key: "CHANNEL:MANAGE_ALL", resource: "CHANNEL", action: "MANAGE_ALL", displayName: "Manage all channels" },
  { key: "CHANNEL:ARCHIVE", resource: "CHANNEL", action: "ARCHIVE", displayName: "Archive channels" },
  { key: "CHANNEL:ADD_MEMBER", resource: "CHANNEL", action: "ADD_MEMBER", displayName: "Add channel members" },
  // Files
  { key: "FILE:UPLOAD", resource: "FILE", action: "UPLOAD", displayName: "Upload files" },
  { key: "FILE:DOWNLOAD_OWN", resource: "FILE", action: "DOWNLOAD_OWN", displayName: "Download files in member channels" },
  { key: "FILE:DELETE_OWN", resource: "FILE", action: "DELETE_OWN", displayName: "Delete own files" },
  { key: "FILE:DELETE_ANY_MINISTRY", resource: "FILE", action: "DELETE_ANY_MINISTRY", displayName: "Delete any ministry file" },
  { key: "FILE:DELETE_ANY", resource: "FILE", action: "DELETE_ANY", displayName: "Delete any file" },
  // Administration
  { key: "ADMIN:VIEW_AUDIT_LOGS_MINISTRY", resource: "ADMIN", action: "VIEW_AUDIT_LOGS_MINISTRY", displayName: "View ministry audit logs" },
  { key: "ADMIN:VIEW_AUDIT_LOGS_ALL", resource: "ADMIN", action: "VIEW_AUDIT_LOGS_ALL", displayName: "View all audit logs" },
  { key: "ADMIN:MANAGE_ROLES", resource: "ADMIN", action: "MANAGE_ROLES", displayName: "Manage roles" },
  { key: "ADMIN:INVITE_EXTERNAL", resource: "ADMIN", action: "INVITE_EXTERNAL", displayName: "Invite external partners" },
  { key: "ADMIN:SYSTEM_CONFIG", resource: "ADMIN", action: "SYSTEM_CONFIG", displayName: "Modify system configuration" },
] as const;

// ---------------------------------------------------------------------------
// ROLES — name, weight, and which permissions they hold
// ---------------------------------------------------------------------------
const ROLES: Array<{
  name: string;
  displayName: string;
  weight: number;
  description: string;
  permissions: string[];
}> = [
  {
    name: "SUPER_ADMIN",
    displayName: "Super Administrator",
    weight: 100,
    description: "Full system access. Reserved for GovSphere platform engineers.",
    permissions: PERMISSIONS.map((p) => p.key), // all permissions
  },
  {
    name: "GOVERNMENT_ADMIN",
    displayName: "Government Administrator",
    weight: 90,
    description: "Cross-ministry access. IT administrators and senior government officials.",
    permissions: PERMISSIONS.filter((p) => p.key !== "ADMIN:SYSTEM_CONFIG").map((p) => p.key),
  },
  {
    name: "MINISTRY_ADMIN",
    displayName: "Ministry Administrator",
    weight: 70,
    description: "Full access within their assigned ministry.",
    permissions: [
      "AUTH:LOGIN", "AUTH:SETUP_MFA", "AUTH:MANAGE_SESSIONS",
      "USER:READ_OWN", "USER:UPDATE_OWN", "USER:READ_MINISTRY",
      "USER:CREATE", "USER:UPDATE_ROLE", "USER:DEACTIVATE", "USER:UNLOCK",
      "CHANNEL:READ_MEMBER", "CHANNEL:SEND_MESSAGE",
      "CHANNEL:CREATE_PUBLIC", "CHANNEL:CREATE_PRIVATE",
      "CHANNEL:MANAGE_OWN", "CHANNEL:MANAGE_MINISTRY",
      "CHANNEL:ARCHIVE", "CHANNEL:ADD_MEMBER",
      "FILE:UPLOAD", "FILE:DOWNLOAD_OWN",
      "FILE:DELETE_OWN", "FILE:DELETE_ANY_MINISTRY",
      "ADMIN:VIEW_AUDIT_LOGS_MINISTRY", "ADMIN:INVITE_EXTERNAL",
    ],
  },
  {
    name: "DEPARTMENT_ADMIN",
    displayName: "Department Administrator",
    weight: 50,
    description: "Full access within their assigned department.",
    permissions: [
      "AUTH:LOGIN", "AUTH:SETUP_MFA", "AUTH:MANAGE_SESSIONS",
      "USER:READ_OWN", "USER:UPDATE_OWN", "USER:READ_MINISTRY",
      "USER:CREATE", "USER:UPDATE_ROLE", "USER:DEACTIVATE", "USER:UNLOCK",
      "CHANNEL:READ_MEMBER", "CHANNEL:SEND_MESSAGE",
      "CHANNEL:CREATE_PUBLIC", "CHANNEL:CREATE_PRIVATE",
      "CHANNEL:MANAGE_OWN", "CHANNEL:ARCHIVE", "CHANNEL:ADD_MEMBER",
      "FILE:UPLOAD", "FILE:DOWNLOAD_OWN", "FILE:DELETE_OWN",
    ],
  },
  {
    name: "DIVISION_ADMIN",
    displayName: "Division Administrator",
    weight: 40,
    description: "Full access within their assigned division.",
    permissions: [
      "AUTH:LOGIN", "AUTH:SETUP_MFA", "AUTH:MANAGE_SESSIONS",
      "USER:READ_OWN", "USER:UPDATE_OWN", "USER:READ_MINISTRY",
      "CHANNEL:READ_MEMBER", "CHANNEL:SEND_MESSAGE",
      "CHANNEL:CREATE_PUBLIC", "CHANNEL:CREATE_PRIVATE",
      "CHANNEL:MANAGE_OWN", "CHANNEL:ADD_MEMBER",
      "FILE:UPLOAD", "FILE:DOWNLOAD_OWN", "FILE:DELETE_OWN",
    ],
  },
  {
    name: "TEAM_MANAGER",
    displayName: "Team Manager",
    weight: 30,
    description: "Manages their team's channels and members.",
    permissions: [
      "AUTH:LOGIN", "AUTH:SETUP_MFA", "AUTH:MANAGE_SESSIONS",
      "USER:READ_OWN", "USER:UPDATE_OWN", "USER:READ_MINISTRY",
      "CHANNEL:READ_MEMBER", "CHANNEL:SEND_MESSAGE",
      "CHANNEL:CREATE_PUBLIC", "CHANNEL:CREATE_PRIVATE",
      "CHANNEL:MANAGE_OWN", "CHANNEL:ADD_MEMBER",
      "FILE:UPLOAD", "FILE:DOWNLOAD_OWN", "FILE:DELETE_OWN",
    ],
  },
  {
    name: "EMPLOYEE",
    displayName: "Employee",
    weight: 10,
    description: "Standard civil servant. Access to assigned channels only.",
    permissions: [
      "AUTH:LOGIN", "AUTH:SETUP_MFA", "AUTH:MANAGE_SESSIONS",
      "USER:READ_OWN", "USER:UPDATE_OWN", "USER:READ_MINISTRY",
      "CHANNEL:READ_MEMBER", "CHANNEL:SEND_MESSAGE", "CHANNEL:MANAGE_OWN",
      "FILE:UPLOAD", "FILE:DOWNLOAD_OWN", "FILE:DELETE_OWN",
    ],
  },
  {
    name: "GUEST",
    displayName: "Guest / External Partner",
    weight: 0,
    description: "Read-only access to invited channels. Cannot send messages or upload files.",
    permissions: [
      "AUTH:LOGIN", "AUTH:SETUP_MFA", "AUTH:MANAGE_SESSIONS",
      "USER:READ_OWN",
      "CHANNEL:READ_MEMBER",
      "FILE:DOWNLOAD_OWN",
    ],
  },
];

// ---------------------------------------------------------------------------
// MAIN SEED
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("🌱 GovSphere — Seeding identity platform...");

  // 1. Upsert all permissions
  console.log(`  → Seeding ${PERMISSIONS.length} permissions...`);
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { displayName: perm.displayName },
      create: {
        key: perm.key,
        displayName: perm.displayName,
        resource: perm.resource,
        action: perm.action,
      },
    });
  }

  // 2. Upsert all roles + their permission links
  console.log(`  → Seeding ${ROLES.length} roles...`);
  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        displayName: roleData.displayName,
        weight: roleData.weight,
        description: roleData.description,
        isSystem: true,
      },
      create: {
        name: roleData.name,
        displayName: roleData.displayName,
        weight: roleData.weight,
        description: roleData.description,
        isSystem: true,
      },
    });

    // Resolve permission IDs
    const permIds = await prisma.permission.findMany({
      where: { key: { in: roleData.permissions as string[] } },
      select: { id: true },
    });

    // Upsert role-permission links
    for (const { id: permissionId } of permIds) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }

    console.log(`    ✅ ${roleData.name} (weight: ${roleData.weight}, permissions: ${permIds.length})`);
  }

  // 3. Upsert Super Admin user
  // Password is read from SEED_ADMIN_PASSWORD env var.
  // Falls back to a placeholder — must be rotated before production use.
  const adminEmail = "superadmin@govsphere.cd";
  const rawPassword = process.env["SEED_ADMIN_PASSWORD"] ?? "GovSphere@Admin1!";
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      matriculeNumber: "0.000.001",
      firstName: "Platform",
      lastName: "Admin",
      displayName: "Platform Administrator",
      passwordHash,
      role: "SUPER_ADMIN",
      userType: "IT_ADMINISTRATOR",
      status: "ACTIVE",
      passwordChangedAt: new Date(),
    },
  });
  console.log(`  ✅ Super Admin: ${adminEmail} (role: SUPER_ADMIN)`);
  if (!process.env["SEED_ADMIN_PASSWORD"]) {
    console.warn("  ⚠️  Default seed password used — set SEED_ADMIN_PASSWORD before production use.");
  }

  console.log("🌱 Seed complete.");
}

main()
  .catch((err: unknown) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
