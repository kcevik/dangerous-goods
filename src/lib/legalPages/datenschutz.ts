import type { LegalDocument } from './document'

/**
 * Datenschutzerklärung nach Art. 13, 14 DSGVO. Entwurf – vor dem Start anwaltlich prüfen lassen.
 * Must change whenever a new service processes personal data (analytics, payment, mail sender).
 */
export const DATENSCHUTZ: LegalDocument = {
  title: 'Datenschutzerklärung',
  description: 'Wie gefahrgut.org personenbezogene Daten verarbeitet und welche Rechte du hast.',
  blocks: [
    { kind: 'h2', text: '1. Verantwortlicher' },
    { kind: 'p', text: 'Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:' },
    { kind: 'p', text: '{companyName}\n{street}\n{postalCode} {city}\nDeutschland\nE-Mail: {email}\nTelefon: {phone}' },
    { kind: 'p', text: 'Einen Datenschutzbeauftragten haben wir nicht benannt, weil wir dazu gesetzlich nicht verpflichtet sind. Bei Fragen zum Datenschutz erreichst du uns unter der oben genannten E-Mail-Adresse.' },

    { kind: 'h2', text: '2. Überblick' },
    { kind: 'p', text: 'Wir verarbeiten personenbezogene Daten nur, soweit es für den Betrieb dieser Website und unserer Leistungen erforderlich ist, du eingewilligt hast oder eine andere gesetzliche Grundlage besteht. Wir verkaufen keine Daten und nutzen sie nicht für Werbung durch Dritte.' },
    { kind: 'p', text: 'Diese Erklärung gilt für gefahrgut.org und app.gefahrgut.org. Für den Blog unter blog.gefahrgut.org gilt die dort veröffentlichte Datenschutzerklärung.' },

    { kind: 'h2', text: '3. Hosting und Server-Logdateien' },
    { kind: 'p', text: 'Die Anwendung läuft auf einem Server der STRATO AG, Otto-Ostrowski-Straße 7, 10249 Berlin, in Deutschland. Mit STRATO besteht ein Vertrag über die Auftragsverarbeitung nach Art. 28 DSGVO.' },
    { kind: 'p', text: 'Bei jedem Aufruf speichert der Webserver automatisch folgende Daten in Logdateien:' },
    { kind: 'ul', items: [
      'IP-Adresse des anfragenden Geräts',
      'Datum und Uhrzeit des Zugriffs',
      'aufgerufene Adresse (URL) und HTTP-Statuscode',
      'übertragene Datenmenge',
      'Browser und Betriebssystem (User-Agent)',
    ] },
    { kind: 'p', text: 'Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse besteht darin, die Website sicher und stabil zu betreiben sowie Angriffe und Missbrauch (zum Beispiel durch Begrenzung von Anmeldeversuchen) zu erkennen und abzuwehren. Die Logdateien werden nach {logRetention} gelöscht, sofern sie nicht im Einzelfall zur Aufklärung eines Sicherheitsvorfalls länger benötigt werden.' },

    { kind: 'h2', text: '4. Datenbank und Anmeldung (Supabase)' },
    { kind: 'p', text: 'Nutzerkonten, die Anmeldung und die Regelwerksdaten verwalten wir mit Supabase, einem Dienst der Supabase, Inc. (USA). Die Datenbank liegt in einem Rechenzentrum in Frankfurt am Main (Region eu-central-1). Mit Supabase besteht ein Vertrag über die Auftragsverarbeitung nach Art. 28 DSGVO.' },
    { kind: 'p', text: 'Da Supabase, Inc. ihren Sitz in den USA hat, ist ein Zugriff auf Daten aus den USA nicht ausgeschlossen. Für diesen Fall sind die Standardvertragsklauseln der Europäischen Kommission nach Art. 46 Abs. 2 lit. c DSGVO vereinbart.' },

    { kind: 'h2', text: '5. Nutzerkonto' },
    { kind: 'p', text: 'Wenn du ein Konto anlegst, verarbeiten wir deine E-Mail-Adresse, dein Passwort (nur als verschlüsselter Hashwert), den Zeitpunkt der Registrierung und der Bestätigung, den Zeitpunkt der Freischaltung deines Kontos sowie die Zeitpunkte deiner Anmeldungen. Der Anmeldedienst protokolliert Anmeldevorgänge zusätzlich mit der IP-Adresse, um Missbrauch zu erkennen (Art. 6 Abs. 1 lit. f DSGVO). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, denn ohne diese Daten können wir dir kein Konto bereitstellen.' },
    { kind: 'p', text: 'Deine Suchanfragen werden nicht dauerhaft gespeichert und nicht deinem Konto zugeordnet; sie werden nur für die Dauer der Anfrage verarbeitet.' },
    { kind: 'p', text: 'Wir speichern deine Kontodaten, solange dein Konto besteht. Wenn du dein Konto löschen möchtest, genügt eine E-Mail an uns; wir löschen die Daten dann, soweit keine gesetzlichen Aufbewahrungspflichten (etwa für Rechnungen nach Handels- und Steuerrecht) entgegenstehen.' },

    { kind: 'h2', text: '6. Cookies' },
    { kind: 'p', text: 'Wir setzen nur Cookies, die für die Anmeldung technisch erforderlich sind. Sie enthalten das Sitzungstoken deines Kontos und werden gelöscht, wenn du dich abmeldest oder die Sitzung abläuft. Rechtsgrundlage für das Speichern auf deinem Gerät ist § 25 Abs. 2 Nr. 2 TDDDG, für die weitere Verarbeitung Art. 6 Abs. 1 lit. b DSGVO. Eine Einwilligung ist dafür nicht erforderlich.' },
    { kind: 'p', text: 'Schriftarten laden wir von unserem eigenen Server; es werden dabei keine Daten an Dritte übertragen.' },

    { kind: 'h2', text: '7. Benachrichtigung zum Start' },
    { kind: 'p', text: 'Solange die Plattform noch nicht gestartet ist, kannst du dich benachrichtigen lassen, wenn es losgeht. Dafür speichern wir deine E-Mail-Adresse, den Zeitpunkt und die Fassung deiner Einwilligung sowie den Zeitpunkt deiner Bestätigung. Rechtsgrundlage ist deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO.' },
    { kind: 'p', text: 'Wir nutzen das Double-Opt-in-Verfahren: Die erste E-Mail, die du von uns erhältst, bittet dich, deine Adresse zu bestätigen. Nur bestätigte Adressen erhalten die Startbenachrichtigung. Du kannst deine Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, etwa per E-Mail an uns. Sobald die Startbenachrichtigung versandt ist, löschen wir die gesamte Liste; deine Adresse löschen wir schon früher, wenn du widerrufst.' },

    { kind: 'h2', text: '8. E-Mail-Versand' },
    { kind: 'p', text: 'E-Mails zur Bestätigung deiner Adresse, zum Zurücksetzen deines Passworts und zur Startbenachrichtigung versenden wir über {mailProvider}. Dabei werden deine E-Mail-Adresse und der Inhalt der Nachricht verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, bei der Startbenachrichtigung Art. 6 Abs. 1 lit. a DSGVO.' },

    { kind: 'h2', text: '9. Kontakt per E-Mail' },
    { kind: 'p', text: 'Wenn du uns schreibst, verarbeiten wir deine Angaben, um deine Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn deine Anfrage mit einem Vertrag zusammenhängt, ansonsten Art. 6 Abs. 1 lit. f DSGVO (unser Interesse, Anfragen zu beantworten). Wir löschen die Nachrichten, wenn die Anfrage erledigt ist und keine Aufbewahrungspflichten bestehen.' },

    { kind: 'h2', text: '10. Zahlungsabwicklung' },
    { kind: 'p', text: 'Sobald kostenpflichtige Tarife buchbar sind, wickeln wir Zahlungen über Stripe ab, einen Dienst der Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland. Stripe verarbeitet die für die Zahlung erforderlichen Daten (zum Beispiel Name, E-Mail-Adresse, Zahlungsdaten und Rechnungsanschrift) als eigener Verantwortlicher. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Wir selbst erhalten keine vollständigen Karten- oder Kontodaten. Diese Ziffer wird vor dem Start der Bezahlung ergänzt.' },

    { kind: 'h2', text: '11. Analyse- und Trackingwerkzeuge' },
    { kind: 'p', text: 'Wir setzen derzeit keine Analyse-, Tracking- oder Werbewerkzeuge ein. Sollte sich das ändern, holen wir vorher deine Einwilligung ein, soweit sie erforderlich ist, und ergänzen diese Erklärung.' },

    { kind: 'h2', text: '12. Speicherdauer' },
    { kind: 'p', text: 'Wir speichern personenbezogene Daten nur so lange, wie es für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungsfristen es verlangen. Die Fristen für die einzelnen Verarbeitungen sind in den Abschnitten oben genannt.' },

    { kind: 'h2', text: '13. Deine Rechte' },
    { kind: 'p', text: 'Du hast gegenüber uns folgende Rechte hinsichtlich der dich betreffenden personenbezogenen Daten:' },
    { kind: 'ul', items: [
      'Recht auf Auskunft (Art. 15 DSGVO)',
      'Recht auf Berichtigung (Art. 16 DSGVO)',
      'Recht auf Löschung (Art. 17 DSGVO)',
      'Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)',
      'Recht auf Datenübertragbarkeit (Art. 20 DSGVO)',
      'Recht, eine Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen (Art. 7 Abs. 3 DSGVO)',
    ] },
    { kind: 'p', text: 'Widerspruchsrecht (Art. 21 DSGVO): Soweit wir Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO verarbeiten, kannst du aus Gründen, die sich aus deiner besonderen Situation ergeben, jederzeit widersprechen. Wir verarbeiten die Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe nachweisen, die deine Interessen überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.' },
    { kind: 'p', text: 'Beschwerderecht (Art. 77 DSGVO): Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem Mitgliedstaat deines gewöhnlichen Aufenthalts, deines Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes.' },
    { kind: 'p', text: 'Um deine Rechte auszuüben, genügt eine E-Mail an {email}.' },

    { kind: 'h2', text: '14. Pflicht zur Bereitstellung, keine automatisierten Entscheidungen' },
    { kind: 'p', text: 'Du bist nicht verpflichtet, uns Daten bereitzustellen. Ohne E-Mail-Adresse und Passwort können wir dir aber kein Konto einrichten. Eine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von Art. 22 DSGVO findet nicht statt.' },

    { kind: 'h2', text: '15. Änderungen' },
    { kind: 'p', text: 'Wir passen diese Erklärung an, wenn sich unsere Verarbeitungen oder die Rechtslage ändern. Es gilt die jeweils hier veröffentlichte Fassung.' },
  ],
}
