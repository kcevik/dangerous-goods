# Persona-Test P5 – Marek Nowak (Spedition, ADR-Stückgut, 22 MA)

Stand: lokaler Prod-Build, Waitlist-Modus, 2026-11-24. Desktop 1280 + Handy 375 (isMobile), Konto aktiv und gesperrt.
Simulierte Persona, keine echte Kundenmeinung. Fachliche Auffälligkeiten sind "zu prüfen".

## Profil und Gesamturteil
Marek, 36, ex-Disponent, jetzt GGB und Teilhaber. Entscheidet in Sekunden, am Handy, im Dispositionsalltag
(Zusammenladung, Tunnelcode, BK, Fahrzeugausrüstung, 1000-Punkte, Zusammenpackverbote). Vergleicht alles mit
klassischer Gefahrgutsoftware, Verlags-App, BAM-Seiten und PDF.

**Würde ich 125 €/Monat inkl. MwSt. zahlen? Heute nein.** Der 1000-Punkte-Rechner ist das erste Werkzeug, das mir
wirklich Arbeit abnimmt (er hat meine Mischladung 1203/1950/3082/1789/1823/1965 in unter 2 Minuten fast fertig
gerechnet), und die UN-Seite ist schnell und sauber. Aber mein Kernproblem – "darf das zusammen auf einen Wagen,
und was heißt das für Tunnel und Ausrüstung der ganzen Ladung?" – löst das Produkt nicht. Zusammenladeverbote
(7.5.2), Tunnelcode der Beförderungseinheit, Ausrüstung: fehlt. Und kaufen kann ich nicht (deaktivierter Knopf).
125 € brutto (~105 € netto) für einen Einzelnutzer ist ohne Zusammenladungs-Check und Papiere zu viel; mit beidem wäre es ok.

## Scores (1–10)
| Nutzen | Datenvertrauen | Bed. Desktop | Bed. Mobil | Design | Preis-Leistung | Kaufwahrsch. | Weiterempf. |
|---|---|---|---|---|---|---|---|
| 5 | 7 | 8 | 7 | 8 | 3 | 3 | 5 |

## Was gut ist (konkret)
- **1000-Punkte-Rechner** (`/tools/1000-punkte`): UN eintippen, Menge, BK/Faktor/Punkte sofort aus BAM. Mein Test:
  1203 200 L = 600 P (BK2 x3), 3082 300 L = 300 P, 1823 50 kg = 150 P, 1965 20 = 60 P. Bei UN mit mehreren
  BK (1950, 1789) zwingt er zur Wahl der Eintragung, kein stilles Raten, Gesamtergebnis blockiert bis dahin ("Noch kein Ergebnis – Angaben unvollständig"). Das ist fachlich ehrlich.
  Hinweise 1.1.3.6.5 (LQ/EQ nicht mitzählen), Druck/PDF-Knopf für die Akte.
- **UN-Seite**: ~1,7 s Ladezeit, alles auf einer Seite: BK x Faktor, Tunnelcode (1202 D/E, 1965 B/D, 1950 E),
  Kemler, SV-Liste, 1.10-Hinweis, Detailcodes mit Sprung in den ADR-Text (4.1.10 ↗, 8.5 ↗, 7.5.11 ↗). Das hat die BAM-Webseite so nicht.
- **Vergleichsansicht**: UN 1005 zeigt "Kritische Abweichungen: Luftverkehr verboten"; ICAO-Y-Mengen (Y341) sind da;
  "nicht vorgesehen" vs. "Keine Angabe in der Quelle (BAM)" wird unterschieden; "Nur Abweichungen zeigen".
- **Suche**: Synonyme (Salzsäure → 1789, Natronlauge, Altöl mit Hinweis "Einstufung per SDB prüfen"), `UN3082` springt direkt, `?q=` wird übernommen.
- **Handy**: kein horizontales Scrollen auf 375 px (Dashboard, Suche, Vergleich, Rechner, ADR-Text), Vergleich als Karten, Suchfeld 343 px breit.
- Disclaimer ehrlich, Quellenangabe BAM, keine Phantomversprechen auf der Landing.

## Bugs / Fehlaussagen
1. **`/un/1950` ICAO-Kachel zeigt "?"** statt Klasse: Variante nicht auflösbar, und es gibt keinen Hinweis in der Kachel, nur im Vergleich
   ("Für diese Variante keine eindeutige Entsprechung. Bitte wähle:" mit 7+ englischen Optionen). Für einen Disponenten, der nur "Spraydose" hat, unbenutzbar. Schritte: /un/1950 öffnen, Kachel ICAO ansehen.
2. **Rechner `/tools/1000-punkte`, UN 1965**: Einheit "L" ließ sich wählen, der Hinweis sagt aber "Nettomasse in kg". Ich habe 20 L
   eingetragen und 60 Punkte (=20x3) bekommen, ohne Warnung. Zu prüfen: Einheit bei Gasen erzwingen/warnen (20 L Fassungsraum kann je nach Gas etwas anderes sein als 20 kg).
3. **Rechner Variantenwahl ohne Hilfe**: UN 1789 zeigt nur "VG II – BK 2 / VG III – BK 3", UN 1950 "erstickend – BK 3 … giftig – BK 1".
   Keine Erklärung, welche zu meinem Produkt passt, keine Vorauswahl, kein Link ins SDB-Hinweis. Fehlerrisiko groß, weil falsche Wahl = falsches Ergebnis.
4. **Touch-Ziele**: `/tools/1000-punkte` Handy 4 Elemente < 40 px (u. a. Checkbox "Leere ungereinigte Verpackung", Entfernen-Kreuz), `/regelwerk/adr` Desktop 209 kleine Klickziele (Inhaltsverzeichnis-Links, plausibel nur dicht gesetzt). Nur gezählt, nicht einzeln geprüft.
5. **ADR-Text Handy**: Startseite besteht zuerst aus dem langen Inhaltsverzeichnis (siehe Screenshot `book375.png`), Direktsprung per `?section=8.6` / `7.5.2` zeigt trotzdem oben das TOC, ob die Stelle angesprungen wurde, habe ich per Textauszug nicht belegen können (zu prüfen).
6. TOC-Eintrag "1.2.1" ohne Titel (OCR-Quelle, zu prüfen).

## Lücken (nach Wichtigkeit für mich)
1. **Zusammenladung/Zusammenpackverbote** für mehrere UN-Nummern (7.5.2.1-Tabelle, MP-Codes, Trenn-/Verbotsregeln). Die DB hat `segregation_matrix`, die App nutzt sie für ADR nicht. MP19 steht als nackter Code ohne Text. Das ist mein Alltag Nr. 1.
2. **Ladungsfazit**: Tunnelcode der gesamten Beförderungseinheit (strengster Code), Beförderungskategorie, Fahrzeugausrüstung/ADR-Schein (Warntafeln, Feuerlöscher 8.1.4, Zusatzausrüstung je Klasse), Kennzeichnung. Eine Seite "meine Ladung" mit allem.
3. **Beförderungspapier / Ladeliste** (F-03) aus der Positionsliste des Rechners; Rechner-Daten wiederverwenden statt neu tippen.
4. **Speichern**: Ladungen/Touren ablegen, Favoriten, Verlauf. Alles ist flüchtig ("nichts gespeichert").
5. **Team**: Lizenz für Disponenten (22 MA, 3–5 Nutzer), Netto-Preis, Rechnung, Jahresabo.
6. LQ/EQ-Rechner (angekündigt), Mengenfreigrenzen je Verpackung.
7. Tank-/SV-Volltexte (MP, TU, V, CV, S haben keine Texte; nur Codes, Hinweis steht da).
8. Änderungsmonitor ADR 2025 → 2027, Gefahrgut-Unfallmerkblatt/Schriftliche Weisungen.

## Vertrauen / Recht / Kaufstrecke (gesperrtes Konto, Handy)
- Gesperrt-Erlebnis ist klar: Banner "nur Demo (UN 1203). Alle Daten für 125 € pro Monat inkl. MwSt." + "Jetzt freischalten".
  UN 1202 gesperrt: "erst nach der Freischaltung verfügbar", gut verständlich. Rechner und ADR-Text sind komplett gesperrt, ich sehe
  nicht einmal einen Screenshot/Beispiel des Rechners, nur Text. Ich kann das Beste (Rechner) nicht testen, bevor ich zahle.
- **Kaufen unmöglich**: `/konto` -> "Abo abschließen — demnächst verfügbar" (deaktiviert). Der Weg endet im Nichts, keine Kontaktadresse, keine "Freischaltung anfragen". Als Interessent springe ich hier ab.
- Landing: Preis steht nur in der App, nicht auf der Startseite (bewusst). Ich weiß nach 30 s, was es ist, aber nicht, was es kostet, und das wirkt wie Preis-Verstecken. Für einen ungeduldigen Entscheider kostet das einen Klick zu viel.
- Kein "Warum besser als meine Software": Vergleichsargument fehlt komplett auf der Landing.
- Rechtstexte laut Projekt Entwurf; Betreiber/AVV für Firmenkauf nicht geprüft.

## Alleinstellung vs. Wettbewerb (ehrlich)
Überzeugt: (a) **vier Regelwerke nebeneinander mit automatischer Abweichungsmarkierung** – klassische Software zeigt meist einen Modus,
BAM-Seiten gar keinen Vergleich; (b) **1000-Punkte-Rechner mit Daten direkt aus der Stoffdatenbank** statt Excel; (c) ADR-Volltext mit Sprung
von Codes in den Abschnitt (verknüpft Datenbank und Text), das hat ein PDF nicht; (d) mobil nutzbar und schnell.
Fehlt: Zusammenladung, Papiere, Ladungsfazit, Speicherstand, Teamlizenz, offizielle/verlagsgeprüfte Texte (das ADR-Buch ist OCR und "kein
rechtsverbindlicher Text"; Verlags-App/Original-ADR gewinnt bei Haftungsfragen). ADN fehlt (für mich unkritisch, ich fahre Straße).
Für reine Straßenspeditionen ist der Mehrwert "ADR vs. IMDG/ICAO" begrenzt – mein Kernnutzen ist Straße, deshalb ist Vergleich nett, Zusammenladung Pflicht.

## Zahlungsbereitschaft
- **Heute**: ~39–49 € netto/Monat (Einzelnutzer), das Niveau meiner Verlags-App. 125 € brutto = ~105 € netto ist 2,5x zu viel.
- **Mit Zusammenladungs-Check + Ladungsfazit + Papiere**: 89–119 € netto/Monat für die Firma (bis 5 Nutzer), Jahresabo mit 2 Monaten Rabatt.
- Pro Firma, nicht pro Nutzer. Netto ausweisen (B2B), Rechnung mit USt-ID, kündbar monatlich, 14 Tage echte Testphase mit Rechner.

## Marketing-Sicht
- Ich suche: Google "Gefahrgut Zusammenladung prüfen", "1000 Punkte Rechner ADR", "Tunnelcode Kombination", "Gefahrgutbeauftragter Software Spedition Preis"; Fragen in Facebook-Gruppen für GGB/Disponenten, LinkedIn,
  Verbandsportale (DSLV, BGL, Landesverbände), IHK-Schulungen, Messen (Transport logistic München, Gefahrgut-Foren/Tage), Fachzeitschriften (Gefahrgut, Logistik Heute), Empfehlung vom Schulungsanbieter.
- Überzeugen würde: kostenloser **1000-Punkte-Rechner** als SEO-Magnet (öffentlich, Ergebnis ohne Account, Speichern erst mit Konto) – das ist die Schlagzeile; 60-Sekunden-Video "Mischladung in 2 Minuten";
  Tabelle "gefahrgut.org vs. Software X / BAM / PDF"; Zusammenladungs-Check; Referenzen von echten GGB; klarer Preis mit Team-Staffel.
- Botschaft, die fehlt: "Ladung eingeben -> darf das zusammen, welcher Tunnelcode, welche Ausrüstung, Papier fertig". Fehlender Beweis: echter Kunde, Datenstand pro Jahr, Haftungs-/Fehlerpolitik.
- Würde ich mich in die Warteliste eintragen? Ja, mit einer E-Mail, wenn der Rechner und der Preis auf der Startseite stünden. Nicht abgesendet (Regel).

## Regression (README 2026-11-23)
**Behoben (sichtbar bestätigt):** 1000-Punkte-Rechner existiert (war Must); ICAO-Y-LQ im Vergleich; RID-Kemler "Keine Angabe in der Quelle"; ICAO-Verbot (UN 1005) als kritische Abweichung;
Preis in App konsistent 125 € inkl. MwSt.; Synonymsuche (Salzsäure, Natronlauge, Altöl, Spraydosen) mit Hinweis; `UN3082` ohne Leerzeichen; `?q=` übernommen; Handy-Suchfeld breit (343 px); SV-Volltext mit "Im ADR-Text öffnen"; MP/V/CV/S/Tank-Codes mit Sprung in den ADR-Text; kein horizontales Scrollen; ICAO "Verpackung zusammenlaufend" nicht mehr gesehen.
**Noch offen:** Kaufen unmöglich (Stripe), Zusammenladeverbote, Beförderungspapiere, LQ/EQ-Rechner, Team-/Beraterlizenz, Netto-Preis, Änderungsmonitor/Favoriten, Variantenvorauswahl bei 1950 (jetzt "?" in der ICAO-Kachel), mobiles ADR-TOC füllt den ersten Bildschirm, SV 327/344/625-Texte nur auf Klick.
**Neu:** Rechner Einheit "L" bei Gas ohne Warnung (Bug 2); Variantenwahl im Rechner ohne Hilfe (Bug 3); Rechner komplett hinter Paywall ohne Vorschau.
Nicht geprüft: Trefferzähler im ADR-Text, TOC-Markdownreste, Direktsprung 1.1.3.6/8.6 genauer, DE/EN/TR-Sprachfehler.
