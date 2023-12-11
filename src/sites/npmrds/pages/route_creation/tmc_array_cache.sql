DROP TABLE IF EXISTS admin2.tmc_array_cache;

CREATE TABLE admin2.tmc_array_cache (
  route_id BIGINT,
  year SMALLINT,
  conflation_version TEXT,
  tmc_array JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY(route_id, year, conflation_version),
  FOREIGN KEY (route_id)
    REFERENCES admin2.routes(id)
    ON DELETE CASCADE
);
