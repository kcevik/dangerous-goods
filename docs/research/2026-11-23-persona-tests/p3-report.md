# Persona-Test P3 – Dr. Thomas Brandt (externer Gefahrgutbeauftragter)

Getestet am 23.11.2026 gegen `origin/main` (6822271), lokaler Dev-Server :5183, Chromium (playwright-core).
Screenshots: `/tmp/claude-1000/-home-dilli-projects-dangerous-goods/d1f1fb99-c91f-4850-8938-73c56eb69568/scratchpad/personas/p3/shots/`
(im Folgenden kurz `shots/…`).

## Persona

Dr. Thomas Brandt, 61, selbstständiger externer Gefahrgutbeauftragter und Trainer (Ingenieurbüro bei Stuttgart, ~20 Mandanten: Lackhersteller, Werkstätten, Entsorger, Labor, Batterierecycler, Kleinversender).
Schreibt alle Jahresberichte, macht Audits und Unterweisungen nach 1.3, kennt das ADR auswendig und zitiert nur mit Fundstelle.

## Erster Eindruck

**Landing (1280 / 768):** Sauber, modern, auf dem Tablet ordentlich umbrechend, kein horizontales Scrollen (`shots/l-hero-1280.png`, `shots/l-hero-768.png`, `shots/l-cmp-768.png`). Inhaltlich wirkt sie aber nach Marketing und nicht nach Fachleuten:
- „**BAM-zertifizierte Datenbasis**“: Die BAM zertifiziert keine Datenbasis. Die Daten *stammen* von der BAM. Für mich ist das eine Formulierung, die mir sofort Misstrauen macht.
- „**2.347+ UN-Nummern**“ (Hero und Stoffsuche-Kachel) gegenüber „16.730 Einträgen“ weiter unten. Das passt für mich nicht zusammen, denn die UN-Liste hat über 3.000 Nummern. Bitte prüfen.
- „100 % BAM-Datenbasis“, aber der ADR-Text stammt aus der österreichischen BMIMI-Fassung. „5 Regelwerke“, aber die ADN-Spalte ist leer.
- Funktionen, die es noch nicht gibt, werden mit „rechtssicher“ und „normkonform“ beworben (Dokumentengenerator, Rechenwerkzeuge), nur mit „Demnächst verfügbar“ markiert. Für einen Gefahrgutbeauftragten ist „rechtssicher“ ein Reizwort.
- FAQ „Was kostet gefahrgut.org?“ sagt: „**Der Preis steht noch nicht fest**“. In den AGB § 4 und in der App stehen aber **125 €/Monat**. Das widerspricht sich.
- FAQ 1000 Punkte: „Bleibt die Summe **unter** 1.000 Punkten“. Korrekt ist „nicht überschreitet“ (≤ 1000). Gerade bei *der* Kernregel darf so etwas nicht stehen. Die FAQ beschreibt SV 640 als „Beförderungsbedingungen bestimmter Stoffgruppen“. Tatsächlich betrifft SV 640 die Unterscheidung der Tankcodierung und den Vermerk im Beförderungspapier.
- Footer-Links „Dokumentation“, „ADR-Leitfaden“, „Änderungsmonitor“ und „BAM-Datenbasis“ zeigen auf `#` und sind damit tot.
- Im Demo-Kasten steht das Icon vor „Multimodaler Gefahrgut-Vergleich“ als leeres Kästchen (Emoji 🌐 ohne Font) (`shots/l-demo-1280.png`). Möglicherweise liegt das an der Testumgebung, trotzdem prüfen.
- Die Verpackungsanweisungen im Demo-Datenblatt laufen zusammen: „P001IBC02R001“ (in der Vergleichstabelle dagegen korrekt „P001, IBC02, R001“).

**Rechtliches und Vertrauen:** Impressum, AGB, Datenschutz und Widerruf sind alle als „**Entwurf – noch nicht gültig**“ markiert und voller Platzhalter `[[Firma und Rechtsform]]`, `[[E-Mail-Adresse]]` usw. (`shots/impressum-1280.png`). **Ich sehe nicht, wer dahintersteht.** Ohne Firma, Anschrift und Ansprechpartner bestelle ich nichts und empfehle nichts. Positiv: Die Quellenangaben sind vorbildlich. BAM GEFAHRGUT steht mit dl-de/by-2-0 und Änderungsvermerk im Impressum, im Footer und unter jeder Vergleichstabelle. Der ADR-Text wird als BMIMI-Fassung „Ausgabe 2026-01, aktualisiert am 02.01.2026“ benannt, mit dem Satz „kein rechtsverbindlicher Text“. In den AGB fehlt die Mindestlaufzeit noch als Platzhalter. Eine **Update-Politik** fehlt: Wann kommt ADR 2027, wie lange bleibt 2025 parallel verfügbar? Gesagt wird nur „jährlich aktualisiert“.

**Gesperrtes Konto:** Der Ablauf ist klar und sauber gemacht. Es gibt ein gelbes Banner mit Preis, ein Modal „Schalte alle Daten frei“ mit vier konkreten Leistungen und 125 € inkl. MwSt. (`shots/lk-modal-1280.png`). Die Demo zeigt nur UN 1203, gesperrte Seiten erklären freundlich warum (`shots/lk-un1263-768.png`). **Aber:** „Jetzt freischalten“ führt nach `/konto#abo`, und dort steht nur der deaktivierte Knopf „Abo abschließen — demnächst verfügbar“. Das ist eine Sackgasse: Ich kann nicht kaufen, nicht anfragen und keinen Kontakt aufnehmen. Auf dem Tablet (768) öffnet sich das Modal nicht automatisch (am Desktop schon). Ob das beabsichtigt ist, sollte geprüft werden.

**Preis:** 125 €/Monat inkl. MwSt. = 1.260 € netto/Jahr. Damit liegt das Angebot im Bereich etablierter Fachverlags-Datenbanken mit verbindlichem Text, Änderungsdienst und Formularen. Für den heutigen Funktionsumfang (Nachschlagen plus Vergleich plus inoffizieller ADR-Text) ist das zu viel.

## Getestete Aufgaben

| Aufgabe | Wie gelöst | Ergebnis | Anmerkung |
|---|---|---|---|
| Landing als Interessent lesen (1280/768) | Seite komplett gelesen | ⚠️ | Responsiv sauber. Marketing-Aussagen fachlich angreifbar (BAM-zertifiziert, 2.347+, „unter 1.000“), Preis-Widerspruch FAQ und AGB, tote Footer-Links |
| Wer steckt dahinter? (Impressum/AGB/DSGVO) | `/impressum`, `/agb`, `/datenschutz`, `/widerruf` | ❌ | Alles Entwurf mit Platzhaltern, kein Betreiber erkennbar. Quellen- und Lizenzangaben dagegen vorbildlich |
| Gesperrt: Was sehe ich, wie kaufe ich? | Login gesperrtes Konto, Modal, „Jetzt freischalten“ | ⚠️ | Verständlich und freundlich. Der Kauf endet aber an einem deaktivierten Knopf |
| UN 1263 Farbe (Lackhersteller) | `/un/1263`, Varianten, Vergleich | ✅ | VG I: LQ 500 ml, E3, BK 1, D/E, SV 163/367/650, P001 – plausibel. Sechs Varianten sauber wählbar. Variantentexte sehr lang |
| UN 1203 Benzin | `/un/1203` + `/vergleich` | ⚠️ | ADR-Daten plausibel (LQ 1 L, E2, BK 2, 33, D/E, SV 243/534/664). Datenblatt zeigt „P001IBC02R001“ ohne Trennzeichen. IMDG zeigt nur P001, IBC02 fehlt (prüfen) |
| UN 3480 / 3090 Lithium (Batterierecycler) | UN-Seite + Vergleich | ✅/⚠️ | ADR: 9A, M4, LQ 0, E0, BK 2, Tunnel E, SV 188…677 – plausibel. ICAO PAX „FORBIDDEN“, Fracht „See 965/968“ korrekt. ICAO-Gefahrzettel bei 3090 (Lithium-*Metall*) lautet „Lithium or sodium ion batteries“ – prüfen |
| UN 2794 Batterien nass (Werkstatt) | UN-Seite + Vergleich | ✅ | LQ 1 L, E0, BK 3, 80, E, SV 295/598, ICAO 870 30/400 kg – plausibel |
| UN 3291 klinischer Abfall (Labor/Entsorger) | UN-Seite + Vergleich | ⚠️ | Kemler 606, BK 2, SV 565 plausibel. Synonym verstümmelt: „BIO)MEDIZINISCHER ABFALL“ (Klammer fehlt). Verpackungsgruppe wird nicht angezeigt – prüfen |
| UN 1789 Salzsäure | UN-Seite + Vergleich | ✅ | VG II: LQ 1 L, E2, BK 2, 80, E, SV 520, ICAO 851 1 L/855 30 L – plausibel |
| Stoffsuche Fachbegriffe | „Farbe“, „Lithium“, „Diesel“, „Akku“, „Salzsäure“, „Altöl“ | ⚠️ | Farbe/Lithium/Diesel/Akku gut. „**Salzsäure**“ findet nur 1798 (Königswasser), **nicht 1789**. Suche lässt sich nicht als Link teilen (`/suche?q=` wird ignoriert) |
| Regelwerksvergleich (F-10) | 1203, 1263, 3480, 2794, 1789 | ⚠️ | Tolle Idee, übersichtliche Tabelle (`shots/ac-cmp3480-1280.png`). **Aber fachlich falsche Aussagen:** RID „Kemler-Zahl: In diesem Regelwerk nicht vorgesehen“ (RID kennt die Nummer zur Kennzeichnung der Gefahr). ICAO „Begrenzte Mengen: nicht vorgesehen“ (ICAO hat Y-Verpackungsanweisungen). ICAO „Verpackungsanweisungen: nicht vorgesehen“, obwohl zwei Zeilen tiefer PI 353/364 steht |
| ADR 1.1.3.6 zitieren | TOC, Suche „1.1.3.6“, `?section=1.1.3.6` | ⚠️ | Der Direktsprung meldet „Zu 1.1.3.6 wurde keine Stelle gefunden“. Volltextsuche liefert 21 Treffer, der erste ist das Inhaltsverzeichnis. Über „1.1.3.6.3“ lande ich richtig. Im Text steht das LaTeX-Artefakt „$A_2$“, die Aufzählung in 1.1.3.6.2 bricht um (`shots/bk-q11363-1280.png`) |
| ADR 1.8.3 (eigene Pflichten) | Direktsprung 1.8.3 | ✅ | Landet richtig, sehr gut lesbar (`shots/bk-section-1_8_3-1280.png`) |
| ADR 5.4.1 Beförderungspapier | Direktsprung 5.4.1 (auch 768) | ⚠️ | Gut lesbar. **Die Aufzählungsbuchstaben a) bis k) in 5.4.1.1.1 fehlen** (nur Punkte), daher nicht zitierfähig („5.4.1.1.1 Buchst. f“) (`shots/bk-541-768.png`) |
| ADR 3.4 LQ / 8.6 Tunnel | Direktsprung 3.4/8.6/1.10, Suche „Tunnelbeschränkungscode“ | ⚠️ | Kapitel-Sprünge „nicht gefunden“, über TOC und Volltextsuche aber erreichbar. 8.6.3 sauber gerendert inkl. Tabelle 8.6.2 (`shots/bk-qtunnel5-1280.png`) |
| SV 274 / 640 / 663 | SV-Links von der UN-Seite (neuer Tab), `?sv=` | ✅/⚠️ | Sprung und Markierung funktionieren gut (`shots/bk-sv-640-1280.png`). SV 662/663 werden als Aufzählungspunkte dargestellt, Struktur der Quelle uneinheitlich |
| Inhaltsverzeichnis | TOC-Klick Kapitel 1.10 | ⚠️ | Springt korrekt. TOC zeigt aber rohes Markdown („**Kapitel 1.11**“, „**STOPPINEN, …**“), Teil 2 ist mit Stofflisten durchsetzt. Kapitel 1.4 heißt „Sicherungspflichten“ statt „Sicherheitspflichten“. Trefferlisten-Brotkrumen falsch („Ätzende Stoffe … › 2.2.9.1.10.3“, „Zusätzliche Vorschriften › Kapitel 4.3“) |
| Drucken/Export für Jahresbericht | Druckansicht emuliert | ❌ | Kein Druck-Layout (Navigation/TOC werden mitgedruckt), kein PDF-/CSV-Export, keine Zitierfunktion |
| Tablet beim Kunden (768) | Buch, UN-Seite, Vergleich | ⚠️ | Kein horizontales Scrollen. Im Buch frisst das TOC ein Drittel der Breite, die Lesespalte wird schmal |

## Stärken

- **Quellen- und Lizenztransparenz** (BAM dl-de/by-2-0, Änderungsvermerk, BMIMI-Ausgabe, Disclaimer) unter jeder Tabelle. Das ist besser als bei manchem Wettbewerber.
- **ADR-Daten plausibel:** Für alle von mir geprüften Einträge (1263, 1203, 3480, 3090, 2794, 1789) stimmen LQ, EQ, BK, Kemler, Tunnelcode und SV mit meinem Kenntnisstand überein.
- **SV-Texte direkt beim Stoff** plus Sprung in den ADR-Text mit Markierung. Das spart mir täglich Zeit.
- **Multimodaler Überblick** auf einer Seite, inkl. IMDG-EmS/Stauung/Trennung und ICAO-PI/Mengen. Für den Batterierecycler und das Labor (Luftfracht) sehr nützlich.
- **ADR-Volltextsuche** schnell, Treffer-Navigation (‹ ›, Trefferliste, „Auch beiläufige Treffer“) durchdacht. 1.8.3 und 8.6 lesen sich angenehm.
- Varianten-Auswahl bei n.a.g./Mehrfacheinträgen (1263, 1993, 3291) ist korrekt modelliert.
- Gesperrter Zustand ehrlich und freundlich formuliert, kein Dark Pattern.

## Schwächen & Bugs

1. **Kein Betreiber erkennbar.** Alle Rechtstexte sind Entwurf mit Platzhaltern. `/impressum` @1280/768, `shots/impressum-1280.png`. Für mich ein K.-o.-Kriterium.
2. **Kauf unmöglich.** Modal → `/konto#abo` → deaktivierter Knopf „demnächst verfügbar“. `/dashboard` @1280, `shots/lk-modal-1280.png`.
3. **Vergleich behauptet fachlich Falsches.** RID „Kemler-Zahl nicht vorgesehen“, ICAO „Begrenzte Mengen nicht vorgesehen“, ICAO „Verpackungsanweisungen nicht vorgesehen“ (bei angezeigter PI 353/364). `/un/1203/vergleich` @1280, `shots/ac-cmp3480-1280.png`. Wo die BAM keine Daten liefert, sollte „keine Daten in der Quelle“ stehen statt „im Regelwerk nicht vorgesehen“.
4. **IMDG-Verpackungsanweisungen unvollständig?** Für 1203/1789 nur P001, IBC02 fehlt (prüfen).
5. **ICAO-Gefahrzettel bei UN 3090** lautet „Lithium or sodium ion batteries“ (prüfen).
6. **ICAO-Kachel zeigt nur Cargo-PI** (1203: „PI: 364“, die Passagier-PI 353 und Y341 fehlen in der Übersicht).
7. **Preis-Widerspruch:** FAQ „Preis steht noch nicht fest“ ↔ AGB/App „125 €“. `/` @1280.
8. **Marketing-Aussagen:** „BAM-zertifiziert“, „2.347+ UN-Nummern“, „100 % BAM“, „rechtssicher“, FAQ „unter 1.000 Punkten“. `/` @1280, `shots/l-hero-1280.png`.
9. **ADR-Text nicht zitierfähig:** fehlende Aufzählungsbuchstaben (5.4.1.1.1), „$A_2$“ (1.1.3.6.2), rohes Markdown im TOC, falsche Brotkrumen, Kapitel-Direktsprünge (1.1.3.6, 3.4, 8.6, 1.10) „nicht gefunden“. `/regelwerk/adr` @1280/768, `shots/bk-section-1_1_3_6-1280.png`, `shots/bk-541-768.png`.
10. **Datenblatt:** Verpackungsanweisungen ohne Trennzeichen („P903P908P909…“). `/un/3480` @1280, `shots/ac-un3480-1280.png`.
11. **Synonym-Fehler:** „BIO)MEDIZINISCHER ABFALL“ (öffnende Klammer verloren). `/un/3291` @1280, `shots/ac-un3291-1280.png`.
12. **Suche:** „Salzsäure“ findet UN 1789 nicht. `/suche?q=` wird ignoriert, Suchen lassen sich nicht verlinken.
13. **Tote Footer-Links** (`#`) und Emoji-Kästchen im Demo-Kopf. `/` @1280, `shots/l-demo-1280.png`.
14. **Kein Druck-Layout.**

## Was fehlt mir

**Must (sonst kaufe ich nicht)**
- Vollständiges Impressum, gültige AGB, Kaufprozess mit Rechnung (netto ausgewiesen, Firmenkunde).
- Korrekte Aussagen im Vergleich („nicht vorgesehen“ nur, wo es wirklich so ist). Sonst steht mein Name unter einer falschen Aussage.
- **Zitierfähige Fundstellen:** jede Angabe mit „ADR 2025, 3.2 Tab. A Sp. 15“ und Deep-Link auf die Stelle. Absatz-Direktsprung muss für jede Nummer (1.1.3.6, 3.4, 8.6) funktionieren, Buchstaben-Gliederung muss erhalten bleiben.
- **Klare Editions- und Update-Politik:** Wann kommt ADR 2027 (ab 1.1.2027 freiwillig, Pflicht ab 1.7.2027), wie lange bleibt 2025 parallel verfügbar?
- **Druck/PDF-Export** von Stoffdatenblatt und Vergleich (für Kundenakte und Jahresbericht).

**Should**
- **„Was ändert sich 2027?“** – Änderungsmonitor 2025 → 2027 je UN-Nummer und je Absatz. Das ist für Schulungen im Herbst mein größter Aufwand.
- **1000-Punkte-Rechner** (mit Ausdruck für die Kundenakte), **LQ/EQ-Rechner**.
- **Mandanten-/Projektlisten:** Stofflisten je Kunde („Lackfabrik X: 1263, 1866, 1993 …“), mit Hinweis, wenn sich bei 2027 etwas ändert.
- **Jahresbericht-Unterstützung** (GbV § 8): Vorlage, Mengen- und Ereigniserfassung je Mandant.
- RID/ADN vollständig (ADN fehlt ganz) und GGVSEB-Bezüge.
- Mehrplatz-/Beraterlizenz (ich plus Assistentin), Kundenzugänge zum Weiterverkauf.

**Nice**
- Schulungsmaterial (Folien je Kapitel, Fragenkatalog für Unterweisung nach 1.3) und Zertifikatsvorlage.
- Dokumentengenerator (Beförderungspapier, schriftliche Weisungen), SV- und Verpackungs-Browser.
- Favoriten, Notizen an Absätzen, Lesezeichen im ADR-Text.
- Offline/PWA für Kundentermine ohne Netz.

## Kaufentscheidung

**Heute: Nein.** Kein Impressum, kein Kaufprozess, und der Vergleich enthält Aussagen, die ich als falsch erkenne. Meine Kunden würden genau das hinterfragen.

**Unter Bedingungen ja:** Sobald Betreiber und AGB stehen, die „nicht vorgesehen“-Fehler korrigiert sind, Fundstellen zitierfähig sind und ADR 2027 verbindlich zugesagt ist, würde ich ein Jahresabo testen.

- **Akzeptabler Preis für mich (heutiger Umfang):** 39–49 € netto/Monat bzw. ~450 € netto/Jahr. Mit Änderungsmonitor 2027, 1000-Punkte-Rechner, Mandantenlisten und PDF-Export wären **79–99 € netto/Monat** für mich als Berater vertretbar, mit zweitem Platz für die Assistentin.
- **Empfehlung an Mandanten:** heute nicht. Später ja, für Versender mit wenigen Stoffen als „Nachschlage-Lizenz“ für **15–25 €/Monat**. 125 € zahlt keine Werkstatt und kein Kleinversender für ein Nachschlagewerk. Ideal wäre eine Beraterlizenz, mit der ich meinen Kunden Lesezugänge zuteilen kann.

## Scores 1–10

| Kriterium | Score |
|---|---|
| Nutzen | 6 |
| Datenvertrauen | 5 |
| Bedienbarkeit Desktop | 7 |
| Bedienbarkeit Mobil/Tablet | 6 |
| Design | 8 |
| Preis-Leistung | 3 |
| Kaufwahrscheinlichkeit (heute) | 2 |

## Ein Satz für den Gründer

Zeigen Sie mir, wer Sie sind, und machen Sie jede Angabe mit Fundstelle zitierfähig. Ein Gefahrgutbeauftragter kauft Verlässlichkeit, nicht Design, und ein einziges falsches „im Regelwerk nicht vorgesehen“ kostet Sie mehr Vertrauen, als zehn neue Funktionen zurückbringen.
