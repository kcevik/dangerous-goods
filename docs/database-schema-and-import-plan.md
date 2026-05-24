# Database Schema & CSV Import Plan

> **Data source:** BAM GEFAHRGUT database  
> **License:** dl-de/by-2-0 — attribution required, modifications must be marked  

---

## 1. What's in the CSV files

### File format
- **Separator:** Tab (`\t`) — not comma
- **Encoding:** ISO-8859-1 (Latin-1 / Windows-1252)
- **Line endings:** CRLF
- **Extension:** `.txt` (misleading — they are TSV)

### Datasets available

| File | Mode | Rows | Notes |
|------|------|------|-------|
| `ADR25_csv.txt` | Road (ADR 2025) | 3,374 | Most complete — includes Kemler, tunnel code |
| `RID25_csv.txt` | Rail (RID 2025) | 3,350 | No Kemler, has express freight |
| `ICAO25_csv.txt` | Air (ICAO 2025) | 3,528 | PI passenger/cargo, state variations |
| `IMDG25_csv.txt` | Sea (IMDG Amdt. 42-24) | 3,246 | Has MARPOL, EmS, stowage, segregation |
| `UN23_csv.txt` | UN Recommendations | 3,232 | Reference base |
| **ADN** | Inland waterway | — | **Not in BAM dataset** |

### Segregation tables (per mode)
- `Zusammenladung_csv.txt` — cross-class segregation matrix
- `Zusammenladung Codes_csv.txt` — code description lookup
- `Zusammenladung Klasse 1_csv.txt` — class 1 compatibility matrix
- `Zusammenladung Klasse 1 Codes_csv.txt` — class 1 code descriptions
- IMDG also has `Zusammenladung allgemein_csv.txt` (label-based, not class-based)

### Special provisions (Sondervorschriften)
Individual `.TXT` files per provision number, plain text, German:

| Mode | Files |
|------|-------|
| ADR | ~993 |
| RID | ~658 |
| IMDG | ~526 |
| UN | ~225 |
| ICAO | ~206 |
| **Total** | **~2,608** |

### Key structural patterns in the main tables
Every row = one UN entry + one sequence number (a UN number can have multiple rows for different physical forms).

Multi-value data is stored in numbered columns in the source CSVs:
- `S_SV1 … S_SV11` — special provision codes → collapse to `TEXT[]`
- `S_KENN1 … S_KENN4` — hazard label codes → collapse to `TEXT[]`
- `S_VERPACKUNGSANW1 … S_VERPACKUNGSANW9` — packing instructions → `TEXT[]`
- `S_SV_VP1 … S_SV_VP5` — packing SPs → `TEXT[]`
- Stowage / segregation / tank SPs similarly

---

## 2. Recommended Database Schema

### Design decisions
- One **entry table per transport mode** — avoids a 150-column monster table, keeps mode-specific columns typed correctly
- **PostgreSQL arrays** for multi-value fields (SV codes, label codes, packing instructions) — fast `@>` containment queries
- **Separate `special_provisions` table** — one row per (mode, code), avoids 993 FK joins
- **`un_numbers` view** (not a table) — cross-mode search derived from the entry tables
- No ADN table until source data is available

---

### Table: `adr_entries`

```sql
CREATE TABLE adr_entries (
  id                    SERIAL PRIMARY KEY,
  un_number             TEXT        NOT NULL,           -- "1203"
  sequence_number       INTEGER     NOT NULL,           -- multiple rows per UN
  name_prefix           TEXT,
  name                  TEXT,
  name_en               TEXT,
  name_fr               TEXT,
  specification         TEXT,
  specification_en      TEXT,
  specification_fr      TEXT,
  hazard_class          TEXT,
  classification_code   TEXT,
  packing_group         TEXT,                           -- I / II / III
  hazard_labels         TEXT[],                         -- collapsed from KENN1-4
  special_provision_codes TEXT[],                       -- collapsed from SV1-11
  limited_qty           TEXT,
  excepted_qty          TEXT,
  packing_instructions  TEXT[],                         -- VERPACKUNGSANW1-9
  packing_sv_codes      TEXT[],                         -- SV_VP1-5
  co_packing            TEXT[],                         -- ZUSAMMENPACKUNG1-2
  un_tank_codes         TEXT[],                         -- UN_TANK1-4
  un_tank_sv_codes      TEXT[],
  tank_codes            TEXT[],
  tank_sv_codes         TEXT[],
  tank_vehicle          TEXT,
  transport_category    TEXT,                           -- "1" / "2" / "3" / "4"
  multiplier            INTEGER,                        -- 1000-point calculator
  tunnel_code           TEXT,                           -- "B/D" etc.
  package_sv_codes      TEXT[],
  bulk_sv_codes         TEXT[],
  handling_sv_codes     TEXT[],
  operation_sv_codes    TEXT[],
  kemler_number         TEXT,                           -- Gefahrnummer
  remark                TEXT,
  compatibility_group   TEXT,
  prohibited            BOOLEAN     DEFAULT FALSE,
  security_level        INTEGER,
  security_qty_tank     TEXT,
  security_qty_bulk     TEXT,
  security_qty_packages TEXT,
  n_mark                TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (un_number, sequence_number)
);
```

### Table: `rid_entries`

Same structure as `adr_entries` **minus** `kemler_number` and `tunnel_code`, **plus**:
```sql
  express_freight       TEXT[],   -- EXPRESSGUT1-2
```

### Table: `icao_entries`

```sql
CREATE TABLE icao_entries (
  id                    SERIAL PRIMARY KEY,
  un_number             TEXT        NOT NULL,
  sequence_number       INTEGER     NOT NULL,
  name                  TEXT,
  specification         TEXT,
  hazard_class          TEXT,
  subsidiary_risks      TEXT[],                         -- ZUGEFAHR1-2
  packing_group         TEXT,
  hazard_labels         TEXT[],
  special_provision_codes TEXT[],
  excepted_qty          TEXT,
  packing_instr_passenger TEXT,                         -- PI_PAS
  packing_instr_passenger_y TEXT,                       -- PI_PAS_Y (excepted)
  max_net_passenger     TEXT,
  max_net_passenger_y   TEXT,
  packing_instr_cargo   TEXT,                           -- PI_FRA
  max_net_cargo         TEXT,
  state_variations      TEXT[],                         -- STATE_VAR1-7
  supplementary_code    TEXT,
  attachment            TEXT,
  remark                TEXT,
  prohibited            BOOLEAN     DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (un_number, sequence_number)
);
```

### Table: `imdg_entries`

```sql
CREATE TABLE imdg_entries (
  id                    SERIAL PRIMARY KEY,
  un_number             TEXT        NOT NULL,
  sequence_number       INTEGER     NOT NULL,
  name_prefix           TEXT,
  name                  TEXT,
  name_en               TEXT,
  specification         TEXT,
  specification_en      TEXT,
  hazard_class          TEXT,
  subsidiary_risks      TEXT[],                         -- ZUGEFAHR1-2
  marpol                TEXT,
  packing_group         TEXT,
  special_provision_codes TEXT[],
  limited_qty           TEXT,
  excepted_qty          TEXT,
  packing_instructions  TEXT[],
  packing_sv_codes      TEXT[],
  ibc_instructions      TEXT,
  ibc_sv_codes          TEXT[],
  un_tank_codes         TEXT[],
  tank_sv_codes         TEXT[],
  ems_fire              TEXT,                           -- EMS1, e.g. "F-E"
  ems_spill             TEXT,                           -- EMS2, e.g. "S-E"
  stowage_category      TEXT,
  stowage_codes         TEXT[],                         -- STAUUNG1-3
  handling_codes        TEXT[],
  segregation_codes     TEXT[],                         -- TRENNUNG1-10
  segregation_groups    TEXT[],                         -- TRENNGRUPPE1-3
  remark                TEXT,
  prohibited            BOOLEAN     DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (un_number, sequence_number)
);
```

### Table: `un_entries`

```sql
CREATE TABLE un_entries (
  id                    SERIAL PRIMARY KEY,
  un_number             TEXT        NOT NULL,
  sequence_number       INTEGER     NOT NULL,
  name                  TEXT,
  specification         TEXT,
  hazard_class          TEXT,
  subsidiary_risks      TEXT[],
  packing_group         TEXT,
  special_provision_codes TEXT[],
  limited_qty           TEXT,
  excepted_qty          TEXT,
  packing_instructions  TEXT[],
  packing_sv_codes      TEXT[],
  ibc_instructions      TEXT,
  un_tank_codes         TEXT[],
  transport_category    TEXT,
  remark                TEXT,
  prohibited            BOOLEAN     DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (un_number, sequence_number)
);
```

### Table: `special_provisions`

```sql
CREATE TABLE special_provisions (
  id        SERIAL PRIMARY KEY,
  mode      TEXT    NOT NULL,   -- 'ADR' | 'RID' | 'IMDG' | 'ICAO' | 'UN'
  code      TEXT    NOT NULL,   -- "163", "274", etc.
  text_de   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (mode, code)
);
```

> Note: SP text files are currently German only. English translations can be added as `text_en` later.

### Table: `segregation_matrix`

```sql
CREATE TABLE segregation_matrix (
  id         SERIAL PRIMARY KEY,
  mode       TEXT NOT NULL,
  class_from TEXT NOT NULL,
  class_to   TEXT NOT NULL,
  code       TEXT,             -- segregation code, e.g. "a", "b", "-", "X"
  UNIQUE (mode, class_from, class_to)
);

CREATE TABLE segregation_codes (
  id    SERIAL PRIMARY KEY,
  mode  TEXT NOT NULL,
  code  TEXT NOT NULL,
  text  TEXT,
  UNIQUE (mode, code)
);
```

### Indexes

```sql
-- Fast UN number lookup (primary use case)
CREATE INDEX idx_adr_un_number   ON adr_entries  (un_number);
CREATE INDEX idx_rid_un_number   ON rid_entries  (un_number);
CREATE INDEX idx_icao_un_number  ON icao_entries (un_number);
CREATE INDEX idx_imdg_un_number  ON imdg_entries (un_number);
CREATE INDEX idx_un_un_number    ON un_entries   (un_number);

-- Full-text search on substance names
CREATE INDEX idx_adr_name_fts  ON adr_entries  USING gin(to_tsvector('german', coalesce(name,'') || ' ' || coalesce(name_en,'')));
CREATE INDEX idx_rid_name_fts  ON rid_entries  USING gin(to_tsvector('german', coalesce(name,'') || ' ' || coalesce(name_en,'')));
CREATE INDEX idx_imdg_name_fts ON imdg_entries USING gin(to_tsvector('german', coalesce(name,'') || ' ' || coalesce(name_en,'')));
CREATE INDEX idx_icao_name_fts ON icao_entries USING gin(to_tsvector('english', coalesce(name,'')));
CREATE INDEX idx_un_name_fts   ON un_entries   USING gin(to_tsvector('english', coalesce(name,'')));

-- Special provisions containment search
CREATE INDEX idx_adr_sv_codes ON adr_entries USING gin(special_provision_codes);
```

---

## 3. Column Mapping: CSV → Database

### CSV header prefixes
- `S_` = string field
- `N_` = numeric field

### ADR column mapping (key fields)

| CSV column | DB column | Notes |
|------------|-----------|-------|
| `S_UNNR` | `un_number` | Keep as TEXT — "0004" |
| `N_LFDNR` | `sequence_number` | |
| `S_VORSILBE` | `name_prefix` | Often empty |
| `S_NAME` | `name` | German |
| `S_SPEZIFIKATION` | `specification` | German |
| `S_KLASSE` | `hazard_class` | |
| `S_KLASSIFIZIERUNGSCODE` | `classification_code` | |
| `S_VP_GRUPPE` | `packing_group` | |
| `S_KENN1–4` | `hazard_labels TEXT[]` | Merge 4 cols → array |
| `S_SV1–11` | `special_provision_codes TEXT[]` | Merge 11 cols → array |
| `S_BEGRENZTE_MENGEN` | `limited_qty` | |
| `S_FREIGEST_MENGEN` | `excepted_qty` | |
| `S_VERPACKUNGSANW1–9` | `packing_instructions TEXT[]` | Merge 9 cols → array |
| `S_BEFOERDERUNGSKATEGORIE` | `transport_category` | |
| `S_TUNNEL_CODE` | `tunnel_code` | |
| `S_GEFAHRNR` | `kemler_number` | |
| `S_NAME_E` | `name_en` | |
| `S_SPEZIFIKATION_E` | `specification_en` | |
| `S_NAME_FR` | `name_fr` | |
| `S_SPEZIFIKATION_FR` | `specification_fr` | |
| `S_BEMERKUNG` | `remark` | |
| `N_MULTIPLIKATOR` | `multiplier` | For 1000-point calculator |
| `N_VERBOT` | `prohibited` | 1 = true |

---

## 4. Import Workflow

### Option A — Script-based (recommended)

Write a one-time Node.js or Python import script that:
1. Reads each TSV with correct encoding (ISO-8859-1)
2. Collapses numbered columns into arrays
3. Maps German column names to English DB columns
4. Upserts into Supabase via `supabase-js` or direct PostgreSQL connection

**Pros:** Handles encoding, array merging, and renaming automatically. Rerunnable when new CSV versions are released.

#### Suggested script structure

```
scripts/
  import-regulations.ts     ← main orchestrator
  parsers/
    parse-adr.ts
    parse-rid.ts
    parse-icao.ts
    parse-imdg.ts
    parse-un.ts
    parse-special-provisions.ts
    parse-segregation.ts
  utils/
    read-tsv.ts              ← handles encoding + tab split
    collapse-columns.ts      ← SV1..SV11 → TEXT[]
```

#### `read-tsv.ts` skeleton

```typescript
import { readFileSync } from 'fs'

export function readTsv(filePath: string): Record<string, string>[] {
  const raw = readFileSync(filePath)
  // ISO-8859-1 decode
  const text = new TextDecoder('iso-8859-1').decode(raw)
  const [header, ...rows] = text.split('\r\n').filter(Boolean)
  const cols = header.split('\t')
  return rows.map(row => {
    const vals = row.split('\t')
    return Object.fromEntries(cols.map((c, i) => [c, vals[i] ?? '']))
  })
}
```

#### `collapse-columns.ts` skeleton

```typescript
export function collapseToArray(
  row: Record<string, string>,
  prefix: string,
  count: number,
): string[] {
  return Array.from({ length: count }, (_, i) => row[`${prefix}${i + 1}`])
    .filter(v => v && v.trim() !== '')
}
// Usage: collapseToArray(row, 'S_SV', 11) → ['163', '274', '601']
```

### Option B — Manual header rename + Supabase CSV import

You can do this for a quick first import:

1. Open the TSV in Excel / LibreOffice
2. Set encoding to ISO-8859-1 on open
3. Replace row 1 with the DB column names (see mapping above)
4. Export as CSV (comma-separated, UTF-8)
5. Go to Supabase → Table Editor → Import CSV

**Limitation:** You still need to handle the multi-value columns manually (SV1–11 → array). Supabase's CSV importer does not support PostgreSQL arrays. You'd either:
- Import the numbered columns as-is and normalize later with SQL, or
- Pre-process the file in a spreadsheet (concatenate SV1–11 into `{163,274,601}` format)

**Verdict:** Option A is worth the one-time effort — you'll re-import when a new ADR version is released.

### Option C — Supabase Storage + Edge Function

Upload the raw CSVs to Supabase Storage. Trigger an Edge Function to parse and upsert. Good if you want the import to live entirely within Supabase infrastructure.

---

## 5. Yearly Update Workflow

When BAM releases new data (ADR 2027, etc.):

1. Download the new CSVs from BAM GEFAHRGUT
2. Drop them into `csvbase/` with the new version name
3. Run the import script with `--mode=upsert` → rows with the same `(un_number, sequence_number)` are updated, new ones are inserted
4. Deleted substances need a `--prune` flag or a separate cleanup step

The `UNIQUE (un_number, sequence_number)` constraint makes upsert safe.

---

## 6. ADN Data Gap

**ADN (Binnenschifffahrt / inland waterway) is not in the BAM dataset.** Options:

1. **Leave the table empty for now** — the schema includes `adn_entries` but it ships unpopulated
2. **Manual entry** — ADN table structure is similar to ADR; entries can be added manually for common substances
3. **Other source** — check UNECE for machine-readable ADN data

---

## 7. Supabase Row-Level Security (RLS)

All regulation tables should be **publicly readable** (no auth required for lookups). User data stays separate.

```sql
-- Allow anyone to read regulation data
ALTER TABLE adr_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON adr_entries FOR SELECT USING (true);
-- Repeat for rid_entries, icao_entries, imdg_entries, un_entries,
-- special_provisions, segregation_matrix, segregation_codes
```

---

## 8. Phase Roadmap

| Phase | Tables needed |
|-------|--------------|
| MVP (all modes) | All entry tables, `special_provisions` (all modes), `segregation_matrix` (all modes), `un_comparison` view |
| Phase 2 (tools) | No new tables — builds features on top of existing schema |
| Phase 3 (AI) | Full-text indexes already in place; Meilisearch sync |

### Cross-mode comparison view (MVP)

```sql
CREATE VIEW un_comparison AS
  SELECT un_number, 'ADR'  AS mode, hazard_class, packing_group, transport_category AS cat, kemler_number AS kemler, NULL AS ems, NULL AS stowage_category FROM adr_entries
  UNION ALL
  SELECT un_number, 'RID'  AS mode, hazard_class, packing_group, transport_category, NULL, NULL, NULL FROM rid_entries
  UNION ALL
  SELECT un_number, 'IMDG' AS mode, hazard_class, packing_group, NULL, NULL, ems_fire, stowage_category FROM imdg_entries
  UNION ALL
  SELECT un_number, 'ICAO' AS mode, hazard_class, packing_group, NULL, NULL, NULL, NULL FROM icao_entries;
```

This is what powers the multimodal comparison feature — query once by UN number, get all modes back.
