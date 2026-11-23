# Persona-Test P1 – Sabine Krüger (Gefahrgutbeauftragte, Chemiehandel)

Screenshots: `/tmp/claude-1000/-home-dilli-projects-dangerous-goods/d1f1fb99-c91f-4850-8938-73c56eb69568/scratchpad/personas/p1/shots/`
(alle Pfade unten sind relativ zu diesem Ordner). Getestet am 23.11.2026, lokal `pnpm dev` auf origin/main, Chromium headless.

## Persona
Sabine Krüger, 48, interne Gefahrgutbeauftragte bei einem Chemikalienhändler (180 MA, bei Ludwigshafen). Vor allem ADR-Teilladungen der Klassen 3, 8, 6.1 und 9, ab und zu IMDG-Container über Hamburg. Sie arbeitet heute mit dem gedruckten ADR, der kostenlosen BAM-Datenbank und einer teuren Desktop-Software.

## Erster Eindruck

**Landing (1280 / 375):** Sieht modern und ordentlich aus. Die Botschaft „Alle Gefahrgutvorschriften. Ein Werkzeug.“ verspricht aber mehr, als heute da ist: 5 der 6 Funktionskacheln tragen „Demnächst verfügbar“. Bei 1280 ist die rechte Hälfte des Hero leer (`landing-1280-top.png`). Mobil sauber, kein horizontales Scrollen (`landing-375-top.png`).

Was mich als Fachfrau stört oder verwirrt:
- **„BAM-zertifizierte Datenbasis“**: Die BAM zertifiziert keine Software-Daten. Die Daten stammen *aus* der BAM-Datenbank. Diese Formulierung würde ich als irreführend empfinden.
- **„2.347+ UN-Nummern“** passt nicht zu „16.730 Einträge“ und ~3.374 ADR-Datensätzen. Woher kommt die Zahl?
- „Stoffsuche … nach UN-Nummer, Name **oder Synonym**“: Synonyme funktionieren in der Praxis nicht (siehe unten).
- Laut FAQ steht der **Preis noch nicht fest**. Im gesperrten Konto steht dagegen „125 € pro Monat“. Das widerspricht sich.
- „Demo ohne Anmeldung / Keine Kreditkarte erforderlich“, gleichzeitig zeigen die CTAs nur „Zum Launch benachrichtigen“. Was gilt denn jetzt?
- Dass ADN als Regelwerk ausgewiesen ist, obwohl es keine Daten dazu gibt („5 Regelwerke“), wirkt aufgebläht.

**Gesperrtes Konto:** Banner und Modal sind klar und freundlich (`locked_dashboard-1280.png`, mobil `locked_un_1993-375.png`). Ich sehe sofort, was ich bekomme: 16.730 Einträge, 1.354 SV, Vergleich und ADR-Text. Aber:
- „Jetzt freischalten“ führt auf `/konto#abo`, und dort steht nur der deaktivierte Knopf „Abo abschließen — demnächst verfügbar“. Das ist eine **Sackgasse**. Ich will kaufen und kann nicht.
- Die Demo zeigt nur UN 1203. Ich hätte gern eine meiner eigenen Nummern probiert (z. B. 3 Anfragen frei).
- **Preis 125 €/Monat inkl. MwSt.:** Für B2B erwarte ich Netto-Preise und einen Jahrestarif. 1.500 €/Jahr liegt über meiner Freigabegrenze von 1.000 €. Das müsste also zum Chef, und dafür ist der heutige Umfang zu dünn.

## Getestete Aufgaben

| Aufgabe | Wie gelöst | Ergebnis | Anmerkung |
|---|---|---|---|
| UN 1993 Gefahrgutdaten ADR (Var. VP I–III) | /suche „1993“ → Tool | ✅ | Varianten-Auswahl nach VP-Gruppe/Dampfdruck ist gut. VP I: E3, LQ 0, BK 1 ×50, Tunnel D/E, SV 274 |
| UN 1830 Schwefelsäure: BK, Tunnel, LQ | /un/1830 | ✅ | C1, II, LQ 1 L, E2, BK 2 ×3, Tunnel E, Kemler 80: plausibel |
| UN 1830 Seefracht (IMDG) | /un/1830/vergleich | ✅ | EmS F-A/S-B, Staukat. C, SW15, SG36/SG49. Trennung und Stauung sieht man nur im Vergleich, nicht im IMDG-Tab |
| UN 3082 + SV 375 (5-l/5-kg-Freistellung) | /un/3082, SV aufklappen | ✅ | SV-Volltexte ADR und IMDG sauber. Packanweisungen P001/IBC03/LP01/R001 korrekt. BK 3 ×1, Tunnel (-) |
| UN 3082 IMDG: Meeresschadstoff | IMDG-Tab | ⚠️ | Kennzeichen „Marine Pollutant (P)“ fehlt, ebenso Trenngruppen im Tab (`imdg-3082-1280.png`) |
| UN 2794 Batterien | /un/2794 | ✅ | C11, LQ 1 L, E0, P801, BK 3, Tunnel E, SV 295/598 |
| UN 2789 Eisessig, Nebengefahr | /un/2789 | ✅ | Zettel 8+3, Kemler 83, Tunnel D/E |
| UN 2810 (6.1, VP I) | /un/2810 | ✅ | T1, E5, LQ 0, BK 1 ×50, C/E, Kemler 66 |
| UN 1170 / 1090 / 1230 per Name | /suche „Aceton“, „Methanol“ | ✅ | Treffer schnell, Varianten-Badges „VG II · III“ hilfreich |
| Natronlauge / Salzsäure per Handelsname | /suche „Natronlauge“, „Salzsäure“ | ❌ | „Natronlauge“: keine Ergebnisse. „Salzsäure“ findet nur UN 1798, **nicht UN 1789** (Chlorwasserstoffsäure). Für einen Chemiehändler täglich relevant (`suche-Natronlauge-1280.png`, `suche-Salzs_ure-1280.png`) |
| Suche „1830“, „umweltgefährdend“ – Modus-Badges | /suche | ⚠️ | In den Trefferkarten fehlt das ICAO-Badge für 1830, 3077 und 3082, auf der Detailseite ist ICAO aber vorhanden (PI 855/964). Badges irreführend → **check** |
| ADR-Text: 1.1.3.6, 1.8.3.6 Unfallbericht, Jahresbericht, 3.4.7 | /regelwerk/adr Suche | ⚠️ | Findet alles in ~1 s. Der erste Treffer für „1.1.3.6“ landet aber im Inhaltsverzeichnis-Text, nicht beim Abschnitt (21 Treffer durchklicken). Sichtbare `**`-Markdown-Reste (`adr-search-Unfallbericht-1280.png`) |
| Dashboard / Konto | /dashboard, /konto | ⚠️ | Dashboard enthält nur Links + „in Vorbereitung“. Keine Favoriten, keine zuletzt gesuchten Stoffe. Konto zeigt „aktiv seit 23.11.2026“ |
| Mobil: Detail, Vergleich, ADR-Text (375) | Telefon-Breite | ⚠️ | Kein horizontales Scrollen. Bis zu den eigentlichen Daten muss man aber sehr weit scrollen. Das ADR-Suchfeld ist nur ~55 px breit |

## Stärken
- **Datenqualität wirkt solide.** Alle stichprobenartig geprüften ADR-Werte (BK/Faktor, Tunnelcode, LQ/EQ, Kemler, Packanweisungen, Zettel) waren für meine Alltagsstoffe plausibel. Die Quellenangabe (dl-de/by-2-0, „kein rechtsverbindlicher Text“) ist vorbildlich.
- **Regelwerksvergleich** (`cmp-1830-1280.png`): ADR, RID, IMDG, ICAO und UN nebeneinander, inklusive EmS, Stauung, Trennung und ICAO-PI/Höchstmengen. Das hat meine Desktop-Software so nicht. Der Filter „Nur Abweichungen“ und die Legende sind gut.
- **Variantenwahl** (VP-Gruppe, Dampfdruck, Viskosität) bei n.a.g.-Einträgen ist fachlich sauber gelöst.
- **SV-Volltexte** in DE/EN/FR inline aufklappbar, mit Sprung „Im ADR-Text öffnen“.
- **ADR-Volltextsuche** ist schnell, mit Trefferliste und Vor/Zurück. Für 1.8.3.x (meine GB-Pflichten) sehr praktisch.
- Kein horizontales Scrollen auf 375 px, aufgeräumtes Design.

## Schwächen & Bugs
1. **Kaufstrecke tot:** „Jetzt freischalten“ (Banner + Modal) → /konto#abo → Knopf „Abo abschließen — demnächst verfügbar“ ist deaktiviert. Seite: /dashboard, 1280 + 375, `locked_dashboard-1280.png`, `locked_konto-1280.png`.
2. **Widersprüchlicher Preis:** Die FAQ der Landing sagt „Preis steht noch nicht fest“, das gesperrte Konto zeigt 125 €/Monat. Preis brutto statt netto (B2B).
3. **Synonym-/Handelsnamen-Suche fehlt:** Natronlauge, Salzsäure (→ UN 1789) werden nicht gefunden. Gleichzeitig verspricht die Landing eine Suche „nach Synonym“. /suche, 1280.
4. **Modus-Badges in der Trefferliste unvollständig** (kein ICAO bei 1830, 1831, 3077, 3082, obwohl ICAO-Daten existieren). /suche, 1280, `suche-Schwefels_ure-1280.png` → check.
5. **Vergleich sagt Falsches über Regelwerke:** „In diesem Regelwerk nicht vorgesehen“ bei **RID Kemler-Zahl** (RID kennt die Nummer zur Kennzeichnung der Gefahr, Tab. A Sp. 20) und bei **ICAO begrenzte Mengen** (ICAO hat LQ/Y-Packanweisungen). Falls die BAM das nur nicht liefert, sollte dort „keine Daten in der Quelle“ stehen, nicht „nicht vorgesehen“. /un/1830/vergleich, 1280, `cmp-1830-1280.png` → check.
6. **IMDG EmS „S-E!“** bei UN 1993 VP I (Vergleich): Das Ausrufezeichen wirkt wie ein Daten- oder Formatartefakt → check.
7. **UN 9999** (ICAO-Platzhalter, keine echte UN-Nummer) taucht in der Suche auf, z. B. bei „Formaldehyd“ und „9999“, mit englischem Fließtext als Name. Verwirrend. /suche, 1280, `suche-9999-1280.png`, `suche-Formaldehyd-1280.png`.
8. **ADR-Viewer:** Die Trefferzähler überlagern sich nach einer zweiten Suche („Treffer 2 von 21Treffer 1 von 2“). /regelwerk/adr, 1280, `adr-search-Unfallbericht-1280.png`.
9. **ADR-Viewer:** Markdown-Reste `**Kapitel 1.11**`, `1.8.3.4**` und OCR-Müll im Inhaltsverzeichnis (z. B. „STOPPINEN“-Listen unter 2.2). Wirkt unfertig, `adr-viewer-1280.png`.
10. **ADR-Viewer mobil:** Das Suchfeld ist ~55 px breit, der Begriff ist abgeschnitten („1.1“), und der aktive Treffer liegt nicht sichtbar im Viewport. `m_adr_search-375.png`.
11. **Fehlendes Icon:** Das 🌐 vor „Multimodaler Gefahrgut-Vergleich“ wird als leeres Kästchen (Tofu) gerendert, auf allen Detailseiten, 1280 + 375 (`detail-3082-1280.png`, `m_un_1993-375.png`).
12. **Mobil-Detailseite:** Sechs gekürzte Varianten-Buttons (Text abgeschnitten „größer a…“) und die Verfügbarkeitskarten stehen vor den eigentlichen Daten. Man muss 2–3 Bildschirme scrollen. `m_un_1993-375.png`.
13. **ADR-Detail unvollständig für die Praxis:** Es fehlen Tankcodes, Sondervorschriften für Verpackung (PP/MP-Zusammenpackung), Beförderung (V, VV, CV, S), Tunnel-/Beförderungs-SV. Gerade CV/S und MP brauche ich beim Verladen täglich.
14. Landing: „BAM-zertifiziert“ (fachlich falsch), „2.347+ UN-Nummern“ (unplausibel), leere rechte Hero-Hälfte bei 1280.
15. Dashboard ohne Nutzen: keine Favoriten, keine Historie, kein „Was ist neu im ADR 2025“.

## Was fehlt mir
**Must**
- 1000-Punkte-Rechner (1.1.3.6) für gemischte Ladungen, inklusive Ausdruck. Das mache ich täglich.
- Beförderungspapier-Generator (5.4.1) mit korrekter Reihenfolge, Tunnelcode, „UMWELTGEFÄHRDEND“, LQ/EQ-Vermerken.
- Vollständige ADR-Tabelle-A-Spalten (Tank, MP, V/CV/S, Sondervorschriften für Beförderung).
- Synonym- und Handelsnamensuche (Natronlauge, Salzsäure, Ätznatron, Kalilauge, Spiritus …).
- Eine funktionierende Kaufstrecke mit Rechnung, Netto-Preis und Jahresabo.

**Should**
- LQ/EQ-Rechner inklusive Kennzeichnung (3.4/3.5).
- Zusammenladeverbote (7.5.2) und IMDG-Trenntabelle als Prüfer: Ich habe gesehen, dass Trenndaten in der DB existieren.
- Favoriten und eigene Stoffliste (unser Sortiment, ~300 Artikel) mit Hinweis bei Regelwerksänderungen (Änderungsmonitor 2027).
- Pflichtenprüfer nach 1.4 / GGVSEB (Verlader, Absender, Befüller).
- Vorlagen für Jahresbericht (§ 8 GbV) und Unfallbericht (1.8.3.6).
- Mehrere Nutzer pro Firma (Vertretung, Versandabteilung).

**Nice**
- SV-Browser, Verpackungs-Browser (P001/IBC02-Texte direkt verlinkt).
- Schulungsunterlagen für die Unterweisung nach 1.3.
- KI-Assistent (nur mit Quellenverweis auf die Fundstelle).
- ERP-API (später, eher für die IT interessant).

## Kaufentscheidung
**Heute: Nein. Unter Bedingungen: ja.** Im jetzigen Umfang bekomme ich nichts, was die kostenlose BAM-Datenbank und mein gedrucktes ADR nicht auch liefern, außer dem schönen Vergleich und der ADR-Volltextsuche. Das sind 2 von ca. 10 Dingen, die ich brauche.
- Akzeptabler Preis heute: **~30–40 €/Monat netto** (bzw. ~400 €/Jahr, ohne Chef-Freigabe).
- Mit 1000-Punkte-Rechner, Beförderungspapier, vollständiger Tabelle A und Synonymsuche: **~80–100 €/Monat netto, Jahresabo, 2–3 Nutzer inklusive**. Dann würde ich beim Chef für einen Wechsel werben.
- **Wechsel von der Desktop-Software** nur, wenn Papiergenerator + 1000-Punkte + Zusammenladung zuverlässig sind und es eine 30-Tage-Testphase mit vollen Daten gibt. Die Daten müssen pünktlich zum Jahreswechsel (ADR 2027) aktualisiert sein.

## Scores 1–10
| Kriterium | Score |
|---|---|
| Nutzen | 4 |
| Datenvertrauen | 7 |
| Bedienbarkeit Desktop | 7 |
| Bedienbarkeit Mobil | 5 |
| Design | 7 |
| Preis-Leistung | 2 |
| Kaufwahrscheinlichkeit | 2 |

## Ein Satz für den Gründer
Die Daten und der Vergleich sind solide. Kaufen werde ich aber erst, wenn mir das Tool Arbeit abnimmt: also 1000-Punkte-Rechner, Beförderungspapier und Zusammenladung statt nur Nachschlagen. Und wenn ich auf „Jetzt freischalten“ klicke, muss ich auch wirklich bezahlen können.
