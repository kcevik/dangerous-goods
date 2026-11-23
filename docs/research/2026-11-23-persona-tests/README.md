# Persona-Test 2026-11-23 — Gesamtbericht

Fünf KI-Agenten haben als Gefahrgutbeauftragte mit unterschiedlichem Profil das Produkt im echten Browser
getestet (Stand `origin/main` nach PR #1–#5, Desktop + Handy, gesperrtes und aktiviertes Testkonto).
Einzelberichte: `p1-report.md` … `p5-report.md` in diesem Ordner.

> **Einordnung:** Das sind simulierte Personas, keine echten Kunden. Sie liefern gute Hypothesen und
> haben echte Bugs gefunden, ersetzen aber keine Gespräche mit echten Gefahrgutbeauftragten.
> Fachliche Datenhinweise der Personas sind Verdachtsfälle („zu prüfen“) — die BAM-Daten sind maßgeblich.
> Punkte mit ✔︎ habe ich im Code bzw. in der Datenbank nachgeprüft.

## Die Personas

| # | Persona | Profil | Schwerpunkt |
|---|---|---|---|
| P1 | Sabine Krüger, 48 | Chemiehandel, 180 MA, intern | ADR Straße, 1000 Punkte, Beförderungspapiere |
| P2 | Mehmet Yıldız, 39 | Spedition, 600 MA, Leiter Gefahrgut, 5er-Team | multimodal ADR/RID/IMDG/ADN, Handy am Terminal |
| P3 | Dr. Thomas Brandt, 61 | externer GGB, ~20 Mandanten, Trainer | Genauigkeit, Fundstellen, ADR-Text, Jahresberichte |
| P4 | Julia Neumann, 34 | Pharma/Diagnostik, 900 MA | ICAO/Luftfracht, LQ/EQ, Datenschutz/Einkauf |
| P5 | Andi Wolf, 55 | Entsorger, 35 MA, GGB nebenbei | Abfall, Handy, preissensibel |

## Ergebnis auf einen Blick

**Niemand würde heute zu 125 € pro Monat kaufen.** Alle fünf vertrauen den ADR-Daten grundsätzlich und loben
Vergleich, SV-Volltexte und Sprung in den ADR-Text — aber das Produkt nimmt ihnen noch zu wenig Arbeit ab,
man kann nicht kaufen, und einige falsche Aussagen im Vergleich kosten Vertrauen.

| Score (1–10) | P1 | P2 | P3 | P4 | P5 | Ø |
|---|---|---|---|---|---|---|
| Nutzen | 4 | 6 | 6 | 5 | 4 | **5,0** |
| Datenvertrauen | 7 | 5 | 5 | 6 | 8 | **6,2** |
| Bedienbarkeit Desktop | 7 | 7 | 7 | 7 | 7 | **7,0** |
| Bedienbarkeit Mobil | 5 | 6 | 6 | 6 | 5 | **5,6** |
| Design | 7 | 7 | 8 | 8 | 7 | **7,4** |
| Preis-Leistung | 2 | 4 | 3 | 3 | 2 | **2,8** |
| Kaufwahrscheinlichkeit | 2 | 4 | 2 | 3 | 2 | **2,6** |

### Zahlungsbereitschaft

| Persona | Heute | Mit Kernfunktionen (Rechner, Papiere …) |
|---|---|---|
| P1 Chemiehandel | 30–40 € netto/Monat | 80–100 € netto (Jahresabo, 2–3 Nutzer) |
| P2 Spedition | 49–69 € netto/Nutzer | 149–199 € netto für 5er-Team; 125 € netto für bis zu 5 Nutzer „ja“ |
| P3 Berater | 39–49 € netto | 79–99 €; Mandanten 15–25 €/Monat |
| P4 Pharma | 40–60 € netto | als Ergänzung zu IATA, nicht als Ersatz |
| P5 Entsorger | — | 30–40 € (≈ 400 €/Jahr, 2–3 Nutzer) |

Muster: **heute ~30–60 € netto pro Monat**, mit den Phase-1-Werkzeugen ~80–100 €, Teams/Firmen
erwarten mehrere Nutzer pro Lizenz und **Netto-Preis + Rechnung + Jahresoption**.

## 1. Kritisch: falsche fachliche Aussagen (Vertrauenskiller)

1. **„In diesem Regelwerk nicht vorgesehen“ ist mehrfach falsch** (P1–P4). ✔︎
   - ICAO „Begrenzte Mengen“: `COMPARE_FIELDS` schließt LQ für AIR aus. Die Daten **liegen aber vor**:
     `icao_entries.packing_instr_passenger_y` / `max_net_passenger_y` sind bei 1.525 von 3.528 Einträgen
     befüllt (UN 1170: Y341 / 1 L), werden vom Mapper aber nicht gelesen. Ebenso `state_variations` (608 Einträge).
   - RID „Kemler-Zahl“: RID kennt Gefahrnummern, der BAM-Feed liefert nur keine Spalte →
     richtig wäre „keine Daten in der Quelle“.
   - Grundsatz: „nicht vorgesehen“ nur, wenn das Regelwerk es wirklich nicht kennt; sonst „keine Angabe in der Quelle“.
2. **Luftverkehrsverbot wird nicht als kritisch gemeldet** (P2). ✔︎ Bei UN 1005 (ICAO FORBIDDEN) und UN 3480
   (Passagier FORBIDDEN) zeigt der Vergleich „Keine kritischen Abweichungen“, weil die ICAO-Mengenfelder nur
   gegen ICAO selbst verglichen werden. Für die Kernfrage „geht das auf allen Verkehrsträgern?“ ist das die gefährlichste Lücke.
3. **Fehlalarm bei UN 1950** (P2, P5): IMDG-LQ „See SP277“ wird als kritische Abweichung gewertet — ein Verweis,
   kein abweichender Wert.
4. **Zu prüfen** (Daten/Mapping): IMDG-IBC-Anweisungen scheinen zu fehlen (IBC02 bei 1203/1789, IBC08 bei 3077;
   P2, P3); ICAO 3481/3091 zwei Varianten mit identischer Beschriftung (P4); UN 3090 ICAO-Zettel
   „Lithium or sodium ion batteries“ (P3); UN 3291 ohne VG, Klammer fehlt im Synonym (P3); EmS mit „!“ unerklärt (P1, P2);
   UN 3373 ADR-Tab zeigt Variante „nur tierische Stoffe“ mit 606 (P4); UN 9999 in Suchtreffern (P1).

## 2. Kaufstrecke, Preis und Vertrauen

- **Kaufen ist unmöglich** (alle 5): „Jetzt freischalten“ → `/konto#abo` → deaktivierter Knopf. Das Modal
  verspricht etwas, das es nicht gibt. Mindestens eine Kontaktmöglichkeit („Freischaltung anfragen“) bis Stripe kommt.
- **Preis widerspricht sich** (alle 5): FAQ „Preis steht noch nicht fest“ vs. 125 € in App und AGB.
- **Pro Nutzer oder pro Firma?** Netto-Preis, Rechnung, Jahresabo, Team-/Beraterlizenz fehlen (P1–P4).
- **Rechtstexte sind Entwurf, kein Betreiber erkennbar; kein AVV/TOMs/Subprozessorliste** (P3, P4) — für Einkauf und
  externe Berater ein K.-o. (bekannter Go-live-Blocker 4).
- **Landing-Claims untergraben Vertrauen** (P1–P5): „BAM-zertifizierte Datenbasis“ (die BAM zertifiziert nichts),
  „2.347+ UN-Nummern“ neben „16.730 Einträgen“, „5 Regelwerke“ bei leerem ADN, „rechtssicher“, FAQ
  „unter 1.000 Punkten“ (korrekt: nicht über 1.000), „Demo ohne Anmeldung / keine Kreditkarte“ obwohl nur
  Warteliste, vier Footer-Links auf `#`, Verpackungsanweisungen im Mockup laufen zusammen („P001IBC02R001“),
  fünf von sechs Funktionen „Demnächst verfügbar“, Abfall kommt nicht vor.

## 3. Bugs in der App

- **ADR-Text-Viewer:** alter Trefferzähler bleibt stehen („Treffer 1 von 254Treffer 1 von 22“, P1, P5); rohes
  Markdown im Inhaltsverzeichnis („\*\*Kapitel 1.11\*\*“, alle); Suchfeld auf dem Handy 40–55 px breit (alle);
  Direktsprung zu 1.1.3.6, 3.4, 8.6, 1.10 „nicht gefunden“ (P3); SV-Deeplink landet ungenau (P2, P4);
  `$A_2$`, fehlende a)–k) in 5.4.1.1.1 (P3, OCR-Quelle); Brotkrumen falsch (P3); Inhaltsverzeichnis füllt mobil den ersten Bildschirm (P5).
- **Suche:** keine Handels-/Alltagsnamen („Salzsäure“ findet 1789 nicht, „Natronlauge“, „Altbatterien“,
  „Spraydosen“, „Altöl“, „battery“: 0 Treffer — die Landing verspricht Synonymsuche); stilles Abschneiden nach
  20 Treffern; `UN3373` ohne Leerzeichen; `/suche?q=` wird ignoriert; ICAO-Badge fehlt bei manchen Treffern (P1–P5).
- **Sprachen:** EN-Modus nur halb englisch und nicht seitenübergreifend gemerkt (P4); Türkisch: falsche
  Großschreibung („ETIKETLERI“ statt „ETİKETLERİ“), Stoffnamen/SV nur englisch (P2).
- **Vorauswahl der Varianten** bei 1950/1263 trifft für Entsorger meist den falschen Fall (P5); mobil 1,5
  Bildschirmhöhen scrollen bis zu den Daten (P4).
- 🌐 als leeres Kästchen: vermutlich nur die fehlende Emoji-Schrift im Testbrowser.

## 4. Was fehlt (nach Häufigkeit)

| Funktion | Genannt von | Roadmap |
|---|---|---|
| 1000-Punkte-Rechner | P1, P3, P5 (Must) | F-02 |
| Beförderungspapier / Dokumente (inkl. „ABFALL“, Shipper's Declaration) | P1, P4, P5 | F-03 |
| LQ/EQ-Rechner | P1, P3, P4 | F-12 |
| Team-Accounts, Berater-/Mandantenlizenz | P1, P2, P3 | neu |
| Zusammenladeverbote / IMDG-Trennung für mehrere UN-Nummern | P1, P2 | neu |
| Tankdaten (Tankcodierung, TU/TE, IMDG T/TP), Beförderungs-SV V/CV/S, MP | P1, P2 | neu (Daten prüfen) |
| Änderungsmonitor 2025 → 2027, Favoriten | P1, P3 | neu |
| Zitierfähige Fundstellen, Druck/PDF-Export | P3 | neu |
| Synonym-/Alltagsnamen-Suche | P1, P3, P4, P5 | Known issue |
| ICAO State Variations, Y-LQ | P4 | Daten vorhanden |
| Ampel-Fazit „geht auf allen Verkehrsträgern?“ | P2 | F-10-Erweiterung |
| Vorlagen Jahres-/Unfallbericht | P1, P3 | neu |

## Empfehlung (Reihenfolge)

1. **Vergleich korrigieren** (klein, höchste Wirkung): „nicht vorgesehen“ vs. „keine Angabe in der Quelle“,
   ICAO-Y-LQ und State Variations anzeigen, Verbote (FORBIDDEN) als kritisch, „See SPxxx“ nicht als Abweichung,
   IBC-Mapping prüfen.
2. **Landing ehrlich machen** (klein): Claims, Zahlen, FAQ-Preis, Footer-Links, Mockup-Trennzeichen.
3. **Kaufstrecke überbrücken**: bis Stripe ein „Freischaltung anfragen“ statt totem Knopf; Preisstruktur klären
   (netto, pro Firma/Team, Jahresoption).
4. **ADR-Viewer-Bugs**: Trefferzähler, Markdown im TOC, mobiles Suchfeld, Abschnittssprünge.
5. **Suche**: Synonyme/Handelsnamen, Hinweis bei abgeschnittenen Treffern, `?q=`.
6. **Features**: F-02 1000-Punkte-Rechner zuerst (am häufigsten Must), dann F-03 Beförderungspapier, dann LQ/EQ.
7. **Preis überdenken**: Die Signale liegen bei ~49 € netto Einzelplatz heute bzw. ~99 € mit Werkzeugen,
   plus Team-/Beraterstufe. Entscheidung des Owners — idealerweise mit 3–5 echten Interviews abgesichert.
