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
    ems: 'EmS', stowageCat: 'Staukategorie', stowage: 'Stauung', segregation: 'Trennung',
    marpol: 'MARPOL', packingInstr: 'Verpackungsanweisungen',
    piPassenger: 'PI Passagier', piCargo: 'PI Fracht',
    cones: 'Kegel/Lichter', equipment: 'Ausrüstung', remark: 'Bemerkung',
    specialProvisions: 'Sondervorschriften', availability: 'Verfügbarkeit in allen Modi',
    noText: 'Kein Text verfügbar', notFound: 'nicht vorhanden',
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
    ems: 'EmS', stowageCat: 'Stowage cat.', stowage: 'Stowage', segregation: 'Segregation',
    marpol: 'MARPOL', packingInstr: 'Packing instructions',
    piPassenger: 'PI Passenger', piCargo: 'PI Cargo',
    cones: 'Cones/lights', equipment: 'Equipment', remark: 'Remark',
    specialProvisions: 'Special provisions', availability: 'Availability in all modes',
    noText: 'No text available', notFound: 'not available',
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
    ems: 'EmS', stowageCat: "Catégorie d'arrimage", stowage: 'Arrimage', segregation: 'Séparation',
    marpol: 'MARPOL', packingInstr: "Instructions d'emballage",
    piPassenger: 'PI Passagers', piCargo: 'PI Cargo',
    cones: 'Cônes/feux', equipment: 'Équipement', remark: 'Remarque',
    specialProvisions: 'Dispositions spéciales', availability: 'Disponibilité dans tous les modes',
    noText: 'Texte non disponible', notFound: 'non disponible',
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
    ems: 'EmS', stowageCat: 'İstif kategorisi', stowage: 'İstif', segregation: 'Ayrıştırma',
    marpol: 'MARPOL', packingInstr: 'Ambalaj talimatları',
    piPassenger: 'Yolcu talimatı', piCargo: 'Kargo talimatı',
    cones: 'Koni/ışıklar', equipment: 'Ekipman', remark: 'Not',
    specialProvisions: 'Özel hükümler', availability: 'Tüm taşıma modlarındaki durum',
    noText: 'Metin mevcut değil', notFound: 'mevcut değil',
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

// ── Demo data (UN 1203 · Benzin/Gasoline) ───────────────────

export const DEMO_DATA: Record<string, Entry[]> = {
  ADR: [{
    unNumber: '1203', sequenceNumber: 1,
    name: 'BENZIN', nameEn: 'PETROL', nameFr: 'ESSENCE',
    specification: 'oder KRAFTSTOFF FÜR MOTOREN, BENZIN',
    specificationEn: 'or MOTOR SPIRIT or GASOLINE',
    specificationFr: 'ou ESSENCE POUR MOTEURS',
    hazardClass: '3', classificationCode: 'F1', packingGroup: 'II',
    hazardLabels: '3', exceptedQty: 'E2', limitedQty: '1 L',
    transportCategory: '2', multiplier: '1000',
    kemlerNumber: '33', tunnelCode: 'D/E',
    packingInstructions: 'P001, IBC02',
    specialProvisions: '163, 243, 274, 601, 640D',
  }],
  RID: [{
    unNumber: '1203', sequenceNumber: 1,
    name: 'BENZIN', nameEn: 'PETROL', nameFr: 'ESSENCE',
    specification: 'oder KRAFTSTOFF FÜR MOTOREN, BENZIN',
    specificationEn: 'or MOTOR SPIRIT or GASOLINE',
    hazardClass: '3', classificationCode: 'F1', packingGroup: 'II',
    hazardLabels: '3', exceptedQty: 'E2', limitedQty: '1 L',
    transportCategory: '2', multiplier: '1000',
    packingInstructions: 'P001, IBC02',
    specialProvisions: '163, 274, 601',
  }],
  IMDG: [{
    unNumber: '1203', sequenceNumber: 1,
    name: 'GASOLINE', nameEn: 'GASOLINE', nameFr: 'ESSENCE',
    specificationEn: 'or PETROL or MOTOR SPIRIT',
    hazardClass: '3', packingGroup: 'II',
    hazardLabels: '3', exceptedQty: 'E2', limitedQty: '1 L',
    ems1: 'F-E', ems2: 'S-E',
    stowageCategory: 'B', stowage: 'SW2', segregation: 'SG35',
    marpol: '–',
    specialProvisions: '163, 223, 955',
  }],
  ICAO: [{
    unNumber: '1203', sequenceNumber: 1,
    name: 'Gasoline',
    hazardClass: '3', packingGroup: 'II',
    hazardLabels: '3', exceptedQty: 'E2',
    packingInstrPassenger: '353', packingInstrCargo: '364',
    maxNetCargo: '60 L',
    specialProvisions: '',
  }],
  ADN: [{
    unNumber: '1203', sequenceNumber: 1,
    name: 'BENZIN', nameEn: 'PETROL', nameFr: 'ESSENCE',
    specification: 'oder KRAFTSTOFF FÜR MOTOREN',
    hazardClass: '3', classificationCode: 'F1', packingGroup: 'II',
    hazardLabels: '3', exceptedQty: 'E2', limitedQty: '1 L',
    cones: '1',
    specialProvisions: '163, 274',
  }],
}

export const DEMO_SVS: Record<string, string> = {
  '163': 'Wenn dieses Gut befördert wird und im Falle eines Unfalls Feuer entsteht, darf das Feuer im Allgemeinen nicht mit Wasser gelöscht werden. Wasser kann dazu benutzt werden, benachbarte Güter zu kühlen. Wasser kann in Form von Sprühwasser oder Sprühnebel angewendet werden, um Dämpfe einzuengen oder zu zerstreuen.',
  '243': 'Kanister aus Kunststoff (4H2) sind ebenfalls zugelassen.',
  '274': 'Die Benennung des Gutes muss ergänzt werden durch den technischen Namen des Erzeugnisses (vgl. 3.1.2.8.1 und 3.1.2.8.1.1).',
  '601': 'Kraftstoffe für Motoren, die Benzin oder Benzin-Blends enthalten, dürfen befördert werden, sofern der Flammpunkt nicht über 60 °C liegt.',
  '640D': 'Die großen Aufschriften müssen nicht auf Teilen der Verpackung angebracht werden, die normalerweise nicht sichtbar sind.',
  '223': 'Dieses Gut darf in IBCs des Typs 31A, 31B und 31N befördert werden.',
  '955': 'Zugelassen als Tankcontainer der Typen T1–T22.',
}

// ── Color helpers ─────────────────────────────────────────────

export const BK_CLASSES: Record<string, string> = {
  '0': 'bg-red-900 text-red-300',
  '1': 'bg-orange-900 text-orange-200',
  '2': 'bg-[#1e3a5f] text-blue-200',
  '3': 'bg-green-900 text-green-200',
  '4': 'bg-gray-700 text-gray-200',
}
