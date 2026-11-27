import { planPrice } from '$lib/legalPages/facts'
import { DATA_SOURCE_LABEL, SITE_FACTS } from './siteFacts'

export interface FaqItem { question: string, answer: string }

/**
 * The one place for the price wording on the landing page. The amount comes from `LEGAL_FACTS`
 * via `planPrice()` (AGB, /konto, upsell, landing) — never retype it. Owner 2026-11-25: the
 * price is public and waitlist members get 14 days free after the launch.
 */
export const PRICE_FAQ_ANSWER = `gefahrgut.org gibt es als einen Tarif mit vollem Funktionsumfang – ohne Funktionsstufen: ${planPrice() ?? 'Der Preis steht in den AGB'}. Wer sich vor dem Start auf die Benachrichtigungsliste einträgt, bekommt nach dem Start 14 Tage gratis. Weitere Tarife, etwa für Teams, sind später möglich.`

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Was ist die 1000-Punkte-Regel im ADR?',
    answer: 'Die 1000-Punkte-Regel (ADR 1.1.3.6) erlaubt Erleichterungen beim Gefahrguttransport auf der Straße: Jeder Beförderungskategorie ist ein Faktor zugeordnet, mit dem die transportierte Menge multipliziert wird. Ergibt die Summe aller Produkte je Beförderungseinheit nicht mehr als 1.000 Punkte, entfallen unter anderem die Pflicht zur orangefarbenen Kennzeichnung, der ADR-Schein des Fahrers und die schriftlichen Weisungen. Den Rechner gibt es auf gefahrgut.org als Werkzeug für freigeschaltete Konten.',
  },
  {
    question: 'Worin unterscheiden sich ADR, RID, IMDG und ICAO?',
    answer: 'ADR regelt den Gefahrguttransport auf der Straße, RID auf der Schiene, der IMDG-Code auf See und die ICAO Technical Instructions in der Luft. Dieselbe UN-Nummer kann je nach Verkehrsträger unterschiedliche Verpackungsanweisungen, Mengengrenzen und Sondervorschriften haben. gefahrgut.org stellt die vier Regelwerke je UN-Nummer nebeneinander dar und markiert Abweichungen. Das ADN (Binnenschifffahrt) ist nicht enthalten, weil die BAM dafür keine Daten veröffentlicht.',
  },
  {
    question: 'Wann braucht ein Unternehmen einen Gefahrgutbeauftragten?',
    answer: 'Nach der Gefahrgutbeauftragtenverordnung (GbV) muss jedes Unternehmen, das an der Beförderung gefährlicher Güter beteiligt ist – als Absender, Verpacker, Verlader, Befüller oder Beförderer – grundsätzlich einen geschulten Gefahrgutbeauftragten bestellen. Ausnahmen gelten unter anderem für Unternehmen, die ausschließlich innerhalb der Freistellungsgrenzen befördern, z. B. mit nicht mehr als 1.000 Punkten je Beförderungseinheit nach ADR 1.1.3.6.',
  },
  {
    question: 'Was kann Software für Gefahrgutbeauftragte, was ein ADR-Buch nicht kann?',
    answer: 'Ein Buch zeigt dir ein Regelwerk. Als Gefahrgutbeauftragter prüfst du aber oft dieselbe UN-Nummer in mehreren Verkehrsträgern. gefahrgut.org stellt ADR, RID, IMDG und ICAO je UN-Nummer nebeneinander und markiert Abweichungen, sucht über Stoffnamen und Handelsnamen, rechnet die 1000-Punkte-Regel nach ADR 1.1.3.6 und zeigt die Sondervorschriften im Volltext direkt beim Stoff. Das ADR gibt es zusätzlich als durchsuchbaren Lesetext (kein rechtsverbindlicher Text). Einstufung, Beförderungspapiere und Verantwortung bleiben bei dir.',
  },
  {
    question: 'Was ist eine UN-Nummer?',
    answer: 'Eine UN-Nummer ist eine vierstellige, von den Vereinten Nationen vergebene Kennnummer für gefährliche Stoffe und Gegenstände, zum Beispiel UN 1203 für Benzin. Sie identifiziert einen Stoff verkehrsträgerübergreifend eindeutig und ist der Schlüssel zu allen Vorschriften: Gefahrklasse, Verpackungsgruppe, Sondervorschriften und Mengengrenzen sind je UN-Nummer in den Regelwerken hinterlegt.',
  },
  {
    question: 'Was sind Sondervorschriften (SV)?',
    answer: 'Sondervorschriften sind nummerierte Zusatzregeln, die einzelnen UN-Nummern zugeordnet sind und die allgemeinen Vorschriften ergänzen oder ersetzen – etwa SV 640 zu Beförderungsbedingungen bestimmter Stoffgruppen. Sie stehen in Kapitel 3.3 der Regelwerke. gefahrgut.org zeigt die vollständigen Texte der Sondervorschriften direkt beim jeweiligen Stoff an, auf Deutsch, Englisch und Französisch, soweit amtlich verfügbar.',
  },
  {
    question: 'Hilft gefahrgut.org bei Abfalltransporten?',
    answer: 'Beim Nachschlagen ja: Gefährliche Abfälle werden denselben UN-Nummern und Einträgen zugeordnet wie andere Gefahrgüter; für Abfälle, deren Zusammensetzung nicht genau bekannt ist, regelt ADR 2.1.3.5.5 die Zuordnung. Die Stoffsuche und der Regelwerksvergleich zeigen dir die Angaben je UN-Nummer. Es gibt aber kein eigenes Abfall-Werkzeug – Besonderheiten wie den Vermerk „ABFALL“ vor der UN-Nummer im Beförderungspapier (ADR 5.4.1.1.3) berücksichtigst du selbst.',
  },
  {
    question: 'Welche Datenbasis nutzt gefahrgut.org?',
    answer: `Datenbasis ist die ${DATA_SOURCE_LABEL} der Bundesanstalt für Materialforschung und -prüfung (BAM): ${SITE_FACTS.unNumbers} UN-Nummern mit ${SITE_FACTS.entries} Einträgen zu ADR 2025, RID 2025, IMDG Amdt. 42-24, ICAO 2025 und den UN-Modellvorschriften, dazu ${SITE_FACTS.specialProvisions} Sondervorschriften. ADN-Daten veröffentlicht die BAM nicht. Die Daten stehen unter der Datenlizenz Deutschland (dl-de/by-2-0); Änderungen gegenüber der Quelle werden gekennzeichnet.`,
  },
  {
    question: 'Was kostet gefahrgut.org?',
    answer: PRICE_FAQ_ANSWER,
  },
]
