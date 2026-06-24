# GovSphere — Engineering Task List

## Phase 1 — Foundation (Current)
- [x] Monorepo structure (Turborepo)
- [x] Root configuration (TypeScript, ESLint, Prettier)
- [x] Package scaffolds (ui, types, i18n, database, config, auth, utils)
- [x] Prisma schema (full domain model)
- [x] Docker Compose (local dev services)
- [x] i18n locale files (FR, EN, LN, SW, LUA)
- [x] Environment variable schema and validation

## Phase 2 — Authentication
- [ ] NestJS Auth module (JWT strategy, local strategy)
- [ ] Matricule + Email login endpoints
- [ ] Password hashing (bcrypt)
- [ ] Refresh token rotation
- [ ] Next.js login pages (matricule and email forms)
- [ ] NextAuth.js session wiring
- [ ] MFA scaffolding (TOTP-ready)
- [ ] Audit log: LOGIN, LOGOUT, LOGIN_FAILED

## Phase 3 — User & Government Structure
- [ ] Ministry CRUD (API + UI)
- [ ] Department CRUD
- [ ] Division CRUD
- [ ] User management (create, activate, deactivate)
- [ ] Role assignment
- [ ] User profile page

## Phase 4 — Channels & Messaging
- [ ] Channel creation (public, private, announcement)
- [ ] Channel membership management
- [ ] Message send / receive (REST + Socket.IO)
- [ ] Message reactions
- [ ] Message pin
- [ ] Reply threading
- [ ] Direct messages (1:1)
- [ ] Group messages
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Presence (online/offline)

## Phase 5 — Files
- [ ] File upload endpoint (MinIO integration)
- [ ] File download (signed URL via API)
- [ ] File listing per channel
- [ ] File metadata storage in PostgreSQL
- [ ] File permission checks

## Phase 6 — UI
- [ ] Main layout (3-column: nav + sidebar + content)
- [ ] Left vertical navigation
- [ ] Channel sidebar
- [ ] Message list (virtualized)
- [ ] Message composer
- [ ] File attachments in messages
- [ ] Notification panel
- [ ] User settings
- [ ] Ministry/Department switcher

## Phase 7 — Search & Notifications
- [ ] Full-text message search (PostgreSQL pg_trgm → later OpenSearch)
- [ ] File search
- [ ] People search
- [ ] In-app notifications
- [ ] Email notifications (MailHog → SMTP in prod)

## Phase 8 — Admin
- [ ] Super admin dashboard
- [ ] User activation / deactivation
- [ ] Audit log viewer
- [ ] Ministry management UI
- [ ] System health dashboard
