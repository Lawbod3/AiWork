-- Create assessment_user role if it doesn't exist
CREATE USER assessment_user WITH PASSWORD 'assessment_pass';

-- Create assessment_db database
CREATE DATABASE assessment_db OWNER assessment_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE assessment_db TO assessment_user;

-- Connect to the new database and grant schema privileges
\c assessment_db

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO assessment_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO assessment_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO assessment_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO assessment_user;

-- Ensure assessment_user can connect
ALTER ROLE assessment_user WITH LOGIN;

