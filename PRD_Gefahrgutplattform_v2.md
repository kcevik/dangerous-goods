# Product Requirements Document (PRD)
## Gefahrgut-Webplattform für Gefahrgutbeauftragte

**Version:** 2.0  
**Datum:** April 2026  
**Status:** Entwurf

---

## 1. Produkt-Übersicht

### 1.1 Produktvision

Eine spezialisierte Web-App, die Gefahrgutbeauftragten alle relevanten Regelwerke (ADR, RID, IMDG, ICAO, ADN, UN) in einer modernen, schnellen Oberfläche zugänglich macht – nicht als statisches Nachschlagewerk, sondern als aktives Arbeitswerkzeug.

### 1.2 Problemstellung

Gefahrgutbeauftragte müssen heute:
- Mehrere Regelwerke parallel in PDFs oder unübersichtlichen Datenbanken nachschlagen
- Unterschiede zwischen Verkehrsträgern manuell herausarbeiten
- Freistellungen und Mengenberechnungen von Hand durchführen
- Dokumente wie Beförderungspapiere manuell erstellen

Das kostet täglich wertvolle Zeit und birgt Fehlerrisiken.

### 1.3 Lösung

Eine zentrale Plattform, auf der der Nutzer eine UN-Nummer oder einen Stoffnamen eingibt und sofort alle relevanten Vorschriften aller Verkehrsträger sieht – mit automatischem Regelwerksvergleich, integrierten Rechentools und Dokumentengenerator.

### 1.4 Zielgruppe

- Gefahrgutbeauftragte in Unternehmen
- Versandmitarbeiter mit Gefahrgutverantwortung
- Gefahrgutberater und -auditoren
- Speditionen und Logistikunternehmen

### 1.5 Wettbewerbsumfeld

gefahrgut.org ist die bekannteste vergleichbare Plattform und nutzt dieselbe BAM-Datenbasis. Sie deckt jedoch ausschließlich ADR ab. Der zentrale Wettbewerbsvorteil dieser Plattform ist der Regelwerksvergleich über alle Verkehrsträger hinweg (ADR, RID, IMDG, ICAO, ADN) – das existiert am Markt bislang nicht in dieser Form.

---

## 2. Datenbasis

**Quelle:** Bundesanstalt für Materialforschung und -prüfung (BAM) – Datenbank GEFAHRGUT  
**Lizenz:** dl-de/by-2-0 (Namensnennung erforderlich, Datenveränderung kennzeichnen)

| Regelwerk | Datensätze | UN-Nummern |
|-----------|-----------|------------|
| ADR       | ~3.374    | 2.347      |
| RID       | ~3.350    | 2.347      |
| IMDG      | ~3.246    | 2.347      |
| ICAO      | ~3.528    | 2.340      |
| ADN       | ~3.353    | 2.354      |
| UN        | ~3.232    | 2.347      |

**Entwicklungsstrategie:** Start mit ADR (Phase 1), schrittweise Erweiterung um weitere Regelwerke.

---

## 3. Tech-Stack

| Bereich              | Technologie                        |
|----------------------|------------------------------------|
| Frontend             | Nuxt 3 + TypeScript                |
| UI-Komponenten       | Nuxt UI + Tailwind CSS             |
| Datenbank            | PostgreSQL via Supabase            |
| Authentifizierung    | Supabase Auth                      |
| Datei-Storage        | Supabase Storage                   |
| Hosting              | Netcup (Node.js / Docker + PM2)    |
| SSL                  | Let's Encrypt via Caddy            |
| PDF-Generierung      | Puppeteer                          |
| Suche (Phase 2)      | Meilisearch                        |

---

## 4. Seitenstruktur & Navigation

### 4.1 Hauptnavigation

```
/dashboard
/search
/un/:nummer
/tools
/documents
/regulations
/changes
/settings
```

### 4.2 URL-Struktur (wichtigste Seiten)

```
/dashboard                    → Startseite nach Login
/search?q=benzin              → Suchergebnisse
/un/1203                      → UN-Detailseite
/un/1203/vergleich            → Regelwerksvergleich
/tools/1000-punkte            → 1000-Punkte-Rechner
/tools/lq-eq                  → LQ/EQ-Rechner
/tools/dokumentengenerator    → Dokumentengenerator
/tools/transport-assistent    → Transportarten-Assistent
/tools/verpackung             → Verpackungsassistent
/documents                    → Dokumentenarchiv
/changes                      → Änderungsmonitor
/regulations/adr              → Regelwerks-Browser
```

---

## 5. Geschäftsmodell

Das Preismodell ist noch in Abstimmung. Angedacht ist ein 2- bis 3-stufiges Modell, möglicherweise inklusive Freemium-Einstieg.

**Mögliche Stufen (zur Diskussion):**

**Freemium** – kostenlos, ohne Anmeldung oder nach Registrierung  
Zugang zu Basis-Tools (z.B. UN-Suche, einfacher Rechner)

**Starter / Pro** – Abo für Einzelnutzer  
Zugang zu allen Tools, Dokumentengenerator, Regelwerksvergleich

**Team / Business** – Abo für Unternehmen  
Mehrere Nutzer, Mandantenfähigkeit, Rollenverwaltung, API-Zugang

**Premium-Features** (kostenpflichtig, unabhängig vom Modell):
- Regelwerksvergleich über alle Verkehrsträger
- PDF-Dokumentengenerator
- Änderungsmonitor
- KI-Assistent (Phase 3)
- API-Zugang für ERP-/TMS-Systeme

---

## 6. Features & Anforderungen

### 6.1 Phase 1 – MVP (ADR)

#### F-01: UN-Nummern-Suche (ADR)

**Priorität:** Muss  
**Beschreibung:** Zentrale Suchfunktion für UN-Nummern und Stoffnamen auf Basis der ADR-Daten.

Eingabe:
- UN-Nummer (z.B. 1203)
- Stoffname / Synonym (z.B. „Benzin", „Petrol", „Gasoline")
- Gefahrzettel
- Verpackungsgruppe

Ausgabe (Detailseite /un/:nummer):
- Offizielle Benennung
- Gefahrklasse
- Verpackungsgruppe
- Tunnelcode
- Sondervorschriften
- Begrenzte Mengen (LQ) / Freigestellte Mengen (EQ)
- Verpackungsanweisungen
- Beförderungskategorie
- Marine Pollutant / Umweltgefährdung

Technische Anforderungen:
- Unscharfe Suche (Tippfehlertoleranz)
- Suche nach Synonymen
- Antwortzeit < 300 ms

---

#### F-02: 1000-Punkte-Rechner (ADR 1.1.3.6)

**Priorität:** Muss  
**Beschreibung:** Berechnung der Beförderungskategorie und Freistellung nach ADR 1.1.3.6.

Eingabe:
- Beliebig viele Stoffe (UN-Nummer + Menge)
- Verpackungsart

Ausgabe:
- Punktzahl je Stoff
- Gesamtpunktzahl
- Ergebnis: „Freigestellt" oder „Voller ADR-Transport erforderlich"
- Warnhinweise bei kritischen Stoffen

---

#### F-03: Dokumentengenerator

**Priorität:** Muss  
**Beschreibung:** Automatische Erzeugung transportrelevanter Dokumente auf ADR-Basis.

Dokumente:
- Beförderungspapier (ADR-konform, § 5.4.1)
- Schriftliche Weisungen
- Checklisten (Fahrer, Versand)

Export-Formate:
- PDF
- Word (.docx)

Anforderungen:
- Vorschauansicht vor dem Export
- Speicherung im Dokumentenarchiv (/documents)
- Wiederöffnen und Bearbeiten gespeicherter Dokumente

---

#### F-04: Benutzerverwaltung & Login

**Priorität:** Muss  
**Beschreibung:** Authentifizierung über Supabase Auth.

Funktionen:
- Registrierung und Login per E-Mail + Passwort
- Passwort zurücksetzen
- Benutzerprofil (Name, Unternehmen, E-Mail)
- Favoritenliste für häufig genutzte UN-Nummern

---

#### F-05: Dashboard

**Priorität:** Muss  
**Beschreibung:** Startseite nach Login.

Inhalte:
- Globales Suchfeld (prominent oben)
- Zuletzt verwendete UN-Nummern
- Favoritenliste
- Schnellzugriff-Karten (Rechner, Dokumentengenerator)
- Hinweis auf aktuelle ADR-Änderungen

---

#### F-06: ADR-Pflichten-Checker

**Priorität:** Sollte  
**Beschreibung:** Stoff und Menge eingeben → automatische Ausgabe aller geltenden ADR-Pflichten.

Ausgabe: Erforderliche Dokumente, Ausrüstung, Schulungspflichten, Kennzeichnung

---

#### F-07: Sondervorschriften-Browser (ADR 3.3)

**Priorität:** Sollte  
**Beschreibung:** Volltext aller ADR-Sondervorschriften, verknüpft mit der UN-Suche.

---

#### F-08: Verpackungsanweisungen-Browser (ADR 4.1.4)

**Priorität:** Sollte  
**Beschreibung:** Übersicht aller Verpackungsanweisungen, verknüpft mit UN-Nummern.

---

### 6.2 Phase 2 – Regelwerke & Vergleich

#### F-09: Erweiterung um RID, IMDG, ICAO, ADN

**Priorität:** Muss  
**Beschreibung:** Import und Darstellung aller weiteren Regelwerke aus der BAM-Datenbasis.

---

#### F-10: Regelwerksvergleich (zentrales Differenzierungsmerkmal)

**Priorität:** Muss  
**Beschreibung:** Automatischer Vergleich aller Regelwerke für eine UN-Nummer.

| Regelwerk | Klasse | Verp.gruppe | Sondervorschriften | LQ | EQ |
|-----------|--------|-------------|--------------------|----|-----|
| ADR       | ...    | ...         | ...                | ...| ... |
| RID       | ...    | ...         | ...                | ...| ... |
| IMDG      | ...    | ...         | ...                | ...| ... |
| ICAO      | ...    | ...         | ...                | ...| ... |
| ADN       | ...    | ...         | ...                | ...| ... |

Anforderungen:
- Unterschiede farblich markieren
- Hinweistext bei Abweichungen: „Achtung: ICAO weicht von ADR ab"
- Export als PDF

---

#### F-11: Transportarten-Assistent

**Priorität:** Sollte  
**Beschreibung:** Geführter Assistent für multimodale Transporte.

Beispiel: „UN 1263, 20 Liter, Straße + Fähre + Luftfracht"  
Ausgabe: Anforderungen je Verkehrsträger, Unterschiede, Warnhinweise

---

#### F-12: Freistellungsrechner (LQ / EQ)

**Priorität:** Sollte  
**Beschreibung:** Berechnung von Limited Quantity und Excepted Quantity nach allen Regelwerken.

---

#### F-13: Verpackungs- und Kennzeichnungsassistent

**Priorität:** Sollte  
**Beschreibung:** Zulässige Verpackungen und Kennzeichnungen je UN-Nummer, Verpackungsart und Gebindegröße.

---

#### F-14: Änderungsmonitor

**Priorität:** Sollte  
**Beschreibung:** Vergleich zwischen Regelwerks-Versionen (z.B. ADR 2023 vs. ADR 2025).

Funktionen:
- Filter nach Regelwerk und UN-Nummer
- Markierung geänderter Felder
- Optional: E-Mail-Benachrichtigung bei relevanten Änderungen

---

#### F-15: Mandantenfähigkeit & Rollen

**Priorität:** Sollte  
**Beschreibung:** Mehrere Unternehmen und Nutzer mit Rollenverwaltung.

Rollen: Administrator, Gefahrgutbeauftragter, Versandmitarbeiter, Fahrer, Auditor

---

### 6.3 Phase 3 – KI & Automatisierung

#### F-16: KI-Assistent

**Priorität:** Kann  
**Beschreibung:** Chatbasierter Assistent für konkrete Transportfragen.

Beispiel: „Darf ich UN 1993 mit 5-Liter-Kanistern per Flugzeug verschicken?"  
Antwort: Ja/Nein + Begründung + relevante Regelwerks-Abschnitte

---

#### F-17: Dokumentenprüfung per Upload

**Priorität:** Kann  
**Beschreibung:** KI-gestützte Prüfung hochgeladener Beförderungspapiere auf Fehler und fehlende Angaben.

---

#### F-18: Mobile App / PWA

**Priorität:** Kann  
**Beschreibung:** Progressive Web App oder native App für iOS und Android.

---

## 7. Nicht-funktionale Anforderungen

| Anforderung         | Zielwert                                        |
|---------------------|-------------------------------------------------|
| Suchgeschwindigkeit | < 300 ms                                        |
| Seitenlade-Zeit     | < 1,5 s (First Contentful Paint)                |
| Verfügbarkeit       | > 99,5 %                                        |
| Datensicherheit     | DSGVO-konform, Daten in EU                      |
| Browser-Support     | Chrome, Firefox, Safari, Edge (aktuelle Version)|
| Responsivität       | Desktop-optimiert, Tablet nutzbar               |
| Datenherkunft       | BAM-Quellenangabe im Footer auf allen Seiten    |

---

## 8. Offene Fragen

- Preismodell: 2-stufig oder 3-stufig inkl. Freemium? Welche Features in welcher Stufe?
- Lizenzprüfung: BAM dl-de/by-2-0 für kommerzielle Nutzung rechtlich absichern
- Update-Frequenz: Wie oft liefert BAM neue CSV-Daten? Automatischer Import-Job nötig?
- Sprachen: Nur Deutsch (Phase 1) oder Englisch ab Phase 2?
- Supabase Free (500 MB Limit) vs. Self-hosted PostgreSQL auf Netcup ab Go-Live klären

---

*Version 2.0 – April 2026*
