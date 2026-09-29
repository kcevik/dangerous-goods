import { type Lang, LANGS } from '$lib/multimodal/types'

// ── Books ────────────────────────────────────────────────────

/**
 * Transport modes that have a book. The route is `/regelwerk/[mode]` so RID, IMDG
 * and ICAO books can slot in later (owner, 2026-09-29); only the ADR exists today.
 */
export const BOOK_MODES = ['adr'] as const
export type BookMode = typeof BOOK_MODES[number]

// ── Structure ────────────────────────────────────────────────

/** One markdown heading, with the ADR number it carries when it has one. */
export interface BookHeading {
  /** 1..6, matching `#`..`######` */
  level: number
  /** raw heading text, without the leading hashes */
  text: string
  /** '1.1.3.6' when the heading starts with an ADR number, else null */
  sectionNo: string | null
  /** stable anchor id, 'h-1-1-3-6' or 'h-<text-slug>', unique across the document */
  slug: string
  /** 1-based line in the source file */
  line: number
  /** enclosing headings, outermost first, e.g. ['Teil 3 …', 'Kapitel 3.3'] */
  path: string[]
}

export interface TocEntry {
  level: number
  text: string
  sectionNo: string | null
  slug: string
  line: number
}

// ── Occurrences ──────────────────────────────────────────────

/**
 * Why a number appears where it does. Drives ranking: a provision's own
 * definition is what the user wants, a mention in a date is not.
 */
export type HitRole =
  | 'definition'
  | 'tableARow'
  | 'tableASvCell'
  | 'tableB'
  | 'crossReference'
  | 'incidental'

/** Rank 1 is the best hit, 5 is noise that is hidden unless asked for. */
export type HitRank = 1 | 2 | 3 | 4 | 5

export const RANK_BY_ROLE: Record<HitRole, HitRank> = {
  definition: 1,
  tableARow: 1,
  tableB: 2,
  crossReference: 3,
  tableASvCell: 4,
  incidental: 5,
}

export interface BookHit {
  kind: 'sv' | 'un'
  /** '243', '640D', '1203' */
  code: string
  /** 1-based line in the source file */
  line: number
  rank: HitRank
  role: HitRole
  /** ≤ 180 characters around the match, for the hit list */
  context: string
  /** nearest enclosing heading, for grouping the hit list by chapter */
  heading: BookHeading | null
}

/** What the reader asked to see. */
export type BookTarget =
  | { kind: 'sv', code: string }
  | { kind: 'un', code: string }
  | { kind: 'section', sectionNo: string }
  | { kind: 'q', term: string }

// ── Rendered output ──────────────────────────────────────────

/** One rendered slice of the document. The viewer holds several, in line order. */
export interface RenderedWindow {
  /** sanitised HTML — safe for `{@html}`, see render.ts */
  html: string
  /** 1-based inclusive line range this window covers, after boundary snapping */
  lineStart: number
  lineEnd: number
  /** headings contained in this window, for the TOC's current-position marker */
  headings: TocEntry[]
}

export interface HitListResult {
  hits: BookHit[]
  /** total matches found, which may exceed `hits.length` */
  total: number
  /** true when `total` was cut down to the cap */
  capped: boolean
}

/**
 * Lines in a window fetched next to an already loaded one (`dir` on the window
 * endpoint). A hit closer than this to a loaded edge is reached by an adjacent
 * fetch rather than a centred one, because the slicer snaps outward and a centred
 * window next to a loaded one would render the same text twice.
 */
export const ADJACENT_WINDOW_LINES = 300

/** What `/regelwerk/[mode]` loads. A locked account gets the marker and nothing else. */
export type BookPageData =
  | { locked: true, mode: BookMode }
  | {
    locked: false
    mode: BookMode
    target: BookTarget | null
    /** prefilled find-bar text */
    term: string
    hits: BookHit[]
    totalHits: number
    capped: boolean
    currentIndex: number
    includeIncidental: boolean
    windows: RenderedWindow[]
    toc: TocEntry[]
    totalLines: number
    /** line to scroll to on arrival (the active hit, or a section heading) */
    focusLine: number | null
    /** the code the reader asked for when nothing in the text matched it */
    notFound: string | null
    /**
     * The lettered provision the reader asked for (640D) when it has no paragraph of
     * its own; `target` then names the parent (640), so hits and marks agree.
     */
    fallbackFrom: string | null
  }


/** Hit-list cap. Above this the UI asks the reader to narrow the search. */
export const HIT_LIMIT = 500

/** Special provision codes as the ADR writes them: 163, 640, 640D. */
export const SV_CODE_RE = /^\d{2,3}[A-Z]?$/

/** UN numbers: exactly four digits. */
export const UN_NUMBER_RE = /^\d{4}$/

/** Shortest search term accepted, matching the substance search. */
export const MIN_BOOK_QUERY_LENGTH = 2

/** Longest search term accepted, so a pathological query cannot scan repeatedly. */
export const MAX_BOOK_QUERY_LENGTH = 120

// ── Chrome copy (the book text itself is German only) ────────

export const BOOK_LABELS: Record<Lang, Record<string, string>> = {
  de: {
    bookTitle: 'ADR 2025 – konsolidierter Text',
    findPlaceholder: 'Im ADR-Text suchen…',
    prevHit: 'Vorheriger Treffer',
    nextHit: 'Nächster Treffer',
    noHits: 'Keine Treffer',
    hitCounter: 'Treffer {current} von {total}',
    cappedNote: 'Mehr als {limit} Treffer – bitte Suchbegriff einschränken oder die Trefferliste nach Kapitel verwenden.',
    includeIncidental: 'Auch beiläufige Treffer',
    hitList: 'Trefferliste',
    toc: 'Inhaltsverzeichnis',
    cappedTotal: '{shown}+ ({total} Treffer)',
    noChapter: 'Ohne Kapitel',
    wrapped: 'Am Ende fortgesetzt',
    loadGap: 'Übersprungenen Abschnitt laden',
    tooManySections: 'Viele Abschnitte geladen – Ansicht zurücksetzen?',
    resetView: 'Ansicht zurücksetzen',
    lockedNotice: 'Der ADR-Volltext ist nach der Freischaltung verfügbar.',
    openInBook: 'Im ADR-Text öffnen',
    openSvInBook: 'Sondervorschrift {code} im ADR-Text öffnen',
    openUnInBook: 'UN {code} im ADR-Text öffnen',
    notBinding: 'Kein rechtsverbindlicher Text. Maßgeblich ist die amtliche Fassung.',
    sectionNotFound: 'Zu {code} wurde keine Stelle im ADR-Text gefunden.',
    germanOnly: 'Der ADR-Text liegt nur auf Deutsch vor.',
    skipToContent: 'Zum Inhalt springen',
    loading: 'Wird geladen…',
    wideTable: 'Tabelle, horizontal scrollbar',
    chipSv: 'Sondervorschrift {code}',
    chipUn: 'UN-Nummer {code}',
    chipSection: 'Abschnitt {code}',
    parentFallback: '{code} hat keinen eigenen Absatz – angezeigt wird Sondervorschrift {parent}.',
    loadPrevious: 'Vorherigen Abschnitt laden',
    loadNext: 'Weiterlesen',
    findLabel: 'Suchbegriff',
    loadFailed: 'Der Abschnitt konnte nicht geladen werden. Bitte erneut versuchen.',
    attributionSource: 'Quelle: amtlicher Text des ADR 2025 (genaue Fundstelle wird ergänzt). Maschinell nach HTML konvertiert; die Gliederung wurde für die Anzeige in Abschnitte zerlegt.',
    attributionBam: 'Stoffdaten separat: BAM GEFAHRGUT, Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0).',
  },
  en: {
    bookTitle: 'ADR 2025 – consolidated text',
    findPlaceholder: 'Search the ADR text…',
    prevHit: 'Previous match',
    nextHit: 'Next match',
    noHits: 'No matches',
    hitCounter: 'Match {current} of {total}',
    cappedNote: 'More than {limit} matches – narrow the search term or use the chapter list.',
    includeIncidental: 'Include incidental matches',
    hitList: 'Matches',
    toc: 'Table of contents',
    cappedTotal: '{shown}+ ({total} matches)',
    noChapter: 'No chapter',
    wrapped: 'Continued from the end',
    loadGap: 'Load the skipped section',
    tooManySections: 'Many sections loaded – reset the view?',
    resetView: 'Reset view',
    lockedNotice: 'The full ADR text becomes available once your account is activated.',
    openInBook: 'Open in the ADR text',
    openSvInBook: 'Open special provision {code} in the ADR text',
    openUnInBook: 'Open UN {code} in the ADR text',
    notBinding: 'Not legally binding. The official version prevails.',
    sectionNotFound: 'No place in the ADR text was found for {code}.',
    germanOnly: 'The ADR text is available in German only.',
    skipToContent: 'Skip to content',
    loading: 'Loading…',
    wideTable: 'Table, scrolls horizontally',
    chipSv: 'Special provision {code}',
    chipUn: 'UN number {code}',
    chipSection: 'Section {code}',
    parentFallback: '{code} has no paragraph of its own – showing special provision {parent}.',
    loadPrevious: 'Load previous section',
    loadNext: 'Continue reading',
    findLabel: 'Search term',
    loadFailed: 'The section could not be loaded. Please try again.',
    attributionSource: 'Source: official text of ADR 2025 (exact reference to follow). Machine-converted to HTML; split into sections for display.',
    attributionBam: 'Substance data separately: BAM GEFAHRGUT, Data licence Germany – attribution – version 2.0 (dl-de/by-2-0).',
  },
  fr: {
    bookTitle: 'ADR 2025 – texte consolidé',
    findPlaceholder: 'Rechercher dans le texte ADR…',
    prevHit: 'Occurrence précédente',
    nextHit: 'Occurrence suivante',
    noHits: 'Aucune occurrence',
    hitCounter: 'Occurrence {current} sur {total}',
    cappedNote: 'Plus de {limit} occurrences – précisez le terme ou utilisez la liste par chapitre.',
    includeIncidental: 'Inclure les occurrences accessoires',
    hitList: 'Occurrences',
    toc: 'Table des matières',
    cappedTotal: '{shown}+ ({total} occurrences)',
    noChapter: 'Sans chapitre',
    wrapped: 'Reprise depuis la fin',
    loadGap: 'Charger la section omise',
    tooManySections: 'Nombreuses sections chargées – réinitialiser la vue ?',
    resetView: 'Réinitialiser la vue',
    lockedNotice: 'Le texte intégral de l’ADR sera disponible après activation du compte.',
    openInBook: 'Ouvrir dans le texte ADR',
    openSvInBook: 'Ouvrir la disposition spéciale {code} dans le texte ADR',
    openUnInBook: 'Ouvrir ONU {code} dans le texte ADR',
    notBinding: 'Texte sans valeur juridique. Seule la version officielle fait foi.',
    sectionNotFound: 'Aucun passage du texte ADR n’a été trouvé pour {code}.',
    germanOnly: 'Le texte de l’ADR n’est disponible qu’en allemand.',
    skipToContent: 'Aller au contenu',
    loading: 'Chargement…',
    wideTable: 'Tableau, défilement horizontal',
    chipSv: 'Disposition spéciale {code}',
    chipUn: 'Numéro ONU {code}',
    chipSection: 'Section {code}',
    parentFallback: '{code} n’a pas de paragraphe propre – affichage de la disposition spéciale {parent}.',
    loadPrevious: 'Charger la section précédente',
    loadNext: 'Continuer la lecture',
    findLabel: 'Terme recherché',
    loadFailed: 'La section n’a pas pu être chargée. Veuillez réessayer.',
    attributionSource: 'Source : texte officiel de l’ADR 2025 (référence exacte à compléter). Converti automatiquement en HTML ; découpé en sections pour l’affichage.',
    attributionBam: 'Données sur les matières séparément : BAM GEFAHRGUT, licence de données Allemagne – attribution – version 2.0 (dl-de/by-2-0).',
  },
  tr: {
    bookTitle: 'ADR 2025 – konsolide metin',
    findPlaceholder: 'ADR metninde ara…',
    prevHit: 'Önceki sonuç',
    nextHit: 'Sonraki sonuç',
    noHits: 'Sonuç yok',
    hitCounter: '{total} sonuçtan {current}.',
    cappedNote: '{limit} sonuçtan fazla – arama terimini daraltın veya bölüm listesini kullanın.',
    includeIncidental: 'İkincil sonuçları da göster',
    hitList: 'Sonuç listesi',
    toc: 'İçindekiler',
    cappedTotal: '{shown}+ ({total} sonuç)',
    noChapter: 'Bölümsüz',
    wrapped: 'Sondan devam edildi',
    loadGap: 'Atlanan bölümü yükle',
    tooManySections: 'Çok sayıda bölüm yüklendi – görünüm sıfırlansın mı?',
    resetView: 'Görünümü sıfırla',
    lockedNotice: 'ADR tam metni hesabınız etkinleştirildikten sonra kullanılabilir.',
    openInBook: 'ADR metninde aç',
    openSvInBook: 'Özel hüküm {code} ADR metninde aç',
    openUnInBook: 'UN {code} ADR metninde aç',
    notBinding: 'Hukuken bağlayıcı değildir. Resmî sürüm geçerlidir.',
    sectionNotFound: '{code} için ADR metninde bir yer bulunamadı.',
    germanOnly: 'ADR metni yalnızca Almanca mevcuttur.',
    skipToContent: 'İçeriğe geç',
    loading: 'Yükleniyor…',
    wideTable: 'Tablo, yatay kaydırılabilir',
    chipSv: 'Özel hüküm {code}',
    chipUn: 'UN numarası {code}',
    chipSection: 'Bölüm {code}',
    parentFallback: '{code} için ayrı bir paragraf yok – özel hüküm {parent} gösteriliyor.',
    loadPrevious: 'Önceki bölümü yükle',
    loadNext: 'Okumaya devam et',
    findLabel: 'Arama terimi',
    loadFailed: 'Bölüm yüklenemedi. Lütfen tekrar deneyin.',
    attributionSource: 'Kaynak: ADR 2025 resmî metni (tam künye eklenecek). Otomatik olarak HTML’e dönüştürülmüş; görüntüleme için bölümlere ayrılmıştır.',
    attributionBam: 'Madde verileri ayrıca: BAM GEFAHRGUT, Almanya Veri Lisansı – Atıf – Sürüm 2.0 (dl-de/by-2-0).',
  },
}

/** Mirrors `getL` in multimodal/types.ts: requested language, then German, then the key. */
export function getBookLabel(lang: Lang, key: string): string {
  return BOOK_LABELS[lang]?.[key] ?? BOOK_LABELS.de[key] ?? key
}

/** Fills `{name}` placeholders, so copy stays in the label table rather than in markup. */
export function formatBookLabel(lang: Lang, key: string, values: Record<string, string | number>): string {
  return getBookLabel(lang, key).replace(/\{(\w+)\}/g, (whole, name) =>
    name in values ? String(values[name]) : whole)
}

export { type Lang, LANGS }
