import type { LegalDocument } from './document'

/**
 * Allgemeine Geschäftsbedingungen für Verbraucher und Unternehmer.
 * Entwurf – vor dem Start anwaltlich prüfen lassen. Before payments go live the checkout needs:
 * AGB acceptance, the explicit request to start during the withdrawal period, and a
 * cancellation button (§ 312k BGB).
 */
export const AGB: LegalDocument = {
  title: 'Allgemeine Geschäftsbedingungen',
  description: 'Allgemeine Geschäftsbedingungen für die Nutzung von gefahrgut.org.',
  blocks: [
    { kind: 'h2', text: '§ 1 Geltungsbereich' },
    { kind: 'p', text: '(1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die Nutzung der Plattform gefahrgut.org zwischen {companyName}, {street}, {postalCode} {city} (nachfolgend „wir“) und dem Kunden.' },
    { kind: 'p', text: '(2) Kunden können Verbraucher und Unternehmer sein. Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können (§ 13 BGB). Unternehmer ist eine natürliche oder juristische Person oder eine rechtsfähige Personengesellschaft, die bei Abschluss des Rechtsgeschäfts in Ausübung ihrer gewerblichen oder selbständigen beruflichen Tätigkeit handelt (§ 14 BGB).' },
    { kind: 'p', text: '(3) Abweichende Bedingungen des Kunden gelten nur, wenn wir ihnen ausdrücklich in Textform zugestimmt haben.' },

    { kind: 'h2', text: '§ 2 Leistungen' },
    { kind: 'p', text: '(1) gefahrgut.org ist eine webbasierte Arbeitsplattform für Gefahrgutbeauftragte und andere mit der Beförderung gefährlicher Güter befasste Personen. Sie stellt insbesondere Stoffdaten zu ADR, RID, IMDG-Code und ICAO-TI, einen Vergleich dieser Regelwerke und einen Lesezugang zum ADR-Text bereit. Der jeweils aktuelle Leistungsumfang ergibt sich aus der Beschreibung auf der Website zum Zeitpunkt der Bestellung.' },
    { kind: 'p', text: '(2) Die Stoffdaten stammen aus der Datenbank GEFAHRGUT der Bundesanstalt für Materialforschung und -prüfung (BAM); der ADR-Text beruht auf der amtlichen deutschsprachigen Fassung des österreichischen Bundesministeriums für Innovation, Mobilität und Infrastruktur (BMIMI). Wir bereiten diese Quellen technisch auf. Die Inhalte sind kein rechtsverbindlicher Text; maßgeblich sind allein die amtlich veröffentlichten Fassungen der Regelwerke.' },
    { kind: 'p', text: '(3) Die Plattform ist ein Arbeitsmittel und keine Rechtsberatung. Die Verantwortung für die Einstufung, Verpackung, Kennzeichnung, Dokumentation und Beförderung gefährlicher Güter verbleibt beim Kunden und den nach den Vorschriften verantwortlichen Personen. Vor Entscheidungen im Einzelfall hat der Kunde die Angaben anhand der amtlichen Fassungen zu prüfen.' },
    { kind: 'p', text: '(4) Wir dürfen die Plattform weiterentwickeln und Funktionen ändern, soweit der vertraglich vereinbarte Leistungsumfang dadurch nicht wesentlich eingeschränkt wird und die Änderung für den Kunden zumutbar ist. Gegenüber Verbrauchern gilt für Änderungen an digitalen Produkten § 327r BGB.' },

    { kind: 'h2', text: '§ 3 Registrierung und Vertragsschluss' },
    { kind: 'p', text: '(1) Für die Nutzung ist ein Nutzerkonto erforderlich. Die Registrierung ist kostenlos. Ein neues Konto zeigt zunächst nur Beispieldaten; der volle Zugang wird mit der Freischaltung nach Abschluss eines kostenpflichtigen Vertrags gewährt.' },
    { kind: 'p', text: '(2) Die Darstellung der Tarife auf der Website ist kein bindendes Angebot. Mit dem Abschluss des Bestellvorgangs über die Schaltfläche „zahlungspflichtig bestellen“ gibt der Kunde ein verbindliches Angebot ab. Vor dem Absenden kann der Kunde seine Angaben jederzeit prüfen und korrigieren. Der Vertrag kommt zustande, wenn wir die Bestellung per E-Mail bestätigen oder das Konto freischalten.' },
    { kind: 'p', text: '(3) Vertragssprache ist Deutsch. Wir speichern den Vertragstext; die jeweils geltenden AGB sind auf dieser Seite abrufbar und werden dem Kunden mit der Bestellbestätigung in Textform übermittelt.' },
    { kind: 'p', text: '(4) Der Kunde muss bei der Registrierung wahre Angaben machen und sie aktuell halten.' },

    { kind: 'h2', text: '§ 4 Preise und Zahlung' },
    { kind: 'p', text: '(1) Es gilt der zum Zeitpunkt der Bestellung auf der Website angegebene Preis, derzeit {price}. Gegenüber Verbrauchern sind alle Preise Endpreise einschließlich der gesetzlichen Umsatzsteuer; gegenüber Unternehmern verstehen sie sich zuzüglich der gesetzlichen Umsatzsteuer, soweit nicht anders angegeben.' },
    { kind: 'p', text: '(2) Die Vergütung ist {billingPeriod} fällig. Die Zahlung erfolgt über den bei der Bestellung angebotenen Zahlungsdienstleister.' },
    { kind: 'p', text: '(3) Gerät ein Unternehmer mit der Zahlung in Verzug, dürfen wir den Zugang nach vorheriger Ankündigung in Textform bis zum Ausgleich sperren.' },

    { kind: 'h2', text: '§ 5 Laufzeit und Kündigung' },
    { kind: 'p', text: '(1) Der Vertrag hat eine Mindestlaufzeit von {minimumTerm}. Danach verlängert er sich auf unbestimmte Zeit und kann von beiden Seiten jederzeit mit einer Frist von einem Monat gekündigt werden.' },
    { kind: 'p', text: '(2) Die Kündigung ist in Textform (zum Beispiel per E-Mail) oder über die Kündigungsschaltfläche auf der Website möglich.' },
    { kind: 'p', text: '(3) Das Recht beider Seiten zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt für uns insbesondere vor, wenn der Kunde trotz Abmahnung gegen § 7 verstößt.' },
    { kind: 'p', text: '(4) Nach Vertragsende wird das Konto wieder auf die Beispieldaten beschränkt. Auf Wunsch löschen wir es vollständig.' },

    { kind: 'h2', text: '§ 6 Verfügbarkeit' },
    { kind: 'p', text: '(1) Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit der Plattform. Wartungsarbeiten führen wir nach Möglichkeit zu nutzungsarmen Zeiten durch. Unterbrechungen durch Störungen außerhalb unseres Einflussbereichs (zum Beispiel des Internets oder höhere Gewalt) haben wir nicht zu vertreten.' },
    { kind: 'p', text: '(2) Gegenüber Verbrauchern gelten die gesetzlichen Vorschriften über digitale Produkte (§§ 327 ff. BGB) einschließlich der Pflicht zur Bereitstellung von Aktualisierungen.' },

    { kind: 'h2', text: '§ 7 Pflichten des Kunden' },
    { kind: 'p', text: '(1) Der Kunde hält seine Zugangsdaten geheim. Ein Konto ist nur für eine Person bestimmt; die Zugangsdaten dürfen nicht an Dritte weitergegeben werden.' },
    { kind: 'p', text: '(2) Untersagt sind insbesondere das automatisierte Auslesen der Inhalte (zum Beispiel durch Skripte oder Crawler), das Weitergeben oder Weiterverkaufen der Inhalte der Plattform als eigenes Angebot sowie jede Handlung, die den Betrieb der Plattform stört oder ihre Sicherheitsmaßnahmen umgeht.' },
    { kind: 'p', text: '(3) Die Rechte des Kunden, die BAM-Daten aus der Originalquelle unter den Bedingungen der Datenlizenz Deutschland zu nutzen, bleiben unberührt.' },

    { kind: 'h2', text: '§ 8 Nutzungsrechte' },
    { kind: 'p', text: 'Wir räumen dem Kunden für die Dauer des Vertrags das einfache, nicht übertragbare Recht ein, die Plattform im vereinbarten Umfang für eigene Zwecke zu nutzen. Rechte an der Software, an der Gestaltung und an unseren eigenen Inhalten verbleiben bei uns.' },

    { kind: 'h2', text: '§ 9 Haftung' },
    { kind: 'p', text: '(1) Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei der Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.' },
    { kind: 'p', text: '(2) Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig vertrauen darf (Kardinalpflicht), ist unsere Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.' },
    { kind: 'p', text: '(3) Wir übernehmen die Inhalte der amtlichen Quellen mit größtmöglicher Sorgfalt, aber ohne eigene inhaltliche Prüfung. Für Fehler, die bereits in den amtlichen Quellen enthalten sind, haften wir nicht. § 2 Abs. 3 bleibt unberührt.' },
    { kind: 'p', text: '(4) Die vorstehenden Beschränkungen gelten auch zugunsten unserer gesetzlichen Vertreter und Erfüllungsgehilfen. Zwingende gesetzliche Rechte von Verbrauchern bleiben unberührt.' },

    { kind: 'h2', text: '§ 10 Mängel' },
    { kind: 'p', text: '(1) Gegenüber Verbrauchern gelten die gesetzlichen Gewährleistungsrechte für digitale Produkte.' },
    { kind: 'p', text: '(2) Unternehmer melden Mängel unverzüglich in Textform mit einer nachvollziehbaren Beschreibung. Wir beheben Mängel in angemessener Frist.' },

    { kind: 'h2', text: '§ 11 Datenschutz' },
    { kind: 'p', text: 'Wie wir personenbezogene Daten verarbeiten, beschreibt unsere Datenschutzerklärung.' },

    { kind: 'h2', text: '§ 12 Änderungen dieser AGB' },
    { kind: 'p', text: 'Änderungen dieser AGB bieten wir dem Kunden mindestens sechs Wochen vor ihrem Inkrafttreten in Textform an. Sie werden nur wirksam, wenn der Kunde zustimmt. Stimmt der Kunde nicht zu, können beide Seiten den Vertrag zum Zeitpunkt des geplanten Inkrafttretens kündigen.' },

    { kind: 'h2', text: '§ 13 Widerrufsrecht für Verbraucher' },
    { kind: 'p', text: 'Verbrauchern steht ein Widerrufsrecht nach Maßgabe der Widerrufsbelehrung zu, die auf dieser Website abrufbar ist und mit der Bestellbestätigung übermittelt wird.' },

    { kind: 'h2', text: '§ 14 Streitbeilegung' },
    { kind: 'p', text: 'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.' },

    { kind: 'h2', text: '§ 15 Schlussbestimmungen' },
    { kind: 'p', text: '(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Gegenüber Verbrauchern gilt diese Rechtswahl nur, soweit dadurch nicht der Schutz entzogen wird, den zwingende Bestimmungen des Rechts des Staates gewähren, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat.' },
    { kind: 'p', text: '(2) Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag {city}.' },
    { kind: 'p', text: '(3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen Bestimmung treten die gesetzlichen Vorschriften.' },
  ],
}
