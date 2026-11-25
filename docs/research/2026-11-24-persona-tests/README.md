# Persona-Test 2026-11-24 — Gesamtbericht

Fünf simulierte Gefahrgutbeauftragte haben den Produktions-Build lokal (Port 3100, echte BAM-Daten, echtes ADR-Buch)
mit dem aktivierten und dem gesperrten E2E-Konto getestet, Desktop (1280) und Handy (375). Einzelberichte: `p1`…`p5-report.md`.

> Simulierte Personas, keine echten Kunden: gute Hypothesen, kein Ersatz für Interviews. Fachliche Auffälligkeiten sind
> „zu prüfen“; die BAM-Daten sind maßgeblich.

| # | Persona | Profil |
|---|---|---|
| P1 | Lars Hoffmann, 42 | GGB Lack-/Farbenhersteller, 350 MA |
| P2 | Aylin Demir, 29 | Berufseinsteigerin, Kontraktlogistik, mobil |
| P3 | Frank Lehmann, 57 | Trainer + externer GGB, 15 Mandanten |
| P4 | Katrin Bauer, 45 | Compliance Lithium/Automotive, Entscheiderin für 4 Nutzer |
| P5 | Marek Nowak, 36 | Spedition, 22 MA, Wettbewerbsvergleicher |

## Scores (1–10)

| | P1 | P2 | P3 | P4 | P5 | Ø | 23.11. |
|---|---|---|---|---|---|---|---|
| Nutzen | 5 | 5 | 6 | 6 | 5 | **5,4** | 5,0 |
| Datenvertrauen | 7 | 6 | 6 | 7 | 7 | **6,6** | 6,2 |
| Desktop | 8 | 7 | 7 | 7 | 8 | **7,4** | 7,0 |
| Mobil | 6 | 6 | 6 | 6 | 7 | **6,2** | 5,6 |
| Design | 8 | 7 | 8 | 8 | 8 | **7,8** | 7,4 |
| Preis-Leistung | 3 | 3 | 3 | 3 | 3 | **3,0** | 2,8 |
| Kaufwahrscheinlichkeit | 3 | 2 | 2 | 2 | 3 | **2,4** | 2,6 |
| Weiterempfehlung | 5 | 4 | 5 | 5 | 5 | **4,8** | — |

**Kernbefund: Das Produkt ist besser geworden, aber niemand würde 125 € brutto zahlen — und niemand *kann* kaufen.**
Daten, Design und Vergleich überzeugen; der Nutzen pro Euro nicht, weil die Arbeitsabnahme (Papiere, Zusammenladung,
LQ/EQ) fehlt und die Kaufstrecke im deaktivierten Knopf endet.

### Zahlungsbereitschaft

| Persona | Heute | Mit Kernfunktionen |
|---|---|---|
| P1 | 40–50 € netto/Nutzer | 90–120 € netto/Firma |
| P2 | 29–39 € netto | 59–79 € netto |
| P3 | ~49 € netto | 79–99 € netto |
| P4 | 125 €/Person abgelehnt | 149–249 € netto/Firma mit 4 Sitzen |
| P5 | 39–49 € netto | 89–119 € netto/Firma |

Muster: **Einzelplatz heute 30–50 € netto; Firmenlizenz mit Werkzeugen 90–250 € netto.** 125 € brutto *pro Konto* liegt
genau zwischen beiden Welten und passt für niemanden. Alle erwarten Nettopreis, Rechnung, Jahresoption, Teamsitze.

## Kritische Befunde (nach Häufigkeit/Gewicht)

1. **Variantenwahl (P1, P2, P4, P5):** Bei UN 1263, 1950, 3481/3091/3171 stehen RID/IMDG/ICAO auf „? Keine eindeutige
   Variante“, die Auswahl ist englisch, ohne Vorauswahl, die Labels beginnen alle gleich und sind mobil abgeschnitten.
   1263 im Rechner: PG I voreingestellt. Der Kernnutzen (Vergleich) bricht genau bei den häufigen Stoffen.
2. **Kaufstrecke (alle):** „Jetzt freischalten“ → deaktivierter Knopf, kein Kontaktweg. Gesperrte Konten sehen nur UN 1203;
   Rechner und ADR-Viewer sind ohne Vorschau gesperrt. AGB mit sichtbarem `[[Mindestlaufzeit]]`, „Konto nur für eine Person“.
3. **Suche (P1):** „Lack“ → Schwarzpulver (Substring in „BLACK POWDER“); „Xylol“, „Toluol“, „Epoxidharz“, „Wasserlack“ → nichts.
   Wirbt mit Synonymsuche. Volltextsuche im Buch ebenfalls reine Teilzeichenfolge (P3: „…beauftragter“ 2 Treffer vs. „…beauftragte“ 16;
   Phrasen in Anführungszeichen nichts).
4. **ADR-Viewer (P3):** `?section=5.4.1.1.1` springt still auf 5.4.1.1.2, Fenster beginnt mit rohem Markdown (Kemler-Tabelle);
   Inhaltsverzeichnis mit Lücken (1.2.1, Kapitel 1.11 ohne Titel, 1.9 ohne Unterabschnitte); kein Zitat-/Permalink-/Druck-Weg.
5. **1000-Punkte-Rechner (P5, zu prüfen):** Bei UN 1965 (Gas) ist die Einheit „L“ wählbar (`UNITS` in `lib/points/points.ts`),
   obwohl der Hinweis Nettomasse in kg verlangt; 20 L ergaben ohne Warnung 60 Punkte. Bei Verflüssigten Gasen ist ein
   Liter keine Masse → mögliche Fehlberechnung. Bei mehrdeutigen BK nur Auswahl ohne Erklärung.
6. **Codes ohne Text (P2, P4):** V14, CV9, MP9, PP87, P903/P908, ICAO „See 965“ ohne Klartext/Grenzen und ohne Sprung ins Buch.
   „Umweltgefährdend“ bei fast jedem Stoff „Keine Angabe (BAM)“.
7. **Sprachen (P3):** EN/FR/TR halb übersetzt, Sprache nicht in der URL, türkischer SV-Text englisch.
8. **Mobil:** Touch-Ziele < 44 px (Checkboxen, Inline-Links, „Weiterlesen“, P1); ggf. 20-px-Checkbox im Rechner (P2, unsicher).
9. **Recht/Einkauf (P4):** kein AVV/TOMs/Subprozessorliste, kein Support-/SLA-Versprechen, Impressum ohne Telefon/USt-ID, B2B netto/brutto unklar.

## Seit 23.11. behoben (mehrfach bestätigt)
ICAO-LQ und FORBIDDEN als kritisch, Fehlalarm UN 1950, 1000-Punkte-Rechner (rechnet in Stichproben korrekt: 999 frei, 1.019 nicht frei;
UN 3480 × 400 kg = 1.200), Synonyme/`?q=`, Trefferzähler, Landing-Claims und Footer-Links, einheitlicher Preis, Betreiber im Impressum,
mobiles Suchfeld, kein horizontales Scrollen bei 375 px. Stichproben UN 1203/1789/2814/3090/3480/1005 stimmen (P3).

## Gewünschte Funktionen (Häufigkeit)
Beförderungspapier-Generator (P1, P5), Zusammenladeprüfer mehrerer UN-Nummern mit Ladungsfazit (P2, P5), Klartext-Checkliste je UN-Nummer (P2),
LQ/EQ-Rechner (P1), Lithium-Assistent (P4), Zitat-Knopf/Permalink/PDF-Export (P3), Teamlizenz + Rechnung + AVV (P1, P4, P5), Probezugang mit eigenen Stoffen (P1, P3).

## Empfehlung
1. Varianten-Auto-Vorauswahl + lesbare Labels (kurzer, unterscheidender Teil zuerst, deutsch).
2. Kaufstrecke überbrücken: „Freischaltung anfragen“ (Mail/Formular) statt totem Knopf; Preismodell klären (netto, Firma/Team, Jahr).
3. Gesperrte Konten: kleine Vorschau auf Rechner und Viewer (Probe statt Wand).
4. Suche: Handelsnamen ergänzen (Xylol, Toluol, Epoxidharz, Wasserlack…), Wortgrenzen statt Substring, Hinweis bei 0 Treffern.
5. Rechner: Einheit auf die nach 1.1.3.6.3 zulässige beschränken oder warnen; BK-Erklärung bei Mehrdeutigkeit.
6. Viewer: Abschnittssprung ehrlich melden, TOC-Lücken, Zitat/Permalink/Druck.
7. Danach Features: Zusammenladung → Papiere → LQ/EQ.

---

# Marketing: Wege, das Produkt zu vermarkten

Ausgangslage: Nische (ca. einige zehntausend GGB in DE/AT/CH), kleine, gut vernetzte, misstrauische Zielgruppe, die Fundstellen zählt.
Vertrauen schlägt Reichweite. Stärken, die sich belegen lassen: **Vergleich ADR/RID/IMDG/ICAO an einem Ort**, Volltext-ADR mit Sprung
aus der UN-Seite, 1000-Punkte-Rechner mit Paragraphenverweisen, Datenbasis BAM, moderner Handy-Auftritt. Nicht behaupten: „rechtssicher“, „immer aktuell“.

## 1. Kostenlose Magneten (Warteliste füllen, Vertrauen aufbauen)
- **Öffentlicher 1000-Punkte-Rechner** (ohne Login, ohne Speichern): meistgenannter Must-have, sucht jeder GGB; Ergebnis mit Paragraphenverweis, Link „im Volltext“ und Hinweis auf die Warteliste. Rankt auf „1000 Punkte Rechner Gefahrgut“ (der alte WordPress-Rechner `/bk-rechner/` hat vermutlich schon Links → 301 hierhin).
- **Öffentliche UN-Seiten als SEO-Landingpages** (nur Kerndaten: Name, Klasse, Zettel, UN-Nummer; Details hinter Login). Suchen wie „UN 1263 Tunnelcode“ sind Alltag. Ersetzt die alten `/un-suche/`-Seiten.
- **Lead-Magnet-PDFs** (ein Dokument, eine Mail): „Checkliste Wareneingang Gefahrgut“, „Lithium-Batterien: ADR/IMDG/ICAO auf einer Seite“, „Was ändert sich 2027?“ (Änderungsmonitor, wenn vorhanden).
- **Blog (196 Beiträge) systematisch verlinken:** jeder Beitrag mit passender UN-Nummer/Regel verlinkt auf die App-Seite; Vergleichsbeispiele als eigene Artikel („UN 1950: Was gilt bei Straße, See und Luft?“).

## 2. Kanäle dort, wo GGB suchen
- **Suchmaschinen:** UN-Nummern, „Gefahrgutbeauftragter Software/Datenbank“, „ADR 2025 online“, „Sondervorschrift 188“, „1.1.3.6“. Strukturierte Daten sind vorhanden.
- **LinkedIn/XING:** Fachposts mit konkreten Fallbeispielen („Dieselbe Batterie, drei Regelwerke“), Gruppen Gefahrgut/Logistik.
- **Verbände & Medien:** DVF, BGL, VCI, IHK-Gefahrgutforen, Fachzeitschriften (z. B. Gefahrgut, Gefährliche Ladung), Newsletter der Berufsgenossenschaften; Gastbeiträge zur ADR-Änderung 2027.
- **Schulungsanbieter und Trainer (P3):** Kooperation/Affiliate; Trainer empfehlen Tools an ihre Teilnehmer — jede Schulung mit 10–20 frisch geprüften GGB (Zielgruppe P2) ist ein Verteiler. Kostenloser Trainer-Zugang für Schulungen gegen Nennung.
- **Messen/Termine:** Fachmesse Gefahrgut-Foren (z. B. transport logistic, LogiMAT), IHK-Gefahrgutbeauftragten-Tage; ein Stand ist teuer, ein Vortrag/Workshop nicht.
- **Berufseinsteiger:** Lernmodus/Prüfungsfälle für die GGB-Prüfung als Einstieg; Lernende werden zu zahlenden Beauftragten.

## 3. Preis- und Paketlogik (aus den Tests)
- **Zwei Stufen statt einer:** Einzelplatz ~39–49 € netto/Monat (Berater, Kleinfirmen) und **Team/Firma ab ~99–149 € netto** mit 3–5 Sitzen, Rechnung, AVV, Jahresrabatt. 125 € brutto pro Konto passt zu keinem.
- **Jahresabo mit Rabatt**, **Gründungspreis** für Warteliste („Early Access, Preis für immer“) — treibt die Eintragung und erzeugt Zahlungsbelege vor Stripe.
- **Berater-/Mandantenlizenz:** Berater bringen Mandanten; ein Berater-Konto mit Sitzen für Mandanten (P3: 15–25 €/Mandant).
- **Probezugang 7–14 Tage** auf echte Daten statt Demo mit einer UN-Nummer: Nutzen muss mit *eigenen* Stoffen erlebbar sein (P1, P3).

## 4. Botschaften, die tragen (und Belege dafür)
- **„Ein Stoff, vier Regelwerke, eine Seite.“** Belegt durch den Vergleich; ICAO-Verbote als kritische Abweichung sofort sichtbar — bei Lithium (P4) das stärkste Argument.
- **„Von der UN-Nummer in den ADR-Text — ein Klick.“** (F-13 ist für den Inhaber die zweitwichtigste Funktion.)
- **„Gebaut für den Lageralltag: auch am Handy.“** Aber erst nach Behebung der Varianten-Labels.
- **Transparenz als Marke:** „Datenbasis: BAM-Datenbank GEFAHRGUT“, Lizenz sichtbar, „kein rechtsverbindlicher Text“ offen — passt zu Misstrauenden wie P3.
- Beweis fehlt noch: Kundenstimmen, Fallstudie, Zahl gesparter Minuten pro Vorgang. Ersten 5 Pilotkunden Gratiszugang gegen Zitat und Feedback.

## 5. Reihenfolge (90 Tage)
1. **Vor jeder Werbung:** Kaufstrecke/Anfrage-Weg, Varianten-Fix, Suche („Lack“, „Xylol“) — sonst verbrennt man die ersten Besucher.
2. Öffentlicher Rechner + SEO-UN-Seiten + Blog-Verlinkung (Dauerläufer).
3. Warteliste mit Early-Access-Preis; DOI-Mail zum Laufen bringen (offener Punkt).
4. 5–10 Pilotkunden (Trainer, kleine Speditionen, ein Lithium-Hersteller) gegen Feedback und Zitat.
5. Trainer-Kooperation + LinkedIn-Fachposts + ein Verbandsartikel zu ADR 2027.
6. Messbar machen (nach Einwilligung): Warteliste-Rate, Rechner-zu-Warteliste-Quote, Probezugang-zu-Kauf.

Grenzen: Preise und Kanäle sind Hypothesen aus simulierten Personas; vor Festlegung 3–5 echte Gespräche führen.
