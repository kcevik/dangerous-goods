-- Special provisions exist in up to three languages in the BAM dataset
-- (D_/E_/F_ file prefixes). ICAO and UN provisions are English-only, so
-- text_de alone cannot cover all modes.
ALTER TABLE special_provisions
  ADD COLUMN IF NOT EXISTS text_en TEXT,
  ADD COLUMN IF NOT EXISTS text_fr TEXT;
