# Produkttest gefahrgut.org – Persona P5 „Andi Wolf“ (Entsorgungsbetrieb)

Getestet am 23.11.2026 auf `origin/main` (Dev-Server :5185), überwiegend bei 375 px, außerdem bei 320 px und 1280 px.
Screenshots liegen unter `/tmp/claude-1000/-home-dilli-projects-dangerous-goods/d1f1fb99-c91f-4850-8938-73c56eb69568/scratchpad/personas/p5/shots/`.
Unten steht im Text nur der Dateiname, gemeint ist immer dieser Ordner.

## Persona
Andreas „Andi“ Wolf, 55, Betriebsleiter und nebenbei Gefahrgutbeauftragter in einem Entsorgungsbetrieb mit 35 Leuten in Sachsen. Er sammelt per Lkw Altbatterien, Spraydosen, Farbreste, Altöl, Säuren/Laugen und Altverpackungen.
Er arbeitet meistens am Handy. Bisher nutzt er die kostenlose BAM-Datenbank, ein gedrucktes ADR und ruft seinen alten Ausbilder an. Bei ihm zählt jeder Hunderter.

## Erster Eindruck

**Landingpage (375/320):** Sie sieht sauber und professionell aus. Es gibt kein horizontales Scrollen (375 und 320 geprüft). Die Demo mit UN 1203 ist gut, da sehe ich sofort, was ich bekomme.
Es gibt aber ein paar Dinge, bei denen ich als skeptischer Praktiker hängen bleibe:
- **„BAM-zertifizierte Datenbasis“** (Hero, `landing-375-s0.png`): Die BAM zertifiziert keine Datenbanken Dritter. Die Daten *stammen* von der BAM. Das wirkt auf mich übertrieben. → Formulierung prüfen.
- **„2.347+ UN-Nummern / Stoffe“** im Hero, aber weiter unten **„über 16.730 Einträge“**. Als Laie verstehe ich nicht, warum es zwei Zahlen gibt.
- **„Jetzt ausprobieren“, „Demo ohne Anmeldung“ und „Keine Kreditkarte erforderlich“**: Ganz unten heißt es dann aber „Plattform im Aufbau – zum Launch benachrichtigen“, und einen Test-Zugang gibt es nicht. Das ist widersprüchlich.
- **„Dokumentengenerator … rechtssicher“**: Das Werkzeug ist noch gar nicht da und verspricht schon Rechtssicherheit. Das macht mich misstrauisch.
- 5 von 6 Funktionskacheln sind „Demnächst verfügbar“. Ehrlich, aber für mich bleibt heute nur die Stoffsuche.
- In der FAQ steht „Preis steht noch nicht fest“. Im gesperrten Konto steht dann aber 125 €/Monat. Das passt nicht zusammen.
- Für Nicht-Vollprofis gut verständlich: der SEO-Textblock und die FAQ (1000-Punkte, was ist eine UN-Nummer). Zum Thema **Abfall/Entsorgung** steht nirgends ein Wort. Ich fühle mich als Entsorger nicht angesprochen.

**Gesperrtes Konto (375):** Das Modal „Schalte alle Daten frei“ (`locked-dash-dialog.png`) ist klar, mit 4 Nutzenpunkten und dem Preis „125 € pro Monat inkl. MwSt.“. Das Banner oben ist dauerhaft da und kompakt.
- **Sackgasse:** „Jetzt freischalten“ führt zu `/konto#abo`. Dort steht „Abo abschließen — demnächst verfügbar“ (deaktiviert). Ich will kaufen und kann nicht. Kein Hinweis „wir melden uns“, keine Kontaktadresse.
- Die Sperrseiten (z. B. `/un/3480`, `locked-un3480.png`) bestehen aus einem Satz grauer Text auf leerer Fläche. Hier wäre der Platz, um zu zeigen, *was* ich zu UN 3480 bekäme.

**Preis:** 125 €/Monat = **1.500 €/Jahr** (inkl. MwSt.). Für unseren Betrieb ist das so viel wie ein kompletter Schulungstag plus Fortbildung. Die BAM-Datenbank ist kostenlos. Das gedruckte ADR kostet ca. 100–150 € alle 2 Jahre. Es fehlen Angaben dazu, ob der Preis pro Nutzer gilt (meine Disponentin müsste auch rein), ob es einen Jahrespreis gibt und ob Netto-Rechnungen fürs Gewerbe möglich sind.

## Getestete Aufgaben

| Aufgabe | Wie gelöst | Ergebnis | Anmerkung |
|---|---|---|---|
| UN 3480 nachschlagen (Li-Ion zur Entsorgung) | Suche „3480“ → Detail | ✅ | Kl. 9, 9A, BK 2 ×3, Tunnel E, SV 188…376, 377, 636, 677. Plausibel. |
| SV 376 / 377 / 636 lesen | Aufklappen auf UN 3480; „Im ADR-Text öffnen“ | ✅ | Volltext vollständig, auf 375 aber sehr lang (`un-3480-sv-open.png`). Der Sprung in den ADR-Text springt direkt zu SV 376 bzw. 636, top. |
| UN 3090 | Direkt-URL | ✅ | Wie 3480, ohne SV 348. Plausibel. |
| UN 1950 Spraydosen, SV 327 | Suche „Spraydosen“ → **keine Treffer**; „Druckgaspackungen“/„Aerosol“ → ✅ | ⚠️ | Standard-Variante ist „erstickend“ (5A, BK 3). Für meine Sammeldosen brauche ich „entzündbar“ (5F, BK 2 ×3, Tunnel D). Den Variantenwähler gibt es, aber ich musste erst wissen, dass ich umschalten muss (`un-1950.png`, `un-1950-entz.png`). |
| UN 1263 Farbe | Suche „Farbe“ ✅, „Farben“ → **keine Treffer** | ⚠️ | Standard ist VP-Gr. I. Die Variantenknöpfe sind auf dem Handy sehr lange Textblöcke (Dampfdruck, Viskosität …). |
| UN 3082 | URL | ✅ | VG III, LQ 5 L, Tunnel „-“. Plausibel. |
| UN 1760 / 3264 / 3266 | URL | ✅ | Jeweils VG I als Standard, Kemler 88, BK 1. Plausibel. Für Batteriesäure bräuchte ich eher VG II, also Variante wechseln. |
| UN 3509 Altverpackungen | Suche „Verpackungen“ / „3509“ | ✅ | SV 663, BK 4. Anzeige **„BK 4 × 0“** ist für einen Fahrer missverständlich („× 0“?). ICAO „PI: FORBIDDEN“ ist roh auf Englisch. |
| UN 1202 Diesel / Heizöl | Suche „Diesel“ | ✅ | Synonyme Gasöl/Heizöl leicht vorhanden. Einmal 4 s Ladezeit. |
| UN 2794 Starterbatterien | URL | ✅ | Kl. 8, LQ 1 L, SV 295, 598. Plausibel. |
| Suche mit Alltagswörtern | „Altbatterien“, „Spraydosen“, „Altöl“, „Batteriesäure“, „Natronlauge“, „Farben“ | ❌ | Alles **„Keine Ergebnisse“** (`suche-Altbatterien.png` usw.). Die Suche nach „Batterien“ findet 3480 nicht direkt in der Liste (die beginnt mit 2794, 2795 …). Für meine Fahrer am Telefon ist das das Hauptproblem. |
| Suche „Abfall“ in der Stoffsuche | Stoffsuche | ⚠️ | Liefert Fischabfall, Zelluloid-Abfall usw. – für mich nutzlos. Ein Abfall-Einstieg (2.1.3.5, 5.4.1.1.3, SV 636/663) fehlt. |
| ADR-Text: „Abfall“, „2.1.3.5“, „Tunnel“, „1.1.3.6“ | ADR-Text-Suche (375) | ⚠️ | Die Treffer stimmen (254 / 22 / 80 / 21), Trefferliste nach Kapitel gruppiert. „2.1.3.5“ landet aber zuerst auf einem Querverweis in 2.1.3.4.1 statt auf dem Abschnitt selbst. „Tunnel“ landet zuerst im Unfallbericht-Formular. Den Abschnitt 1.9.5 muss ich mir über die Liste suchen. |
| Regelwerksvergleich 3480 / 3082 / 1263 / 1950 | „Alle Modi vergleichen“ | ⚠️ | Für Straße-only bringt er mir wenig. Bei 1950 wird **„IMDG See SP277“ als kritische Abweichung** bei LQ markiert – das ist eine Verweis-Notation, keine echte Abweichung (bitte prüfen). Hier muss ich zudem aus 15 englischen ICAO-Varianten wählen. |
| 1000-Punkte-Frage gemischte Ladung (z. B. 200 kg 3480 + 100 kg 1950-5F + 200 L 1263 VG III) | Kopfrechnen aus „BK × Faktor“ | ⚠️ | Es geht, weil BK und Multiplikator angezeigt werden (600 + 300 + 200 = 1.100 → über 1.000). Ein Rechner fehlt, und genau den bräuchte ich. |
| Mobile Navigation | Burger-Menü (320) | ✅ | Dashboard / Suche / ADR-Text / Konto, klar. |

## Stärken
- **Daten wirken solide** und stimmen bei allen geprüften Nummern mit dem überein, was ich im Kopf habe (Kl., BK, Tunnel, Kemler, LQ, SVs).
- **SV-Volltext direkt am Stoff** und **Sprung in den ADR-Text an die richtige Stelle** (`book-375-sv376.png`, `desk-book.png`). Das spart mir das Blättern im gedruckten ADR und ist für mich der größte Nutzen.
- **ADR-Volltextsuche mit Trefferliste nach Kapiteln** ist auf dem Desktop richtig gut (`desk-book.png`).
- Variantenwähler (Klassifizierungscode/VG) ist vorhanden. Ohne ihn wären 1950/1263 falsch.
- Kein horizontales Scrollen auf 320/375/1280 auf allen getesteten Seiten. Ladezeiten meist ~1,1–1,9 s.
- Ehrliche Hinweise: „kein rechtsverbindlicher Text“, Quelle dl-de/by-2-0.

## Schwächen & Bugs
1. **Bug – Trefferzähler im ADR-Text doppelt:** Nach der zweiten Suche steht dauerhaft „Treffer 1 von 254Treffer 1 von 22“ (der alte Zähler bleibt im selben Element stehen, auch nach 8 s). Seite `/regelwerk/adr`, 375 (`book-375-q-2_1_3_5.png`, `book-375-q-Tunnel.png`, `book-375-counter-later.png`).
2. **Bug – rohes Markdown im Inhaltsverzeichnis:** „\*\*Kapitel 1.11\*\*“ und in der Rendering-Fläche „\*\*STOPPINEN, NICHT SPRENGKRÄFTIG:\*\*“ usw. mit Sternchen. `/regelwerk/adr`, 375 + 1280 (`book-375-start.png`, `desk-book.png`).
3. **ADR-Text auf dem Handy: Suchfeld winzig.** Bei 375 sieht man nur „Im“, bei 320 ist das Feld ~40 px breit, und der „›“-Knopf rutscht in eine zweite Zeile (`book-375-start.png`, `320-book.png`). Das Inhaltsverzeichnis füllt den ganzen ersten Bildschirm, und es gibt keinen Knopf zum Zuklappen/Springen, der mir auffällt.
4. **Stoffsuche kennt keine Alltags-/Abfallbegriffe:** Altbatterien, Spraydosen, Altöl, Batteriesäure, Natronlauge, Farben (Plural) → 0 Treffer. 375, `suche-*.png`.
5. **Kauf-Sackgasse:** „Jetzt freischalten“ → `/konto` → „Abo abschließen — demnächst verfügbar“ (deaktiviert), kein Kontakt. 375, `locked-konto.png`.
6. **Vergleich 1950:** „IMDG See SP277“ als „kritische Abweichung“ markiert (prüfen, ob Fehlalarm). 375, `vgl-1950.png`.
7. **Anzeige „BK 4 × 0“** (UN 3509) ist ohne Erklärung irritierend. 375, `un-3509.png`.
8. **ICAO-Werte roh auf Englisch** („PI: See 965“, „FORBIDDEN“, „Miscellaneous - Lithium …“) in der sonst deutschen Oberfläche. 375, `un-3480.png`.
9. **Globus-Icon** im Hinweis „Multimodaler Gefahrgut-Vergleich“ erscheint als leeres Kästchen (Emoji ohne Font). 375 + 1280 (`un-1950.png`, `desk-un3480.png`). Prüfen, ob das auch auf echten Geräten passiert.
10. Landing: „BAM-zertifiziert“, „2.347+ vs. 16.730“, „Keine Kreditkarte / Demo ohne Anmeldung“ vs. Warteliste, FAQ „Preis steht nicht fest“ vs. 125 € im Konto (`landing-375-s0.png`).
11. Standard-Variante ist immer die erste Zeile (VG I / „erstickend“). Für Entsorger ist das fast nie der richtige Fall, und auf dem Handy fällt das leicht nicht auf.

## Was fehlt mir
**Must**
- **1000-Punkte-Rechner** (1.1.3.6) für gemischte Sammeltouren, am Handy in 30 Sekunden.
- **Beförderungspapier mit „ABFALL“-Vermerk** (5.4.1.1.3) und den Textbausteinen für SV 636 / 376 („LITHIUMBATTERIEN ZUR ENTSORGUNG“ usw.).
- **Suche mit Alltags- und Abfallbegriffen** (Synonyme: Altbatterien, Spraydosen, Altöl, Batteriesäure, Laugen, Farbreste, Bleiakkus).
- **Kaufmöglichkeit**, die funktioniert, mit Rechnung auf die Firma.

**Should**
- Abfall-Einstieg: 2.1.3.5 / 2.1.3.5.5, 5.4.1.1.3, SV 636/663/376, die typischen Sammeleintragungen auf einer Seite.
- „Darf das so mit?“-Pflichtenprüfer bzw. Zusammenladeverbote (7.5.2) und LQ/EQ-Rechner.
- Handy-taugliche ADR-Textansicht (breites Suchfeld, Inhaltsverzeichnis einklappbar).
- Favoriten: meine ~15 Standardnummern auf einen Tipp.

**Nice**
- Schriftliche Weisungen zum Ausdrucken, Fahrer-Ansicht zum Weiterleiten per Link/WhatsApp.
- Änderungsmonitor ADR 2027 („was ändert sich für meine Stoffe“).
- Später KI-Assistent – aber nur mit Quellenangabe.

## Kaufentscheidung
**Zu 125 €/Monat: Nein.** Im heutigen Stand bekomme ich die BAM-Daten (die ich kostenlos habe) schöner aufbereitet, dazu SV-Volltext und ADR-Suche. Das ist nett, aber keine 1.500 €/Jahr wert.
**Unter Bedingungen ja:** wenn 1000-Punkte-Rechner und Beförderungspapier mit Abfall-Vermerk fertig sind und die Suche meine Wörter versteht. Dann würde ich **ca. 30–40 €/Monat (Jahresabo ~400 €, netto, 2–3 Nutzer)** zahlen. 125 € passen eher zu Speditionen oder externen Beratern mit vielen Kunden.
**Was mich zum Wechseln bringt:** Wenn ich einem Fahrer am Telefon in unter einer Minute sagen kann „passt, 1000 Punkte nicht überschritten, schreib ABFALL aufs Papier“ – ohne meinen Ausbilder anzurufen.

## Scores (1–10)
| Kriterium | Punkte |
|---|---|
| Nutzen (für mich, heute) | 4 |
| Datenvertrauen | 8 |
| Bedienbarkeit Desktop | 7 |
| Bedienbarkeit Mobil | 5 |
| Design | 7 |
| Preis-Leistung | 2 |
| Kaufwahrscheinlichkeit (heute) | 2 |

## Ein Satz für den Gründer
„Die Daten stimmen und der SV-Sprung ins ADR ist klasse – aber solange ich einem Fahrer im Hof nicht in einer Minute sagen kann, ob die Fuhre unter 1000 Punkten ist und was aufs Papier muss, zahle ich keine 125 € im Monat für eine hübschere BAM-Datenbank.“
