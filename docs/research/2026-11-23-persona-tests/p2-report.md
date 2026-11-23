# Produktbewertung gefahrgut.org – Persona P2 (Mehmet Yıldız)

Screenshots: `/tmp/claude-1000/-home-dilli-projects-dangerous-goods/d1f1fb99-c91f-4850-8938-73c56eb69568/scratchpad/personas/p2/shots/` (unten kurz `shots/…`).
Getestet am 23.11.2026 auf `origin/main` (79dd8be), lokaler Dev-Server, Chromium headless, 1280 px und 375 px.

## Persona
Mehmet Yıldız, 39, Gefahrgutbeauftragter und Leiter Gefahrgut einer Spedition in Duisburg (600 MA, Bahnterminal, Containerverkehr nach Rotterdam/Antwerpen), täglich multimodal ADR/RID/IMDG/ADN.
Führt 4 Disponenten, die am Terminal per Handy nachschlagen. Spricht Deutsch und Türkisch, einige Fahrer brauchen Englisch oder Türkisch.

## Erster Eindruck

**Landing (1280 / 375)** – `shots/landing-1280-top.png`, `shots/landing-1280.png`, `shots/landing-375.png`
- Die Botschaft „Alle Gefahrgutvorschriften. Ein Werkzeug.“ trifft genau meinen Schmerz. Die interaktive Demo (UN 1203) und die Vergleichstabelle zeigen sofort, worum es geht. Das ist gut.
- Das Hero-Bild bei 1280 ist rechts halb leer (keine Grafik und kein Screenshot). Das Produkt sieht man erst nach dem Scrollen.
- Widersprüche und Übertreibungen, die mich als Fachmann misstrauisch machen:
  - „2.347+ UN-Nummern“ und „5 Regelwerke“ stehen neben „16.730 Einträge“. Die ADN-Spalte ist in der Demo aber leer. Was gilt?
  - Das Häkchen „BAM-**zertifizierte** Datenbasis“: Die BAM zertifiziert nichts, die Daten stehen nur unter einer offenen Lizenz. Das klingt nach Marketing.
  - „Dokumentengenerator … rechtssicher“ und „Freistellungsrechner … normkonform“ stehen da, obwohl alles „Demnächst verfügbar“ ist.
  - „Jetzt ausprobieren / Demo ohne Anmeldung / Keine Kreditkarte erforderlich“ passt nicht zu „Zum Launch benachrichtigen“. Kann ich jetzt kaufen oder nicht?
- Das FAQ sagt: „Der Preis steht noch nicht fest … Weitere Tarife, etwa für Teams, sind später möglich.“ Eingeloggt steht dann aber 125 €. Teams werden nur vage erwähnt.
- Mobil (375): kein horizontales Scrollen, sauber gestapelt, insgesamt aber sehr lang (~9.100 px).

**Gesperrter Account** – `shots/locked-_dashboard-1280-top.png`, `shots/locked-_dashboard-375-top.png`, `shots/locked-_konto-1280-top.png`, `shots/locked-_un_1203-375-top.png`, `shots/locked-cmp1203-1280.png`
- Das Modal „Schalte alle Daten frei“ ist klar und ehrlich: 4 Nutzenpunkte, Preis „125 € pro Monat inkl. MwSt.“, „Später“ ist möglich. Darunter gibt es ein gelbes Banner. Auf dem Handy sieht das sauber aus.
- Die Demo mit UN 1203 läuft auf der UN-Seite und im Vergleich. Andere UN-Nummern und die ADR-Text-Seite zeigen einen freundlichen Sperrhinweis.
- **Sackgasse:** „Jetzt freischalten“ führt nach `/konto#abo`. Dort ist der Button „Abo abschließen — demnächst verfügbar“ deaktiviert. Ich will kaufen und kann nicht. Es gibt keinen Kontakt, kein Angebot auf Rechnung und kein „Demo anfragen“.
- **Preis:** Nirgends steht, ob 125 € **pro Nutzer** oder pro Firma gilt, wie viele Logins enthalten sind, ob Rechnung bzw. Jahreszahlung möglich ist und ob ein netto-Preis mit USt-ID ausgewiesen wird. „inkl. MwSt.“ ist eine B2C-Formulierung. Ich rechne netto (105,04 €).
  Für 5 Nutzer (ich + 4 Disponenten) wären 5 × 125 € = 625 €/Monat ein klares Nein. 125 € für das ganze Team wären diskutabel.

## Getestete Aufgaben

| Aufgabe | Wie gelöst | Ergebnis | Anmerkung |
|---|---|---|---|
| UN 1203 Benzin LKW/Bahn/Schiff/Flug vergleichen | `/un/1203/vergleich` | ✅ | Klar. SV 664 nur ADR wird korrekt als „Abweichung“ markiert. ICAO A100, PI 353/364, 5 L/60 L sind plausibel. |
| UN 1993 n.a.g., Varianten | `/un/1993/vergleich`, Variantenwahl VG I…III | ✅ | 6 ADR-Varianten (Dampfdruck, viskos) sind sauber wählbar. IMDG EmS wird als „S-E**!**“ angezeigt. Das „!“ ist unerklärt (Check). |
| UN 1950 Druckgaspackungen (Varianten) | Vergleich, Variante „erstickend“ und „entzündbar“ | ⚠️ | ICAO verlangt eine zweite Variantenwahl aus 15 englischen Langtexten (`shots/active_un_1950_vergleich-1280.png`). **Falscher Alarm:** „Kritische Abweichung: Begrenzte Mengen ADR 1 L · RID 1 L · IMDG See SP277“. IMDG verweist nur auf SP 277, es ist keine echte Abweichung. Ein Disponent bekommt hier unnötig Panik. |
| UN 1965 Kohlenwasserstoffgas | Vergleich | ✅ | Klasse 2 ↔ 2.1 wird korrekt nicht als Abweichung gewertet. RID-Zettel „(13)“ (Rangierzettel) ist gut. ICAO PAX FORBIDDEN, CAO 200/150 kg. IMDG EmS „F-D!“ (Check). |
| UN 1005 Ammoniak, wasserfrei | Vergleich | ❌ (Bewertung) | ICAO Passagier **und** Fracht: FORBIDDEN. Die Zusammenfassung sagt trotzdem „**Keine kritischen Abweichungen**“ (`shots/active_un_1005_vergleich-1280.png`). Genau meine Kernfrage „geht das auf allen Verkehrsträgern?“ wird damit falsch beantwortet. IMDG-Gefahrzettel zeigt nur „8“ statt 2.3 + 8 (Check). |
| UN 2187 CO₂ tiefgekühlt | Vergleich | ✅ | Plausibel (3A, 22, C/E, P203, EmS F-C/S-V). |
| UN 3480 Li-Ion | Vergleich | ⚠️ | Daten sind plausibel (9A, BK 2, E; IMDG SP 384; ICAO PAX FORBIDDEN, „See 965“). Auch hier steht „Keine kritischen Abweichungen“, obwohl Passagierflug verboten ist. |
| UN 1263 Farbe | Vergleich | ✅ / ⚠️ | Daten sind ok. Die Variantenknöpfe sind riesige Textblöcke (bis 4 Zeilen „einschließlich Farbe, Lack, Emaille…“). Unübersichtlich. |
| UN 1866 Harzlösung | Vergleich | ✅ | Plausibel. „S-E!“ erscheint wieder. |
| UN 3077 UHS fest | Vergleich | ⚠️ | IMDG-Verpackung zeigt „P002, LP02“, ohne **IBC08**. Bei 1203 fehlt in IMDG ebenso IBC02. Das sieht so aus, als würde die IMDG-IBC-Spalte nicht übernommen (Check). ADR-Tunnelcode wird als „-“ dargestellt, sonst als „—“. |
| Stoffsuche | `/suche`: Benzin, Diesel, Gasöl, Heizöl, Lithium, Batterie, Propan, Ammoniak, Farbe, Tippfehler | ⚠️ | Synonyme funktionieren (Gasöl/Heizöl → 1202). Treffer werden bei **20 hart abgeschnitten**, ohne Hinweis („Propan“, „Lithium“, „Batterie“). Die Modus-Badges sind inkonsistent: „Benzin“ zeigt bei 1203 nur ADR·RID, „Diesel“ zeigt 4 Modi, „Dieselkraftstoff“ zeigt 3. Ein Treffer „UN 9999“ bei „Batterie“ (Check). |
| UN-Seite mit Modus-Tabs + Sprachen | `/un/1203`, DE/EN/FR/TR | ⚠️ | Die Tabs sind gut, ebenso die Statuskarten pro Modus. **Türkisch:** Großbuchstaben sind falsch („TEHLIKE ETIKETLERI“, „TAŞIMA KATEGORISI“, „MODLARINDAKI“ statt İ). Der Stoffname bleibt Englisch („MOTOR SPIRIT“), SV-Texte kommen auf Englisch (`shots/un1203-TR-375.png`). Für meine türkischen Fahrer reicht das nur halb. |
| SV-Text aufklappen + „Im ADR-Text öffnen“ | UN 1203 → SV 243 → `/regelwerk/adr?sv=243` | ⚠️ | Aufklappen funktioniert. Auf 375 px ist nach dem Sprung SV 243 nicht oben im Bild, man sieht SV 250/251 (`shots/adr-sv243-375.png`) (Check). |
| ADR-Text-Viewer | `/regelwerk/adr`, Suche „1.1.3.6“ | ⚠️ | Desktop ist gut: Inhaltsverzeichnis, Trefferzähler, Highlight (`shots/adr-search-1136-1280.png`). Im Inhaltsverzeichnis steht „**Kapitel 1.11**“ mit rohen Markdown-Sternchen. Mobil ist das Suchfeld **45 px breit** (Platzhalter „Im“), und das ausgeklappte Inhaltsverzeichnis schiebt den Text weit nach unten (`shots/adr-375.png`). |
| Mobile Nutzung 375 px | UN-Seiten, Vergleich, Menü | ⚠️ | Kein horizontales Scrollen. Der Vergleich wird zu Karten pro Angabe (`shots/active_un_1203_vergleich-375.png`), ist aber ~3.400 px lang. Bei 1950 sieht man auf dem ersten Bildschirm nur Variantenknöpfe (`shots/active_un_1950_vergleich-375-top.png`). Das 🌐-Icon erscheint als leeres Kästchen (evtl. nur fehlende Emoji-Schrift im Testbrowser). |
| Ladezeit | Seitenaufruf UN/Vergleich | ✅ | ~1,3 s bis Network-Idle (Dev-Server). Die ADR-Text-Seite braucht 2–5 s. |
| ADN (Binnenhafen) | jede Vergleichsseite | ❌ | Die Spalte ist da, Inhalt: „Die BAM veröffentlicht keine ADN-Daten.“ Ehrlich, aber für meinen Hafen nutzlos. |

## Stärken
- **Echter Nebeneinander-Vergleich ADR/RID/IMDG/ICAO/UN** pro UN-Nummer mit Variantenwahl. Das hat in dieser Form keines meiner Werkzeuge. Die Markierungen „nicht vorgesehen“ und „abweichende Systematik, nicht verglichen“ sind fachlich durchdacht (RID-Zettel 13, IMDG „See SP63“).
- IMDG-Felder für die Seeschiene sind vorhanden: EmS, Staukategorie, Stauung (SW…), Trennung (SG…), MARPOL.
- SV-Volltexte sind direkt aufklappbar, mit Sprung in den ADR-Text.
- Synonymsuche (Gasöl/Heizöl → 1202) und Mehrsprachigkeit der Oberfläche.
- Quellenangabe und „kein rechtsverbindlicher Text“ stehen sauber auf jeder Vergleichsseite.
- Mobil ist das Layout stabil (nie horizontal scrollen). Die Seiten sind schnell.
- Das Upsell im gesperrten Zustand ist fair: Demo nutzbar, Preis offen genannt.

## Schwächen & Bugs
1. **Falsche „Alles ok“-Aussage bei Beförderungsverboten** – `/un/1005/vergleich` und `/un/3480/vergleich`, 1280 und 375. ICAO FORBIDDEN, trotzdem „Keine kritischen Abweichungen“. `shots/active_un_1005_vergleich-1280.png`. Für mich der schwerste Punkt, weil genau das die Kaufbegründung ist.
2. **Falscher kritischer Alarm** – `/un/1950/vergleich`, 1280. „See SP277“ wird als kritische LQ-Abweichung gewertet. `shots/active_un_1950_vergleich-1280.png`.
3. **RID: Kemler-Zahl „In diesem Regelwerk nicht vorgesehen“** (alle Vergleiche). Kesselwagen tragen nach RID sehr wohl Gefahrnummern auf der orangefarbenen Tafel. Die Aussage ist fachlich irreführend (Check, ob die BAM-RID-Tabelle die Spalte liefert).
4. **ICAO: begrenzte Mengen „nicht vorgesehen“.** ICAO kennt LQ über Y-Verpackungsanweisungen (z. B. Y341 bei 1203) (Check).
5. **IMDG-IBC-Anweisungen fehlen offenbar** (1203: nur P001; 3077: ohne IBC08) (Check).
6. **Keine Tankangaben**: weder ADR/RID-Tankcodierung (L4BN…), Tank-SV (TU/TE/TT) noch IMDG T-Codes/TP, dazu keine Beförderungs-SV (V/CV/S, RID W/CW/CE). Für Kesselwagen und Tankcontainer fehlt damit das Wichtigste.
7. **Türkische Großschreibung falsch** (İ/I), Stoffnamen und SV nur Englisch – `/un/1203` TR, 375. `shots/un1203-TR-375.png`.
8. **Suche kappt bei 20 Treffern ohne Hinweis**, Modus-Badges inkonsistent – `/suche`, 1280/375. `shots/search-Lithium-375.png`.
9. **ADR-Viewer mobil**: Suchfeld 45 px breit, Inhaltsverzeichnis standardmäßig offen, SV-Deeplink landet nicht auf der SV – `shots/adr-375.png`, `shots/adr-sv243-375.png`. Desktop: „\*\*Kapitel 1.11\*\*“ roh im Inhaltsverzeichnis.
10. **Kauf-Sackgasse**: „Jetzt freischalten“ → deaktivierter Button – `shots/locked-_konto-1280-top.png`.
11. **Landing-Claims**: „BAM-zertifiziert“, „5 Regelwerke“ (ADN leer), „2.347+ UN-Nummern“ neben „16.730 Einträgen“, „rechtssicher“ für ein noch nicht vorhandenes Tool.
12. Kleinkram: „S-E!“ / „F-D!“ ohne Erklärung. „-“ und „—“ gemischt. Die Variantenknöpfe bei 1263 sind Textwände. Die ICAO-Variantenauswahl gibt es nur auf Englisch. Das Desktop-Hero ist rechts leer.

## Was fehlt mir

**Must**
- Ein Verkehrsträger-Ampelfazit oben: „Straße ✓ · Schiene ✓ · See ✓ · Luft PAX ✗ / CAO ✓“. Verbote, Mengengrenzen und Sonder-SV gehören in die kritische Zusammenfassung.
- Tankdaten (ADR/RID-Tankcode, TU/TE/TT, IMDG T/TP) und Beförderungs-SV (V/CV/S, W/CW/CE).
- **IMDG-Trennung / Zusammenladeverbote**: zwei oder mehr UN-Nummern eingeben, dann erscheint die Trennungsmatrix (7.2.4, SG-Codes) und das ADR-Zusammenladeverbot (7.5.2). Die Tabellen `segregation_matrix` existieren offenbar schon. Das wäre für mich der Kaufgrund Nr. 2.
- **Team-Accounts** (5 Logins, Admin, eine Rechnung, netto mit USt-ID) und ein klarer Preis pro Team.
- Kaufprozess, der funktioniert (Rechnung/SEPA, AVV-Vertrag).

**Should**
- ADN (andere Quelle oder eigene Pflege) – Binnenhafen Duisburg.
- 1000-Punkte-Rechner (ADR 1.1.3.6) mit mehreren Positionen; LQ/EQ-Rechner.
- Dokumentengenerator: Beförderungspapier ADR/RID, IMO-Dangerous-Goods-Declaration, Container-Packzertifikat.
- RID-Gefahrnummer, ICAO-LQ (Y-PI) und IMDG-IBC korrekt anzeigen.
- Türkische Stoffnamen bzw. -texte, korrekte türkische Großschreibung; Gefahrzettel als Piktogramme (sprachunabhängig, ideal für Fahrer).
- Suche: mehr als 20 Treffer bzw. „weitere laden“, Favoriten/Verlauf für die Disponenten.
- Änderungsmonitor (ADR 2027, IMDG Amdt. 43-26).

**Nice**
- ERP/TMS-API (Stammdaten-Abgleich unserer Artikel mit UN-Nummern).
- PWA bzw. Offline-Modus fürs Terminal (Funklöcher zwischen Containern).
- KI-Assistent – erst wenn die Datenbasis die obigen Punkte abdeckt.
- Pflichtenprüfer, SV-Browser, Verpackungs-Browser.

## Kaufentscheidung
**Unter Bedingungen – heute noch nein.**
- Für 125 €/Monat **pro Nutzer** (= 625 € für mein Team): klar nein.
- Für 125 €/Monat **netto für ein Team bis 5 Nutzer** würde ich kaufen, sobald (1) Verbote und Einschränkungen in der Vergleichs-Zusammenfassung korrekt als kritisch erscheinen, (2) Tankdaten und RID-Gefahrnummern drin sind und (3) ich tatsächlich bezahlen kann (Rechnung).
- Meine Preisvorstellung: ca. 49–69 € netto für 1 Nutzer, ca. 149–199 € netto für ein Team mit 5 Nutzern. Mit IMDG-Trennungsrechner, Zusammenladeprüfung und Dokumentengenerator wären auch 249 € für das Team vertretbar.
- **Wechseln** würde ich, wenn ich damit meine bisherigen Einzelwerkzeuge (ADR-Buch/-Software, IMDG-Code, RID-Tabelle) für die täglichen Disponentenfragen wirklich ersetzen kann – inklusive Trennung im Container und ADN.

## Scores (1–10)
| Kriterium | Score |
|---|---|
| Nutzen | 6 |
| Datenvertrauen | 5 |
| Bedienbarkeit Desktop | 7 |
| Bedienbarkeit Mobil | 6 |
| Design | 7 |
| Preis-Leistung | 4 |
| Kaufwahrscheinlichkeit | 4 |

## Ein Satz für den Gründer
Der Vergleich ist genau das richtige Produkt, aber er muss meine eigentliche Frage beantworten („darf ich das per LKW, Bahn, Schiff und Flugzeug gleich verschicken – und was ändert sich?“) – statt „keine kritischen Abweichungen“ bei einem Flugverbot zu melden. Mit Tanks, Trennung und einem Teampreis bin ich dabei.
