# Review: Synonyme der Stoffsuche

**Status: Entwurf. Vor dem Merge muss der Owner diese Liste fachlich prüfen.**

Quelle der Wahrheit ist `src/lib/search/synonyms.ts`; diese Tabelle ist daraus erzeugt (221 Einträge,
9 davon ohne UN-Nummer, nur mit dem Hinweis „in der Regel kein Gefahrgut“).

## Regeln

- Ein Synonym-Treffer erscheint **unter** allen Treffern über die offiziellen BAM-Namen, nie davor, und ist markiert:
  „Über Synonym „…“ gefunden – Einstufung anhand des Sicherheitsdatenblatts (Abschnitt 14) prüfen“.
- Findet die Namenssuche eine UN-Nummer schon offiziell, erscheint sie kein zweites Mal als Synonym.
- Hängt die Einstufung vom Produkt ab (Konzentration, Flammpunkt, Batterietyp …), stehen alle Kandidaten drin und die
  Anmerkung sagt, wovon es abhängt.
- Jede UN-Nummer wurde am 2026-11-23 per SQL gegen `adr_entries` geprüft (alle 123 vorhanden).
- Begriffe, die schon in einem offiziellen Namen stecken (z. B. „Benzin“, „Diesel“, „Aceton“, „Feuerlöscher“, „Eisessig“,
  „TNT“, „Altverpackungen“), fehlen absichtlich: Die Namenssuche findet sie selbst.
- Abgleich: Groß-/Kleinschreibung, Umlaute (ä/ae, ß/ss), Bindestriche und einfache Plurale werden ignoriert;
  Wortanfänge ab 5 Zeichen („Natronl“) treffen nur, wenn kein Begriff genau passt; kurze Abkürzungen (IPA, MEK) nur exakt.

## Bewusst weggelassen (zu unsicher)

| Begriff | Warum nicht |
|---|---|
| Ballongas | Helium oder Helium-Luft-Gemisch (UN 1046 oder 1956) – hängt vom Produkt ab |
| Kalkstickstoff | UN 1403 gilt nur bei > 0,1 % Calciumcarbid; Düngemittel-Ware ist oft nicht eingestuft |
| Branntkalk / Ätzkalk | UN 1910 – Anwendbarkeit im ADR unklar |
| E-Bike / Pedelec | UN 3171 oder 3556 – Zuordnung unsicher (der Akku allein ist als „E-Bike-Akku“ → 3480 drin) |
| Biodiesel / HVO | Flammpunkt je nach Produkt, teils kein Gefahrgut |
| Scheibenfrostschutz | enthält oft Methanol/Ethanol/Isopropanol (Kl. 3) – nicht pauschal zuordenbar |
| Nagellackentferner, Abflussreiniger, Entkalker, Desinfektionsmittel (allgemein) | Produktvielfalt zu groß |
| Holzkohle, Grillanzünder | Freistellungen/Einstufung je nach Produkt |
| Wunderkerzen, Munition (allgemein) | Unterklasse je nach Artikel |
| Leuchtstoffröhren, Energiesparlampen | Quecksilber-Freistellung (Kleinmengen) – nicht pauschal |
| R410A | nicht namentlich im ADR (UN 3163 n.a.g.) – unsicher gelassen |
| Kühlmittel als UN-Eintrag | mehrdeutig (Kältemittel vs. Kühlerflüssigkeit); nur als Hinweis „in der Regel kein Gefahrgut“ |

## Unsicher, aber aufgenommen (bitte besonders prüfen)

Motoröl, Hydrauliköl und Bremsflüssigkeit als „in der Regel kein Gefahrgut“; Waschbenzin/Feuerzeugbenzin → 1268/3295;
Testbenzin → 1300; Handdesinfektionsmittel → 1170/1219/1987; Nagellack → 1263; Altöl → 3082/1202/1993;
R1234yf → 3161; Rasenmäher/Kettensäge → 3528; Setzbolzenkartuschen → 0014; Klimagerät/Kühlschrank → 2857/3358.

## Liste

| # | Begriff | UN-Nummern | Anmerkung (wird angezeigt) | Art des Begriffs |
|---|---|---|---|---|
| 1 | Salzsäure | 1789 |  | Trivialname (Chlorwasserstoffsäure) |
| 2 | HCl | 1789, 1050 | wässerige Lösung UN 1789, Gas (wasserfrei) UN 1050 | Formel |
| 3 | muriatic acid | 1789 |  | Englisch (Salzsäure) |
| 4 | Batteriesäure | 2796 | Schwefelsäure über 51 % Säure: UN 1830 | Trivialname |
| 5 | Akkusäure | 2796 | Schwefelsäure über 51 % Säure: UN 1830 | Trivialname |
| 6 | battery acid | 2796 |  | Englisch |
| 7 | H2SO4 | 1830, 2796 | über 51 % Säure UN 1830, höchstens 51 % UN 2796 | Formel |
| 8 | Batterielauge | 2797 |  | Trivialname (Batterieflüssigkeit, alkalisch) |
| 9 | Scheidewasser | 2031 |  | Trivialname (Salpetersäure) |
| 10 | HNO3 | 2031, 2032 | rauchende Salpetersäure UN 2032 | Formel |
| 11 | Königswasser | 1798 |  | Trivialname |
| 12 | Flusssäure | 1790 |  | Trivialname (Fluorwasserstoffsäure) |
| 13 | HF | 1052, 1790 | wasserfrei UN 1052, wässerige Lösung UN 1790 | Formel |
| 14 | Essigessenz | 2790 | Einstufung hängt von der Konzentration ab | Trivialname (Essigsäure, Lösung) |
| 15 | Karbolsäure | 1671, 2821 | fest UN 1671, Lösung UN 2821 | Trivialname (Phenol) |
| 16 | Blausäure | 1051, 1613 | wasserfrei UN 1051, wässerige Lösung UN 1613 | Trivialname (Cyanwasserstoff) |
| 17 | Natronlauge | 1824 |  | Trivialname (Natriumhydroxidlösung) |
| 18 | Ätznatron | 1823 |  | Trivialname (Natriumhydroxid, fest) |
| 19 | NaOH | 1823, 1824 | fest UN 1823, Lösung UN 1824 | Formel |
| 20 | caustic soda | 1823, 1824 | fest UN 1823, Lösung UN 1824 | Englisch |
| 21 | Kalilauge | 1814 |  | Trivialname (Kaliumhydroxidlösung) |
| 22 | Ätzkali | 1813 |  | Trivialname (Kaliumhydroxid, fest) |
| 23 | KOH | 1813, 1814 | fest UN 1813, Lösung UN 1814 | Formel |
| 24 | Salmiakgeist | 2672, 2073 | Einstufung hängt von der Konzentration ab | Trivialname (Ammoniaklösung) |
| 25 | Ammoniakwasser | 2672, 2073, 3318 | Einstufung hängt von der Konzentration ab | Trivialname (Ammoniaklösung) |
| 26 | Ammoniumhydroxid | 2672, 2073, 3318 | Einstufung hängt von der Konzentration ab | Trivialname (Ammoniaklösung) |
| 27 | NH3 | 1005, 2672, 2073, 3318 | wasserfrei UN 1005; Lösungen je nach Konzentration | Formel |
| 28 | Ammoniakgas | 1005 |  | Trivialname |
| 29 | Chlorbleichlauge | 1791 | Einstufung hängt von der Konzentration ab | Trivialname (Hypochloritlösung) |
| 30 | Bleichlauge | 1791 | Einstufung hängt von der Konzentration ab | Trivialname (Hypochloritlösung) |
| 31 | Chlorbleiche | 1791 | Einstufung hängt von der Konzentration ab | Trivialname (Hypochloritlösung) |
| 32 | Javelwasser | 1791 | Einstufung hängt von der Konzentration ab | Trivialname (Hypochloritlösung) |
| 33 | Natriumhypochlorit | 1791 | Einstufung hängt von der Konzentration ab | Stoffname (Hypochloritlösung) |
| 34 | bleach | 1791 | Einstufung hängt von der Konzentration ab | Englisch |
| 35 | Chlorkalk | 1748, 2208 | Einstufung hängt von der Konzentration ab | Trivialname (Calciumhypochlorit) |
| 36 | H2O2 | 2014, 2015, 2984 | Einstufung hängt von der Konzentration ab | Formel (Wasserstoffperoxid) |
| 37 | Perhydrol | 2014 |  | Handelsname (Wasserstoffperoxid 30 %) |
| 38 | Kalisalpeter | 1486 |  | Trivialname (Kaliumnitrat) |
| 39 | Natronsalpeter | 1498 |  | Trivialname (Natriumnitrat) |
| 40 | Chilesalpeter | 1498 |  | Trivialname (Natriumnitrat) |
| 41 | Superbenzin | 1203 |  | Handelsname |
| 42 | Normalbenzin | 1203 |  | Handelsname |
| 43 | E10 | 1203 |  | Handelsname (Benzin mit höchstens 10 % Ethanol) |
| 44 | E85 | 3475 |  | Handelsname (Ethanol und Benzin, Gemisch) |
| 45 | Zweitaktgemisch | 1203 |  | Trivialname |
| 46 | Alkylatbenzin | 1203 |  | Handelsname (Sonderkraftstoff für Kleingeräte) |
| 47 | AvGas | 1203 |  | Abkürzung (Flugbenzin) |
| 48 | Flugbenzin | 1203 |  | Trivialname |
| 49 | Jet A-1 | 1863 |  | Handelsname (Düsenkraftstoff) |
| 50 | jet fuel | 1863 |  | Englisch |
| 51 | Flugturbinenkraftstoff | 1863 |  | Trivialname |
| 52 | Heizöl EL | 1202 |  | Handelsname (Heizöl, leicht) |
| 53 | Agrardiesel | 1202 |  | Handelsname |
| 54 | Bioethanol | 1170 |  | Handelsname (Brennstoff für Ethanolkamine) |
| 55 | LPG | 1965, 1075, 1978 | Einstufung hängt vom Produkt ab | Abkürzung (Flüssiggas) |
| 56 | Autogas | 1965, 1075 | Einstufung hängt vom Produkt ab | Trivialname (Flüssiggas) |
| 57 | CNG | 1971 |  | Abkürzung (Erdgas, verdichtet) |
| 58 | LNG | 1972 |  | Abkürzung (Erdgas, tiefgekühlt, flüssig) |
| 59 | Flüssiggas | 1965, 1978, 1075 | Einstufung hängt vom Produkt ab | Trivialname |
| 60 | Propangas | 1978 |  | Trivialname (Propan) |
| 61 | Butangas | 1011 |  | Trivialname (Butan) |
| 62 | Propan-Butan-Gemisch | 1965, 1075 |  | Trivialname |
| 63 | Campinggas | 2037, 1965 | Kartuschen UN 2037, nachfüllbare Flaschen UN 1965 | Trivialname |
| 64 | Gaskartusche | 2037 |  | Trivialname (Gefäße, klein, mit Gas) |
| 65 | Azetylen | 1001 |  | Schreibvariante (Acetylen) |
| 66 | Propylen | 1077 |  | Trivialname (Propen) |
| 67 | Butylen | 1012 |  | Trivialname (Buten) |
| 68 | Feuerzeuggas | 1057 |  | Trivialname (Nachfüllpatronen für Feuerzeuge) |
| 69 | Gasfeuerzeug | 1057 |  | Trivialname |
| 70 | Stabfeuerzeug | 1057 |  | Trivialname |
| 71 | Chlorgas | 1017 |  | Trivialname (Chlor) |
| 72 | Pressluft | 1002 |  | Trivialname (Druckluft) |
| 73 | Atemluft | 1002 |  | Trivialname (Luft, verdichtet) |
| 74 | Lachgas | 1070 |  | Trivialname (Distickstoffmonoxid) |
| 75 | Distickstoffoxid | 1070 |  | Stoffname (Distickstoffmonoxid) |
| 76 | laughing gas | 1070 |  | Englisch |
| 77 | Kohlensäure | 1013 | gemeint ist meist Kohlendioxid in Gasflaschen | Trivialname (Kohlendioxid) |
| 78 | CO2 | 1013, 2187, 1845 | Gas UN 1013, tiefgekühlt flüssig UN 2187, fest (Trockeneis) UN 1845 | Formel |
| 79 | Flüssigsauerstoff | 1073 |  | Trivialname |
| 80 | LOX | 1073 |  | Abkürzung (Sauerstoff, tiefgekühlt, flüssig) |
| 81 | Flüssigstickstoff | 1977 |  | Trivialname |
| 82 | LN2 | 1977 |  | Abkürzung (Stickstoff, tiefgekühlt, flüssig) |
| 83 | SF6 | 1080 |  | Formel (Schwefelhexafluorid) |
| 84 | Halon 1211 | 1974 |  | Handelsname (Bromchlordifluormethan) |
| 85 | Halon 1301 | 1009 |  | Handelsname (Bromtrifluormethan) |
| 86 | R134a | 3159 |  | Kältemittel-Nr. (ISO 817) |
| 87 | R404A | 3337 |  | Kältemittel-Nr. (ISO 817) |
| 88 | R407C | 3340 |  | Kältemittel-Nr. (ISO 817) |
| 89 | R22 | 1018 |  | Kältemittel-Nr. (ISO 817) |
| 90 | R32 | 3252 |  | Kältemittel-Nr. (ISO 817) |
| 91 | R290 | 1978 |  | Kältemittel-Nr. (ISO 817, Propan) |
| 92 | R600a | 1969 |  | Kältemittel-Nr. (ISO 817, Isobutan) |
| 93 | R744 | 1013 |  | Kältemittel-Nr. (ISO 817, Kohlendioxid) |
| 94 | R717 | 1005 |  | Kältemittel-Nr. (ISO 817, Ammoniak) |
| 95 | R1234yf | 3161 |  | Kältemittel-Nr. (ISO 817, 2,3,3,3-Tetrafluorpropen) |
| 96 | Kühlschrank | 2857, 3358 | Einstufung hängt vom Kältemittel ab (nicht entzündbar UN 2857, entzündbar UN 3358) | Trivialname (Kältemaschinen) |
| 97 | Klimagerät | 2857, 3358 | Einstufung hängt vom Kältemittel ab (nicht entzündbar UN 2857, entzündbar UN 3358) | Trivialname (Kältemaschinen) |
| 98 | Spiritus | 1170, 1987 | Einstufung hängt vom Produkt ab | Trivialname (Ethanol, vergällt) |
| 99 | Brennspiritus | 1170, 1987 | Einstufung hängt vom Produkt ab | Trivialname (Ethanol, vergällt) |
| 100 | Weingeist | 1170 |  | Trivialname (Ethanol) |
| 101 | Alkohol | 1170, 1987 | Einstufung hängt vom Produkt ab | Trivialname |
| 102 | Spirituosen | 3065 | Einstufung hängt vom Alkoholgehalt ab | Trivialname (alkoholische Getränke) |
| 103 | Handdesinfektionsmittel | 1170, 1219, 1987 | Einstufung hängt vom Produkt ab | Trivialname (alkoholisch) |
| 104 | IPA | 1219 |  | Abkürzung (Isopropanol) |
| 105 | 2-Propanol | 1219 |  | Stoffname (Isopropanol) |
| 106 | rubbing alcohol | 1219 | Einstufung hängt vom Produkt ab | Englisch |
| 107 | Methylalkohol | 1230 |  | Stoffname (Methanol) |
| 108 | Holzgeist | 1230 |  | Trivialname (Methanol) |
| 109 | MEK | 1193 |  | Abkürzung (Ethylmethylketon) |
| 110 | Butanon | 1193 |  | Stoffname (Ethylmethylketon) |
| 111 | MIBK | 1245 |  | Abkürzung (Methylisobutylketon) |
| 112 | Essigester | 1173 |  | Trivialname (Ethylacetat) |
| 113 | Äther | 1155 |  | Trivialname (Diethylether) |
| 114 | THF | 2056 |  | Abkürzung (Tetrahydrofuran) |
| 115 | DMF | 2265 |  | Abkürzung (N,N-Dimethylformamid) |
| 116 | MTBE | 2398 |  | Abkürzung (Methyl-tert-butylether) |
| 117 | Methylenchlorid | 1593 |  | Trivialname (Dichlormethan) |
| 118 | Perchlorethylen | 1897 |  | Trivialname (Tetrachlorethylen) |
| 119 | Styrol | 2055 |  | Trivialname (Styren, monomer, stabilisiert) |
| 120 | Testbenzin | 1300 | Einstufung hängt vom Flammpunkt ab | Trivialname (Terpentinölersatz) |
| 121 | White Spirit | 1300 | Einstufung hängt vom Flammpunkt ab | Handelsname (Terpentinölersatz) |
| 122 | Terpentinersatz | 1300 | Einstufung hängt vom Flammpunkt ab | Trivialname (Terpentinölersatz) |
| 123 | Waschbenzin | 1268, 3295 | Einstufung hängt vom Produkt ab | Trivialname |
| 124 | Feuerzeugbenzin | 1268, 3295 | Einstufung hängt vom Produkt ab | Trivialname |
| 125 | Formalin | 2209, 1198 | nicht entzündbar UN 2209, entzündbar UN 1198; Einstufung hängt von Konzentration und Flammpunkt ab | Handelsname (Formaldehydlösung) |
| 126 | Farben | 1263 | gilt für lösemittelhaltige Farben und Lacke; wasserbasierte sind oft kein Gefahrgut | Plural (Farbe) |
| 127 | Lacke | 1263 | gilt für lösemittelhaltige Farben und Lacke; wasserbasierte sind oft kein Gefahrgut | Plural (Lack) |
| 128 | Farbreste | 1263 | gilt für lösemittelhaltige Farben und Lacke; wasserbasierte sind oft kein Gefahrgut | Abfallbegriff |
| 129 | Lackreste | 1263 | gilt für lösemittelhaltige Farben und Lacke; wasserbasierte sind oft kein Gefahrgut | Abfallbegriff |
| 130 | Altfarben | 1263 | gilt für lösemittelhaltige Farben und Lacke; wasserbasierte sind oft kein Gefahrgut | Abfallbegriff |
| 131 | Altlacke | 1263 | gilt für lösemittelhaltige Farben und Lacke; wasserbasierte sind oft kein Gefahrgut | Abfallbegriff |
| 132 | Klarlack | 1263 | gilt für lösemittelhaltige Farben und Lacke; wasserbasierte sind oft kein Gefahrgut | Handelsname |
| 133 | Autolack | 1263 | gilt für lösemittelhaltige Farben und Lacke; wasserbasierte sind oft kein Gefahrgut | Handelsname |
| 134 | Nagellack | 1263 | Einstufung hängt vom Produkt ab | Handelsname |
| 135 | nail polish | 1263 | Einstufung hängt vom Produkt ab | Englisch |
| 136 | Verdünnung | 1263, 1993 | Einstufung hängt vom Flammpunkt ab | Trivialname (Farbverdünnung) |
| 137 | Nitroverdünnung | 1263, 1993 | Einstufung hängt vom Flammpunkt ab | Handelsname |
| 138 | Lackverdünnung | 1263, 1993 | Einstufung hängt vom Flammpunkt ab | Handelsname |
| 139 | Kunstharzverdünnung | 1263, 1993 | Einstufung hängt vom Flammpunkt ab | Handelsname |
| 140 | Kleber | 1133 | Einstufung hängt vom Flammpunkt ab | Trivialname (Klebstoffe) |
| 141 | Kontaktkleber | 1133 | Einstufung hängt vom Flammpunkt ab | Handelsname (Klebstoffe) |
| 142 | Parfum | 1266 | Einstufung hängt vom Flammpunkt ab | Schreibvariante (Parfümerieerzeugnisse) |
| 143 | Eau de Toilette | 1266 | Einstufung hängt vom Flammpunkt ab | Handelsname (Parfümerieerzeugnisse) |
| 144 | Eau de Parfum | 1266 | Einstufung hängt vom Flammpunkt ab | Handelsname (Parfümerieerzeugnisse) |
| 145 | Aftershave | 1266 | Einstufung hängt vom Flammpunkt ab | Handelsname (Parfümerieerzeugnisse) |
| 146 | Spraydose | 1950 |  | Trivialname (Druckgaspackungen) |
| 147 | Sprühdose | 1950 |  | Trivialname (Druckgaspackungen) |
| 148 | Altspraydosen | 1950 | Druckgaspackungen zur Entsorgung: SV 327 beachten | Abfallbegriff |
| 149 | Aerosoldose | 1950 |  | Trivialname (Druckgaspackungen) |
| 150 | Lackspray | 1950 |  | Handelsname (Druckgaspackungen) |
| 151 | Sprühlack | 1950 |  | Handelsname (Druckgaspackungen) |
| 152 | Haarspray | 1950 |  | Handelsname (Druckgaspackungen) |
| 153 | Deospray | 1950 |  | Handelsname (Druckgaspackungen) |
| 154 | Bauschaum | 1950 |  | Handelsname (PU-Schaum in Druckgaspackungen) |
| 155 | PU-Schaum | 1950 |  | Handelsname (Druckgaspackungen) |
| 156 | spray can | 1950 |  | Englisch |
| 157 | Akku | 3480, 3481 | gilt für Lithium-Ionen-Akkus; Bleiakkus siehe „Bleiakku“ | Trivialname |
| 158 | Lithium-Ionen-Akku | 3480, 3481 | lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481 | Trivialname |
| 159 | Li-Ion | 3480, 3481 | lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481 | Abkürzung |
| 160 | Li-Ion-Akku | 3480, 3481 | lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481 | Abkürzung |
| 161 | Lithiumakku | 3480, 3481 | lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481 | Trivialname |
| 162 | LiPo | 3480, 3481 | lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481 | Abkürzung (Lithium-Polymer = Lithium-Ionen) |
| 163 | Lithium-Polymer-Akku | 3480, 3481 | lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481 | Trivialname |
| 164 | Powerbank | 3480 |  | Handelsname (Lithium-Ionen-Batterie) |
| 165 | E-Bike-Akku | 3480 |  | Trivialname |
| 166 | Handyakku | 3480, 3481 | lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481 | Trivialname |
| 167 | Akkuschrauber | 3481 | lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481 | Trivialname (Lithium-Ionen-Batterien in Ausrüstungen) |
| 168 | Laptop | 3481 | lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481 | Trivialname (Lithium-Ionen-Batterien in Ausrüstungen) |
| 169 | Smartphone | 3481 | lose Akkus UN 3480; im Gerät eingebaut oder mit dem Gerät verpackt UN 3481 | Trivialname (Lithium-Ionen-Batterien in Ausrüstungen) |
| 170 | Lithiumbatterie | 3090, 3091, 3480, 3481 | Lithium-Metall (nicht wiederaufladbar) UN 3090/3091, Lithium-Ionen (Akku) UN 3480/3481 | Trivialname |
| 171 | Lithium-Metall-Batterie | 3090, 3091 | lose UN 3090; im Gerät oder mit dem Gerät verpackt UN 3091 | Trivialname |
| 172 | Knopfzelle | 3090, 3091 | gilt für Lithium-Knopfzellen; Alkali- und Silberoxid-Knopfzellen sind in der Regel kein Gefahrgut | Trivialname |
| 173 | Natrium-Ionen-Akku | 3551, 3552 | lose UN 3551; im Gerät oder mit dem Gerät verpackt UN 3552 | Trivialname |
| 174 | Altbatterien | 3480, 3090, 2794, 2800 | Einstufung hängt vom Batterietyp ab (Lithium-Ionen, Lithium-Metall, Blei) | Abfallbegriff |
| 175 | Altakkus | 3480, 3090, 2794, 2800 | Einstufung hängt vom Batterietyp ab (Lithium-Ionen, Lithium-Metall, Blei) | Abfallbegriff |
| 176 | Batterieschrott | 3480, 3090, 2794, 2800 | Einstufung hängt vom Batterietyp ab (Lithium-Ionen, Lithium-Metall, Blei) | Abfallbegriff |
| 177 | battery | 3480, 3481, 3090, 3091, 2794, 2800 | Einstufung hängt vom Batterietyp ab (Lithium-Ionen, Lithium-Metall, Blei) | Englisch |
| 178 | power bank | 3480 |  | Englisch |
| 179 | Bleiakku | 2794, 2800 | nass, gefüllt mit Säure UN 2794; auslaufsicher (z. B. Gel, AGM) UN 2800 | Trivialname |
| 180 | Bleibatterie | 2794, 2800 | nass, gefüllt mit Säure UN 2794; auslaufsicher (z. B. Gel, AGM) UN 2800 | Trivialname |
| 181 | Autobatterie | 2794, 2800 | nass, gefüllt mit Säure UN 2794; auslaufsicher (z. B. Gel, AGM) UN 2800 | Trivialname |
| 182 | Starterbatterie | 2794, 2800 | nass, gefüllt mit Säure UN 2794; auslaufsicher (z. B. Gel, AGM) UN 2800 | Trivialname |
| 183 | car battery | 2794, 2800 | nass, gefüllt mit Säure UN 2794; auslaufsicher UN 2800 | Englisch |
| 184 | AGM-Batterie | 2800 |  | Handelsname (auslaufsicher) |
| 185 | Gel-Batterie | 2800 |  | Handelsname (auslaufsicher) |
| 186 | Pulverlöscher | 1044 |  | Trivialname (Feuerlöscher) |
| 187 | CO2-Löscher | 1044 |  | Trivialname (Feuerlöscher) |
| 188 | Schaumlöscher | 1044 |  | Trivialname (Feuerlöscher) |
| 189 | Airbag | 3268, 0503 | meist UN 3268; pyrotechnische Sicherheitseinrichtungen der Klasse 1 UN 0503 | Trivialname (Sicherheitseinrichtungen) |
| 190 | Gurtstraffer | 3268, 0503 | meist UN 3268; pyrotechnische Sicherheitseinrichtungen der Klasse 1 UN 0503 | Trivialname (Sicherheitseinrichtungen) |
| 191 | Streichhölzer | 1944, 1945, 1331 | Sicherheitszündhölzer UN 1944, Wachszündhölzer UN 1945, überall entzündbar UN 1331 | Trivialname (Zündhölzer) |
| 192 | Streichholz | 1944, 1945, 1331 | Sicherheitszündhölzer UN 1944, Wachszündhölzer UN 1945, überall entzündbar UN 1331 | Trivialname (Zündhölzer) |
| 193 | Feuerwerk | 0333, 0334, 0335, 0336, 0337 | Einstufung je nach Unterklasse der Feuerwerkskörper (Kennzeichnung auf der Verpackung) | Trivialname (Feuerwerkskörper) |
| 194 | Silvesterfeuerwerk | 0335, 0336, 0337 | Einstufung je nach Unterklasse der Feuerwerkskörper (Kennzeichnung auf der Verpackung) | Trivialname (Feuerwerkskörper) |
| 195 | Böller | 0333, 0334, 0335, 0336, 0337 | Einstufung je nach Unterklasse der Feuerwerkskörper (Kennzeichnung auf der Verpackung) | Trivialname (Feuerwerkskörper) |
| 196 | fireworks | 0333, 0334, 0335, 0336, 0337 | Einstufung je nach Unterklasse der Feuerwerkskörper (Kennzeichnung auf der Verpackung) | Englisch |
| 197 | Setzbolzenkartuschen | 0014 |  | Trivialname (Patronen für Werkzeuge, ohne Geschoss) |
| 198 | Rettungsinsel | 2990 |  | Trivialname (Rettungsmittel, selbstaufblasend) |
| 199 | Rasenmäher | 3528 | gilt für Geräte mit Verbrennungsmotor | Trivialname (Verbrennungsmaschine) |
| 200 | Kettensäge | 3528 | gilt für Geräte mit Verbrennungsmotor | Trivialname (Verbrennungsmaschine) |
| 201 | Leergebinde | 3509 | ausrangierte, ungereinigte Leerverpackungen zur Entsorgung; sonst gilt die UN-Nummer des früheren Inhalts | Abfallbegriff (Altverpackungen) |
| 202 | Patientenprobe | 3373 | nur wenn ein Krankheitserreger enthalten sein kann; freigestellte Patientenproben unterliegen nicht UN 3373 | Trivialname (biologischer Stoff, Kategorie B) |
| 203 | Blutprobe | 3373 | nur wenn ein Krankheitserreger enthalten sein kann; freigestellte Patientenproben unterliegen nicht UN 3373 | Trivialname (biologischer Stoff, Kategorie B) |
| 204 | diagnostische Probe | 3373 | nur wenn ein Krankheitserreger enthalten sein kann; freigestellte Patientenproben unterliegen nicht UN 3373 | Trivialname (biologischer Stoff, Kategorie B) |
| 205 | diagnostic specimen | 3373 | nur wenn ein Krankheitserreger enthalten sein kann | Englisch |
| 206 | Krankenhausabfall | 3291 | nur ansteckungsgefährlicher Abfall | Abfallbegriff (klinischer Abfall) |
| 207 | Klinikabfall | 3291 | nur ansteckungsgefährlicher Abfall | Abfallbegriff (klinischer Abfall) |
| 208 | Zyankali | 1680 |  | Trivialname (Kaliumcyanid) |
| 209 | Arsenik | 1561 |  | Trivialname (Arsentrioxid) |
| 210 | Sublimat | 1624 |  | Trivialname (Quecksilber(II)chlorid) |
| 211 | Karbid | 1402 |  | Trivialname (Calciumcarbid) |
| 212 | Altöl | 3082, 1202, 1993 | Einstufung hängt von Flammpunkt und Umweltgefährdung ab; Altöl ist oft auch kein Gefahrgut – Analyse bzw. Sicherheitsdatenblatt prüfen | Abfallbegriff |
| 213 | Glykol | — (kein Gefahrgut-Hinweis) | in der Regel kein Gefahrgut – Sicherheitsdatenblatt Abschnitt 14 prüfen | Trivialname (Ethylenglykol) |
| 214 | Ethylenglykol | — (kein Gefahrgut-Hinweis) | in der Regel kein Gefahrgut – Sicherheitsdatenblatt Abschnitt 14 prüfen | Stoffname |
| 215 | Kühlmittel | — (kein Gefahrgut-Hinweis) | in der Regel kein Gefahrgut – Sicherheitsdatenblatt Abschnitt 14 prüfen; Kältemittel (R-Gase) z. B. unter „R134a“ suchen | Trivialname (Glykol-Kühlerflüssigkeit) |
| 216 | Kühlerfrostschutz | — (kein Gefahrgut-Hinweis) | in der Regel kein Gefahrgut – Sicherheitsdatenblatt Abschnitt 14 prüfen | Trivialname (Glykol) |
| 217 | AdBlue | — (kein Gefahrgut-Hinweis) | in der Regel kein Gefahrgut – Sicherheitsdatenblatt Abschnitt 14 prüfen | Handelsname (Harnstofflösung) |
| 218 | Harnstofflösung | — (kein Gefahrgut-Hinweis) | in der Regel kein Gefahrgut – Sicherheitsdatenblatt Abschnitt 14 prüfen | Stoffname |
| 219 | Motoröl | — (kein Gefahrgut-Hinweis) | in der Regel kein Gefahrgut – Sicherheitsdatenblatt Abschnitt 14 prüfen | Trivialname (Frischöl; Altöl siehe „Altöl“) |
| 220 | Hydrauliköl | — (kein Gefahrgut-Hinweis) | in der Regel kein Gefahrgut – Sicherheitsdatenblatt Abschnitt 14 prüfen | Trivialname |
| 221 | Bremsflüssigkeit | — (kein Gefahrgut-Hinweis) | in der Regel kein Gefahrgut – Sicherheitsdatenblatt Abschnitt 14 prüfen | Trivialname |

