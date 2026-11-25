# P4 – Katrin Bauer, 45, Leiterin Supply-Chain-Compliance (E-Bike-Akkus, 1.200 MA)

Persona: verschickt UN 3480/3481/3090/3091/3171 per Straße, See, Luft in 40 Länder. Sie müsste eine Lizenz für ihr
4er-Team durch Einkauf, IT-Security und Datenschutz bringen. Getestet: Besucher-Landing, aktives Konto (Desktop 1280,
Handy 375), gesperrtes Konto, Rechtstexte. Fachliche Auffälligkeiten sind "zu prüfen", nicht bewiesen.

## Gesamturteil
**Nein, ich würde heute nicht zahlen, und ich könnte es auch nicht.** Fachlich beeindruckt der Lithium-Fall: UN 3480 zeigt
ADR/RID/IMDG/ICAO nebeneinander, meldet "Passagierflugzeug (ICAO): verboten – nur Frachtflugzeug" als kritische Abweichung,
und die SV 188/376/377 stehen im Volltext (ADR deutsch, ICAO-SV A88 englisch markiert). Das spart mir Blättern in vier Büchern.
Aber: (1) Kaufen geht nicht ("Abo abschließen — demnächst verfügbar"). (2) AGB § 7: "Ein Konto ist nur für eine Person
bestimmt" – mein 4er-Team ist vertraglich ausgeschlossen, es gibt keine Teamlizenz. (3) Kein AVV für Kunden, keine Support-
oder Verfügbarkeitszusage, Mindestlaufzeit in den AGB noch als Platzhalter. (4) Die Packstück-Entscheidung (P903/P908, PI 965–970)
bekomme ich nur als Code, nicht als Text. Für 125 € pro Monat für eine Einzelperson wäre das ein Spielzeug neben dem IATA-Abo.

## Scores (1–10)
Nutzen 6 · Datenvertrauen 7 · Bedienbarkeit Desktop 7 · Bedienbarkeit Mobil 6 · Design 8 · Preis-Leistung 3 ·
Kaufwahrscheinlichkeit 2 · Weiterempfehlung 5

## Was gut ist
- `/un/3480/vergleich` lädt in ~0,7 s, 1 Klick vom Suchtreffer. Kritische Abweichung (ICAO Passagier FORBIDDEN, "See 965" Fracht,
  US-Staatenabweichung "US 3") steht in einem Warnkasten oben; "Nur Abweichungen zeigen" hilft.
- Suche "e-bike akku" findet 3480 und 3481 über das Synonym "Akku", mit Hinweis "Einstufung anhand SDB Abschnitt 14 prüfen"
  (ehrlich). "lithium" liefert 21 UN-Nummern (20 angezeigt, "20 von 21" ist ausgewiesen).
- SV-Volltexte per Klick direkt in der UN-Seite (188, 376, 377, 387 …), IMDG-Tab mit EmS F-A/S-I, Stauung SW19.
- ADR-Buch: Suche "P903" 12 Treffer in ~2 s; Seite 375 px ohne horizontales Scrollen (alle 5 geprüften Routen).
- Rechtstexte benennen jetzt Betreiber, Hosting (STRATO, Frankfurt), Supabase mit SCC, Stripe, Löschfristen (14 Tage Logs).
- Haftung/Disclaimer sind ehrlich: "kein rechtsverbindlicher Text", Verantwortung beim Kunden.

## Bugs / Fehlaussagen
1. **UN 3481/3091 Variantenwahl ist Handarbeit** (`/un/3481/vergleich`): ADR hat zwei Varianten ("in Ausrüstungen" /
   "mit Ausrüstungen verpackt"); RID, IMDG und ICAO zeigen sofort "?  Keine eindeutige Variante", fast jede Zeile "?".
   Für meine Hauptprodukte (Akku im E-Bike vs. lose dazu) ist das der Normalfall, die Zuordnung ist aber offensichtlich
   (Titel identisch). Ohne drei Klicks ist die Tabelle leer. Auch UN 3171: ICAO "?" (equipment/vehicle). Zu prüfen: Auto-Vorauswahl.
2. **Verpackungsanweisungen nur als Code** (`/un/3480`): "P903, P908 … LP906" ohne Text, ICAO nur "→ siehe PI Passagier/Fracht"
   und "See 965". PI 965/966/967 (Zellen/Batterien, Sektion IA/IB/II), Wh-/Gewichtsgrenzen fehlen. Für Lithium die wichtigste
   Information. Im ADR-Buch muss ich selbst suchen (P903: 12 Treffer, kein Direktsprung aus dem Code).
3. **"Umweltgefährdend (Kennzeichen N): Keine Angabe in der Quelle (BAM)"** bei 3480 – für meinen Zweck unklar, ob "nein" oder "unbekannt".
4. **Suche ohne Fachbegriffe:** "fahrrad batterie" 0 Treffer ("Keine Ergebnisse" – korrekt, aber kein Vorschlag "Akku/Lithium").
5. **Mobil** (375): Vergleich ist auf Karten umgebrochen und lesbar, aber 1 Element <40 px auf dem Vergleich, 2 im ADR-Text;
   bis zu den Daten mehrere Bildschirme (Suchfeld, Kopf, Sprachumschalter, Warnkasten, Checkbox).
6. **Konto:** PLZ-Feld mit Hinweis "5 Ziffern", Land-Auswahl enthält AT/CH (4-stellige PLZ) – zu prüfen, ob die Rechnungsadresse
   für Nicht-DE scheitert (nicht abgesendet, Regel).

## Lücken (nach Wichtigkeit)
1. **Team/Mehrnutzer** (Rollen, 4 Sitze, Admin, gemeinsame Rechnung). AGB verbietet Teilen. Ohne das keine Beschaffung.
2. **Kaufstrecke** mit Rechnung (netto, USt-ID, Bestellnummer/PO, Jahresvertrag, SEPA/Überweisung statt nur Karte).
3. **Lithium-Assistent**: PI 965–970/P903/P908/SV 188 prüfen (Wh, Gramm Lithium, SoC 30 %, UN 38.3-Test, Marke/Handling Label),
   Länderabweichungen (40 Länder!) nicht nur "US 3".
4. **Dokumente** (Beförderungspapier, Shipper's Declaration) – "in Vorbereitung".
5. **Änderungsdienst** ("Was ist neu in ADR 2027/IMDG Amdt. 43?") für Compliance-Nachweis; Export (PDF/CSV) des Vergleichs für die Akte.
6. **Audit-Spur**: Datenstand/Version je Abfrage, Datum – für interne Revision.
7. ADN, IATA-DGR-Bezug (ICAO-TI ≠ IATA, Airlines verlangen IATA) – nicht erwähnt, wird bei Luftfracht gefragt.

## Vertrauen / Recht / Kaufstrecke (streng)
- **Impressum**: Name/Anschrift/E-Mail ja (Can Cevik, Gütersloh), aber **keine Telefonnummer, keine USt-ID, keine Rechtsform,
  kein Register**. Einkauf akzeptiert eine Einzelperson ohne USt-ID nicht als Lieferant ("Einzelunternehmer?"), Konzern-Lieferantenprüfung scheitert.
- **AGB**: Banner "Entwurf – noch nicht gültig", "Mindestlaufzeit [[Mindestlaufzeit]]" als Platzhalter sichtbar; § 4: für
  Unternehmer "zuzüglich USt, soweit nicht anders angegeben" versus App "125 € inkl. MwSt." – netto/brutto für B2B unklar.
  § 6 nur "bemühen uns", **keine SLA, kein Support** (Reaktionszeit, Kontakt, Zeiten). § 9: Haftung für leichte Fahrlässigkeit
  ausgeschlossen, Datenfehler der Quelle ausgeschlossen – für ein Werkzeug, auf dem Versandentscheidungen beruhen, nachvollziehbar,
  aber ich brauche das als Risiko in der Freigabe. Keine Aussage zu Datenhoheit/Export/Löschung bei Vertragsende (nur "Konto auf Demo, auf Wunsch löschen").
- **Datenschutz**: AVV mit STRATO/Supabase genannt, aber **kein AVV zwischen uns und gefahrgut.org** zum Abschluss, keine
  TOMs, keine Subprozessor-Liste, kein ISO 27001/SOC 2 – IT-Security stoppt hier. Supabase Inc. (USA) mit SCC, ich bräuchte DPF/TIA-Hinweis.
  Es werden nur Konto-/Rechnungsdaten verarbeitet (positiv: keine Sendungsdaten), das gehört aber prominent gesagt.
- **Kaufstrecke (gesperrt)**: Banner "Alle Daten für 125 € pro Monat inkl. MwSt." + "Jetzt freischalten" → `/konto#abo` → deaktivierter
  Button. Registrieren ist Warteliste. Kein Kontakt "Freischaltung anfragen", kein Testzugang auf eigene UN (nur UN 1203).
  Ich kann mein Produkt (3480) nicht einmal ausprobieren.
- Landing: ehrlich (kein "rechtssicher", Datenbasis BAM), aber kein Preis, keine Referenzen, keine Kundennamen, kein Team-Hinweis.

## Zahlungsbereitschaft
Heute: 40–60 € netto/Monat für eine Person (Ergänzung zu IATA/DGR-Abo). Mit Teamlizenz (4 Sitze), AVV, SLA, Dokumentengenerator und
Lithium-Assistent: **149–249 € netto pro Monat für die Firma (4 Nutzer)**, als Jahresvertrag mit Rechnung. 125 € pro Person
(brutto) ×4 = 500 € wäre für mich keine Freigabe. Ändern müsste sich: Firmenlizenz, Nettopreis, Rechnung, AVV, Support-Zusage.

## Marketing-Sicht
- **Wo ich suche:** Google ("Gefahrgut Software Lithium", "UN 3480 Verpackungsanweisung", "ADR IMDG ICAO Vergleich", "Gefahrgutbeauftragter Tool"),
  LinkedIn, Empfehlung des externen GGB, VDA/ZVEI-Arbeitskreise, Messen (Gefahrgut-Tag?, LogiMAT, Battery Show), Fachzeitschrift
  "Gefahrgut", IHK-Seminare, Vergleichsportale. Kollegen im Konzern-Einkauf fragen nach "Referenzen".
- **Überzeugen würde:** konkreter Lithium-Anwendungsfall mit Beispielseite (3480/3481 komplett demonstriert), Kundenstimme eines
  Batterie-Herstellers, öffentlicher Änderungslog bei jedem Regelwerksupdate, Sicherheits-/DSGVO-Datenblatt als PDF,
  Pilotphase 30 Tage mit allen UN-Nummern.
- **Fehlende Botschaft/Beweis:** "Warum nicht IATA/DGR/Excel?", Team-/Firmenangebot, Wer steckt dahinter (Qualifikation des Betreibers,
  Gefahrgutbeauftragter?), Aktualität (Datenstand je Regelwerk, Update-Termin), Vergleich "ADR 2025 vs. ADR 2027".

## Regression (README 2026-11-23, kurz)
- **Behoben:** ICAO FORBIDDEN als kritisch (UN 3480/3090 ✓); ICAO LQ (Y) wird gezeigt; Preis konsistent 125 € in App/AGB;
  Betreiber im Impressum; ICAO-Varianten 3481/3091 nun unterscheidbar (contained in / packed with); Suche "Akku" findet Lithium (Synonym);
  Seiten 375 px ohne horizontalen Scroll.
- **Noch offen:** Kaufen unmöglich (Stripe fehlt); kein AVV/TOMs/Subprozessorliste für Kunden; keine Team-/Beraterlizenz,
  kein Netto-/Rechnungsmodell; Variantenzuordnung manuell (3481/3091/3171); wenig Packaging-Texte; Dokumentengenerator/LQ-EQ fehlen;
  Rechtstexte "Entwurf".
- **Neu:** AGB § 7 "Ein Konto nur für eine Person" schließt Teams aus; Impressum ohne Telefon/USt-ID; Mindestlaufzeit-Platzhalter sichtbar;
  Konto-PLZ "5 Ziffern" neben AT/CH (zu prüfen).
