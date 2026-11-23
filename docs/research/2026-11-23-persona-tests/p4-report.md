# Persona-Test P4 – Julia Neumann (Pharma/Diagnostik, Luftfracht)

Screenshots: `/tmp/claude-1000/-home-dilli-projects-dangerous-goods/d1f1fb99-c91f-4850-8938-73c56eb69568/scratchpad/personas/p4/shots/`
(im Folgenden nur der Dateiname). Testumgebung: `origin/main`, `pnpm dev` auf Port 5184, eigenes playwright-core-Skript, 23.11.2026.

## Persona

Julia Neumann, 34, Gefahrgutbeauftragte und EHS-Spezialistin bei einem Pharma-/Diagnostikunternehmen (900 MA, nahe FRA). Versendet vor allem per Luft (UN 3373, 1845, Lithiumbatterien, kleine Mengen Klasse 3/8, EQ) und per Kurier/Straße (ADR, LQ/EQ). Hat bereits ein IATA-DGR-Abo und muss jedes neue SaaS-Tool beim Einkauf begründen (inkl. AVV-Prüfung).

## Erster Eindruck

**Landing (375 und 1280):** Modern und sauber, auf dem Handy gut lesbar, kein horizontales Scrollen (`m-land-0.png`, `m-land-2.png`, `landing-1280.png`). Die interaktive Demo mit UN 1203 ist ein guter Einstieg. Was mich als Luftfracht-Frau stutzig macht:
- Die Kennzahlen widersprechen sich: oben „2.347+ UN-Nummern“ bzw. „2.347+ Stoffe“, weiter unten „über 16.730 Einträge“. Was gilt?
- „BAM-zertifizierte Datenbasis“: Die BAM zertifiziert keine Datenbanken. Das klingt nach Marketing und kostet bei Fachleuten Vertrauen. Besser: „Datenbasis: BAM GEFAHRGUT (dl-de/by-2-0)“.
- Im Vergleichs-Mockup steht bei ICAO unter „Begrenzte Mengen“ ein „–“, darunter „Mengengrenzen stimmen überein“. Für UN 1203 gibt es in der ICAO-TI aber eine LQ (Y341, 1 L). Das ist genau mein Fachgebiet, und es ist das Erste, was mir auffällt (`m-land-3.png`).
- Vier von sechs Funktionskacheln sind „Demnächst verfügbar“, darunter Freistellungsrechner (LQ/EQ) und Dokumentengenerator, also genau das, was ich bräuchte.
- Die Vergleichstabelle im Mockup ist auf 375 px rechts abgeschnitten („Begren…“) und lässt sich nur horizontal wischen (`m-land-3.png`).

**Datenschutz (Einkaufssicht):** Inhaltlich ordentlich: Hosting bei STRATO in DE, Supabase in Frankfurt mit SCC-Hinweis, kein Tracking, nur technisch notwendige Cookies, Stripe angekündigt. **Für unseren Einkauf so aber nicht verwendbar:**
- Die Seite ist als „Entwurf – noch nicht gültig“ markiert. Verantwortlicher, Adresse, E-Mail, Log-Speicherdauer und E-Mail-Dienstleister fehlen noch (`[[…]]`-Platzhalter).
- Es gibt kein AVV-Angebot für Geschäftskunden, keine TOMs und keine Subprozessorliste. Die Erklärung ist für Privatpersonen geschrieben („du“). Für ein B2B-Tool brauche ich AVV, TOMs, Subprozessoren und die Aussage, dass keine Kundendaten in die USA gehen.

**Gesperrte Ansicht:** Klar und fair umgesetzt. Ein Banner und einmal pro Seite ein Modal mit Leistungsumfang und Preis (`locked-_dashboard-1280.png`, `locked-_dashboard-375.png`). Auf dem Handy ist das Modal gut bedienbar. Gesperrte UN-Seiten erklären freundlich, dass die Daten erst nach der Freischaltung verfügbar sind. **Aber:** „Jetzt freischalten“ führt auf `/konto`, und dort steht „Abo abschließen — demnächst verfügbar“. Ich kann also gar nicht kaufen.

**Preis:** „125 € pro Monat inkl. MwSt.“ Für B2B erwarte ich einen Nettopreis, eine Jahresoption, eine Rechnung statt Kreditkarte und Team-Lizenzen. 1.500 € im Jahr für einen Nutzer liegen in der Größenordnung eines IATA-DGR-Abos, ohne dass die Luftfracht-Tiefe der IATA erreicht wird (siehe unten).

## Getestete Aufgaben

| Aufgabe | Wie gelöst | Ergebnis | Anmerkung |
|---|---|---|---|
| UN 3373 Luft prüfen | `/un/3373` → ICAO-Tab, EN | ⚠️ | ICAO: Kl. 6.2, Labels „None“, PI „See 650“ für Passagier- und Frachtflugzeug. Plausibel, aber die 4-L/4-kg-Grenzen aus PI 650 fehlen. Im ADR-Tab steht ohne Variantenwahl „(nur tierische Stoffe)“ mit Kemler 606. Das wirkt wie die Tank-/Bulk-Zeile (prüfen). (`raw-_un_3373.png`) |
| UN 1845 Trockeneis | Suche „dry ice“ und „Trockeneis“ → UN-Seite ICAO | ✅ | PI 954, max. 200 kg Passagier/Fracht, A48, A151 vollständig. Der ADR-Hinweis „nur 5.5.3“ ist korrekt, steht aber im EN-Modus auf Deutsch. Mobil gut (`m-icao-1845-375.png`) |
| UN 3480 | UN-Seite ICAO EN | ✅ | Passagier: FORBIDDEN, Fracht: See 965, Label „Lithium or sodium ion batteries“, SVs im Volltext. Korrekt. Abschnitt IA/IB/II von PI 965 nur als „See 965“ |
| UN 3481 / 3091 | UN-Seite ICAO EN | ⚠️ | Daten korrekt (enthalten: PI 967, 5 kg/35 kg; mitverpackt: PI 966). **Bug:** Variantenwahl zeigt zwei identisch beschriftete Buttons „(including lithium ion polymer batteries)“, im ADR-Variantenpicker und in der ICAO-Auswahl. Man muss raten (`icao-3481.png`) |
| UN 3090 | UN-Seite ICAO | ✅ | Passagier FORBIDDEN, Fracht See 968. Korrekt |
| UN 1170 / 1219 Ethanol/Isopropanol | UN-Seite ICAO | ⚠️ | PI 353 (5 L) / 364 (60 L), E2, A3/A58/A180. Korrekt. **ICAO-LQ (Y341, 1 L) fehlt komplett** |
| UN 1789 / 1823 Ätzstoffe | UN-Seite ICAO | ⚠️ | 851 (1 L) / 855 (30 L) bzw. 859 (15 kg) / 863 (50 kg). Korrekt, Y-PI fehlt |
| UN 2814 / 3291 | UN-Seite ICAO | ✅ | 620: 50 mL/g Passagier, 4 L/kg Fracht. Korrekt. 3291: „621 · max No limit“ ist sprachlich holprig |
| UN 1993 | UN-Seite + Variante | ✅ | PG I/II/III als Varianten wählbar, PG I: 351/361, 1 L/30 L. Korrekt |
| Regelwerksvergleich 1170 | `/un/1170/vergleich` 1280 + 375 | ❌ | ICAO „Begrenzte Mengen“ wird als „— (In diesem Regelwerk nicht vorgesehen)“ angezeigt, darüber „Keine kritischen Abweichungen“. **Fachlich falsch:** Die ICAO-TI kennt LQ (Y-Verpackungsanweisungen). Die Datenbank hat sogar die Spalten `packing_instr_passenger_y` / `max_net_passenger_y` (laut Schema-Doku), sie werden aber nicht angezeigt. Gleiches gilt für 3480, 3373 und 1845 |
| Vergleich 3480 Gefahrzettel | `/un/3480/vergleich` | ⚠️ | ADR/RID 9A, IMDG „9“. Prüfen, ob die IMDG-Daten der BAM das Lithium-Label 9A nicht führen (wird ohnehin „nicht verglichen“) |
| Stoffsuche EN/DE | `/suche` mit 18 Begriffen | ⚠️ | Gut: „dry ice“, „Trockeneis“, „biological substance“, „Kategorie B“, „lithium ion“, „hydrochloric“. Schlecht: „Salzsäure“ findet nur 1798, nicht 1789. „Natronlauge“, „diagnostic“ und „UN3373“ (ohne Leerzeichen) finden nichts. „battery“ findet 3090/3480 nicht. „lithium“ und „Batterie“ zeigen genau 20 Treffer ohne Hinweis auf weitere (Kappung? prüfen). Die Batterien stehen bei „lithium“ ganz unten. Bei „Trockeneis“ fehlt der ICAO-Chip (Chip zeigt den Namens-Treffer, nicht die Verfügbarkeit, und das ist missverständlich) |
| EN-Sprache | DE/EN-Umschalter auf UN-Seite | ⚠️ | Nur die Daten wechseln. Navigation, „zurück“, „Alle Modi vergleichen“, Seitentitel („UN 3481 — LITHIUM-IONEN-BATTERIEN IN AUSRÜSTUNGEN“) und ADR-Bemerkungen bleiben deutsch (`icao-3481.png`). Die Sprache wird nicht seitenübergreifend gemerkt |
| ADR-Text | `/regelwerk/adr?sv=188`, `?un=1845`, Suche „5.5.3“, „Trockeneis“ | ✅/⚠️ | Desktop überzeugt: Treffernavigation, Inhaltsverzeichnis, 1.1.3.9 → 5.5.3 sofort gefunden (`adr-search-5_5_3.png`). Im Inhaltsverzeichnis steht „\*\*Kapitel 1.11\*\*“ mit rohen Markdown-Sternchen. Mobil (375) ist die Toolbar gequetscht: Das Suchfeld zeigt nur „1“ statt „188“, und der Sprung zu SV 188 landet sichtbar bei Absatz e) statt am SV-Anfang (prüfen) (`adr_sv_188-375.png`) |
| Mobil UN-Seite | 375, ICAO | ⚠️ | Man muss erst Suchfeld, Info-Banner, Sprachblock und Verfügbarkeitskarten durchscrollen, bevor die Daten kommen (~1,5 Bildschirmhöhen). Das „🌐“-Icon rendert als leeres Kästchen (Font/Emoji; prüfen, ob es nur an meiner Umgebung liegt) |

## Stärken

- **Datenqualität ICAO-Spalten 11–14:** Alle geprüften Passagier-/Fracht-PIs und Höchstmengen (1170, 1219, 1789, 1823, 1845, 1993, 2814, 3090, 3291, 3480, 3481) stimmten mit meinem Wissen überein. FORBIDDEN wird klar ausgewiesen.
- **A-Sondervorschriften im englischen Volltext** (A88, A99, A154, A201 …) direkt aufklappbar. Das spart mir das Blättern im DGR.
- **Multimodaler Vergleich** mit klarer Legende („nicht vorgesehen“ vs. „nicht verglichen“ vs. „?“) und Quellenangabe/Disclaimer.
- **ADR-Volltext** mit schneller Suche, Trefferliste und Sprung aus SV/UN-Nummer. Für Kurier-/Straßenfragen sehr praktisch.
- **Englische Suche** funktioniert für die meisten Stoffnamen, und die Suche ist mehrsprachig (DE/EN/FR in den Treffern).
- **Saubere Sperrlogik und faire Upsell-Kommunikation**, gutes mobiles Modal.
- **Datenschutz-Grundhaltung** (kein Tracking, Hosting in DE) passt gut zu uns.

## Schwächen & Bugs

1. **ICAO-LQ fehlt / wird als „nicht vorgesehen“ bezeichnet**: `/un/1170/vergleich`, 1280 und 375 (`vergleich-1170-1280.png`, `vergleich-1170-375.png`), dazu das ICAO-Tab aller Klasse-3/8-Stoffe. Fachlich falsch und für Luftfracht kritisch. Die Daten liegen laut Schema-Doku vor (`packing_instr_passenger_y`, `max_net_passenger_y`).
2. **Identische Variantenbeschriftungen** bei 3481/3091, 1280 (`icao-3481.png`). Unterscheidungsmerkmal („contained in“ vs. „packed with equipment“) fehlt im Button.
3. **Landing-Mockup**: ICAO-LQ „–“ plus „Mengengrenzen stimmen überein“ (`m-land-3.png`, `landing-1280.png`).
4. **Widersprüchliche Kennzahlen** auf der Landing (2.347+ vs. 16.730) und die Aussage „BAM-zertifiziert“ (`m-land-0.png`).
5. **EN-Modus nur halb englisch** (UI-Chrome, Titel, ADR-Bemerkung bleiben deutsch).
6. **Suche:** keine gängigen Synonyme (Salzsäure, Natronlauge), „UN3373“ ohne Leerzeichen ohne Treffer, keine Singular/Plural-Toleranz („battery“), stille 20er-Kappung (prüfen), Relevanzreihenfolge nach UN-Nummer.
7. **State/Operator Variations nicht sichtbar**, obwohl `state_variations` im Schema steht.
8. **UN 3373 ADR** zeigt ohne Wahlmöglichkeit die Zeile „(nur tierische Stoffe)“/Kemler 606 (prüfen, ob das die richtige Standardzeile ist).
9. **ADR-Viewer mobil**: Suchfeld zu schmal, Sprungposition ungenau (`adr_sv_188-375.png`). Desktop-TOC mit rohem Markdown „\*\*Kapitel 1.11\*\*“ (`adr-search-5_5_3.png`).
10. **Kauf nicht möglich**: „Abo abschließen — demnächst verfügbar“ (`/konto`, `locked-modal-1280.png`).
11. **Datenschutz-Entwurf mit Platzhaltern**, kein AVV/TOM/Subprozessor-Paket.

## Was fehlt mir

**Must**
- ICAO-LQ (Y-PI + Höchstmenge) und ICAO-EQ-Höchstmengen (E-Code → 30 g/1 g usw. ausgeschrieben) im ICAO-Tab und im Vergleich.
- State- und Operator-Variations (mindestens ICAO-State-Variations aus den BAM-Daten; Operator-Variations wären ein IATA-Thema).
- AVV, TOMs, Subprozessorliste, finales Impressum/Datenschutz; Nettopreis, Rechnungskauf, Jahresabo.
- Variantenbuttons eindeutig beschriften.

**Should**
- LQ/EQ-Rechner (Mischpackstücke, Luft vs. Straße), vor allem für EQ-Sendungen aus dem Labor.
- Verpackungsanweisungen als Text (zumindest PI 650, 954, 965–970, Y-PIs) bzw. ein Verpackungs-Browser.
- Kennzeichnungs-/Label-Bilder (UN 3373-Raute, Lithium-Batterie-Zeichen, Kl. 9A, LQ-Y-Zeichen, EQ-Zeichen).
- Shipper's-Declaration-/Beförderungspapier-Generator (Dokumentengenerator).
- Durchgängig englische UI, Sprache gemerkt; Synonymsuche (Salzsäure, Natronlauge, Trockeneis/CO2).
- Mobil: Daten weiter nach oben, Banner einklappbar.

**Nice**
- Favoriten/eigene Stoffliste (unsere ~30 Standardstoffe), Export als PDF.
- Änderungsmonitor 2027 (ADR/ICAO-Wechsel zum 1.1.).
- Team-Lizenzen, SSO.
- KI-Assistent zu SVs.

## Kaufentscheidung

**Heute: Nein. Unter Bedingungen: Ja, als Ergänzung, nicht als IATA-Ersatz.**

Heute ersetzt die Plattform weder mein IATA-DGR-Abo (keine Operator-Variations, keine LQ-Y-PIs, keine PI-Texte, keine Labels), noch spart sie mir genug Zeit bei der Straße/Kurier-Arbeit, weil LQ/EQ-Rechner und Dokumentengenerator fehlen. Der falsche Hinweis „ICAO: begrenzte Mengen nicht vorgesehen“ würde mich in einem Audit in Erklärungsnot bringen.

Akzeptabler Preis heute: ca. 40–60 €/Monat netto (Nachschlagen + ADR-Volltext + Vergleich). Bei 125 € brutto (≈105 € netto) bräuchte ich: korrekte ICAO-LQ/EQ samt State Variations, einen LQ/EQ-Rechner, einen Dokumentengenerator sowie AVV und Rechnungskauf. Dann würde ich es als „schnelles Arbeitstool neben IATA“ beim Einkauf durchbringen, am ehesten mit 2–3 Plätzen im Teampaket.

## Scores 1–10

| Kriterium | Score |
|---|---|
| Nutzen | 5 |
| Datenvertrauen | 6 |
| Bedienbarkeit Desktop | 7 |
| Bedienbarkeit Mobil | 6 |
| Design | 8 |
| Preis-Leistung | 3 |
| Kaufwahrscheinlichkeit | 3 |

## Ein Satz für den Gründer

Zeig im ICAO-Tab die Daten, die du schon in der Datenbank hast (Y-LQ und State Variations), statt „nicht vorgesehen“ zu schreiben, und liefere den LQ/EQ-Rechner. Dann bin ich als Luftfracht-Kundin dabei.
