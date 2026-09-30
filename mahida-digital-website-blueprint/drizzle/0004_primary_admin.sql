-- Mahida admin-only access model.
-- Keep the established first administrator active when upgrading an existing database.
UPDATE users
SET role = 'admin',
    email_verified = true,
    updated_at = NOW()
WHERE LOWER(email) = 'mahidakoperasi@gmail.com';
