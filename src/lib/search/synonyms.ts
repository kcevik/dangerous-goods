/**
 * Curated everyday, trade and abbreviated names → UN numbers for the Stoffsuche.
 *
 * The BAM feed only carries the official proper shipping names (DE/EN/FR). This list fills the gap
 * for what officers actually type ("Natronlauge", "Akku", "Spraydose"). Rules:
 * - correctness before coverage: only mappings that are certain; where the real classification
 *   depends on the product (concentration, flash point, mixture, battery type), every candidate is
 *   listed and the entry carries a note
 * - an entry with no UN numbers is a "usually not dangerous goods" hint and must carry a note
 * - terms that already match an official name are left out (the name search finds them)
 * - every UN number was checked against the live BAM tables (see docs/research/synonyms-review.md)
 *
 * `source` says what kind of name the term is: Trivialname, Handelsname, Abkürzung,
 * Formel, Kältemittel-Nr. (ISO 817), Englisch, Abfallbegriff.
 *
 * The owner reviews this list before it ships.
 */
export interface Synonym {
  term: string
  unNumbers: string[]
  note?: string
  source: string
}

const KONZENTRATION = 'Einstufung hängt von der Konzentration ab'
const FLAMMPUNKT = 'Einstufung hängt vom Flammpunkt ab'
const PRODUKT = 'Einstufung hängt vom Produkt ab'
const KEIN_GEFAHRGUT = 'in der Regel kein Gefahrgut – Sicherheitsdatenblatt Abschnitt 14 prüfen'
const BATTERIETYP = 'Einstufung hängt vom Batterietyp ab (Lithium-Ionen, Lithium-Metall, Blei)'
const LI_ION = 'gilt für Lithium-Ionen-Akkus; Bleiakkus siehe „Bleiakku“'
const IN_GERAET = 'lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481'
const LACK = 'gilt für lösemittelhaltige Farben und Lacke; wasserbasierte sind oft kein Gefahrgut'
const FEUERWERK = 'Einstufung je nach Unterklasse der Feuerwerkskörper (Kennzeichnung auf der Verpackung)'
const KUEHLGERAET = 'Einstufung hängt vom Kältemittel ab (nicht entzündbar UN 2857, entzündbar UN 3358)'

export const SYNONYMS: readonly Synonym[] = [
  // ── Säuren ─────────────────────────────────────────────────────────────
  { term: 'Salzsäure', unNumbers: ['1789'], source: 'Trivialname (Chlorwasserstoffsäure)' },
  { term: 'HCl', unNumbers: ['1789', '1050'], note: 'wässerige Lösung UN 1789, Gas (wasserfrei) UN 1050', source: 'Formel' },
  { term: 'muriatic acid', unNumbers: ['1789'], source: 'Englisch (Salzsäure)' },
  { term: 'Batteriesäure', unNumbers: ['2796'], note: 'Schwefelsäure über 51 % Säure: UN 1830', source: 'Trivialname' },
  { term: 'Akkusäure', unNumbers: ['2796'], note: 'Schwefelsäure über 51 % Säure: UN 1830', source: 'Trivialname' },
  { term: 'battery acid', unNumbers: ['2796'], source: 'Englisch' },
  { term: 'H2SO4', unNumbers: ['1830', '2796'], note: 'über 51 % Säure UN 1830, höchstens 51 % UN 2796', source: 'Formel' },
  { term: 'Batterielauge', unNumbers: ['2797'], source: 'Trivialname (Batterieflüssigkeit, alkalisch)' },
  { term: 'Scheidewasser', unNumbers: ['2031'], source: 'Trivialname (Salpetersäure)' },
  { term: 'HNO3', unNumbers: ['2031', '2032'], note: 'rauchende Salpetersäure UN 2032', source: 'Formel' },
  { term: 'Königswasser', unNumbers: ['1798'], source: 'Trivialname' },
  { term: 'Flusssäure', unNumbers: ['1790'], source: 'Trivialname (Fluorwasserstoffsäure)' },
  { term: 'HF', unNumbers: ['1052', '1790'], note: 'wasserfrei UN 1052, wässerige Lösung UN 1790', source: 'Formel' },
  { term: 'Essigessenz', unNumbers: ['2790'], note: KONZENTRATION, source: 'Trivialname (Essigsäure, Lösung)' },
  { term: 'Karbolsäure', unNumbers: ['1671', '2821'], note: 'fest UN 1671, Lösung UN 2821', source: 'Trivialname (Phenol)' },
  { term: 'Blausäure', unNumbers: ['1051', '1613'], note: 'wasserfrei UN 1051, wässerige Lösung UN 1613', source: 'Trivialname (Cyanwasserstoff)' },

  // ── Laugen und Basen ──────────────────────────────────────────────────
  { term: 'Natronlauge', unNumbers: ['1824'], source: 'Trivialname (Natriumhydroxidlösung)' },
  { term: 'Ätznatron', unNumbers: ['1823'], source: 'Trivialname (Natriumhydroxid, fest)' },
  { term: 'NaOH', unNumbers: ['1823', '1824'], note: 'fest UN 1823, Lösung UN 1824', source: 'Formel' },
  { term: 'caustic soda', unNumbers: ['1823', '1824'], note: 'fest UN 1823, Lösung UN 1824', source: 'Englisch' },
  { term: 'Kalilauge', unNumbers: ['1814'], source: 'Trivialname (Kaliumhydroxidlösung)' },
  { term: 'Ätzkali', unNumbers: ['1813'], source: 'Trivialname (Kaliumhydroxid, fest)' },
  { term: 'KOH', unNumbers: ['1813', '1814'], note: 'fest UN 1813, Lösung UN 1814', source: 'Formel' },
  { term: 'Salmiakgeist', unNumbers: ['2672', '2073'], note: KONZENTRATION, source: 'Trivialname (Ammoniaklösung)' },
  { term: 'Ammoniakwasser', unNumbers: ['2672', '2073', '3318'], note: KONZENTRATION, source: 'Trivialname (Ammoniaklösung)' },
  { term: 'Ammoniumhydroxid', unNumbers: ['2672', '2073', '3318'], note: KONZENTRATION, source: 'Trivialname (Ammoniaklösung)' },
  { term: 'NH3', unNumbers: ['1005', '2672', '2073', '3318'], note: 'wasserfrei UN 1005; Lösungen je nach Konzentration', source: 'Formel' },
  { term: 'Ammoniakgas', unNumbers: ['1005'], source: 'Trivialname' },

  // ── Bleich- und Oxidationsmittel ─────────────────────────────────────
  { term: 'Chlorbleichlauge', unNumbers: ['1791'], note: KONZENTRATION, source: 'Trivialname (Hypochloritlösung)' },
  { term: 'Bleichlauge', unNumbers: ['1791'], note: KONZENTRATION, source: 'Trivialname (Hypochloritlösung)' },
  { term: 'Chlorbleiche', unNumbers: ['1791'], note: KONZENTRATION, source: 'Trivialname (Hypochloritlösung)' },
  { term: 'Javelwasser', unNumbers: ['1791'], note: KONZENTRATION, source: 'Trivialname (Hypochloritlösung)' },
  { term: 'Natriumhypochlorit', unNumbers: ['1791'], note: KONZENTRATION, source: 'Stoffname (Hypochloritlösung)' },
  { term: 'bleach', unNumbers: ['1791'], note: KONZENTRATION, source: 'Englisch' },
  { term: 'Chlorkalk', unNumbers: ['1748', '2208'], note: KONZENTRATION, source: 'Trivialname (Calciumhypochlorit)' },
  { term: 'H2O2', unNumbers: ['2014', '2015', '2984'], note: KONZENTRATION, source: 'Formel (Wasserstoffperoxid)' },
  { term: 'Perhydrol', unNumbers: ['2014'], source: 'Handelsname (Wasserstoffperoxid 30 %)' },
  { term: 'Kalisalpeter', unNumbers: ['1486'], source: 'Trivialname (Kaliumnitrat)' },
  { term: 'Natronsalpeter', unNumbers: ['1498'], source: 'Trivialname (Natriumnitrat)' },
  { term: 'Chilesalpeter', unNumbers: ['1498'], source: 'Trivialname (Natriumnitrat)' },

  // ── Kraftstoffe ──────────────────────────────────────────────────────
  { term: 'Superbenzin', unNumbers: ['1203'], source: 'Handelsname' },
  { term: 'Normalbenzin', unNumbers: ['1203'], source: 'Handelsname' },
  { term: 'E10', unNumbers: ['1203'], source: 'Handelsname (Benzin mit höchstens 10 % Ethanol)' },
  { term: 'E85', unNumbers: ['3475'], source: 'Handelsname (Ethanol und Benzin, Gemisch)' },
  { term: 'Zweitaktgemisch', unNumbers: ['1203'], source: 'Trivialname' },
  { term: 'Alkylatbenzin', unNumbers: ['1203'], source: 'Handelsname (Sonderkraftstoff für Kleingeräte)' },
  { term: 'AvGas', unNumbers: ['1203'], source: 'Abkürzung (Flugbenzin)' },
  { term: 'Flugbenzin', unNumbers: ['1203'], source: 'Trivialname' },
  { term: 'Jet A-1', unNumbers: ['1863'], source: 'Handelsname (Düsenkraftstoff)' },
  { term: 'jet fuel', unNumbers: ['1863'], source: 'Englisch' },
  { term: 'Flugturbinenkraftstoff', unNumbers: ['1863'], source: 'Trivialname' },
  { term: 'Heizöl EL', unNumbers: ['1202'], source: 'Handelsname (Heizöl, leicht)' },
  { term: 'Agrardiesel', unNumbers: ['1202'], source: 'Handelsname' },
  { term: 'Bioethanol', unNumbers: ['1170'], source: 'Handelsname (Brennstoff für Ethanolkamine)' },
  { term: 'LPG', unNumbers: ['1965', '1075', '1978'], note: PRODUKT, source: 'Abkürzung (Flüssiggas)' },
  { term: 'Autogas', unNumbers: ['1965', '1075'], note: PRODUKT, source: 'Trivialname (Flüssiggas)' },
  { term: 'CNG', unNumbers: ['1971'], source: 'Abkürzung (Erdgas, verdichtet)' },
  { term: 'LNG', unNumbers: ['1972'], source: 'Abkürzung (Erdgas, tiefgekühlt, flüssig)' },

  // ── Brennbare Gase ───────────────────────────────────────────────────
  { term: 'Flüssiggas', unNumbers: ['1965', '1978', '1075'], note: PRODUKT, source: 'Trivialname' },
  { term: 'Propangas', unNumbers: ['1978'], source: 'Trivialname (Propan)' },
  { term: 'Butangas', unNumbers: ['1011'], source: 'Trivialname (Butan)' },
  { term: 'Propan-Butan-Gemisch', unNumbers: ['1965', '1075'], source: 'Trivialname' },
  { term: 'Campinggas', unNumbers: ['2037', '1965'], note: 'Kartuschen UN 2037, nachfüllbare Flaschen UN 1965', source: 'Trivialname' },
  { term: 'Gaskartusche', unNumbers: ['2037'], source: 'Trivialname (Gefäße, klein, mit Gas)' },
  { term: 'Azetylen', unNumbers: ['1001'], source: 'Schreibvariante (Acetylen)' },
  { term: 'Propylen', unNumbers: ['1077'], source: 'Trivialname (Propen)' },
  { term: 'Butylen', unNumbers: ['1012'], source: 'Trivialname (Buten)' },
  { term: 'Feuerzeuggas', unNumbers: ['1057'], source: 'Trivialname (Nachfüllpatronen für Feuerzeuge)' },
  { term: 'Gasfeuerzeug', unNumbers: ['1057'], source: 'Trivialname' },
  { term: 'Stabfeuerzeug', unNumbers: ['1057'], source: 'Trivialname' },
  { term: 'Chlorgas', unNumbers: ['1017'], source: 'Trivialname (Chlor)' },

  // ── Nicht brennbare Gase ─────────────────────────────────────────────
  { term: 'Pressluft', unNumbers: ['1002'], source: 'Trivialname (Druckluft)' },
  { term: 'Atemluft', unNumbers: ['1002'], source: 'Trivialname (Luft, verdichtet)' },
  { term: 'Lachgas', unNumbers: ['1070'], source: 'Trivialname (Distickstoffmonoxid)' },
  { term: 'Distickstoffoxid', unNumbers: ['1070'], source: 'Stoffname (Distickstoffmonoxid)' },
  { term: 'laughing gas', unNumbers: ['1070'], source: 'Englisch' },
  { term: 'Kohlensäure', unNumbers: ['1013'], note: 'gemeint ist meist Kohlendioxid in Gasflaschen', source: 'Trivialname (Kohlendioxid)' },
  { term: 'CO2', unNumbers: ['1013', '2187', '1845'], note: 'Gas UN 1013, tiefgekühlt flüssig UN 2187, fest (Trockeneis) UN 1845', source: 'Formel' },
  { term: 'Flüssigsauerstoff', unNumbers: ['1073'], source: 'Trivialname' },
  { term: 'LOX', unNumbers: ['1073'], source: 'Abkürzung (Sauerstoff, tiefgekühlt, flüssig)' },
  { term: 'Flüssigstickstoff', unNumbers: ['1977'], source: 'Trivialname' },
  { term: 'LN2', unNumbers: ['1977'], source: 'Abkürzung (Stickstoff, tiefgekühlt, flüssig)' },
  { term: 'SF6', unNumbers: ['1080'], source: 'Formel (Schwefelhexafluorid)' },
  { term: 'Halon 1211', unNumbers: ['1974'], source: 'Handelsname (Bromchlordifluormethan)' },
  { term: 'Halon 1301', unNumbers: ['1009'], source: 'Handelsname (Bromtrifluormethan)' },

  // ── Kältemittel ──────────────────────────────────────────────────────
  { term: 'R134a', unNumbers: ['3159'], source: 'Kältemittel-Nr. (ISO 817)' },
  { term: 'R404A', unNumbers: ['3337'], source: 'Kältemittel-Nr. (ISO 817)' },
  { term: 'R407C', unNumbers: ['3340'], source: 'Kältemittel-Nr. (ISO 817)' },
  { term: 'R22', unNumbers: ['1018'], source: 'Kältemittel-Nr. (ISO 817)' },
  { term: 'R32', unNumbers: ['3252'], source: 'Kältemittel-Nr. (ISO 817)' },
  { term: 'R290', unNumbers: ['1978'], source: 'Kältemittel-Nr. (ISO 817, Propan)' },
  { term: 'R600a', unNumbers: ['1969'], source: 'Kältemittel-Nr. (ISO 817, Isobutan)' },
  { term: 'R744', unNumbers: ['1013'], source: 'Kältemittel-Nr. (ISO 817, Kohlendioxid)' },
  { term: 'R717', unNumbers: ['1005'], source: 'Kältemittel-Nr. (ISO 817, Ammoniak)' },
  { term: 'R1234yf', unNumbers: ['3161'], source: 'Kältemittel-Nr. (ISO 817, 2,3,3,3-Tetrafluorpropen)' },
  { term: 'Kühlschrank', unNumbers: ['2857', '3358'], note: KUEHLGERAET, source: 'Trivialname (Kältemaschinen)' },
  { term: 'Klimagerät', unNumbers: ['2857', '3358'], note: KUEHLGERAET, source: 'Trivialname (Kältemaschinen)' },

  // ── Lösemittel und Alkohole ──────────────────────────────────────────
  { term: 'Spiritus', unNumbers: ['1170', '1987'], note: PRODUKT, source: 'Trivialname (Ethanol, vergällt)' },
  { term: 'Brennspiritus', unNumbers: ['1170', '1987'], note: PRODUKT, source: 'Trivialname (Ethanol, vergällt)' },
  { term: 'Weingeist', unNumbers: ['1170'], source: 'Trivialname (Ethanol)' },
  { term: 'Alkohol', unNumbers: ['1170', '1987'], note: PRODUKT, source: 'Trivialname' },
  { term: 'Spirituosen', unNumbers: ['3065'], note: 'Einstufung hängt vom Alkoholgehalt ab', source: 'Trivialname (alkoholische Getränke)' },
  { term: 'Handdesinfektionsmittel', unNumbers: ['1170', '1219', '1987'], note: PRODUKT, source: 'Trivialname (alkoholisch)' },
  { term: 'IPA', unNumbers: ['1219'], source: 'Abkürzung (Isopropanol)' },
  { term: '2-Propanol', unNumbers: ['1219'], source: 'Stoffname (Isopropanol)' },
  { term: 'rubbing alcohol', unNumbers: ['1219'], note: PRODUKT, source: 'Englisch' },
  { term: 'Methylalkohol', unNumbers: ['1230'], source: 'Stoffname (Methanol)' },
  { term: 'Holzgeist', unNumbers: ['1230'], source: 'Trivialname (Methanol)' },
  { term: 'MEK', unNumbers: ['1193'], source: 'Abkürzung (Ethylmethylketon)' },
  { term: 'Butanon', unNumbers: ['1193'], source: 'Stoffname (Ethylmethylketon)' },
  { term: 'MIBK', unNumbers: ['1245'], source: 'Abkürzung (Methylisobutylketon)' },
  { term: 'Essigester', unNumbers: ['1173'], source: 'Trivialname (Ethylacetat)' },
  { term: 'Äther', unNumbers: ['1155'], source: 'Trivialname (Diethylether)' },
  { term: 'THF', unNumbers: ['2056'], source: 'Abkürzung (Tetrahydrofuran)' },
  { term: 'DMF', unNumbers: ['2265'], source: 'Abkürzung (N,N-Dimethylformamid)' },
  { term: 'MTBE', unNumbers: ['2398'], source: 'Abkürzung (Methyl-tert-butylether)' },
  { term: 'Methylenchlorid', unNumbers: ['1593'], source: 'Trivialname (Dichlormethan)' },
  { term: 'Perchlorethylen', unNumbers: ['1897'], source: 'Trivialname (Tetrachlorethylen)' },
  { term: 'Styrol', unNumbers: ['2055'], source: 'Trivialname (Styren, monomer, stabilisiert)' },
  { term: 'Testbenzin', unNumbers: ['1300'], note: FLAMMPUNKT, source: 'Trivialname (Terpentinölersatz)' },
  { term: 'White Spirit', unNumbers: ['1300'], note: FLAMMPUNKT, source: 'Handelsname (Terpentinölersatz)' },
  { term: 'Terpentinersatz', unNumbers: ['1300'], note: FLAMMPUNKT, source: 'Trivialname (Terpentinölersatz)' },
  { term: 'Waschbenzin', unNumbers: ['1268', '3295'], note: PRODUKT, source: 'Trivialname' },
  { term: 'Feuerzeugbenzin', unNumbers: ['1268', '3295'], note: PRODUKT, source: 'Trivialname' },
  { term: 'Formalin', unNumbers: ['2209', '1198'], note: 'nicht entzündbar UN 2209, entzündbar UN 1198; Einstufung hängt von Konzentration und Flammpunkt ab', source: 'Handelsname (Formaldehydlösung)' },

  // ── Farben, Lacke, Klebstoffe ────────────────────────────────────────
  { term: 'Farben', unNumbers: ['1263'], note: LACK, source: 'Plural (Farbe)' },
  { term: 'Lacke', unNumbers: ['1263'], note: LACK, source: 'Plural (Lack)' },
  { term: 'Farbreste', unNumbers: ['1263'], note: LACK, source: 'Abfallbegriff' },
  { term: 'Lackreste', unNumbers: ['1263'], note: LACK, source: 'Abfallbegriff' },
  { term: 'Altfarben', unNumbers: ['1263'], note: LACK, source: 'Abfallbegriff' },
  { term: 'Altlacke', unNumbers: ['1263'], note: LACK, source: 'Abfallbegriff' },
  { term: 'Klarlack', unNumbers: ['1263'], note: LACK, source: 'Handelsname' },
  { term: 'Autolack', unNumbers: ['1263'], note: LACK, source: 'Handelsname' },
  { term: 'Nagellack', unNumbers: ['1263'], note: PRODUKT, source: 'Handelsname' },
  { term: 'nail polish', unNumbers: ['1263'], note: PRODUKT, source: 'Englisch' },
  { term: 'Verdünnung', unNumbers: ['1263', '1993'], note: FLAMMPUNKT, source: 'Trivialname (Farbverdünnung)' },
  { term: 'Nitroverdünnung', unNumbers: ['1263', '1993'], note: FLAMMPUNKT, source: 'Handelsname' },
  { term: 'Lackverdünnung', unNumbers: ['1263', '1993'], note: FLAMMPUNKT, source: 'Handelsname' },
  { term: 'Kunstharzverdünnung', unNumbers: ['1263', '1993'], note: FLAMMPUNKT, source: 'Handelsname' },
  { term: 'Kleber', unNumbers: ['1133'], note: FLAMMPUNKT, source: 'Trivialname (Klebstoffe)' },
  { term: 'Kontaktkleber', unNumbers: ['1133'], note: FLAMMPUNKT, source: 'Handelsname (Klebstoffe)' },

  // ── Kosmetik ─────────────────────────────────────────────────────────
  { term: 'Parfum', unNumbers: ['1266'], note: FLAMMPUNKT, source: 'Schreibvariante (Parfümerieerzeugnisse)' },
  { term: 'Eau de Toilette', unNumbers: ['1266'], note: FLAMMPUNKT, source: 'Handelsname (Parfümerieerzeugnisse)' },
  { term: 'Eau de Parfum', unNumbers: ['1266'], note: FLAMMPUNKT, source: 'Handelsname (Parfümerieerzeugnisse)' },
  { term: 'Aftershave', unNumbers: ['1266'], note: FLAMMPUNKT, source: 'Handelsname (Parfümerieerzeugnisse)' },

  // ── Druckgaspackungen ────────────────────────────────────────────────
  { term: 'Spraydose', unNumbers: ['1950'], source: 'Trivialname (Druckgaspackungen)' },
  { term: 'Sprühdose', unNumbers: ['1950'], source: 'Trivialname (Druckgaspackungen)' },
  { term: 'Altspraydosen', unNumbers: ['1950'], note: 'Druckgaspackungen zur Entsorgung: SV 327 beachten', source: 'Abfallbegriff' },
  { term: 'Aerosoldose', unNumbers: ['1950'], source: 'Trivialname (Druckgaspackungen)' },
  { term: 'Lackspray', unNumbers: ['1950'], source: 'Handelsname (Druckgaspackungen)' },
  { term: 'Sprühlack', unNumbers: ['1950'], source: 'Handelsname (Druckgaspackungen)' },
  { term: 'Haarspray', unNumbers: ['1950'], source: 'Handelsname (Druckgaspackungen)' },
  { term: 'Deospray', unNumbers: ['1950'], source: 'Handelsname (Druckgaspackungen)' },
  { term: 'Bauschaum', unNumbers: ['1950'], source: 'Handelsname (PU-Schaum in Druckgaspackungen)' },
  { term: 'PU-Schaum', unNumbers: ['1950'], source: 'Handelsname (Druckgaspackungen)' },
  { term: 'spray can', unNumbers: ['1950'], source: 'Englisch' },

  // ── Batterien ────────────────────────────────────────────────────────
  { term: 'Akku', unNumbers: ['3480', '3481'], note: LI_ION, source: 'Trivialname' },
  { term: 'Lithium-Ionen-Akku', unNumbers: ['3480', '3481'], note: IN_GERAET, source: 'Trivialname' },
  { term: 'Li-Ion', unNumbers: ['3480', '3481'], note: IN_GERAET, source: 'Abkürzung' },
  { term: 'Li-Ion-Akku', unNumbers: ['3480', '3481'], note: IN_GERAET, source: 'Abkürzung' },
  { term: 'Lithiumakku', unNumbers: ['3480', '3481'], note: IN_GERAET, source: 'Trivialname' },
  { term: 'LiPo', unNumbers: ['3480', '3481'], note: IN_GERAET, source: 'Abkürzung (Lithium-Polymer = Lithium-Ionen)' },
  { term: 'Lithium-Polymer-Akku', unNumbers: ['3480', '3481'], note: IN_GERAET, source: 'Trivialname' },
  { term: 'Powerbank', unNumbers: ['3480'], source: 'Handelsname (Lithium-Ionen-Batterie)' },
  { term: 'E-Bike-Akku', unNumbers: ['3480'], source: 'Trivialname' },
  { term: 'Handyakku', unNumbers: ['3480', '3481'], note: IN_GERAET, source: 'Trivialname' },
  { term: 'Akkuschrauber', unNumbers: ['3481'], note: IN_GERAET, source: 'Trivialname (Lithium-Ionen-Batterien in Ausrüstungen)' },
  { term: 'Laptop', unNumbers: ['3481'], note: IN_GERAET, source: 'Trivialname (Lithium-Ionen-Batterien in Ausrüstungen)' },
  { term: 'Smartphone', unNumbers: ['3481'], note: IN_GERAET, source: 'Trivialname (Lithium-Ionen-Batterien in Ausrüstungen)' },
  { term: 'Lithiumbatterie', unNumbers: ['3090', '3091', '3480', '3481'], note: 'Lithium-Metall (nicht wiederaufladbar) UN 3090/3091, Lithium-Ionen (Akku) UN 3480/3481', source: 'Trivialname' },
  { term: 'Lithium-Metall-Batterie', unNumbers: ['3090', '3091'], note: 'lose UN 3090; im Gerät oder mit dem Gerät verpackt UN 3091', source: 'Trivialname' },
  { term: 'Knopfzelle', unNumbers: ['3090', '3091'], note: 'gilt für Lithium-Knopfzellen; Alkali- und Silberoxid-Knopfzellen sind in der Regel kein Gefahrgut', source: 'Trivialname' },
  { term: 'Natrium-Ionen-Akku', unNumbers: ['3551', '3552'], note: 'lose UN 3551; im Gerät oder mit dem Gerät verpackt UN 3552', source: 'Trivialname' },
  { term: 'Altbatterien', unNumbers: ['3480', '3090', '2794', '2800'], note: BATTERIETYP, source: 'Abfallbegriff' },
  { term: 'Altakkus', unNumbers: ['3480', '3090', '2794', '2800'], note: BATTERIETYP, source: 'Abfallbegriff' },
  { term: 'Batterieschrott', unNumbers: ['3480', '3090', '2794', '2800'], note: BATTERIETYP, source: 'Abfallbegriff' },
  { term: 'battery', unNumbers: ['3480', '3481', '3090', '3091', '2794', '2800'], note: BATTERIETYP, source: 'Englisch' },
  { term: 'power bank', unNumbers: ['3480'], source: 'Englisch' },
  { term: 'Bleiakku', unNumbers: ['2794', '2800'], note: 'nass, gefüllt mit Säure UN 2794; auslaufsicher (z. B. Gel, AGM) UN 2800', source: 'Trivialname' },
  { term: 'Bleibatterie', unNumbers: ['2794', '2800'], note: 'nass, gefüllt mit Säure UN 2794; auslaufsicher (z. B. Gel, AGM) UN 2800', source: 'Trivialname' },
  { term: 'Autobatterie', unNumbers: ['2794', '2800'], note: 'nass, gefüllt mit Säure UN 2794; auslaufsicher (z. B. Gel, AGM) UN 2800', source: 'Trivialname' },
  { term: 'Starterbatterie', unNumbers: ['2794', '2800'], note: 'nass, gefüllt mit Säure UN 2794; auslaufsicher (z. B. Gel, AGM) UN 2800', source: 'Trivialname' },
  { term: 'car battery', unNumbers: ['2794', '2800'], note: 'nass, gefüllt mit Säure UN 2794; auslaufsicher UN 2800', source: 'Englisch' },
  { term: 'AGM-Batterie', unNumbers: ['2800'], source: 'Handelsname (auslaufsicher)' },
  { term: 'Gel-Batterie', unNumbers: ['2800'], source: 'Handelsname (auslaufsicher)' },

  // ── Gegenstände ──────────────────────────────────────────────────────
  { term: 'Pulverlöscher', unNumbers: ['1044'], source: 'Trivialname (Feuerlöscher)' },
  { term: 'CO2-Löscher', unNumbers: ['1044'], source: 'Trivialname (Feuerlöscher)' },
  { term: 'Schaumlöscher', unNumbers: ['1044'], source: 'Trivialname (Feuerlöscher)' },
  { term: 'Airbag', unNumbers: ['3268', '0503'], note: 'meist UN 3268; pyrotechnische Sicherheitseinrichtungen der Klasse 1 UN 0503', source: 'Trivialname (Sicherheitseinrichtungen)' },
  { term: 'Gurtstraffer', unNumbers: ['3268', '0503'], note: 'meist UN 3268; pyrotechnische Sicherheitseinrichtungen der Klasse 1 UN 0503', source: 'Trivialname (Sicherheitseinrichtungen)' },
  { term: 'Streichhölzer', unNumbers: ['1944', '1945', '1331'], note: 'Sicherheitszündhölzer UN 1944, Wachszündhölzer UN 1945, überall entzündbar UN 1331', source: 'Trivialname (Zündhölzer)' },
  { term: 'Streichholz', unNumbers: ['1944', '1945', '1331'], note: 'Sicherheitszündhölzer UN 1944, Wachszündhölzer UN 1945, überall entzündbar UN 1331', source: 'Trivialname (Zündhölzer)' },
  { term: 'Feuerwerk', unNumbers: ['0333', '0334', '0335', '0336', '0337'], note: FEUERWERK, source: 'Trivialname (Feuerwerkskörper)' },
  { term: 'Silvesterfeuerwerk', unNumbers: ['0335', '0336', '0337'], note: FEUERWERK, source: 'Trivialname (Feuerwerkskörper)' },
  { term: 'Böller', unNumbers: ['0333', '0334', '0335', '0336', '0337'], note: FEUERWERK, source: 'Trivialname (Feuerwerkskörper)' },
  { term: 'fireworks', unNumbers: ['0333', '0334', '0335', '0336', '0337'], note: FEUERWERK, source: 'Englisch' },
  { term: 'Setzbolzenkartuschen', unNumbers: ['0014'], source: 'Trivialname (Patronen für Werkzeuge, ohne Geschoss)' },
  { term: 'Rettungsinsel', unNumbers: ['2990'], source: 'Trivialname (Rettungsmittel, selbstaufblasend)' },
  { term: 'Rasenmäher', unNumbers: ['3528'], note: 'gilt für Geräte mit Verbrennungsmotor', source: 'Trivialname (Verbrennungsmaschine)' },
  { term: 'Kettensäge', unNumbers: ['3528'], note: 'gilt für Geräte mit Verbrennungsmotor', source: 'Trivialname (Verbrennungsmaschine)' },
  { term: 'Leergebinde', unNumbers: ['3509'], note: 'ausrangierte, ungereinigte Leerverpackungen zur Entsorgung; sonst gilt die UN-Nummer des früheren Inhalts', source: 'Abfallbegriff (Altverpackungen)' },

  // ── Medizin und Labor ────────────────────────────────────────────────
  { term: 'Patientenprobe', unNumbers: ['3373'], note: 'nur wenn ein Krankheitserreger enthalten sein kann; freigestellte Patientenproben unterliegen nicht UN 3373', source: 'Trivialname (biologischer Stoff, Kategorie B)' },
  { term: 'Blutprobe', unNumbers: ['3373'], note: 'nur wenn ein Krankheitserreger enthalten sein kann; freigestellte Patientenproben unterliegen nicht UN 3373', source: 'Trivialname (biologischer Stoff, Kategorie B)' },
  { term: 'diagnostische Probe', unNumbers: ['3373'], note: 'nur wenn ein Krankheitserreger enthalten sein kann; freigestellte Patientenproben unterliegen nicht UN 3373', source: 'Trivialname (biologischer Stoff, Kategorie B)' },
  { term: 'diagnostic specimen', unNumbers: ['3373'], note: 'nur wenn ein Krankheitserreger enthalten sein kann', source: 'Englisch' },
  { term: 'Krankenhausabfall', unNumbers: ['3291'], note: 'nur ansteckungsgefährlicher Abfall', source: 'Abfallbegriff (klinischer Abfall)' },
  { term: 'Klinikabfall', unNumbers: ['3291'], note: 'nur ansteckungsgefährlicher Abfall', source: 'Abfallbegriff (klinischer Abfall)' },
  { term: 'Zyankali', unNumbers: ['1680'], source: 'Trivialname (Kaliumcyanid)' },
  { term: 'Arsenik', unNumbers: ['1561'], source: 'Trivialname (Arsentrioxid)' },
  { term: 'Sublimat', unNumbers: ['1624'], source: 'Trivialname (Quecksilber(II)chlorid)' },
  { term: 'Karbid', unNumbers: ['1402'], source: 'Trivialname (Calciumcarbid)' },

  // ── Abfall und Öle ───────────────────────────────────────────────────
  { term: 'Altöl', unNumbers: ['3082', '1202', '1993'], note: 'Einstufung hängt von Flammpunkt und Umweltgefährdung ab; Altöl ist oft auch kein Gefahrgut – Analyse bzw. Sicherheitsdatenblatt prüfen', source: 'Abfallbegriff' },

  // ── In der Regel kein Gefahrgut ──────────────────────────────────────
  { term: 'Glykol', unNumbers: [], note: KEIN_GEFAHRGUT, source: 'Trivialname (Ethylenglykol)' },
  { term: 'Ethylenglykol', unNumbers: [], note: KEIN_GEFAHRGUT, source: 'Stoffname' },
  { term: 'Kühlmittel', unNumbers: [], note: `${KEIN_GEFAHRGUT}; Kältemittel (R-Gase) z. B. unter „R134a“ suchen`, source: 'Trivialname (Glykol-Kühlerflüssigkeit)' },
  { term: 'Kühlerfrostschutz', unNumbers: [], note: KEIN_GEFAHRGUT, source: 'Trivialname (Glykol)' },
  { term: 'AdBlue', unNumbers: [], note: KEIN_GEFAHRGUT, source: 'Handelsname (Harnstofflösung)' },
  { term: 'Harnstofflösung', unNumbers: [], note: KEIN_GEFAHRGUT, source: 'Stoffname' },
  { term: 'Motoröl', unNumbers: [], note: KEIN_GEFAHRGUT, source: 'Trivialname (Frischöl; Altöl siehe „Altöl“)' },
  { term: 'Hydrauliköl', unNumbers: [], note: KEIN_GEFAHRGUT, source: 'Trivialname' },
  { term: 'Bremsflüssigkeit', unNumbers: [], note: KEIN_GEFAHRGUT, source: 'Trivialname' },
]
