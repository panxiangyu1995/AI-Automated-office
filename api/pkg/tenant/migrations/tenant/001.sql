CREATE TABLE IF NOT EXISTS enterprises (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(255) NOT NULL,
			code VARCHAR(100) UNIQUE NOT NULL,
			contact_email VARCHAR(255),
			contact_phone VARCHAR(50),
			address TEXT,
			status VARCHAR(20) DEFAULT 'active',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		)