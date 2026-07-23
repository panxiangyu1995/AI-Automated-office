DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
        AND table_name = 'backup_records'
        AND column_name = 'encrypted'
    ) THEN
        ALTER TABLE backup_records ADD COLUMN encrypted BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;
