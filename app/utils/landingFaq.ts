export interface FaqItem { question: string, answer: string }

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Was ist die 1000-Punkte-Regel im ADR?',
    answer: 'Die 1000-Punkte-Regel (ADR 1.1.3.6) erlaubt Erleichterungen beim Gefahrguttransport auf der Straße: Jeder Beförderungskategorie ist ein Faktor zugeordnet, mit dem die transportierte Menge multipliziert wird. Bleibt die Summe aller Produkte unter 1.000 Punkten, entfallen unter anderem die Pflicht zur orangefarbenen Kennzeichnung, der ADR-Schein des Fahrers und die schriftlichen Weisungen. gefahrgut.org wird einen 1000-Punkte-Rechner enthalten, der die Berechnung automatisch durchführt.',
  },
  {
    question: 'Worin unterscheiden sich ADR, RID, IMDG und ICAO?',
    answer: 'ADR regelt den Gefahrguttransport auf der Straße, RID auf der Schiene, der IMDG-Code auf See und die ICAO Technical Instructions in der Luft. Dieselbe UN-Nummer kann je nach Verkehrsträger unterschiedliche Verpackungsanweisungen, Mengengrenzen und Sondervorschriften haben. gefahrgut.org stellt alle vier Regelwerke nebeneinander dar, sodass Unterschiede auf einen Blick sichtbar werden – als eine der ersten Plattformen überhaupt.',
  },
  {
    question: 'Wann braucht ein Unternehmen einen Gefahrgutbeauftragten?',
    answer: 'Nach der Gefahrgutbeauftragtenverordnung (GbV) muss jedes Unternehmen, das an der Beförderung gefährlicher Güter beteiligt ist – als Absender, Verpacker, Verlader, Befüller oder Beförderer – grundsätzlich einen geschulten Gefahrgutbeauftragten bestellen. Ausnahmen gelten unter anderem für Unternehmen, die ausschließlich Mengen unterhalb der Freistellungsgrenzen (z. B. der 1000-Punkte-Regel) befördern.',
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
    question: 'Welche Datenbasis nutzt gefahrgut.org?',
    answer: 'gefahrgut.org basiert auf der GEFAHRGUT-Datenbank der Bundesanstalt für Materialforschung und -prüfung (BAM) mit über 16.730 Einträgen zu ADR 2025, RID 2025, IMDG Amdt. 42-24, ICAO 2025 und den UN-Modellvorschriften. Die Daten stehen unter der Datenlizenz Deutschland (dl-de/by-2-0); Änderungen gegenüber der Quelle werden gekennzeichnet.',
  },
  {
    question: 'Was kostet gefahrgut.org?',
    answer: 'Zum Start gibt es einen kostenlosen Zugang mit 5 Suchanfragen pro Monat. Für Vielnutzer wird es einen bezahlten Zugang geben; die Preise stehen noch nicht fest und werden zuerst den Mitgliedern der Warteliste mitgeteilt.',
  },
]
