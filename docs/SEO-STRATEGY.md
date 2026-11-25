# SEO-Strategie gefahrgut.org (Stand 2026-11-25)

Plan aus `/seo plan https://app.gefahrgut.org/`. **Owner-Entscheidung 2026-11-25: nichts aus der App wird öffentlich** (kein offener Rechner, keine öffentlichen UN-Seiten; STATUS.md T16/T17 entfallen). Passt zu „no free tier". SEO läuft deshalb nur über **Landingpage + Blog**. Status/Aufgaben: `docs/STATUS.md`.

## 1. Ausgangslage (gemessen 2026-11-25)

| Punkt | Befund |
|---|---|
| `app.gefahrgut.org/` | 200, indexierbar, Canonical auf sich selbst, Title/Description/H1, JSON-LD vorhanden |
| Sitemap, robots, Header | seit 2026-11-25 live (Sitemap nur Startseite; HSTS, nosniff, gzip geprüft) |
| Apex `gefahrgut.org` | WordPress-Blog (~196 Beiträge, unter `/blog/`), getrennte Seite, keine Weiterleitung (Owner). Alte Tool-/Rechtsseiten gelöscht (404) |
| Indexierbar in der App | nur Landingpage; alles andere hinter Login |
| Kaufweg / Preis | fehlt; kein Preis auf der Landingpage (bewusst) |

**Konsequenz:** Die App kann nur für Markenbegriffe und die Landingpage ranken. Alle Reichweite für Suchbegriffe wie „1000 Punkte Regel" kommt aus dem Blog. SEO-Hebel = Autorität und Inhalte des Blogs, sichtbarer Link Blog → App, saubere Technik der Landingpage.

## 2. Ziele

Conversion in dieser Phase = Eintrag in die Launch-Liste, später Kauf.

| Metrik | Basis | 3 Mon. | 6 Mon. | 12 Mon. |
|---|---|---|---|---|
| Indexierte App-URLs | 1 | 1 (+ Rechtsseiten, sobald nicht mehr `noindex`) | 1–5 | – |
| Klicks Blog → App | ungemessen | Messung steht | Basis +X % | nach Messung festlegen |
| Launch-Liste aus organisch | 0 | Messung steht | – | – |
| CWV (INP/LCP/CLS) | ungemessen | „gut" | halten | halten |

Messung: Search Console (Domain-Property `gefahrgut.org` deckt `app.` mit ab), Bing Webmaster. Analytics erst nach Consent-Banner.

## 3. Struktur

```
gefahrgut.org/blog/…      Blog (Reichweite, Autorität) — Links mit sichtbarem CTA auf app.
app.gefahrgut.org/        Landing (Launch-Liste) — einzige App-Seite im Index
app.gefahrgut.org/impressum, /datenschutz, /agb, /widerruf   (noindex bis fertig)
```
Login-Bereiche bleiben aus Sitemap und Index (Login-Seite selbst `noindex` prüfen).

## 4. Inhalt und E-E-A-T

- Autor/Über-uns mit realer Person und Qualifikation; Disclaimer „kein rechtsverbindlicher Text" bleibt sichtbar.
- Blog (Hauptmotor): GSC auswerten, Top-20 nach Klicks aktualisieren (ADR 2025, Datum sichtbar), jeder Beitrag mit klarem Hinweis auf die Plattform; neue Beiträge zu Themen, bei denen die App Vorsprung hat (ADR/RID/IMDG/ICAO-Unterschiede, 1000-Punkte-Regel erklärt, LQ/EQ) — erklären, nicht das Tool freigeben.
- Keine Versprechen wie „rechtssicher"/„immer aktuell".

## 5. Technik

- Erledigt: Sitemap, robots, Security-Header, Kompression, `llms.txt`.
- Offen: Sitemap in GSC/Bing einreichen; `<lastmod>` ergänzen, sobald weitere URLs dazukommen; `og:image` prüfen (Logo off-centre); CWV messen (PageSpeed/CrUX); Login-/Auth-Seiten `noindex`.
- Schema: Organization, WebSite, SoftwareApplication (ohne `offers`, solange kein Preis). FAQPage-Markup bleibt (kein Rich Result mehr seit Mai 2026).
- Hreflang nicht nötig (nur Deutsch indexiert).
- GEO: konkrete, zitierfähige Absätze mit Zahlen und Quelle auf Landing und im Blog.

## 6. Fahrplan

**Phase 1 – Fundament (Woche 1–4)**
1. Sitemap in Search Console und Bing einreichen (Owner).
2. Sichtbarer Link zu `app.gefahrgut.org` im Blog (Header/Sidebar + Beitragsende); Blog-Datenschutz/Impressum.
3. GSC: 404-Fehler der gelöschten WP-Seiten beobachten; nur bei Rankings/Backlinks 301 auf ein passendes Ziel.
4. Login-/Auth-Seiten `noindex` testen.
*Scheitert, wenn:* nach 2 Wochen `/` nicht indexiert oder Blog-Impressions >20 % fallen. *Frühindikator:* GSC-Abdeckung.

**Phase 2 – Blog als Motor (Woche 5–12)**
1. Top-20-Beiträge aktualisieren, mit klarem Link zur Plattform.
2. 4–6 neue Beiträge zu den Themen oben.
3. Launch-Liste muss mit Double-Opt-in funktionieren (T19), sonst ist Traffic nicht messbar nutzbar.
4. Analytics-Entscheidung (Consent-Banner oder nur GSC/Server-Logs).
*Scheitert, wenn:* Klicks Blog → Landingpage nach 8 Wochen nicht messbar steigen.

**Phase 3 – Autorität (Monat 4–12)**
Backlinks von Schulungsanbietern, Verbänden, IHK-/Hochschul-Materialien, Pilotkunden (T20) als Referenz; Jahresupdate-Beiträge nach jedem ADR/IMDG-Zyklus; nach Kaufweg-Start `offers` im Schema und Preis-FAQ.

## 7. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Wenig Reichweite, da App-Inhalte nicht indexierbar | bewusst; Blog ist der Motor; Entscheidung nach 6 Mon. mit Daten überprüfen |
| Blog-Ranking bricht ein | keine URL-Änderungen am Blog; GSC vorher/nachher |
| Zwei Domains teilen Autorität schlecht | sichtbare Links Blog → App, ein Canonical je Inhalt |
| Launch-Liste ohne DOI-Mail | T19 vor jeder Werbung |
| Haftungsrisiko von Blog-Inhalten | Disclaimer, Quellenangabe, Anwaltsprüfung |

## 8. Bewusst nicht geplant

Öffentlicher Rechner und öffentliche UN-Seiten (T16/T17, Owner 2026-11-25), Preisseite, Wettbewerber-Vergleichsseiten, ADN-Inhalte, HowTo-Schema, bezahlte SEO-Tools.
