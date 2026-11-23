/**
 * IMDG EmS codes. The IMDG Code underlines some EmS numbers in the Dangerous Goods List; BAM cannot
 * deliver underlining and appends "!" instead ("Tabellenbeschreibung IMDG", note 4: the substance has
 * additional advice in the EmS Guide). We show the code underlined, as the IMDG Code prints it.
 */
export interface EmsCode {
  code: string
  underlined: boolean
}

export function parseEms(raw: string): EmsCode {
  const text = raw.trim()
  return text.endsWith('!') ? { code: text.slice(0, -1).trimEnd(), underlined: true } : { code: text, underlined: false }
}
