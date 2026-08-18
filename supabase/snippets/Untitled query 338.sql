-- supabase/seed.sql

-- Insert School
INSERT INTO schools (id, name, country, city)
VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'Nairobi STEM Academy', 'Kenya', 'Nairobi');

-- Insert Users (You will need to pre-hash the passwords to paste here if keeping custom auth)
INSERT INTO users (id, school_id, name, email, password_hash, role, avatar, subject)
VALUES 
('b2c3d4e5-f6a7-8901-2345-6789abcdef01', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'Admin User', 'admin@gillytech.dev', '$2a$10$YourHashedPasswordHere', 'admin', 'AU', NULL),
('c3d4e5f6-a7b8-9012-3456-789abcdef012', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'Ms. Achieng Otieno', 'teacher@gillytech.dev', '$2a$10$YourHashedPasswordHere', 'teacher', 'AO', 'Biology');