DROP TABLE admin2.batchreports;

CREATE TABLE admin2.batchreports(
	id BIGSERIAL PRIMARY KEY,
	name TEXT,
	description TEXT,
	batchreport JSONB,
	created_by BIGINT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);