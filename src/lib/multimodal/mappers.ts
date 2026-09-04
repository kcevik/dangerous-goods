import type { SupabaseClient } from '@supabase/supabase-js'
import type { Entry, Modal } from './types'

function joinArr(arr: unknown): string | undefined {
  if (!Array.isArray(arr) || arr.length === 0) return undefined
  return arr.filter(Boolean).join(', ')
}

function str(v: unknown): string | undefined {
  if (v == null || v === '') return undefined
  return String(v)
}

type RawAdr = Record<string, unknown>
type RawRid = Record<string, unknown>
type RawImdg = Record<string, unknown>
type RawIcao = Record<string, unknown>

function mapAdr(r: RawAdr): Entry {
  return {
    unNumber: String(r.un_number),
    sequenceNumber: Number(r.sequence_number),
    name: str(r.name),
    nameEn: str(r.name_en),
    nameFr: str(r.name_fr),
    specification: str(r.specification),
    specificationEn: str(r.specification_en),
    specificationFr: str(r.specification_fr),
    hazardClass: str(r.hazard_class),
    classificationCode: str(r.classification_code),
    packingGroup: str(r.packing_group),
    hazardLabels: joinArr(r.hazard_labels),
    exceptedQty: str(r.excepted_qty),
    limitedQty: str(r.limited_qty),
    transportCategory: str(r.transport_category),
    multiplier: str(r.multiplier),
    kemlerNumber: str(r.kemler_number),
    tunnelCode: str(r.tunnel_code),
    packingInstructions: joinArr(r.packing_instructions),
    remark: str(r.remark),
    specialProvisions: joinArr(r.special_provision_codes),
  }
}

function mapRid(r: RawRid): Entry {
  return {
    unNumber: String(r.un_number),
    sequenceNumber: Number(r.sequence_number),
    name: str(r.name),
    nameEn: str(r.name_en),
    nameFr: str(r.name_fr),
    specification: str(r.specification),
    specificationEn: str(r.specification_en),
    specificationFr: str(r.specification_fr),
    hazardClass: str(r.hazard_class),
    classificationCode: str(r.classification_code),
    packingGroup: str(r.packing_group),
    hazardLabels: joinArr(r.hazard_labels),
    exceptedQty: str(r.excepted_qty),
    limitedQty: str(r.limited_qty),
    transportCategory: str(r.transport_category),
    multiplier: str(r.multiplier),
    packingInstructions: joinArr(r.packing_instructions),
    remark: str(r.remark),
    specialProvisions: joinArr(r.special_provision_codes),
  }
}

function mapImdg(r: RawImdg): Entry {
  return {
    unNumber: String(r.un_number),
    sequenceNumber: Number(r.sequence_number),
    name: str(r.name),
    nameEn: str(r.name_en),
    specification: str(r.specification),
    specificationEn: str(r.specification_en),
    hazardClass: str(r.hazard_class),
    packingGroup: str(r.packing_group),
    hazardLabels: joinArr(r.subsidiary_risks) ?? str(r.hazard_class),
    exceptedQty: str(r.excepted_qty),
    limitedQty: str(r.limited_qty),
    packingInstructions: joinArr(r.packing_instructions),
    ems1: str(r.ems_fire),
    ems2: str(r.ems_spill),
    stowageCategory: str(r.stowage_category),
    stowage: joinArr(r.stowage_codes),
    segregation: joinArr(r.segregation_codes),
    marpol: str(r.marpol),
    remark: str(r.remark),
    specialProvisions: joinArr(r.special_provision_codes),
  }
}

function mapIcao(r: RawIcao): Entry {
  return {
    unNumber: String(r.un_number),
    sequenceNumber: Number(r.sequence_number),
    name: str(r.name),
    specification: str(r.specification),
    hazardClass: str(r.hazard_class),
    packingGroup: str(r.packing_group),
    hazardLabels: joinArr(r.hazard_labels),
    exceptedQty: str(r.excepted_qty),
    packingInstrPassenger: str(r.packing_instr_passenger),
    packingInstrCargo: str(r.packing_instr_cargo),
    maxNetPassenger: str(r.max_net_passenger),
    maxNetCargo: str(r.max_net_cargo),
    remark: str(r.remark),
    specialProvisions: joinArr(r.special_provision_codes),
  }
}

export async function fetchCompareForUn(
  supabase: SupabaseClient,
  unNumber: string,
): Promise<Record<Modal, Entry[]>> {
  const cleaned = unNumber.trim()
  if (!cleaned) return { ADR: [], RID: [], IMDG: [], ICAO: [], ADN: [] }

  const [adr, rid, imdg, icao] = await Promise.all([
    supabase.from('adr_entries').select('*').eq('un_number', cleaned).order('sequence_number'),
    supabase.from('rid_entries').select('*').eq('un_number', cleaned).order('sequence_number'),
    supabase.from('imdg_entries').select('*').eq('un_number', cleaned).order('sequence_number'),
    supabase.from('icao_entries').select('*').eq('un_number', cleaned).order('sequence_number'),
  ])

  for (const res of [adr, rid, imdg, icao]) {
    if (res.error) throw res.error
  }

  return {
    ADR: (adr.data ?? []).map(mapAdr),
    RID: (rid.data ?? []).map(mapRid),
    IMDG: (imdg.data ?? []).map(mapImdg),
    ICAO: (icao.data ?? []).map(mapIcao),
    ADN: [],
  }
}
