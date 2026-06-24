-- GovSphere PostgreSQL Initialization Script
-- Runs once when the container is first created.

-- Create shadow database for Prisma migrate
CREATE DATABASE govsphere_shadow_db;
GRANT ALL PRIVILEGES ON DATABASE govsphere_shadow_db TO govsphere;

-- Create Keycloak database
CREATE DATABASE keycloak_db;
GRANT ALL PRIVILEGES ON DATABASE keycloak_db TO govsphere;

-- Enable useful extensions on main DB
\c govsphere_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search trigrams
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For accent-insensitive search
