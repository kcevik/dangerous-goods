# Persona-Test 2026-11-24 – P1 Lars Hoffmann

**Persona:** Lars Hoffmann, 42, Gefahrgutbeauftragter bei einem Lack- und Farbenhersteller (350 MA, LKW, Stückgut + Tankwagen,
gelegentlich Seecontainer). Alltag: UN-Nr./Einstufung, Verpackungsanweisungen, SV, Tunnelcode, 1000-Punkte, LQ, Papiere. Heute:
gedrucktes ADR + alte Excel-Sammlung. Getestet: localhost:3100, aktives + gesperrtes Konto, Desktop 1280 und Handy 375.
(Simulierte Persona, keine echte Kundenmeinung; fachliche Auffälligkeiten sind "zu prüfen".)

## Gesamturteil
Für die 125 €/Monat zahle ich **heute nicht**. Das Produkt ist deutlich besser als vor einem Tag: der 1000-Punkte-Rechner rechnet
korrekt (1263 PG II 300 L = 900, +1993 150 L +1170 100 L = 1.150 → "Freistellung nicht möglich", sofort, nachvollizierbar), die
UN-Seite zeigt Tank-, MP-, V/CV/S-Daten mit Sprung ins ADR, das ADR-Buch ist schnell und die Abschnittssprünge funktionieren.
Aber (1) mein Kernstoff UN 1263 ist wegen der Varianten-Wahl mühsam und mobil nicht unterscheidbar, (2) die Suche nach meinen
Alltagsbegriffen ("Lack", "Xylol", "Toluol", "Epoxidharz") liefert Unsinn oder nichts, (3) es fehlen Beförderungspapier und LQ/EQ,
die ich täglich brauche, und (4) ich kann nicht kaufen (Knopf "demnächst"). Mein Chef sieht den Nutzen erst mit Papier + LQ + Team-Lizenz.
Ich würde mich auf die Warteliste setzen und beim Start nochmal prüfen.

## Scores (1-10)
| Nutzen | Datenvertrauen | Bedienb. Desktop | Bedienb. Mobil | Design | Preis-Leistung | Kaufwahrsch. | Weiterempfehlung |
|---|---|---|---|---|---|---|---|
| 5 | 7 | 8 | 6 | 8 | 3 | 3 | 5 |

## Was gut ist (konkret)
- Startseite: in 30 s klar (Gefahrgutbeauftragte, 4 Regelwerke, BAM-Quelle, ehrlich zu ADN), Live-Demo ohne Login, kein Zertifizierungs-/"rechtssicher"-Gerede, keine toten Footer-Links.
- UN-Seite (1263/1139/1993/3082/2810): Klasse, BK x Faktor, Tunnelcode, Tank (T, TP, Tankcode, TU/TE), V/CV/S, 1.10-Schwellen, Umweltzeichen, alles in <1 s; Codes sind ins ADR verlinkt. 1993 und 2810 zeigen "1.10.3 gilt ab" sauber.
- 1000-Punkte-Rechner: korrekt, Echtzeit, Pflichtenhinweise (LQ/EQ nicht mitzählen, 1.8.3.2 b)), Druckfunktion. Fehlt keine Plausibilität bei meinen Stoffen.
- Vergleich: ICAO-Verbote (1005, 3480) werden jetzt als kritisch ▲ gemeldet; RID-Kemler heißt "Keine Angabe in der Quelle"; 1950 ohne Fehlalarm.
- ADR-Buch: TOC ohne `**`, Sprung `?section=8.6 / 1.1.3.6 / 3.4 / 1.10` klappt, Trefferzähler sauber ("Treffer 1 von 80").
- Mobil: kein horizontales Scrollen auf allen 7 geprüften Seiten, Rechner mobil gut bedienbar.
- Gesperrtes Konto: ein klarer Banner mit Preis, Seitenhinweis "UN 1263 ist erst nach der Freischaltung verfügbar".

## Bugs / Fehlaussagen
1. **Suche "Lack" → UN 0027/0028 Schwarzpulver** (`/suche?q=Lack`, Treffer über "B**LACK** POWDER", Substring-Treffer in EN-Namen). Kein Treffer für UN 1263, obwohl "Lacke" 1263 findet. Mein wichtigster Suchbegriff; irreführend. (Zu prüfen: Wortgrenze/Rangfolge.)
2. **Suche kennt Alltagsbegriffe nicht:** "Xylol", "Xylole", "Toluol", "Epoxidharz", "Wasserlack" → "Keine Ergebnisse" (UN 1307 findet nur "Xylene"). "Keine Ergebnisse" liest sich wie eine Aussage über die Vorschrift; ein Hinweis "Stoffnamen nach ADR heißen oft anders (Xylole, Toluen)" fehlt.
3. **UN 1263 Variantenwahl:** Voreinstellung = erste Variante "VP-Gr. I" (BK 1 ×50, sonst Lack i. d. R. PG II/III); Übersicht zeigt "VP-Gr. I" für alle vier Regelwerke. Die sechs Varianten-Buttons beginnen alle mit demselben langen Text; mobil (375 px) abgeschnitten ("VP-Gr. II · (einschließlich Farbe, Lack, E…") → PG II >110 kPa und ≤110 kPa nicht unterscheidbar. `/un/1263`, `/un/1263/vergleich`.
4. **1000-Punkte-Rechner, gleiches Problem:** Dropdown-Einträge für 1263 sind je ~250 Zeichen lang, die entscheidende Info (Dampfdruck, Flammpunkt) steht am Ende; UN-Nummer + Variante lassen sich nicht per Tastatur schnell wählen (Select-Liste).
5. Kleinigkeit: mobil Touch-Ziele unter 44 px: Checkbox 20x20 (Rechner, Vergleichsfilter), Inline-Links "1.1.3.6", "Kapitel 3.4" 18 px hoch, Buchviewer "Weiterlesen"/"Vorherigen Abschnitt laden" 20 px hoch.
6. ADR-Buch: TOC-Eintrag "1.2.1" ohne Titel; Suche nach "Gefahrnummer"/"Kemler" → "Keine Treffer" (OCR/Wortwahl, zu prüfen, aber Nutzer glaubt "steht nicht im ADR").
7. `/suche?q=UN3373` zeigt dreimal "UN 3373" ohne Zählerzeile ("N UN-Nummern" fehlt); nur Varianten, geringfügig.

## Lücken (nach Wichtigkeit)
1. **Beförderungspapier-Generator (F-03)** – tägliche Arbeit; ohne ihn bleibt Excel/Word.
2. **LQ/EQ-Rechner (F-12)** – ich versende viel in Kleinmengen (1263 E3/500 ml, 1170); LQ-Grenzen sehe ich nur je Stoff.
3. **Team-/Firmenlizenz, Netto-Preis + Rechnung**, Jahresoption (Chef!).
4. **Gemischte Ladung / Zusammenladeverbote (7.5.2)** und Tankfahrzeug-Check (Tankcode → zulässige Beladung) für meine Tankwagen.
5. Favoriten / "meine Stoffe" (ich arbeite mit ~10 UN-Nummern), Stoffnamen-Synonyme aus Lack-/Farbenwelt (Nitroverdünnung ist drin, gut).
6. Änderungsmonitor ADR 2025 → 2027, zitierfähige Fundstellen/Export.
7. Rechner: 1000-Punkte-Ergebnis bei Überschreitung zeigt keine Folgepflichten (nur "nicht möglich") – hier würde ich die Pflichtenliste (Kap. 1.8.3, 8.2 usw.) sehen wollen.

## Vertrauen / Recht / Kaufstrecke
- Gesperrtes Konto: "Jetzt freischalten" → `/konto#abo` → "Abo abschließen — demnächst verfügbar". **Sackgasse.** Keine Kontaktmöglichkeit, keine Anfrage. Neue Nutzer sehen nur UN 1203; sie können mit ihren Stoffen (1263!) nichts prüfen, 1000-Punkte-Rechner ist komplett gesperrt, kein Demo-Rechner. Kaufentscheidung ohne Probe unmöglich.
- Preis: Landing nennt bewusst keinen Preis; im Konto "125 € pro Monat inkl. MwSt." – pro Nutzer oder Firma? Unklar. AGB sind Entwurf, Mindestlaufzeit `[[Mindestlaufzeit]]`, "Entwurf – noch nicht gültig".
- `/registrieren` ist nur Warteliste (nicht abgesendet, geprüft nur Text). Keine Testphase.
- Haftungshinweis "kein rechtsverbindlicher Text" ist überall sichtbar – gut, aber für den Chef ist die Frage "Wer haftet?" nicht beantwortet.

## Zahlungsbereitschaft
Heute **ca. 40–50 € netto/Monat** (1 Nutzer). Mit Papier + LQ/EQ + Mehrfach-Nutzern **ca. 90–120 € netto/Monat pro Firma**
(bis 3 Nutzer), lieber Jahresabo mit Rechnung. 125 € **brutto** (= ~105 € netto) für heutigen Funktionsstand zu hoch;
nach Papier + LQ vertretbar. Ändern müsste sich: Probezugang mit eigenen Stoffen (14 Tage), Netto-Ausweis, Jahrespreis, Firmenlizenz.

## Marketing-Sicht
- **Kanäle:** Google ("Gefahrgutbeauftragter Software", "ADR 2025 online", "1000-Punkte-Regel Rechner", "Beförderungspapier erstellen"), Fachzeitschriften/Newsletter (Gefährliche Ladung, Gefahrgut Profi-Blogs), LinkedIn-Gruppen und XING für Gefahrgutbeauftragte, IHK-Schulungen/Fortbildungen (Auffrischungskurse §5 GbV), Verbandsveranstaltungen (VCI, Lackindustrie-Verbände), Messen (Logistics/transport logistic, Chemspec, ECS/European Coatings Show für Lack).
- **Überzeugen:** Zeitersparnis belegt an meinem Alltag ("UN 1263 in 20 s statt 5 Min Blättern"), 14 Tage Test mit eigenen UN-Nummern, Referenzen von Kollegen, klarer Update-Zusage zum ADR 2027, Haftungs-/Datenschutz-Papiere (AVV) für den Chef.
- **Botschaft/Beweis fehlt:** konkrete Beispiele aus meiner Branche (Lacke, Verdünnungen, Tankwagen), eine Vergleichsrechnung "Excel + ADR-Buch vs. gefahrgut.org", Hinweis auf Aktualisierungsstand (Datenstand BAM) auf der Landing, Preis/Lizenzmodell vor der Anmeldung.

## Regression (README 2026-11-23, P1/alle)
**Behoben:** ICAO-LQ (Y-Instruktion) im Vergleich sichtbar; RID-Kemler "Keine Angabe in der Quelle"; ICAO-FORBIDDEN (1005, 3480) als kritisch; UN-1950-Fehlalarm weg; Landing-Claims (zertifiziert/rechtssicher) und Footer-`#`-Links weg; ADR-Viewer: Trefferzähler, Markdown im TOC, Direktsprünge 1.1.3.6/3.4/8.6/1.10; Suche: `?q=` wirkt, Synonyme (Salzsäure, Natronlauge, Spraydosen, Altöl, Altbatterien, battery), UN 9999 nicht mehr in Treffern; 1000-Punkte-Rechner vorhanden; Tank-/MP-/V/CV/S-Daten auf UN-Seite; Preis auf Landing konsistent (kein Betrag).
**Noch offen:** Kaufstrecke tot (kein "Freischaltung anfragen"); Beförderungspapier, LQ/EQ-Rechner, Team-/Netto-Preis, Jahresabo; Variantenvorauswahl (1263 → PG I), AGB/Rechtstexte Entwurf, kein AVV; Zusammenladeverbote, Änderungsmonitor.
**Neu:** Suche "Lack" liefert Schwarzpulver (Substring), "Xylol/Toluol" ohne Treffer; Varianten-Labels mobil nicht unterscheidbar; Touch-Ziele (Checkbox, Inline-Links, Weiterlesen) < 44 px; ADR-Buch findet "Gefahrnummer" nicht; locked-Nutzer sieht keinen Rechner-Demo.
(Nicht erneut geprüft: Sprachen EN/TR, ICAO-3481-Varianten, UN-3291/3373-Datenverdachtsfälle.)
