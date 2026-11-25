# P3 – Frank Lehmann, 57, freiberuflicher Gefahrgut-Trainer und externer GGB (Persona-Test 2026-11-24)

Stand: lokaler Produktions-Build, Waitlist-Modus, echte BAM-Daten + echtes ADR-Buch; Chromium 1280 px und 375 px (mobil),
Konto aktiviert und gesperrt. Nur gelesen und gerechnet, nichts geschrieben. Fachliche Hinweise sind "zu prüfen" (BAM = Wahrheit).

## Profil und Gesamturteil
IHK-Schulungen, Fahrerunterweisungen, externe GGB-Betreuung von 15 Kleinfirmen. Zitiert in jeder Folie Fundstelle (Kapitel/
Abschnitt/SV), will Prüfungsbeispiele, misstraut allem, was seine Quelle nicht nennt.

**Würde ich 125 € pro Monat inkl. MwSt. zahlen? Heute nein.** Der Kern überzeugt mich: ADR-Volltext mit Suche und Sprung,
SV-Volltexte in drei Sprachen, Vergleich mit ehrlichen Lücken-Texten ("Keine Angabe in der Quelle (BAM)"), saubere 1000-Punkte-
Rechnung. Aber: (1) kaufen kann ich nicht, nicht einmal anfragen; (2) ich kann den ADR-Viewer, mein wichtigstes Werkzeug, vor
dem Kauf nicht ansehen (gesperrt = nur UN 1203); (3) nichts ist zitierfähig exportierbar – kein Zitat-Knopf, kein Druck-/PDF-Layout
des Viewers, keine Sammlung für Schulungsunterlagen; (4) das Buch ist OCR (TOC-Lücken, rohe Tabellen) – bei jeder Fundstelle muss
ich ohnehin ins amtliche ADR schauen. Als reines Nachschlagen ersetzt es mir die BAM-Seite plus PDF nur teilweise.

## Scores (1–10)
| Nutzen | Datenvertrauen | Desktop | Mobil | Design | Preis-Leistung | Kaufwahrsch. | Weiterempfehlung |
|---|---|---|---|---|---|---|---|
| 6 | 6 | 7 | 6 | 8 | 3 | 2 | 5 |

Datenvertrauen 6: die vier Stichproben-Stoffe stimmen mit meinem Wissen überein, nichts Falsches gefunden; Abzug, weil die
OCR-Quelle sichtbar fehlerhaft ist und keine Seite eine Fundstelle in Zitierform liefert.

## Was gut ist (konkret)
- **Stichproben UN 1203, 1789, 2814, 3090, 3480, 1005** (/un/…): Klasse, Klassifizierungscode, VG, Gefahrzettel, E-/LQ-Mengen, Kemler,
  Tunnelcode stimmen mit meiner Erinnerung an Tabelle A überein. 1789: Varianten VG II/III schalten *alle* Modi und die Daten um
  (VG III: BK 3 ×1, E1, 5 L, IBC03, PI 856). 1005: BK 1 ×20, ICAO "FORBIDDEN" (▲ im Vergleich). 2814: SV 318 DE/EN/FR vorhanden.
- **SV-Volltexte** auf der UN-Seite aufklappbar, plus "Im ADR-Text öffnen"; Sprachen DE/EN/FR liefern echten Text (318 geprüft).
- **ADR-Viewer** (/regelwerk/adr): lädt in ~0,2–0,5 s; Direktsprünge `?section=1.1.3.6`, `3.4`, `8.6`, `1.9`, `1.10`, `4.1.4.1` landen
  auf der richtigen Überschrift; `?sv=363`, `?sv=188`, `?un=1203` markieren den Treffer (orange) und zentrieren ihn; Trefferliste
  nach Kapitel, "Auch beiläufige Treffer", Vor/Zurück. Hash-Links `/regelwerk/adr#h-1-8-3` funktionieren beim Laden (Scroll 18182 px).
- **Ehrlichkeit:** "Für diese Codes enthält die BAM-Quelle keine Texte", "Kein rechtsverbindlicher Text"-Hinweis auf jeder Seite,
  Hinweis "ADR-Text liegt nur auf Deutsch vor", ADN offen als "keine Daten".
- **1000-Punkte-Rechner:** 1203 × 333 L = 999 → "Freistellung möglich"; +1005 × 1 kg (Faktor 20a) = 1.019 → "nicht möglich", jeweils mit
  Rest-Pflichten samt Paragraphen (5.4.1.1.1 f, 8.1.4, 8.2.3, 8.3.x …) – brauchbar als Unterrichtsbeispiel.
- **Suche:** Handelsnamen (Salzsäure → 1789, Natronlauge, Spraydosen, Altbatterien) mit Hinweis "Über Synonym gefunden"; `UN3373`
  wird erkannt; Lithium (20+) kennzeichnet abgeschnittene Liste ("Treffer laden").
- Mobil 375 px: kein horizontales Scrollen auf allen sechs geprüften Seiten; Suchfeld im Viewer 325 px breit.

## Bugs / Fehlaussagen (Route, Schritte, Beleg)
1. **`/regelwerk/adr?section=5.4.1.1.1`** springt still auf 5.4.1.1.2 (erste sichtbare Überschrift `h-5-4-1-1-2`); das Fenster beginnt
   mit **rohem Markdown** (`| | | |---|---| | 20 | erstickendes Gas …`) – Kemler-Tabelle nicht gerendert. Für mich als Trainer
   (5.4.1.1.1 ist Prüfungsstoff) der schlimmste Fund: kein Hinweis "Absatz nicht als Überschrift gefunden".
2. **Inhaltsverzeichnis:** "1.2.1" und "Kapitel 1.11" ohne Titel; "Kapitel 1.1" und sein Titel erscheinen als zwei getrennte
   Überschriften im Text; Kapitel 1.9 ohne Unterabschnitte (1.9.x vorhanden, TOC-Lücke). OCR-Folgen, aber sichtbar.
3. **Sprachumschaltung (/un/2814, EN/FR/TR):** Abschnittsplaketten bleiben "SV 318" (EN "SP", FR "DS" wären korrekt),
   TR zeigt den SV-Text auf Englisch ohne Hinweis, Footer-Disclaimer bleibt deutsch, Sprache steht nicht in der URL (kein Link
   "dieselbe Seite auf Englisch" für Schulungsunterlagen).
4. **Volltextsuche = reine Teilzeichenfolge:** "Gefahrgutbeauftragter" 2 Treffer, "Gefahrgutbeauftragte" 16 (Endungen!); `"freigestellte Mengen"` mit
   Anführungszeichen 0 Treffer; "Verpackungsanweisung P001" 0, "P 001" 4. Ohne Hinweis auf Wortformen/Schreibweisen.
5. **Variantenleiste UN 2814:** drei Buttons (Name / "in tiefgekühlt verflüssigtem Stickstoff" / "(nur tierische Stoffe)") ohne Erklärung, was
   sie unterscheidet – zu prüfen, ob die BAM-Varianten korrekt benannt sind (gleiche Auffälligkeit wie bei UN 3373 im Vortest).
6. Kleinteile mobil: "Weiterlesen" 80×20 px, "Vorherigen Abschnitt laden" 176×20 px, Checkbox 16×16, Rechner-Links 18 px hoch (Vorgabe 44 px).
   Die Sticky-Leiste (Suche + Treffer + Trefferliste) belegt bei Treffern ~210 px von 800 px. Desktop: Sticky-Leiste verdeckt nach
   Abschnittssprung die erste Textzeile (1.1.3.4.3 halb abgeschnitten).
7. Zu prüfen (Daten): UN 3480 zeigt SV 188, 230, 310, 348, 376, 377, 387, 636, 677 – ob die amtliche Fassung 2025 genau diese Liste
   nennt, habe ich nicht abgeglichen.

## Lücken (nach Wichtigkeit für mich)
1. **Zitierbarkeit:** Zitat-Knopf ("ADR 2025, 1.1.3.6.2, Stand …" + Permalink), Anker auf Absatzebene (nur Überschriften haben `id`),
   URL aktualisiert sich beim Navigieren nicht (nach TOC-Klick bleibt `?section=1.1.3.6`).
2. **Druck/Export des Viewers:** im Code kein `print:`-Layout für /regelwerk; Seitenleiste/Toolbar landen im Ausdruck. Ich brauche
   Abschnitt → PDF/Word mit Fundstellenkopf, am besten Auswahl mehrerer Abschnitte + SV-Texte + Vergleichstabelle für Folien.
3. **Detail-Codes ohne Text:** MP15, TU42, V12, CV13, S14 … nur Code + Link ins Buch. Als Trainer will ich die Klartexte inline
   (Hover/Aufklappen), sonst ist die Tabelle ohne Buch nicht lesbar.
4. **Prüfungsfälle/Beispiele:** keine Beispielsammlung, kein "Aufgabe aus Stoff generieren" (Zusammenladung, 1000 Punkte, SV-Wirkung),
   keine Lesezeichen/Notizen/Favoritenlisten pro Schulung.
5. **Änderungen 2023→2025** (Änderungsmonitor) und ein sichtbarer Datenstand/Importdatum je Seite ("BAM-Stand …, ADR 2025 Fassung …").
6. **Mandantenbetrieb:** Berater-/Mehrfachlizenz, Jahres-/Mandantenberichte, Vorlagen (Unterweisungsnachweis 1.3, Sicherheitsplan 1.10).
7. Beförderungspapier (F-03) und LQ/EQ-Rechner fehlen (laut Landing "demnächst").

## Vertrauen / Recht / Kaufstrecke (gesperrtes Konto)
- Landing nennt keinen Preis (Absicht); FAQ verweist auf AGB/Konto. Preis (125 € pro Monat inkl. MwSt.) sehe ich erst nach Login im Banner
  – aber Registrierung ist nur Warteliste. Ablauf: Banner "Jetzt freischalten" → `/konto#abo` → **deaktivierter Knopf "Abo abschließen –
  demnächst verfügbar"**. Sackgasse ohne Kontaktweg, ohne Testzugang. Als Besucher kann ich also weder testen noch bestellen.
- Gesperrt: ADR-Volltext komplett zu ("nach der Freischaltung verfügbar"), Suche zu, UN 1789 zu; nur UN-1203-Demo (immerhin mit SV-Texten).
  Für mich als Trainer ist der ADR-Viewer der Kaufgrund – ein Auszug (z. B. Kapitel 1.1 oder ein Beispiel-Abschnitt) fehlt als Probe.
- Rechtstexte/AVV/Betreiberangaben in diesem Lauf nicht geprüft.

## Zahlungsbereitschaft
Heute **~49 € netto/Monat** für mich allein (≈ 58 € brutto). 125 € brutto = ~105 € netto wäre ich bei **Schulungsexport + Zitierfunktion +
Prüfungs-/Beispielgenerator** bereit (Richtwert 79–99 € netto Einzelplatz, Jahresabo mit Rechnung). Zusätzlich Mandantenzugang
(Leselizenz für meine Firmen) 15–25 € netto/Monat je Firma. Preis pro Nutzer, nicht pro Firma, und netto mit Rechnung ausweisen.
Änderungen: Kaufweg/Probezugang (7–14 Tage, inkl. Viewer), Zitat + Druck, Netto-Ausweis, Berater-/Mehrnutzer-Stufe.

## Marketing-Sicht
- **Wo ich suche:** Google "ADR 2025 Volltext", "ADR Sondervorschrift 188 Text", "Gefahrgutbeauftragter Software", "UN Nummer Suche
  ADR RID IMDG"; Fachzeitschriften/-portale (Gefahrgut-Fachverlage, VerkehrsRundschau), IHK-Dozenten-Netzwerke, XING-/LinkedIn-Gruppen
  für Gefahrgutbeauftragte, Messen (transport logistic, LogiMAT), Seminar-Mailings der Verbände; Empfehlungen von Kollegen.
- **Überzeugt mich:** Probezugang mit ADR-Viewer; Beleg, dass Text und Fundstellen mit der amtlichen Fassung übereinstimmen
  (Prüfprotokoll, Datenstand, Fehlermeldeknopf je Absatz); Referenz eines IHK-Dozenten; Demo-Video "Schulungsfolie in 3 Minuten".
- **Fehlende Botschaft/Beweis:** "Jede Aussage mit Fundstelle" (heute nur teilweise); Landing sagt nichts zu Zitieren/Export/Schulung;
  Zielgruppe Trainer/externe GGB wird nicht angesprochen; ADR-Text als OCR wird nur im Kleingedruckten erwähnt – offen als
  Qualitätsversprechen ("geprüft gegen amtliche Fassung, Stand …") statt Entschuldigung.

## Regression (README 2026-11-23, kurz)
**Behoben:** ICAO-LQ (Y341 · max 1 L bei 1203); RID-Kemler "Keine Angabe in der Quelle"; ICAO FORBIDDEN als ▲ im Vergleich (1005, 3480);
IBC02 bei 1203/1789 vorhanden; Direktsprünge 1.1.3.6/3.4/8.6/1.10; SV-/UN-Deeplink zentriert; Trefferzähler ohne Doppeltext;
Suchfeld mobil breit; Synonyme (Salzsäure, Natronlauge, Altöl, Spraydosen, Altbatterien); `/suche?q=`; `UN3373`; Abschneiden-Hinweis;
1000-Punkte-Rechner vorhanden und rechnet richtig; Footer-Links echt; Preis-Widerspruch FAQ/App aufgelöst.
**Noch offen:** Kaufen unmöglich; TOC-Lücken ("Kapitel 1.11", "1.2.1"); Zitierfähigkeit + Druck/PDF; EN/TR halb übersetzt (Plaketten "SV", TR-SV englisch);
Variante "nur tierische Stoffe" (2814); Beförderungspapier, LQ/EQ, Team-/Beraterlizenz fehlen.
**Neu:** 5.4.1.1.1 landet falsch + rohe Markdown-Tabelle; Volltextsuche ohne Wortformen/Phrasen; kleine Touch-Ziele im Viewer mobil.
