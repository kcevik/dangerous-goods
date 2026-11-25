# Persona-Test P2 – Aylin Demir (2026-11-24)

**Profil:** 29, Gefahrgutbeauftragte seit 4 Monaten, Kontraktlogistiker mit Gefahrstofflager/Umschlag, ~25 Kunden. Unsicher, Angst vor Bußgeldern, meist Handy am Tor, Laptop im Büro. Will geführt werden ("Was muss ich bei diesem Stoff beachten?"). Getestet: Landing als Besucher, aktives und gesperrtes Konto, 375 px (mobil) und 1280 px, UN 1993/3480/3481/1950/2794/3082, Suche, Vergleich, 1000-Punkte, ADR-Buch. Keine Schreibaktionen.

## Gesamturteil
Nein, 125 € brutto/Monat würde ich als Einsteigerin nicht zahlen. Die Daten sind schnell (UN-Seite < 1,5 s) und die Seite zeigt viel, aber sie beantwortet nicht meine Frage "Was muss ich tun?": Ich bekomme Tabellenspalten und Codes (P903, MP19, V12, CV13 ohne Text), keine Checkliste (Kennzeichnung, Zettel, Beförderungspapier, Ladungssicherung). Zusammenladeverbot steht nur als Fließtext im ADR-Buch, nicht als Werkzeug. Der 1000-Punkte-Rechner ist gut, aber nur ein Baustein. Kaufen kann ich ohnehin nicht (Abo-Knopf deaktiviert). Ein Einzelplatz-Preis um 40-50 € netto mit Hilfe/Checklisten wäre für mich eine Überlegung wert.

## Scores (1-10)
Nutzen 5 · Datenvertrauen 6 · Bedienbarkeit Desktop 7 · Mobil 6 · Design 7 · Preis-Leistung 3 · Kaufwahrscheinlichkeit 2 · Weiterempfehlung 4

## Was gut ist
- Landing in 30 s verständlich: wofür, für wen, Datenquelle BAM, ehrliche Zahlen, ADN-Hinweis. Kein Preis, bewusst.
- Suche mit Synonymen funktioniert: "Spraydose" -> UN 1950, "Salzsäure" -> 1789, "Altbatterien" -> 3480/3090/2794/2800 mit Hinweis "Einstufung anhand SDB Abschnitt 14 prüfen" und "hängt vom Batterietyp ab" (genau richtig für mich). "Lithiumbatterie" liefert 3090/3091/3480/3481 mit Erklärung.
- UN-Seite mobil ohne horizontales Scrollen (alle Routen scrollWidth = 375), Touch-Ziele 44 px, Detailzeilen mit Sprung ins ADR (z. B. "7.5.11 ↗", "8.5 ↗").
- Vergleich UN 3480: "Passagierflugzeug (ICAO): verboten – nur Frachtflugzeug" wird als kritische Abweichung oben gemeldet. Das ist für mich als Warenannahme-Check sehr wertvoll.
- 1000-Punkte-Rechner: UN 3480 400 kg -> BK 2, Faktor 3, 1.200 Punkte sofort; bei mehrdeutigen UN (1993, 1950) wird zur Auswahl der Eintragung aufgefordert und kein Ergebnis geraten ("Angaben unvollständig"). Hinweise (LQ/EQ nicht mitzählen, 1.8.3.2 b) hilfreich.
- ADR-Buch: Direktsprung `?section=7.5.2` landet exakt auf "7.5.2 Zusammenladeverbote"; Volltextsuche (Zusammenladeverbot: 9 Treffer); kein Layoutproblem mobil (sticky Suchleiste ca. 110 px).
- Gesperrtes Konto: klare Hinweise ("UN 1993 ist erst nach der Freischaltung verfügbar. Demo: UN 1203"), Preis 125 € inkl. MwSt. im Banner und auf /konto.

## Bugs / Fehlaussagen (zu prüfen, Beleg = Seitentext im Browser)
1. **UN 3481 (/un/3481, /un/3481/vergleich):** RID, IMDG und ICAO zeigen in der Übersicht nur "?" und im Vergleich "Keine eindeutige Variante" für Klasse, Zettel, LQ usw.; die Person muss je Regelwerk selbst die Variante wählen. Für die häufigste Lithium-Ware am Tor ist das die schwächste Stelle. ADR-Variantenbuttons mobil abgeschnitten ("LITHIUM-IONEN-BATTERIEN IN AUSRÜSTUNGEN · (…").
2. **UN 1950 (/un/1950/vergleich):** ICAO "keine eindeutige Variante", Auswahl nur auf Englisch ("flammable, corrosive, containing substances in Class 8, Packing Group II / …"), 12 ADR-Varianten ohne Vorauswahl. Als Anfängerin kann ich nicht wissen, welche gilt; Vergleich ICAO fällt aus.
3. **Kein Handlungsteil bei Fund:** UN-Seite listet Codes (V14, CV9, S2, S20, MP9, PP87) ohne Text ("Für diese Codes enthält die BAM-Quelle keine Texte"), nur Link ins Buch. Der Hinweis ist ehrlich, hilft mir aber nicht am Tor.
4. **UN 3480/3481:** "Umweltgefährdend: Keine Angabe in der Quelle (BAM)" bei fast jedem Stoff (1993, 2794, 1950, 3480) wirkt wie eine Lücke; bei 3082 steht "Ja". Erklärung "Wann ist das Feld leer?" fehlt.
5. **Mobil 1000-Punkte:** Checkbox "Leere ungereinigte Verpackung" nur 20 px hoch (Zeile selbst ist anklickbar? nicht geprüft); Hinzufügen/Entfernen ok. Tooltip/Link "Welche Menge trage ich ein?" ist klar.
6. SV-Texte erst nach Klick ("Klicken zum Öffnen…"); bei 11 SV (UN 3481) elf Klicks, kein "Alle öffnen".
7. ADR-Buch: Überschrift "7.5.2 Zusammenladeverbote" erscheint als normaler Absatz (OCR), Tabelle 7.5.2.1 (Zusammenladematrix) im Buch nicht als Werkzeug nutzbar – nicht prüfbar, ob die Tabelle korrekt gerendert ist.

## Lücken (nach Wichtigkeit für mich)
1. **Eingangs-Checkliste je UN/Eintrag** ("Was muss ich beachten": Kennzeichen, Zettel, Papier, Ladungssicherung, Sicherungsvorschriften, Unterweisung) in Klartext.
2. **Zusammenladeverbot-Prüfer** (mehrere UN eingeben -> erlaubt/verboten; ADR 7.5.2, IMDG-Trennung). Kernfall im Lager.
3. **LQ/EQ-Rechner** und Freistellung ("in Vorbereitung"); aktuell zeigt die UN-Seite nur "LQ 1 L / E0".
4. **Beförderungspapier-Generator** für meine Kunden/Lagerbewegungen.
5. Lithium-Assistent (Typ, Zustand beschädigt/Prototyp/Abfall, SV 188/376/377 erklärt).
6. Lagerthemen (Lagerung/Zusammenlagerung, TRGS 510 ist nicht ADR - bewusst Grenze benennen), Unterweisungsnachweis, Änderungsmonitor.
7. Favoriten/Verlauf für meine ~25 Kunden und Stoffe.

## Vertrauen / Recht / Kaufstrecke
- Disclaimer "kein rechtsverbindlicher Text" überall sichtbar, gut, aber für mich auch ein Warnsignal: Wenn ich mich auf die Seite verlasse und ein Bußgeld kommt, haftet niemand. Ich bräuchte Stand/Version pro Seite ("ADR 2025, BAM-Stand …").
- Kaufstrecke: Banner "Jetzt freischalten" -> /konto#abo -> "Abo abschließen — demnächst verfügbar" (Sackgasse, bekannt). Keine Kontaktmöglichkeit, kein Testzugang außer UN 1203. Das Banner erscheint auf jeder Seite; mobil tolerierbar.
- Landing nennt keinen Preis; /konto und Banner nennen 125 € inkl. MwSt. (brutto, Firmenkundin will netto/Rechnung sehen).
- Anmeldung: nur Warteliste; ich hätte mich eingetragen (Neugier), aber nicht mit Firmenadresse ohne Datenschutz-Details.

## Zahlungsbereitschaft
Heute: 29-39 € netto/Monat (nur ich, Einzelplatz, vom Arbeitgeber bezahlt). Mit Checklisten, Zusammenladeprüfung und LQ/EQ: 59-79 € netto. 125 € brutto (105 € netto) nur, wenn die Firma zahlt und mehrere Nutzer (Lager, Disposition) mitlaufen. Änderungen: Preis pro Firma/Team statt nur pro Konto, Netto + Rechnung, Monats-/Jahres-Option, Testzugang mit allen Daten 14 Tage.

## Marketing-Sicht
- Suche: Google "Gefahrgut Lithium Batterien Lager Regeln", "Gefahrgutbeauftragter Checkliste Wareneingang", "Zusammenladeverbot prüfen", "UN 3481 Kennzeichnung", "1000 Punkte Rechner", "LQ EQ Rechner". Communities: LinkedIn-Gruppen Gefahrgut/Logistik, Facebook "Gefahrgutbeauftragte", Foren der IHK-Schulungsteilnehmer, Gefahrgut-Schulungsanbieter (Newsletter, Lehrgangsende-Mails an frisch Geprüfte), Messen: transport logistic, LogiMAT, Gefahrgut-Fachtage (z. B. VDI/DGUV-nahe Veranstaltungen), Fachzeitschrift "Gefahrgut".
- Überzeugend: konkrete Fallseiten ("UN 3481 am Wareneingang in 2 Minuten"), Vergleich "heute: ADR-Buch + 5 Tabs", Beweise von echten GGB, Datenstand/Aktualisierungsversprechen, Sicherheit bei Fehlern ("Fehlerchecks vor dem Bußgeld"). Fehlt: Kundenstimmen, Beispiel-Workflow, Info zu Haftung/Update-Rhythmus, Schulungs-/Einsteigerbotschaft ("für frisch geprüfte GGB").

## Regression (Bericht 2026-11-23)
- **Behoben (soweit geprüft):** ICAO-Verbot wird als kritisch gemeldet (UN 3480); 1000-Punkte-Rechner existiert; Synonymsuche (Spraydose, Salzsäure, Altbatterien, Lithiumbatterie); `/suche?q=` füllt Suche vor; Preis sichtbar in App (125 € inkl. MwSt.); ADR-Sprung `section=` funktioniert.
- **Noch offen:** Kaufen unmöglich (toter Abo-Knopf); ICAO 3481-Variante mehrdeutig (jetzt auch RID/IMDG "?"); Vorauswahl der Varianten (1950); Zusammenladeverbote/Dokumente/LQ-EQ fehlen; Tank-/Betriebs-Code-Texte fehlen; kein Team-/Netto-Preis.
- **Neu:** SV-Texte nur per Klick (kein "Alle öffnen"); Checkbox 20 px (1000-Punkte, Mobil); ADR-Variantenbuttons mobil abgeschnitten (3481).
- Nicht geprüft: Trefferzähler-Reset im Buch, TOC-Markdown, Türkisch, Abschnittssprünge 1.1.3.6/3.4/8.6.
