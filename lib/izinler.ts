// lib/izinler.ts
// Merkezi izin sistemi — middleware'e dokunmaz, sayfa içi kontrol için kullanılır

export type IzinKey =
  | 'firmalar' | 'koordinasyon' | 'saglik' | 'ziyaretler'
  | 'teklifler' | 'tahsilat' | 'arsiv' | 'taramalar'
  | 'hekim' | 'malzemeler' | 'tedarikciler' | 'raporlar'
  | 'fatura' | 'idari' | 'personeller' | 'site'

// Temel izin — çoğu modül için
export interface ModulIzin {
  goruntur: boolean
  duzenle: boolean
  // Arşiv gibi modüllere özel alanlar (opsiyonel)
  dosya_yukle?: boolean
  sil?: boolean
}

export type IzinMap = Partial<Record<IzinKey, ModulIzin>>

// Arşiv default izinleri rol bazlı
const ARSIV_ROL_DEFAULTS: Record<string, ModulIzin> = {
  yonetici:  { goruntur: true,  duzenle: true,  dosya_yukle: true,  sil: true },
  operasyon: { goruntur: true,  duzenle: true,  dosya_yukle: true,  sil: false },
  hekim:     { goruntur: false, duzenle: false, dosya_yukle: false, sil: false },
  satis:     { goruntur: false, duzenle: false, dosya_yukle: false, sil: false },
  muhasebe:  { goruntur: false, duzenle: false, dosya_yukle: false, sil: false },
  saha:      { goruntur: true,  duzenle: true,  dosya_yukle: true,  sil: false },
}

const ROL_DEFAULTS: Record<string, IzinMap> = {
  yonetici: {
    firmalar:    { goruntur: true,  duzenle: true },
    koordinasyon:{ goruntur: true,  duzenle: true },
    saglik:      { goruntur: true,  duzenle: true },
    ziyaretler:  { goruntur: true,  duzenle: true },
    teklifler:   { goruntur: true,  duzenle: true },
    tahsilat:    { goruntur: true,  duzenle: true },
    arsiv:       { goruntur: true,  duzenle: true,  dosya_yukle: true,  sil: true },
    taramalar:   { goruntur: true,  duzenle: true },
    hekim:       { goruntur: true,  duzenle: true },
    malzemeler:  { goruntur: true,  duzenle: true },
    tedarikciler:{ goruntur: true,  duzenle: true },
    raporlar:    { goruntur: true,  duzenle: true },
    fatura:      { goruntur: true,  duzenle: true },
    idari:       { goruntur: true,  duzenle: true },
    personeller: { goruntur: true,  duzenle: true },
    site:        { goruntur: true,  duzenle: true },
  },
  operasyon: {
    firmalar:    { goruntur: true,  duzenle: true },
    koordinasyon:{ goruntur: true,  duzenle: true },
    saglik:      { goruntur: true,  duzenle: true },
    ziyaretler:  { goruntur: true,  duzenle: true },
    arsiv:       { goruntur: true,  duzenle: true,  dosya_yukle: true,  sil: false },
    taramalar:   { goruntur: true,  duzenle: true },
    teklifler:   { goruntur: false, duzenle: false },
    tahsilat:    { goruntur: false, duzenle: false },
    hekim:       { goruntur: false, duzenle: false },
    malzemeler:  { goruntur: false, duzenle: false },
    tedarikciler:{ goruntur: false, duzenle: false },
    raporlar:    { goruntur: false, duzenle: false },
    fatura:      { goruntur: false, duzenle: false },
    idari:       { goruntur: false, duzenle: false },
    personeller: { goruntur: false, duzenle: false },
    site:        { goruntur: false, duzenle: false },
  },
  hekim: {
    firmalar:    { goruntur: false, duzenle: false },
    koordinasyon:{ goruntur: true,  duzenle: false },
    saglik:      { goruntur: true,  duzenle: true },
    ziyaretler:  { goruntur: false, duzenle: false },
    teklifler:   { goruntur: false, duzenle: false },
    tahsilat:    { goruntur: false, duzenle: false },
    arsiv:       { goruntur: false, duzenle: false, dosya_yukle: false, sil: false },
    taramalar:   { goruntur: false, duzenle: false },
    hekim:       { goruntur: true,  duzenle: true },
    malzemeler:  { goruntur: false, duzenle: false },
    tedarikciler:{ goruntur: false, duzenle: false },
    raporlar:    { goruntur: false, duzenle: false },
    fatura:      { goruntur: false, duzenle: false },
    idari:       { goruntur: false, duzenle: false },
    personeller: { goruntur: false, duzenle: false },
    site:        { goruntur: false, duzenle: false },
  },
  satis: {
    firmalar:    { goruntur: true,  duzenle: true },
    koordinasyon:{ goruntur: true,  duzenle: true },
    saglik:      { goruntur: true,  duzenle: true },
    ziyaretler:  { goruntur: true,  duzenle: true },
    teklifler:   { goruntur: true,  duzenle: true },
    tahsilat:    { goruntur: true,  duzenle: true },
    arsiv:       { goruntur: true,  duzenle: true,  dosya_yukle: true,  sil: false },
    taramalar:   { goruntur: true,  duzenle: true },
    hekim:       { goruntur: false, duzenle: false },
    malzemeler:  { goruntur: false, duzenle: false },
    tedarikciler:{ goruntur: false, duzenle: false },
    raporlar:    { goruntur: false, duzenle: false },
    fatura:      { goruntur: false, duzenle: false },
    idari:       { goruntur: false, duzenle: false },
    personeller: { goruntur: false, duzenle: false },
    site:        { goruntur: false, duzenle: false },
  },
  muhasebe: {
    firmalar:    { goruntur: true,  duzenle: true },
    koordinasyon:{ goruntur: true,  duzenle: true },
    saglik:      { goruntur: true,  duzenle: true },
    ziyaretler:  { goruntur: true,  duzenle: true },
    teklifler:   { goruntur: true,  duzenle: true },
    tahsilat:    { goruntur: true,  duzenle: true },
    arsiv:       { goruntur: true,  duzenle: true,  dosya_yukle: true,  sil: false },
    taramalar:   { goruntur: true,  duzenle: true },
    hekim:       { goruntur: false, duzenle: false },
    malzemeler:  { goruntur: false, duzenle: false },
    tedarikciler:{ goruntur: false, duzenle: false },
    raporlar:    { goruntur: false, duzenle: false },
    fatura:      { goruntur: false, duzenle: false },
    idari:       { goruntur: false, duzenle: false },
    personeller: { goruntur: false, duzenle: false },
    site:        { goruntur: false, duzenle: false },
  },
  saha: {
    firmalar:    { goruntur: false, duzenle: false },
    koordinasyon:{ goruntur: true,  duzenle: true },
    saglik:      { goruntur: false, duzenle: false },
    ziyaretler:  { goruntur: true,  duzenle: true },
    teklifler:   { goruntur: false, duzenle: false },
    tahsilat:    { goruntur: false, duzenle: false },
    arsiv:       { goruntur: true,  duzenle: true,  dosya_yukle: true,  sil: false },
    taramalar:   { goruntur: false, duzenle: false },
    hekim:       { goruntur: false, duzenle: false },
    malzemeler:  { goruntur: false, duzenle: false },
    tedarikciler:{ goruntur: false, duzenle: false },
    raporlar:    { goruntur: false, duzenle: false },
    fatura:      { goruntur: false, duzenle: false },
    idari:       { goruntur: false, duzenle: false },
    personeller: { goruntur: false, duzenle: false },
    site:        { goruntur: false, duzenle: false },
  },
}

export function getIzin(
  modul: IzinKey,
  rol: string,
  kisiselIzinler: IzinMap = {}
): ModulIzin {
  if (kisiselIzinler[modul] !== undefined) {
    return kisiselIzinler[modul]!
  }
  const defaults = ROL_DEFAULTS[rol] || ROL_DEFAULTS.operasyon
  return defaults[modul] || { goruntur: false, duzenle: false }
}

export function getRolDefaults(rol: string): IzinMap {
  return ROL_DEFAULTS[rol] || ROL_DEFAULTS.operasyon
}

// Modüle özel izin alanlarını döner (personel yetki modalı için)
export function getModulIzinAlanlari(modul: IzinKey): { key: keyof ModulIzin; label: string }[] {
  const temel: { key: keyof ModulIzin; label: string }[] = [
    { key: 'goruntur', label: 'Göster' },
    { key: 'duzenle',  label: 'Düzenle' },
  ]
  if (modul === 'arsiv') {
    return [
      ...temel,
      { key: 'dosya_yukle', label: 'Dosya Yükle' },
      { key: 'sil',         label: 'Sil' },
    ]
  }
  return temel
}

export const MODUL_LISTESI: { key: IzinKey; label: string }[] = [
  { key: 'firmalar',     label: 'Firmalar' },
  { key: 'koordinasyon', label: 'Görev Takibi' },
  { key: 'saglik',       label: 'Sağlık Raporu' },
  { key: 'ziyaretler',   label: 'ISG Ziyaretleri' },
  { key: 'teklifler',    label: 'Teklifler' },
  { key: 'tahsilat',     label: 'Tahsilat' },
  { key: 'arsiv',        label: 'Arşiv' },
  { key: 'taramalar',    label: 'Sağlık Taramaları' },
  { key: 'hekim',        label: 'Hekim Ekranı' },
  { key: 'malzemeler',   label: 'Malzemeler' },
  { key: 'tedarikciler', label: 'Tedarikçiler' },
  { key: 'raporlar',     label: 'Raporlar' },
  { key: 'fatura',       label: 'Fatura Takibi' },
  { key: 'idari',        label: 'İdari İşler' },
  { key: 'personeller',  label: 'Personel & Yetkiler' },
  { key: 'site',         label: 'Site Yönetimi' },
]
