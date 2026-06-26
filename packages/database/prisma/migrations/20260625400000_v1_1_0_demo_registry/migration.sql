-- v1.1.0 Demo Registry — Tracks demo-generated entity IDs for safe reset

CREATE TABLE "demo_registry" (
  "id"         TEXT NOT NULL,
  "entityType" VARCHAR(100) NOT NULL,
  "entityId"   VARCHAR(100) NOT NULL,
  "sessionId"  VARCHAR(100) NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "demo_registry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "demo_registry_entityType_entityId_key"
  ON "demo_registry"("entityType", "entityId");
CREATE INDEX "demo_registry_sessionId_idx" ON "demo_registry"("sessionId");
CREATE INDEX "demo_registry_entityType_idx" ON "demo_registry"("entityType");
