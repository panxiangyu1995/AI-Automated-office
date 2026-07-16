ALTER TABLE subscription_plans ALTER COLUMN features TYPE jsonb USING features::jsonb;
