import type { LegalDocument } from './document'

/**
 * Widerrufsbelehrung für Verträge über Dienstleistungen, nach dem gesetzlichen Muster
 * (Anlage 1 zu Art. 246a § 1 Abs. 2 Satz 2 EGBGB), mit Muster-Widerrufsformular (Anlage 2).
 * Entwurf – vor dem Start anwaltlich prüfen lassen.
 */
export const WIDERRUF: LegalDocument = {
  title: 'Widerrufsbelehrung',
  description: 'Widerrufsrecht für Verbraucher bei gefahrgut.org und Muster-Widerrufsformular.',
  blocks: [
    { kind: 'p', text: 'Das folgende Widerrufsrecht gilt nur für Verbraucher (§ 13 BGB). Unternehmern steht kein gesetzliches Widerrufsrecht zu.' },

    { kind: 'h2', text: 'Widerrufsrecht' },
    { kind: 'p', text: 'Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.' },
    { kind: 'p', text: 'Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.' },
    { kind: 'p', text: 'Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({companyName}, {street}, {postalCode} {city}, Deutschland, E-Mail: {email}, Telefon: {phone}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.' },
    { kind: 'p', text: 'Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.' },

    { kind: 'h2', text: 'Folgen des Widerrufs' },
    { kind: 'p', text: 'Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.' },
    { kind: 'p', text: 'Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.' },

    { kind: 'h2', text: 'Muster-Widerrufsformular' },
    { kind: 'p', text: '(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)' },
    { kind: 'p', text: 'An {companyName}, {street}, {postalCode} {city}, Deutschland, E-Mail: {email}' },
    { kind: 'ul', items: [
      'Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: Nutzung der Plattform gefahrgut.org',
      'Bestellt am (*) / erhalten am (*)',
      'Name des/der Verbraucher(s)',
      'Anschrift des/der Verbraucher(s)',
      'E-Mail-Adresse des Kontos',
      'Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)',
      'Datum',
    ] },
    { kind: 'p', text: '(*) Unzutreffendes streichen.' },
  ],
}
