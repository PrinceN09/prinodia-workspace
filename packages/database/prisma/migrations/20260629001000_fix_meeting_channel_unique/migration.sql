CREATE UNIQUE INDEX IF NOT EXISTS "meetings_channelId_key"
ON "meetings"("channelId")
WHERE "channelId" IS NOT NULL;
