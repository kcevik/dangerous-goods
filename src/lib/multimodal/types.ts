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
  cones?: string | number | null
  equipment?: string
  remark?: string
  specialProvisions?: string
}

export const MODALS = ['ADR', 'RID', 'IMDG', 'ICAO', 'ADN'] as const
export type Modal = (typeof MODALS)[number]

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
    searchPlaceholder: 'UN-Nummer oder Stoffname…',
    clickLoad: 'Klicken zum Öffnen…',
    demoNotice: 'Volltextsuche in der Vollversion verfügbar.',
    bannerTitle: 'Multimodaler Gefahrgut-Vergleich.',
    bannerSub: ' UN-Nummer eingeben und alle Transportmodi auf einen Blick vergleichen.',
  },
  en: {
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
    searchPlaceholder: 'UN number or substance name…',
    clickLoad: 'Click to expand…',
    demoNotice: 'Full search available in the complete version.',
    bannerTitle: 'Multimodal Dangerous Goods Comparison.',
    bannerSub: ' Enter a UN number and compare all transport modes at a glance.',
  },
  fr: {
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
    searchPlaceholder: 'Numéro ONU ou nom de matière…',
    clickLoad: 'Cliquer pour ouvrir…',
    demoNotice: 'Recherche complète disponible dans la version complète.',
    bannerTitle: 'Comparaison multimodale des matières dangereuses.',
    bannerSub: " Saisissez un numéro ONU et comparez tous les modes de transport d'un coup d'œil.",
  },
  tr: {
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
    searchPlaceholder: 'BM numarası veya madde adı…',
    clickLoad: 'Açmak için tıklayın…',
    demoNotice: 'Tam arama özelliği tam sürümde mevcut.',
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
// Generated from the live BAM tables for UN 1203, sequence 1, on 2026-09-28.
// Never hand-write values here: the landing page shows this to safety advisers,
// so every field must match what an activated account actually sees.
// Source: BAM GEFAHRGUT database, dl-de/by-2-0.

export const DEMO_DATA: Record<string, Entry[]> = {
  ADR: [{
    unNumber: '1203', sequenceNumber: 1,
    name: 'BENZIN', nameEn: 'MOTOR SPIRIT', nameFr: 'ESSENCE',
    hazardClass: '3', classificationCode: 'F1', packingGroup: 'II',
    hazardLabels: '3', exceptedQty: 'E2', limitedQty: '1 L',
    transportCategory: '2', multiplier: '3',
    kemlerNumber: '33', tunnelCode: 'D/E',
    packingInstructions: 'P001, IBC02, R001',
    specialProvisions: '243, 534, 664',
  }],
  RID: [{
    unNumber: '1203', sequenceNumber: 1,
    name: 'BENZIN', nameEn: 'MOTOR SPIRIT',
    hazardClass: '3', classificationCode: 'F1', packingGroup: 'II',
    hazardLabels: '3', exceptedQty: 'E2', limitedQty: '1 L',
    transportCategory: '2',
    packingInstructions: 'P001, IBC02, R001',
    specialProvisions: '243, 534',
  }],
  IMDG: [{
    unNumber: '1203', sequenceNumber: 1,
    name: 'OTTOKRAFTSTOFF', nameEn: 'MOTOR SPIRIT',
    hazardClass: '3', packingGroup: 'II',
    hazardLabels: '3', exceptedQty: 'E2', limitedQty: '1 L',
    packingInstructions: 'P001',
    ems1: 'F-E', ems2: 'S-E', stowageCategory: 'E',
    specialProvisions: '243',
  }],
  ICAO: [{
    unNumber: '1203', sequenceNumber: 1,
    name: 'Gasoline',
    hazardClass: '3', packingGroup: 'II',
    hazardLabels: 'Liquid flammable', exceptedQty: 'E2',
    packingInstrPassenger: '353', maxNetPassenger: '5 L',
    packingInstrCargo: '364', maxNetCargo: '60 L',
    specialProvisions: 'A100',
  }],
  // BAM ships no ADN data, so the real app always renders this tab empty — the demo must match
  ADN: [],
}

export const DEMO_SVS: Record<string, SvText> = {
  'ADR:243': {
    textDe: "Benzin und Ottokraftstoff für die Verwendung in Ottomotoren (z.B. in Kraftfahrzeugen, ortsfesten Motoren und anderen Motoren) sind ungeachtet der Bandbreite der Flüchtigkeit dieser Eintragung zuzuordnen.",
    textEn: "Gasoline, motor spirit and petrol for use in spark-ignition engines (e.g. in automobiles, stationary engines and other engines) shall be assigned to this entry regardless of variations in volatility.",
    textFr: "L'essence destinée à être utilisée comme carburant pour moteurs d'automobiles, moteurs fixes et autres moteurs à allumage commandé doit être classée sous cette rubrique indépendamment de ses caractéristiques de volatilité.",
  },
  'ADR:534': {
    textDe: "Obwohl Benzin unter gewissen klimatischen Bedingungen bei 50 °C einen Dampfdruck von mehr als 110 kPa (1,10 bar) bis höchstens 150 kPa (1,50 bar) haben kann, muss es einem Stoff gleichgestellt bleiben, der bei 50 °C einen Dampfdruck von höchstens 110 kPa (1,10 bar) hat.",
    textEn: "While in some climatic conditions, petrol (gasoline) may have a vapour pressure at 50 °C of more than 110 kPa (1.10 bar) but not more than 150 kPa (1.50 bar) it is to continue to be considered as a substance having a vapour pressure at 50 °C of not more than 110 kPa (1.10 bar).",
    textFr: "Nonobstant que l'essence peut, sous certaines conditions climatiques, avoir une pression de vapeur à 50 °C supérieure à 110 kPa (1,10 bar), sans dépasser 150 kPa (1,50 bar), elle doit continuer à être assimilée à une matière ayant une pression de vapeur à 50 °C ne dépassant pas 110 kPa (1,10 bar).",
  },
  'ADR:664': {
    textDe: "Werden Stoffe unter dieser Eintragung in festverbundenen Tanks (Tankfahrzeugen) oder Aufsetztanks befördert, so dürfen diese Tanks mit Additivierungseinrichtungen ausgerüstet sein. […]",
    textEn: "When substances under this entry are carried in fixed tanks (tank-vehicles) or demountable tanks, these tanks may be equipped with additive devices. […]",
    textFr: "Lorsque des matières classées sous cette rubrique sont transportées dans des citernes fixes (véhicules-citernes) ou des citernes démontables, ces citernes peuvent être équipées de dispositifs pour additifs. […]",
  },
  'RID:243': {
    textDe: "Benzin und Ottokraftstoff für die Verwendung in Ottomotoren (z.B. in Kraftfahrzeugen, ortsfesten Motoren und anderen Motoren) sind ungeachtet der Bandbreite der Flüchtigkeit dieser Eintragung zuzuordnen.",
    textEn: "Gasoline, motor spirit and petrol for use in spark-ignition engines (e.g. in automobiles, stationary engines and other engines) shall be assigned to this entry regardless of variations in volatility.",
    textFr: null,
  },
  'RID:534': {
    textDe: "Obwohl Benzin unter gewissen klimatischen Bedingungen bei 50 °C einen Dampfdruck von mehr als 110 kPa (1,10 bar) bis höchstens 150 kPa (1,50 bar) haben kann, muss es einem Stoff gleichgestellt bleiben, der bei 50 °C einen Dampfdruck von höchstens 110 kPa (1,10 bar) hat.",
    textEn: "While in some climatic conditions, petrol (gasoline) may have a vapour pressure at 50 °C of more than 110 kPa (1.10 bar) but not more than 150 kPa (1.50 bar) it is to continue to be considered as a substance having a vapour pressure at 50 °C of not more than 110 kPa (1.10 bar).",
    textFr: null,
  },
  'IMDG:243': {
    textDe: "Benzin und Ottokraftstoff für die Verwendung in Ottomotoren (z. B. in Kraftfahrzeugen, ortsfesten Motoren und anderen Motoren) sind ungeachtet der Bandbreite der Flüchtigkeit dieser Eintragung zuzuordnen.",
    textEn: "Gasoline, motor spirit and petrol for use in spark-ignition engines (e.g. in automobiles, stationary engines and other engines) shall be assigned to this entry regardless of variations in volatility.",
    textFr: null,
  },
  'ICAO:A100': {
    textDe: null,
    textEn: "Gasoline, motor spirit and petrol for use in spark-ignition engines (e.g. in automobiles, stationary engines and other engines) must be assigned to this entry regardless of variations in volatility.",
    textFr: null,
  },
}

// ── Color helpers ─────────────────────────────────────────────

export const BK_CLASSES: Record<string, string> = {
  '0': 'bg-red-900 text-red-300',
  '1': 'bg-orange-900 text-orange-200',
  '2': 'bg-[#1e3a5f] text-blue-200',
  '3': 'bg-green-900 text-green-200',
  '4': 'bg-gray-700 text-gray-200',
}
