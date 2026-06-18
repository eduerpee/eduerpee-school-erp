-- Add photo_url to registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS student_first_name VARCHAR(100);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS student_last_name VARCHAR(100);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'general';

-- Verify
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'registrations' ORDER BY ordinal_position;
