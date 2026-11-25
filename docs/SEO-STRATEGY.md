# SEO-Strategie gefahrgut.org (Stand 2026-11-25)

Plan von `/seo plan https://app.gefahrgut.org/` (SaaS-Vorlage, angepasst). Reine Planung, nichts davon ist umgesetzt. Status/Aufgaben: `docs/STATUS.md`.

## 1. Ausgangslage (gemessen am 2026-11-25)

| Punkt | Befund |
|---|---|
| `app.gefahrgut.org/` | 200, indexierbar (`index, follow`), Canonical = sich selbst, 1 JSON-LD-Block im HTML, Title/Description/H1 gesetzt, kein Basic-Auth mehr |
| `/sitemap.xml` live | **404** – die Datei liegt nur im Repo (nicht deployt) |
| `robots.txt` live | 200 (neue Version mit `Sitemap:` noch nicht deployt) |
| Apex `gefahrgut.org` | WordPress, ~196 Blogbeiträge + ~15 alte Tool-Seiten; Weiterleitung nur der Startseite auf `app.` beschlossen, nicht umgesetzt |
| Öffentlich indexierbar | nur die Landingpage (+ Rechtsseiten, solange `noindex`-Entwurf). Alles Wertvolle (UN-Seiten, Rechner, ADR-Buch) liegt hinter Login |
| Kaufweg / Preis | fehlt, bewusst keine Preis-Seite |

**Kernproblem:** Die Domain hat Autorität im Blog, die App hat Inhalt hinter einer Paywall. Suchmaschinen sehen genau eine App-Seite. SEO-Hebel = (a) Autorität des Blogs an die App übergeben, (b) wenige öffentliche Einstiegsseiten bauen, (c) nichts am bestehenden Blog-Ranking kaputtmachen.

## 2. Ziele und KPIs

Zielgruppe: Gefahrgutbeauftragte, Spediteure, Schulungsanbieter, Hersteller (DE/AT/CH). Conversion in dieser Phase = Eintrag in die Launch-Liste, später Kauf.

| Metrik | Basis | 3 Mon. | 6 Mon. | 12 Mon. |
|---|---|---|---|---|
| Indexierte App-URLs | 1 | 5–8 | 20–40 | 100+ (UN-Kernseiten, falls T17) |
| Organische Klicks Blog→App | 0 (nicht gemessen) | messen | +Basis | Ziel nach 3 Mon. Messung festlegen |
| Launch-Liste aus organisch | 0 | Messung steht | – | – |
| CWV (INP/LCP/CLS) | ungemessen | alle „gut" | halten | halten |

Messung: Search Console für **beide** Properties (Domain-Property `gefahrgut.org` deckt `app.` mit ab). Analytics erst nach Consent-Banner (STATUS.md).

## 3. Wettbewerb (zu verifizieren, nicht gemessen)

Ohne SERP-Daten nicht belegbar; vor Phase 2 per Hand prüfen: „un nummer suche", „adr 1.1.3.6 rechner", „1000 punkte regel", „adr sondervorschrift 188", „gefahrgut datenbank". Erwartete Konkurrenz: BAM GEFAHRGUT selbst, Verlags-/Software-Anbieter (Schulung/Software), Behörden- und IHK-Seiten, Foren. Wettbewerbsvorteil: multimodaler Vergleich + Rechner kostenlos zugänglich, Blog mit 196 Beiträgen.

## 4. Architektur

Entscheidung beibehalten: Blog bleibt auf dem Apex (Root-Slugs, keine Umzüge), App auf `app.`.

```
app.gefahrgut.org/
├── /                       Landing (Launch-Liste)
├── /tools/1000-punkte      ← T16: öffentlicher Rechner, ohne Login, nichts gespeichert (301 von altem /bk-rechner/)
├── /un/:nummer (Kern)      ← T17: öffentlicher Kopf (Name, Klasse, Gefahrzettel, ADR/IMDG-Kurzvergleich), Details bleiben hinter Login
├── /impressum /datenschutz /agb /widerruf
└── (App-Bereich hinter Login: noindex per Weiterleitung)
gefahrgut.org/…             Blog; jeder Beitrag verlinkt die passende UN-/Regel-Seite (T18)
```

Regeln: Weiterleitungen alter WP-Tool-Seiten (`/un-suche/`, `/bk-rechner/`, `/multimodal/` …) einzeln 301 auf das jeweilige Pendant, nicht alle auf die Startseite (Soft-404-Risiko). Gesperrte/Login-Seiten nie in die Sitemap.

**Quality Gate UN-Seiten:** 2.347 Seiten wären programmatisch (Index-Bloat-Risiko). Erst mit 20–50 meistgesuchten UN-Nummern starten (Messung per GSC), nur indexieren, wenn die Seite eigenen Inhalt hat (nicht nur Tabellenzeile). Der BAM-Inhalt ist dl-de/by-2.0 → Quellenangabe auf jeder Seite, Änderungen kennzeichnen.

## 5. Inhalt & E-E-A-T

- Autorenseite/Über-uns mit realer Person, Qualifikation (Gefahrgutbeauftragter?) und Kontakt – ersetzt das Fehlen einer Firma. Heute nur „Privatperson" im Impressum.
- Disclaimer „kein rechtsverbindlicher Text / BAM bescheinigt nichts" prominent lassen (Vertrauen + Haftung).
- Blog: die 196 Altbeiträge nicht anfassen, sondern auditieren: Top-20 nach Klicks (GSC) aktualisieren (ADR 2025, Datum sichtbar), Links zur App ergänzen.
- Neue Inhalte nur dort, wo die App Vorsprung hat: ADR vs. RID vs. IMDG vs. ICAO Unterschiede (Vergleich als Beispiele), 1000-Punkte-Regel Schritt für Schritt, Freistellungen (LQ/EQ) – jeweils mit Link auf das Tool.
- Keine Versprechen wie „rechtssicher"/„immer aktuell" (bestehende Regel in CLAUDE.md).

## 6. Technik

Bereits erledigt im Repo, **nicht deployt**: Caddy `encode` + Security-Header, `sitemap.xml`, `robots.txt` mit Sitemap-Zeile, `llms.txt`.

- Deployen (Owner-Freigabe nötig), danach `/sitemap.xml` live prüfen und in GSC einreichen.
- Sitemap: `<lastmod>` ergänzen, sobald weitere URLs dazukommen; generieren statt von Hand pflegen ab >10 URLs.
- Schema: Organization, WebSite, SoftwareApplication (ohne `offers`, solange kein Preis) auf der Landing. FAQPage-Markup bleibt (Info, kein Rich Result mehr seit Mai 2026). Für UN-Seiten später nur BreadcrumbList + Article/WebPage; kein Product.
- Social/OG: `og:image` und Twitter-Card prüfen (Logo ist off-centre laut STATUS.md).
- CWV: PageSpeed/CrUX nach Deploy messen; Landing hat ~69 KB HTML, SvelteKit-Chunks vorgeladen – kein Befund, nur messen.
- `noindex` für alle Login-Bereiche sicherstellen (Header oder Meta) und testen; heute schützt der Redirect auf `/login`, Login-Seite selbst `noindex` setzen.
- Hreflang: nicht nötig, solange nur Deutsch indexiert wird (App-Sprachen de/en/fr/tr sind Tool-intern, keine eigenen URLs).
- GEO: `llms.txt` ist optional (Google ignoriert es); wichtiger sind zitierfähige Absätze mit konkreten Zahlen und Quelle auf Landing und Rechner-Seite.

## 7. Fahrplan

**Phase 1 – Fundament (Woche 1–4)**
1. Caddy-Config + Build deployen (Owner), Sitemap/robots live prüfen.
2. Search Console (Domain-Property) + Bing Webmaster einrichten, Sitemap einreichen.
3. WordPress: Startseiten-Weiterleitung 302 → `app.` (`.htaccess`), Blog-Datenschutz/Impressum.
4. Redirect-Map der ~15 alten WP-Tool-Seiten schreiben (noch nicht aktivieren, bis Ziele existieren).
5. `noindex` auf Login/Auth-Seiten testen.
*Scheitert, wenn:* nach 2 Wochen GSC „Gefunden – zurzeit nicht indexiert" für `/` bleibt oder Blog-Impressions >20 % fallen. *Frühindikator:* GSC-Abdeckung, Impressions Blog.

**Phase 2 – Einstiegsseiten (Woche 5–12)** – hängt an T1–T3 laut STATUS.md
1. T16 öffentlicher 1000-Punkte-Rechner + 301 `/bk-rechner/`.
2. T18 Top-20-Blogbeiträge verlinken auf Rechner/UN-Seiten; Redirect-Map aktivieren.
3. T19 Double-Opt-in funktioniert (sonst bringt Traffic keine messbare Conversion).
4. Consent-Banner + Analytics-Entscheidung (oder nur GSC/Server-Logs).
*Scheitert, wenn:* Rechner-Seite nach 8 Wochen <50 Impressions für „1000 Punkte Regel"-Varianten. *Frühindikator:* Position im Zielkeyword-Set.

**Phase 3 – Skalierung (Woche 13–24)**
1. T17: 20–50 öffentliche UN-Kernseiten, Quality Gate beachten, Quellenangabe BAM.
2. Vergleichs-Inhalte ADR/RID/IMDG/ICAO als Blog+Tool-Paar.
3. Backlinks: Schulungsanbieter, Berufsverbände, Hochschul-/IHK-Materialien, Pilotkunden (T20) mit Referenz.
4. Core Web Vitals aus Felddaten prüfen.

**Phase 4 – Autorität (Monat 7–12)**
- Jahresupdate-Content nach jedem ADR/IMDG-Zyklus (Änderungen kommentiert), Kaufweg live → SoftwareApplication-`offers` ergänzen, Preis-FAQ erst mit Preismodell.
- Mehr Autor-/Praxisbelege, Kundenstimmen nur echte.

## 8. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Blog-Ranking bricht bei Umbau ein | keine URL-Änderungen am Blog; nur Startseite weiterleiten; GSC vorher/nachher |
| Index-Bloat durch UN-Seiten | Quality Gate, Start mit wenigen, Sitemap nur mit geprüften URLs |
| Rechts-/Haftungsrisiko öffentlicher Inhalte | Disclaimer, Quellenangabe, Anwaltsprüfung (offen laut STATUS.md) |
| Zwei Domains teilen Autorität schlecht | Interne Links Blog→App, ein Canonical je Inhalt, kein Duplikat-Content zwischen WP-Tools und App |
| Launch-Liste ohne DOI-Mail | T19 vor jeder Werbung |

## 9. Nicht geplant (bewusst)

Preisseite, Vergleichsseiten gegen Wettbewerber („X vs Y" – braucht belegbare Fakten), ADN-Inhalte (keine Daten), HowTo-Schema (abgeschafft), bezahlte SEO-Tools.
