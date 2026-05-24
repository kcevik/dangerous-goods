-- =============================================================================
-- Dangerous Goods Platform — Initial Schema
-- Data source: BAM GEFAHRGUT database (dl-de/by-2-0)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Entry tables (one per transport mode)
-- -----------------------------------------------------------------------------

CREATE TABLE adr_entries (
  id                      SERIAL PRIMARY KEY,
  un_number               TEXT        NOT NULL,
  sequence_number         INTEGER     NOT NULL,
  name_prefix             TEXT,
  name                    TEXT,
  name_en                 TEXT,
  name_fr                 TEXT,
  specification           TEXT,
  specification_en        TEXT,
  specification_fr        TEXT,
  hazard_class            TEXT,
  classification_code     TEXT,
  packing_group           TEXT,
  hazard_labels           TEXT[],
  special_provision_codes TEXT[],
  limited_qty             TEXT,
  excepted_qty            TEXT,
  packing_instructions    TEXT[],
  packing_sv_codes        TEXT[],
  co_packing              TEXT[],
  un_tank_codes           TEXT[],
  un_tank_sv_codes        TEXT[],
  tank_codes              TEXT[],
  tank_sv_codes           TEXT[],
  tank_vehicle            TEXT,
  transport_category      TEXT,
  multiplier              INTEGER,
  tunnel_code             TEXT,
  package_sv_codes        TEXT[],
  bulk_sv_codes           TEXT[],
  handling_sv_codes       TEXT[],
  operation_sv_codes      TEXT[],
  kemler_number           TEXT,
  remark                  TEXT,
  compatibility_group     TEXT,
  prohibited              BOOLEAN     DEFAULT FALSE,
  security_level          INTEGER,
  security_qty_tank       TEXT,
  security_qty_bulk       TEXT,
  security_qty_packages   TEXT,
  n_mark                  TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (un_number, sequence_number)
);

CREATE TABLE rid_entries (
  id                      SERIAL PRIMARY KEY,
  un_number               TEXT        NOT NULL,
  sequence_number         INTEGER     NOT NULL,
  name_prefix             TEXT,
  name                    TEXT,
  name_en                 TEXT,
  name_fr                 TEXT,
  specification           TEXT,
  specification_en        TEXT,
  specification_fr        TEXT,
  hazard_class            TEXT,
  classification_code     TEXT,
  packing_group           TEXT,
  hazard_labels           TEXT[],
  special_provision_codes TEXT[],
  limited_qty             TEXT,
  excepted_qty            TEXT,
  packing_instructions    TEXT[],
  packing_sv_codes        TEXT[],
  co_packing              TEXT[],
  un_tank_codes           TEXT[],
  un_tank_sv_codes        TEXT[],
  tank_codes              TEXT[],
  tank_sv_codes           TEXT[],
  tank_vehicle            TEXT,
  transport_category      TEXT,
  multiplier              INTEGER,
  express_freight         TEXT[],
  package_sv_codes        TEXT[],
  bulk_sv_codes           TEXT[],
  handling_sv_codes       TEXT[],
  operation_sv_codes      TEXT[],
  remark                  TEXT,
  compatibility_group     TEXT,
  prohibited              BOOLEAN     DEFAULT FALSE,
  security_level          INTEGER,
  security_qty_tank       TEXT,
  security_qty_bulk       TEXT,
  security_qty_packages   TEXT,
  n_mark                  TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (un_number, sequence_number)
);

CREATE TABLE icao_entries (
  id                        SERIAL PRIMARY KEY,
  un_number                 TEXT        NOT NULL,
  sequence_number           INTEGER     NOT NULL,
  name                      TEXT,
  specification             TEXT,
  hazard_class              TEXT,
  subsidiary_risks          TEXT[],
  packing_group             TEXT,
  hazard_labels             TEXT[],
  special_provision_codes   TEXT[],
  excepted_qty              TEXT,
  packing_instr_passenger   TEXT,
  packing_instr_passenger_y TEXT,
  max_net_passenger         TEXT,
  max_net_passenger_y       TEXT,
  packing_instr_cargo       TEXT,
  max_net_cargo             TEXT,
  state_variations          TEXT[],
  supplementary_code        TEXT,
  attachment                TEXT,
  remark                    TEXT,
  prohibited                BOOLEAN     DEFAULT FALSE,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (un_number, sequence_number)
);

CREATE TABLE imdg_entries (
  id                      SERIAL PRIMARY KEY,
  un_number               TEXT        NOT NULL,
  sequence_number         INTEGER     NOT NULL,
  name_prefix             TEXT,
  name                    TEXT,
  name_en                 TEXT,
  specification           TEXT,
  specification_en        TEXT,
  hazard_class            TEXT,
  subsidiary_risks        TEXT[],
  marpol                  TEXT,
  packing_group           TEXT,
  special_provision_codes TEXT[],
  limited_qty             TEXT,
  excepted_qty            TEXT,
  packing_instructions    TEXT[],
  packing_sv_codes        TEXT[],
  ibc_instructions        TEXT,
  ibc_sv_codes            TEXT[],
  un_tank_codes           TEXT[],
  tank_sv_codes           TEXT[],
  ems_fire                TEXT,
  ems_spill               TEXT,
  stowage_category        TEXT,
  stowage_codes           TEXT[],
  handling_codes          TEXT[],
  segregation_codes       TEXT[],
  segregation_groups      TEXT[],
  remark                  TEXT,
  prohibited              BOOLEAN     DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (un_number, sequence_number)
);

CREATE TABLE un_entries (
  id                      SERIAL PRIMARY KEY,
  un_number               TEXT        NOT NULL,
  sequence_number         INTEGER     NOT NULL,
  name                    TEXT,
  specification           TEXT,
  hazard_class            TEXT,
  subsidiary_risks        TEXT[],
  packing_group           TEXT,
  special_provision_codes TEXT[],
  limited_qty             TEXT,
  excepted_qty            TEXT,
  packing_instructions    TEXT[],
  packing_sv_codes        TEXT[],
  ibc_instructions        TEXT,
  un_tank_codes           TEXT[],
  transport_category      TEXT,
  remark                  TEXT,
  prohibited              BOOLEAN     DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (un_number, sequence_number)
);

-- -----------------------------------------------------------------------------
-- Supporting tables
-- -----------------------------------------------------------------------------

CREATE TABLE special_provisions (
  id         SERIAL PRIMARY KEY,
  mode       TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  text_de    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (mode, code)
);

CREATE TABLE segregation_matrix (
  id         SERIAL PRIMARY KEY,
  mode       TEXT NOT NULL,
  class_from TEXT NOT NULL,
  class_to   TEXT NOT NULL,
  code       TEXT,
  UNIQUE (mode, class_from, class_to)
);

CREATE TABLE segregation_codes (
  id   SERIAL PRIMARY KEY,
  mode TEXT NOT NULL,
  code TEXT NOT NULL,
  text TEXT,
  UNIQUE (mode, code)
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX idx_adr_un_number  ON adr_entries  (un_number);
CREATE INDEX idx_rid_un_number  ON rid_entries  (un_number);
CREATE INDEX idx_icao_un_number ON icao_entries (un_number);
CREATE INDEX idx_imdg_un_number ON imdg_entries (un_number);
CREATE INDEX idx_un_un_number   ON un_entries   (un_number);

CREATE INDEX idx_adr_name_fts  ON adr_entries  USING gin(to_tsvector('german',  coalesce(name,'') || ' ' || coalesce(name_en,'')));
CREATE INDEX idx_rid_name_fts  ON rid_entries  USING gin(to_tsvector('german',  coalesce(name,'') || ' ' || coalesce(name_en,'')));
CREATE INDEX idx_imdg_name_fts ON imdg_entries USING gin(to_tsvector('german',  coalesce(name,'') || ' ' || coalesce(name_en,'')));
CREATE INDEX idx_icao_name_fts ON icao_entries USING gin(to_tsvector('english', coalesce(name,'')));
CREATE INDEX idx_un_name_fts   ON un_entries   USING gin(to_tsvector('english', coalesce(name,'')));

CREATE INDEX idx_adr_sv_codes ON adr_entries USING gin(special_provision_codes);

-- -----------------------------------------------------------------------------
-- Cross-mode comparison view (powers the multimodal tool)
-- -----------------------------------------------------------------------------

CREATE VIEW un_comparison AS
  SELECT un_number, 'ADR'  AS mode, hazard_class, packing_group,
         transport_category AS cat, kemler_number AS kemler,
         NULL::TEXT AS ems, NULL::TEXT AS stowage_category
    FROM adr_entries
  UNION ALL
  SELECT un_number, 'RID'  AS mode, hazard_class, packing_group,
         transport_category, NULL, NULL, NULL
    FROM rid_entries
  UNION ALL
  SELECT un_number, 'IMDG' AS mode, hazard_class, packing_group,
         NULL, NULL, ems_fire, stowage_category
    FROM imdg_entries
  UNION ALL
  SELECT un_number, 'ICAO' AS mode, hazard_class, packing_group,
         NULL, NULL, NULL, NULL
    FROM icao_entries;

-- -----------------------------------------------------------------------------
-- Row Level Security — regulation data is publicly readable
-- -----------------------------------------------------------------------------

ALTER TABLE adr_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rid_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE icao_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE imdg_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE un_entries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_provisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE segregation_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE segregation_codes  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON adr_entries        FOR SELECT USING (true);
CREATE POLICY "public read" ON rid_entries        FOR SELECT USING (true);
CREATE POLICY "public read" ON icao_entries       FOR SELECT USING (true);
CREATE POLICY "public read" ON imdg_entries       FOR SELECT USING (true);
CREATE POLICY "public read" ON un_entries         FOR SELECT USING (true);
CREATE POLICY "public read" ON special_provisions FOR SELECT USING (true);
CREATE POLICY "public read" ON segregation_matrix FOR SELECT USING (true);
CREATE POLICY "public read" ON segregation_codes  FOR SELECT USING (true);
