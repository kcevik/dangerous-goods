import type { LegalDocument } from './document'

/** Impressum nach § 5 DDG und § 18 Abs. 2 MStV. Entwurf – vor dem Start anwaltlich prüfen lassen. */
export const IMPRESSUM: LegalDocument = {
  title: 'Impressum',
  description: 'Anbieterkennzeichnung von gefahrgut.org nach § 5 DDG.',
  blocks: [
    { kind: 'h2', text: 'Angaben gemäß § 5 DDG' },
    { kind: 'p', text: '{companyName}\n{street}\n{postalCode} {city}\nDeutschland' },
    { kind: 'p', text: 'Vertreten durch: {representative}', requires: 'representative' },

    { kind: 'h2', text: 'Kontakt' },
    { kind: 'p', text: 'E-Mail: {email}\nTelefon: {phone}' },

    { kind: 'h2', text: 'Registereintrag', requires: 'registerCourt' },
    { kind: 'p', text: 'Registergericht: {registerCourt}\nRegisternummer: {registerNumber}', requires: 'registerCourt' },

    { kind: 'h2', text: 'Umsatzsteuer-Identifikationsnummer', requires: 'vatId' },
    { kind: 'p', text: 'Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: {vatId}', requires: 'vatId' },

    { kind: 'h2', text: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV' },
    { kind: 'p', text: '{contentResponsible}' },

    { kind: 'h2', text: 'Verbraucherstreitbeilegung' },
    { kind: 'p', text: 'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.' },

    { kind: 'h2', text: 'Datenquellen und Lizenzen' },
    { kind: 'p', text: 'Die Stoffdaten zu ADR, RID, IMDG-Code, ICAO-TI und den UN-Modellvorschriften stammen aus der Datenbank GEFAHRGUT der Bundesanstalt für Materialforschung und -prüfung (BAM). Sie stehen unter der Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0, www.govdata.de/dl-de/by-2-0). Die Daten wurden für die Darstellung umgewandelt, zusammengeführt und verglichen; diese Veränderungen sind auf den jeweiligen Seiten gekennzeichnet.' },
    { kind: 'p', text: 'Der ADR-Text beruht auf der amtlichen deutschsprachigen Fassung des Bundesministeriums für Innovation, Mobilität und Infrastruktur der Republik Österreich (BMIMI), Ausgabe 2026-01, aktualisiert am 02.01.2026. Er wurde maschinell umgewandelt und ist kein rechtsverbindlicher Text; maßgeblich ist allein die amtlich veröffentlichte Fassung.' },

    { kind: 'h2', text: 'Haftung für Inhalte' },
    { kind: 'p', text: 'Wir erstellen die Inhalte dieser Website mit größtmöglicher Sorgfalt. Sie dienen der Information und ersetzen weder die amtlichen Vorschriftentexte noch eine rechtliche Beratung. Für Entscheidungen bei der Beförderung gefährlicher Güter sind stets die geltenden amtlichen Fassungen der Regelwerke maßgeblich.' },
    { kind: 'p', text: 'Als Diensteanbieter sind wir für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich. Für übermittelte oder gespeicherte fremde Informationen sind wir nicht verpflichtet, diese zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Werden uns Rechtsverletzungen bekannt, entfernen wir die betroffenen Inhalte umgehend.' },

    { kind: 'h2', text: 'Haftung für Links' },
    { kind: 'p', text: 'Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar. Werden uns Rechtsverletzungen bekannt, entfernen wir derartige Links umgehend.' },
  ],
}
