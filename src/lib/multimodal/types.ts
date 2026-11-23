// ── Types ────────────────────────────────────────────────────

export interface Entry {
  unNumber: string
  sequenceNumber: number
  name?: string
  nameEn?: string
  nameFr?: string
  specification?: string
  specificationEn?: string
  specificationFr?: string
  hazardClass?: string
  classificationCode?: string
  packingGroup?: string
  hazardLabels?: string
  exceptedQty?: string
  limitedQty?: string
  transportCategory?: string | number
  multiplier?: string
  kemlerNumber?: string
  tunnelCode?: string
  packingInstructions?: string
  ems1?: string
  ems2?: string
  stowageCategory?: string
  stowage?: string
  segregation?: string
  marpol?: string
  packingInstrPassenger?: string
  packingInstrCargo?: string
  maxNetPassenger?: string
  maxNetCargo?: string
  /** ICAO state variations, e.g. "AU 1, US 3" */
  stateVariations?: string
  cones?: string | number | null
  equipment?: string
  remark?: string
  specialProvisions?: string

  // ── Table A detail columns (display; see details.ts) ──────
  /** ADR/RID col. 9a, IMDG cols. 9 + 11 (PP, B, L, RR, BB …) */
  packingSv?: string
  /** ADR/RID col. 9b mixed packing (MP) */
  coPacking?: string
  /** ADR/RID col. 10, IMDG col. 13: portable tank and bulk container instructions (T, BK) */
  portableTankInstr?: string
  /** ADR/RID col. 11, IMDG col. 14 (TP) */
  portableTankSv?: string
  /** ADR/RID col. 12 tank code (LGBF …) */
  tankCodes?: string
  /** ADR/RID col. 13 (TU, TC, TE, TA, TT, TM) */
  tankSv?: string
  /** ADR col. 14 vehicle for tank carriage (FL, AT, EX/III) */
  tankVehicle?: string
  /** ADR col. 16 (V) / RID col. 16 (W) */
  packageSv?: string
  /** ADR/RID col. 17 (VC, AP) */
  bulkSv?: string
  /** ADR col. 18 (CV) / RID col. 18 (CW) */
  handlingSv?: string
  /** ADR col. 19 operation (S) */
  operationSv?: string
  /** RID col. 19 express freight (CE) */
  expressFreight?: string
  /** IMDG col. 16a handling codes (H) */
  imdgHandling?: string
  /** IMDG col. 16b segregation groups (SGG) */
  segregationGroups?: string
  /** BAM N_SICHERUNG: '0' no, '1' yes, '2' class 7 conditional (high consequence dangerous goods, 1.10.3) */
  securityLevel?: string
  /** BAM S_MENGE_SICHERUNG_*: quantity above which 1.10.3 applies; "a)" moot, "b)" never */
  securityQtyTank?: string
  securityQtyBulk?: string
  securityQtyPackages?: string
  /** BAM S_KENNZ_N: '+' environmentally hazardous, '-' not, 'E' depends (shipper decides) */
  envHazard?: string
  /** class 1 compatibility group (7.5.2.2) */
  compatibilityGroup?: string
}

export const MODALS = ['ADR', 'RID', 'IMDG', 'ICAO', 'ADN'] as const
export type Modal = (typeof MODALS)[number]

/**
 * The modes the BAM feed carries. ADN stays a `Modal` (the data shape keeps `ADN: []`), but it is
 * empty by design, so tabs, overview tiles and comparison columns show only these modes plus one
 * `noAdnData` note.
 */
export const DATA_MODES = MODALS.filter((m): m is Exclude<Modal, 'ADN'> => m !== 'ADN')

export const LANGS = ['de', 'en', 'fr', 'tr'] as const
export type Lang = (typeof LANGS)[number]

// ── i18n ─────────────────────────────────────────────────────

export const MODAL_DESC_I18N: Record<Lang, Record<Modal, string>> = {
  de: { ADR: 'Straßenverkehr 2025', RID: 'Eisenbahn 2025', IMDG: 'Seeverkehr Amdt. 42-24', ICAO: 'Luftverkehr 2025', ADN: 'Binnenschifffahrt 2025' },
  en: { ADR: 'Road transport 2025', RID: 'Rail transport 2025', IMDG: 'Sea transport Amdt. 42-24', ICAO: 'Air transport 2025', ADN: 'Inland waterway 2025' },
  fr: { ADR: 'Transport routier 2025', RID: 'Transport ferroviaire 2025', IMDG: 'Transport maritime Amdt. 42-24', ICAO: 'Transport aérien 2025', ADN: 'Navigation intérieure 2025' },
  tr: { ADR: 'Karayolu 2025', RID: 'Demiryolu 2025', IMDG: 'Deniz taş. Amdt. 42-24', ICAO: 'Hava taşımacılığı 2025', ADN: 'İç su yolu 2025' },
}

export const LABELS: Record<Lang, Record<string, string>> = {
  de: {
    language: 'Sprache', stateVariations: 'Staatenabweichungen', noSourceData: 'Keine Angabe in der Quelle (BAM)', noSourceShort: 'k. A.', elsewhere: 'Im Luftverkehr: siehe {fields}', crossRef: 'Verweis auf eine Sondervorschrift – nicht verglichen', forbidden: 'Beförderung verboten', forbiddenBadge: 'Verboten', airForbiddenAll: 'Luftverkehr (ICAO): Beförderung verboten – auf Passagier- und Frachtflugzeugen', airForbiddenPassenger: 'Passagierflugzeug (ICAO): verboten – nur Frachtflugzeug', airForbiddenCargo: 'Frachtflugzeug (ICAO): verboten', emsUnderlined: 'Im IMDG-Code unterstrichen: Der EmS-Leitfaden enthält zusätzliche Hinweise für diesen Stoff.',
    class: 'Klasse', classCode: 'Klassifizierungscode', packingGroup: 'Verpackungsgruppe',
    labels: 'Gefahrzettel', exceptedQty: 'Freigestellte Mengen', limitedQty: 'Begrenzte Mengen',
    transportCat: 'Beförderungskategorie', kemler: 'Kemler-Zahl', tunnelCode: 'Tunnelcode',
    pgShort: 'VP-Gr.', transportCatShort: 'BK',
    ems: 'EmS', stowageCat: 'Staukategorie', stowage: 'Stauung', segregation: 'Trennung',
    marpol: 'MARPOL', packingInstr: 'Verpackungsanweisungen',
    piPassenger: 'PI Passagier', piCargo: 'PI Fracht',
    cones: 'Kegel/Lichter', equipment: 'Ausrüstung', remark: 'Bemerkung',
    specialProvisions: 'Sondervorschriften', availability: 'Verfügbarkeit in allen Modi',
    noText: 'Kein Text verfügbar', notFound: 'nicht vorhanden',
    loadError: 'Die Daten konnten nicht geladen werden. Bitte versuche es erneut.', retry: 'Erneut versuchen',
    variant: 'Variante', noVariantMatch: 'Für diese Variante gibt es in {mode} keine eindeutige Entsprechung. Bitte wähle:',
    manualVariant: 'Für {mode} manuell gewählt:',
    noDifferencesShown: 'Keine Abweichungen – alle verglichenen Angaben stimmen überein.',
    field: 'Angabe', multiplier: 'Multiplikator', emsFire: 'EmS Feuer', emsSpill: 'EmS Leckage', maxNetPassenger: 'Max. netto Passagier', maxNetCargo: 'Max. netto Fracht', unReference: 'UN-Modellvorschriften', onlyDifferences: 'Nur Abweichungen zeigen', notApplicable: 'In diesem Regelwerk nicht vorgesehen', notCompared: 'Nicht verglichen: abweichende Systematik', noAdnData: 'ADN (Binnenschifffahrt): keine Daten in der BAM-Quelle.', noDeviations: 'Keine kritischen Abweichungen zwischen den Regelwerken.', deviationsTitle: 'Kritische Abweichungen', legendDiffers: 'Abweichung', legendCritical: 'Kritische Abweichung', criticalField: 'Kritische Angabe', unresolved: 'Keine eindeutige Variante', compareTitle: 'Regelwerksvergleich', noEntries: 'Für diese UN-Nummer gibt es in keinem Regelwerk einen Eintrag.', and: 'und', noDeviationsBetween: 'Keine kritischen Abweichungen zwischen {modes}.', uncomparedModes: 'Nicht verglichen: {modes} (keine eindeutige Variante).', nothingToCompare: 'Nur ein Regelwerk enthält diese UN-Nummer – es gibt nichts zu vergleichen.',
    grpPackaging: 'Verpackung', grpTank: 'Tank', grpCarriage: 'Beförderung', grpStowage: 'Stauung und Trennung', grpSecurity: 'Sicherung (1.10)', grpOther: 'Weitere Angaben', packingSv: 'Sondervorschriften Verpackung', coPacking: 'Zusammenpackung', portableTank: 'Ortsbewegliche Tanks und Schüttgut-Container', portableTankSv: 'Sondervorschriften ortsbewegliche Tanks', tankCodes: 'Tankcodierung', tankSv: 'Sondervorschriften Tanks', tankVehicle: 'Fahrzeug für Tankbeförderung', packageSv: 'Versandstücke', bulkSv: 'Lose Schüttung', handlingSv: 'Be- und Entladung, Handhabung', operationSv: 'Betrieb', expressFreight: 'Expressgut', imdgHandling: 'Handhabung', segregationGroups: 'Trenngruppe', securityLevel: 'Gefährliches Gut mit hohem Gefahrenpotenzial', securityQtyTank: '1.10.3 gilt ab – Tank', securityQtyBulk: '1.10.3 gilt ab – lose Schüttung', securityQtyPackages: '1.10.3 gilt ab – Versandstücke', envHazard: 'Umweltgefährdend (Kennzeichen N)', compatibilityGroup: 'Verträglichkeitsgruppe', hcdg0: 'Nein – 1.10.3 gilt nicht', hcdg1: 'Ja – 1.10.3 gilt oberhalb der Mengen unten', hcdg2: 'Radioaktiver Stoff: 1.10.3 gilt nur ab 3000 A2 je Versandstück oder wegen einer Nebengefahr (1.10.3.1.5)', secMoot: 'gegenstandslos', secNever: 'gilt nicht, unabhängig von der Menge', secAnyQty: 'jede Menge', envYes: 'Ja', envNo: 'Nein', envMaybe: 'Möglich – je nach Konzentration oder Isomer, der Versender entscheidet', openSection: 'Abschnitt {section} im ADR-Text öffnen', detailsHint: 'Für diese Codes enthält die BAM-Quelle keine Texte.', detailsHintBook: 'Für diese Codes enthält die BAM-Quelle keine Texte; ↗ öffnet den Abschnitt im ADR-Text.',
    searchPlaceholder: 'UN-Nummer oder Stoffname…',
    clickLoad: 'Klicken zum Öffnen…',
    bannerTitle: 'Multimodaler Gefahrgut-Vergleich.',
    bannerSub: ' UN-Nummer eingeben und alle Transportmodi auf einen Blick vergleichen.',
  },
  en: {
    language: 'Language', stateVariations: 'State variations', noSourceData: 'No data in the source (BAM)', noSourceShort: 'n/a', elsewhere: 'Air transport: see {fields}', crossRef: 'Reference to a special provision – not compared', forbidden: 'Carriage forbidden', forbiddenBadge: 'Forbidden', airForbiddenAll: 'Air (ICAO): carriage forbidden – on passenger and cargo aircraft', airForbiddenPassenger: 'Passenger aircraft (ICAO): forbidden – cargo aircraft only', airForbiddenCargo: 'Cargo aircraft (ICAO): forbidden', emsUnderlined: 'Underlined in the IMDG Code: the EmS Guide has additional advice for this substance.',
    class: 'Class', classCode: 'Classification code', packingGroup: 'Packing group',
    labels: 'Labels', exceptedQty: 'Excepted qty.', limitedQty: 'Limited qty.',
    transportCat: 'Transport cat.', kemler: 'Kemler number', tunnelCode: 'Tunnel code',
    pgShort: 'PG', transportCatShort: 'TC',
    ems: 'EmS', stowageCat: 'Stowage cat.', stowage: 'Stowage', segregation: 'Segregation',
    marpol: 'MARPOL', packingInstr: 'Packing instructions',
    piPassenger: 'PI Passenger', piCargo: 'PI Cargo',
    cones: 'Cones/lights', equipment: 'Equipment', remark: 'Remark',
    specialProvisions: 'Special provisions', availability: 'Availability in all modes',
    noText: 'No text available', notFound: 'not available',
    loadError: 'The data could not be loaded. Please try again.', retry: 'Try again',
    variant: 'Variant', noVariantMatch: 'There is no unambiguous match for this variant in {mode}. Please choose:',
    manualVariant: 'Chosen manually for {mode}:',
    noDifferencesShown: 'No differences – all compared fields agree.',
    field: 'Field', multiplier: 'Multiplier', emsFire: 'EmS fire', emsSpill: 'EmS spillage', maxNetPassenger: 'Max. net passenger', maxNetCargo: 'Max. net cargo', unReference: 'UN Model Regulations', onlyDifferences: 'Show differences only', notApplicable: 'Not part of this regulation', notCompared: 'Not compared: different notation', noAdnData: 'ADN (inland waterways): no data in the BAM source.', noDeviations: 'No critical differences between the regulations.', deviationsTitle: 'Critical differences', legendDiffers: 'Difference', legendCritical: 'Critical difference', criticalField: 'Critical field', unresolved: 'No unambiguous variant', compareTitle: 'Regulatory comparison', noEntries: 'No regulation has an entry for this UN number.', and: 'and', noDeviationsBetween: 'No critical differences between {modes}.', uncomparedModes: 'Not compared: {modes} (no unambiguous variant).', nothingToCompare: 'Only one regulation has this UN number – there is nothing to compare.',
    grpPackaging: 'Packaging', grpTank: 'Tank', grpCarriage: 'Carriage', grpStowage: 'Stowage and segregation', grpSecurity: 'Security (1.10)', grpOther: 'Further data', packingSv: 'Packing provisions', coPacking: 'Mixed packing', portableTank: 'Portable tanks and bulk containers', portableTankSv: 'Portable tank provisions', tankCodes: 'Tank code', tankSv: 'Tank provisions', tankVehicle: 'Vehicle for tank carriage', packageSv: 'Packages', bulkSv: 'Bulk', handlingSv: 'Loading, unloading, handling', operationSv: 'Operation', expressFreight: 'Express parcels', imdgHandling: 'Handling', segregationGroups: 'Segregation group', securityLevel: 'High consequence dangerous goods', securityQtyTank: '1.10.3 applies above – tank', securityQtyBulk: '1.10.3 applies above – bulk', securityQtyPackages: '1.10.3 applies above – packages', envHazard: 'Environmentally hazardous (mark N)', compatibilityGroup: 'Compatibility group', hcdg0: 'No – 1.10.3 does not apply', hcdg1: 'Yes – 1.10.3 applies above the quantities below', hcdg2: 'Radioactive material: 1.10.3 applies only from 3000 A2 per package or because of a subsidiary hazard (1.10.3.1.5)', secMoot: 'not relevant', secNever: 'does not apply, whatever the quantity', secAnyQty: 'any quantity', envYes: 'Yes', envNo: 'No', envMaybe: 'Possibly – depends on concentration or isomer, the consignor decides', openSection: 'Open section {section} in the ADR text', detailsHint: 'The BAM source has no texts for these codes.', detailsHintBook: 'The BAM source has no texts for these codes; ↗ opens the section in the ADR text.',
    searchPlaceholder: 'UN number or substance name…',
    clickLoad: 'Click to expand…',
    bannerTitle: 'Multimodal Dangerous Goods Comparison.',
    bannerSub: ' Enter a UN number and compare all transport modes at a glance.',
  },
  fr: {
    language: 'Langue', stateVariations: 'Divergences des États', noSourceData: 'Pas de donnée dans la source (BAM)', noSourceShort: 'n.d.', elsewhere: 'Transport aérien : voir {fields}', crossRef: 'Renvoi à une disposition spéciale – non comparé', forbidden: 'Transport interdit', forbiddenBadge: 'Interdit', airForbiddenAll: 'Aérien (OACI) : transport interdit – avions passagers et cargo', airForbiddenPassenger: 'Avion passagers (OACI) : interdit – avion cargo uniquement', airForbiddenCargo: 'Avion cargo (OACI) : interdit', emsUnderlined: 'Souligné dans le Code IMDG : le Guide EmS contient des indications supplémentaires pour cette matière.',
    class: 'Classe', classCode: 'Code de classification', packingGroup: "Groupe d'emballage",
    labels: 'Étiquettes', exceptedQty: 'Qté exemptée', limitedQty: 'Qté limitée',
    transportCat: 'Catégorie transp.', kemler: 'Numéro Kemler', tunnelCode: 'Code tunnel',
    pgShort: 'GE', transportCatShort: 'CT',
    ems: 'EmS', stowageCat: "Catégorie d'arrimage", stowage: 'Arrimage', segregation: 'Séparation',
    marpol: 'MARPOL', packingInstr: "Instructions d'emballage",
    piPassenger: 'PI Passagers', piCargo: 'PI Cargo',
    cones: 'Cônes/feux', equipment: 'Équipement', remark: 'Remarque',
    specialProvisions: 'Dispositions spéciales', availability: 'Disponibilité dans tous les modes',
    noText: 'Texte non disponible', notFound: 'non disponible',
    loadError: 'Les données n’ont pas pu être chargées. Veuillez réessayer.', retry: 'Réessayer',
    variant: 'Variante', noVariantMatch: 'Aucune correspondance univoque pour cette variante en {mode}. Veuillez choisir :',
    manualVariant: 'Choisi manuellement pour {mode} :',
    noDifferencesShown: 'Aucun écart – toutes les données comparées concordent.',
    field: 'Donnée', multiplier: 'Multiplicateur', emsFire: 'EmS incendie', emsSpill: 'EmS déversement', maxNetPassenger: 'Qté nette max. passagers', maxNetCargo: 'Qté nette max. cargo', unReference: 'Règlement type de l’ONU', onlyDifferences: 'Écarts uniquement', notApplicable: 'Non prévu dans ce règlement', notCompared: 'Non comparé : notation différente', noAdnData: 'ADN (navigation intérieure) : pas de données dans la source BAM.', noDeviations: 'Aucun écart critique entre les règlements.', deviationsTitle: 'Écarts critiques', legendDiffers: 'Écart', legendCritical: 'Écart critique', criticalField: 'Donnée critique', unresolved: 'Pas de variante univoque', compareTitle: 'Comparaison réglementaire', noEntries: 'Aucun règlement ne contient ce numéro ONU.', and: 'et', noDeviationsBetween: 'Aucun écart critique entre {modes}.', uncomparedModes: 'Non comparé : {modes} (pas de variante univoque).', nothingToCompare: 'Un seul règlement contient ce numéro ONU – rien à comparer.',
    grpPackaging: 'Emballage', grpTank: 'Citerne', grpCarriage: 'Transport', grpStowage: 'Arrimage et séparation', grpSecurity: 'Sûreté (1.10)', grpOther: 'Autres données', packingSv: "Dispositions spéciales d'emballage", coPacking: 'Emballage en commun', portableTank: 'Citernes mobiles et conteneurs pour vrac', portableTankSv: 'Dispositions spéciales citernes mobiles', tankCodes: 'Code-citerne', tankSv: 'Dispositions spéciales citernes', tankVehicle: 'Véhicule pour le transport en citerne', packageSv: 'Colis', bulkSv: 'Vrac', handlingSv: 'Chargement, déchargement, manutention', operationSv: 'Exploitation', expressFreight: 'Colis express', imdgHandling: 'Manutention', segregationGroups: 'Groupe de séparation', securityLevel: 'Marchandises dangereuses à haut risque', securityQtyTank: '1.10.3 au-delà de – citerne', securityQtyBulk: '1.10.3 au-delà de – vrac', securityQtyPackages: '1.10.3 au-delà de – colis', envHazard: "Dangereux pour l'environnement (marque N)", compatibilityGroup: 'Groupe de compatibilité', hcdg0: "Non – 1.10.3 ne s'applique pas", hcdg1: "Oui – 1.10.3 s'applique au-delà des quantités ci-dessous", hcdg2: "Matière radioactive : 1.10.3 seulement à partir de 3000 A2 par colis ou en raison d'un danger subsidiaire (1.10.3.1.5)", secMoot: 'sans objet', secNever: "ne s'applique pas, quelle que soit la quantité", secAnyQty: 'toute quantité', envYes: 'Oui', envNo: 'Non', envMaybe: "Possible – selon la concentration ou l'isomère, l'expéditeur décide", openSection: 'Ouvrir la section {section} dans le texte ADR', detailsHint: 'La source BAM ne contient pas de textes pour ces codes.', detailsHintBook: 'La source BAM ne contient pas de textes pour ces codes ; ↗ ouvre la section dans le texte ADR.',
    searchPlaceholder: 'Numéro ONU ou nom de matière…',
    clickLoad: 'Cliquer pour ouvrir…',
    bannerTitle: 'Comparaison multimodale des matières dangereuses.',
    bannerSub: " Saisissez un numéro ONU et comparez tous les modes de transport d'un coup d'œil.",
  },
  tr: {
    language: 'Dil', stateVariations: 'Devlet farklılıkları', noSourceData: 'Kaynakta veri yok (BAM)', noSourceShort: 'yok', elsewhere: 'Hava taşımacılığı: bkz. {fields}', crossRef: 'Özel hükme atıf – karşılaştırılmadı', forbidden: 'Taşıma yasak', forbiddenBadge: 'Yasak', airForbiddenAll: 'Hava (ICAO): taşıma yasak – yolcu ve kargo uçağında', airForbiddenPassenger: 'Yolcu uçağı (ICAO): yasak – yalnızca kargo uçağı', airForbiddenCargo: 'Kargo uçağı (ICAO): yasak', emsUnderlined: 'IMDG Kodunda altı çizili: EmS Kılavuzu bu madde için ek bilgiler içerir.',
    class: 'Sınıf', classCode: 'Sınıflandırma kodu', packingGroup: 'Ambalaj grubu',
    labels: 'Tehlike etiketleri', exceptedQty: 'Muaf miktar', limitedQty: 'Sınırlı miktar',
    transportCat: 'Taşıma kategorisi', kemler: 'Kemler numarası', tunnelCode: 'Tünel kodu',
    pgShort: 'AG', transportCatShort: 'TK',
    ems: 'EmS', stowageCat: 'İstif kategorisi', stowage: 'İstif', segregation: 'Ayrıştırma',
    marpol: 'MARPOL', packingInstr: 'Ambalaj talimatları',
    piPassenger: 'Yolcu talimatı', piCargo: 'Kargo talimatı',
    cones: 'Koni/ışıklar', equipment: 'Ekipman', remark: 'Not',
    specialProvisions: 'Özel hükümler', availability: 'Tüm taşıma modlarındaki durum',
    noText: 'Metin mevcut değil', notFound: 'mevcut değil',
    loadError: 'Veriler yüklenemedi. Lütfen tekrar deneyin.', retry: 'Tekrar dene',
    variant: 'Varyant', noVariantMatch: 'Bu varyant için {mode} içinde net bir karşılık yok. Lütfen seçin:',
    manualVariant: '{mode} için elle seçildi:',
    noDifferencesShown: 'Fark yok – karşılaştırılan tüm alanlar aynı.',
    field: 'Alan', multiplier: 'Çarpan', emsFire: 'EmS yangın', emsSpill: 'EmS sızıntı', maxNetPassenger: 'Maks. net yolcu', maxNetCargo: 'Maks. net kargo', unReference: 'BM Model Düzenlemeleri', onlyDifferences: 'Yalnızca farkları göster', notApplicable: 'Bu düzenlemede yer almıyor', notCompared: 'Karşılaştırılmadı: farklı gösterim', noAdnData: 'ADN (iç su yolu): BAM kaynağında veri yok.', noDeviations: 'Düzenlemeler arasında kritik fark yok.', deviationsTitle: 'Kritik farklar', legendDiffers: 'Fark', legendCritical: 'Kritik fark', criticalField: 'Kritik alan', unresolved: 'Net varyant yok', compareTitle: 'Mevzuat karşılaştırması', noEntries: 'Bu BM numarası için hiçbir düzenlemede kayıt yok.', and: 've', noDeviationsBetween: '{modes} arasında kritik fark yok.', uncomparedModes: 'Karşılaştırılmadı: {modes} (net varyant yok).', nothingToCompare: 'Bu BM numarası yalnızca bir düzenlemede var – karşılaştırılacak bir şey yok.',
    grpPackaging: 'Ambalaj', grpTank: 'Tank', grpCarriage: 'Taşıma', grpStowage: 'İstif ve ayrıştırma', grpSecurity: 'Güvenlik (1.10)', grpOther: 'Diğer bilgiler', packingSv: 'Ambalaj özel hükümleri', coPacking: 'Karışık ambalajlama', portableTank: 'Portatif tanklar ve dökme yük konteynerleri', portableTankSv: 'Portatif tank özel hükümleri', tankCodes: 'Tank kodu', tankSv: 'Tank özel hükümleri', tankVehicle: 'Tank taşımacılığı aracı', packageSv: 'Koliler', bulkSv: 'Dökme', handlingSv: 'Yükleme, boşaltma, elleçleme', operationSv: 'İşletme', expressFreight: 'Ekspres gönderi', imdgHandling: 'Elleçleme', segregationGroups: 'Ayrıştırma grubu', securityLevel: 'Yüksek sonuçlu tehlikeli madde', securityQtyTank: '1.10.3 eşiği – tank', securityQtyBulk: '1.10.3 eşiği – dökme', securityQtyPackages: '1.10.3 eşiği – koliler', envHazard: 'Çevreye zararlı (N işareti)', compatibilityGroup: 'Uyumluluk grubu', hcdg0: 'Hayır – 1.10.3 uygulanmaz', hcdg1: 'Evet – 1.10.3 aşağıdaki miktarların üzerinde uygulanır', hcdg2: 'Radyoaktif madde: 1.10.3 yalnızca koli başına 3000 A2 üzerinde veya yan tehlike nedeniyle uygulanır (1.10.3.1.5)', secMoot: 'konu dışı', secNever: 'miktardan bağımsız olarak uygulanmaz', secAnyQty: 'her miktar', envYes: 'Evet', envNo: 'Hayır', envMaybe: 'Olası – konsantrasyona veya izomere bağlı, gönderen karar verir', openSection: '{section} bölümünü ADR metninde aç', detailsHint: 'BAM kaynağı bu kodlar için metin içermiyor.', detailsHintBook: 'BAM kaynağı bu kodlar için metin içermiyor; ↗ bölümü ADR metninde açar.',
    searchPlaceholder: 'BM numarası veya madde adı…',
    clickLoad: 'Açmak için tıklayın…',
    bannerTitle: 'Çok modlu tehlikeli madde karşılaştırması.',
    bannerSub: ' Bir BM numarası girin ve tüm taşıma modlarını tek bakışta karşılaştırın.',
  },
}

export function getL(lang: Lang, key: string): string {
  return LABELS[lang]?.[key] ?? LABELS.de[key] ?? key
}

/**
 * Text of one special provision in the languages BAM publishes.
 * Structurally identical to a `special_provisions` row.
 */
export interface SvText {
  textDe: string | null
  textEn: string | null
  textFr: string | null
}

/**
 * Picks the best available text for `lang`.
 * Turkish has no official BAM text, so it reads English first, like `getName()`.
 * Returns `null` when the provision has no text in any language.
 */
export function pickSvText(sv: SvText, lang: Lang): string | null {
  if (lang === 'en' || lang === 'tr') return sv.textEn ?? sv.textDe ?? sv.textFr ?? null
  if (lang === 'fr') return sv.textFr ?? sv.textEn ?? sv.textDe ?? null
  return sv.textDe ?? sv.textEn ?? sv.textFr ?? null
}

// ── Demo data (UN 1203 · BENZIN / MOTOR SPIRIT) ─────────────
//
// Generated from the live BAM tables by scripts/generate-demo-data.ts (`pnpm generate:demo`)
// through the app's own mapper. Never hand-edit: the landing page shows this to safety advisers,
// so every field must match what an activated account actually sees.
// Source: BAM GEFAHRGUT database, dl-de/by-2-0.
export { DEMO_DATA, DEMO_SVS } from './demoData.generated'

// ── Color helpers ─────────────────────────────────────────────

export const BK_CLASSES: Record<string, string> = {
  '0': 'bg-red-900 text-red-300',
  '1': 'bg-orange-900 text-orange-200',
  '2': 'bg-[#1e3a5f] text-blue-200',
  '3': 'bg-green-900 text-green-200',
  '4': 'bg-gray-700 text-gray-200',
}
