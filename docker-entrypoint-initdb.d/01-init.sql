-- Initialize database with assessment user and database
-- This script runs as the postgres superuser

-- Create assessment_user role with explicit LOGIN privilege
CREATE USER assessment_user WITH PASSWORD 'assessment_pass' LOGIN;

-- Create assessment_db database owned by assessment_user
CREATE DATABASE assessment_db OWNER assessment_user;

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE assessment_db TO assessment_user;

-- Connect to the new database and grant schema privileges
\c assessment_db

GRANT ALL ON SCHEMA public TO assessment_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO assessment_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO assessment_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO assessment_user;

-- Ensure assessment_user can create tables
ALTER ROLE assessment_user CREATEDB;
