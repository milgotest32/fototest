'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Globe, Settings, Layers, Users, Award, FileText, MessageSquare, ArrowRight, Plus, Trash2, Pencil, X, Check, Upload, Image, ChevronUp, ChevronDown, Eye, EyeOff, Shield } from 'lucide-react'

const sb = createClient()

const SEKMELER = [
  { id: 'slider', label: 'Hero Slider', icon: Image },
  { id: 'ayarlar', label: 'Genel Ayarlar', icon: Settings },
  { id: 'hizmetler', label: 'Hizmetler', icon: Layers },
  { id: 'egitimler', label: 'Eğitimler', icon: Award },
  { id: 'ekip', label: 'Ekip', icon: Users },
  { id: 'referanslar', label: 'Referanslar', icon: Globe },
  { id: 'yazilar', label: 'Yazılar', icon: FileText },
  { id: 'talepler', label: 'Teklif Talepleri', icon: MessageSquare },
  { id: 'tehlike', label: 'Tehlike Sınıfları', icon: Shield },
]

// Resim yükleme yardımcı fonksiyon
async function resimYukle(file: File, klasor: string): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const path = `${klasor}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await sb.storage.from('site-assets').upload(path, file, { upsert: true })
  if (error) { alert('Yükleme hatası: ' + error.message); return null }
  const { data } = sb.storage.from('site-assets').getPublicUrl(path)
  return data.publicUrl
}

// Resim yükleme butonu component
function ResimYukleButon({ mevcut, onUpload, label = 'Resim Seç', klasor = 'genel' }: {
  mevcut?: string; onUpload: (url: string) => void; label?: string; klasor?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setYukleniyor(true)
    const url = await resimYukle(file, klasor)
    if (url) onUpload(url)
    setYukleniyor(false)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mevcut && (
        <div style={{ position: 'relative', width: '100%', maxWidth: 200 }}>
          <img src={mevcut} alt="Önizleme" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handle} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={yukleniyor}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px dashed var(--border)', background: 'var(--surface-2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', width: 'fit-content' }}>
        <Upload size={13} /> {yukleniyor ? 'Yükleniyor...' : label}
      </button>
    </div>
  )
}

export default function SiteYonetim() {
  const [sekme, setSekme] = useState('slider')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [basari, setBasari] = useState('')

  // Slider
  const [sliderler, setSliderler] = useState<any[]>([])
  const [sliderModal, setSliderModal] = useState<any>(null)
  const [sliderForm, setSliderForm] = useState({ baslik: '', altyazi: '', resim_url: '', buton_yazi: '', buton_link: '', sira: 0, aktif: true })

  // Ayarlar
  const [ayarlar, setAyarlar] = useState<Record<string, string>>({})

  // Hizmetler
  const [hizmetler, setHizmetler] = useState<any[]>([])
  const [hizmetModal, setHizmetModal] = useState<any>(null)
  const [hizmetForm, setHizmetForm] = useState({ baslik: '', aciklama: '', detay: '', ikon: '', etiketler: '', resim_url: '', sira: 0, aktif: true })

  // Eğitimler
  const [egitimler, setEgitimler] = useState<any[]>([])
  const [egitimModal, setEgitimModal] = useState<any>(null)
  const [egitimForm, setEgitimForm] = useState({ baslik: '', aciklama: '', sure: '', resim_url: '', sertifika: false, sira: 0, aktif: true })

  // Ekip
  const [ekip, setEkip] = useState<any[]>([])
  const [ekipModal, setEkipModal] = useState<any>(null)
  const [ekipForm, setEkipForm] = useState({ ad_soyad: '', unvan: '', uzmanlik: '', foto_url: '', sira: 0, aktif: true })

  // Referanslar
  const [referanslar, setReferanslar] = useState<any[]>([])
  const [refModal, setRefModal] = useState<any>(null)
  const [refForm, setRefForm] = useState({ firma_adi: '', logo_url: '', sektor: '', sira: 0, aktif: true })

  // Yazılar
  const [yazilar, setYazilar] = useState<any[]>([])
  const [yaziModal, setYaziModal] = useState<any>(null)
  const [yaziForm, setYaziForm] = useState({ baslik: '', ozet: '', icerik: '', foto_url: '', yazar: '', slug: '', yayinda: false })

  // Talepler
  const [talepler, setTalepler] = useState<any[]>([])

  // Tehlike Sınıfları
  const [tehlikeler, setTehlikeler] = useState<any[]>([])
  const [tehlikeArama, setTehlikeArama] = useState('')
  const [tehlikeFiltre, setTehlikeFiltre] = useState('Tümü')
  const [tehlikeModal, setTehlikeModal] = useState<any>(null)
  const [tehlikeForm, setTehlikeForm] = useState({ kod: '', tanim: '', sinif: 'Tehlikeli' })
  const [excelYukleniyor, setExcelYukleniyor] = useState(false)


  useEffect(() => { yukle() }, [sekme])

  async function yukle() {
    setYukleniyor(true)
    setBasari('')
    try {
      if (sekme === 'slider') {
        const { data } = await sb.from('site_slider').select('*').order('sira')
        setSliderler(data || [])
      } else if (sekme === 'ayarlar') {
        const { data } = await sb.from('site_ayarlar').select('*')
        const a: Record<string, string> = {};
        (data || []).forEach((r: any) => { a[r.anahtar] = r.deger })
        setAyarlar(a)
      } else if (sekme === 'hizmetler') {
        const { data } = await sb.from('site_hizmetler').select('*').order('sira')
        setHizmetler(data || [])
      } else if (sekme === 'egitimler') {
        const { data } = await sb.from('site_egitimler').select('*').order('sira')
        setEgitimler(data || [])
      } else if (sekme === 'ekip') {
        const { data } = await sb.from('site_ekip').select('*').order('sira')
        setEkip(data || [])
      } else if (sekme === 'referanslar') {
        const { data } = await sb.from('site_referanslar').select('*').order('sira')
        setReferanslar(data || [])
      } else if (sekme === 'yazilar') {
        const { data } = await sb.from('site_yazilar').select('*').order('olusturuldu_at', { ascending: false })
        setYazilar(data || [])
      } else if (sekme === 'talepler') {
        const { data } = await sb.from('site_teklif_talepleri').select('*').order('olusturuldu_at', { ascending: false })
        setTalepler(data || [])
      } else if (sekme === 'tehlike') {
        const { data } = await sb.from('tehlike_siniflari').select('*').order('kod')
        setTehlikeler(data || [])
      }
    } catch (e) { console.error(e) }
    setYukleniyor(false)
  }

  function goster(msg: string) { setBasari(msg); setTimeout(() => setBasari(''), 2500) }

  // SLIDER
  async function sliderKaydet() {
    if (!sliderForm.resim_url) { alert('Resim zorunludur'); return }
    if (sliderModal?.id) {
      await sb.from('site_slider').update(sliderForm).eq('id', sliderModal.id)
    } else {
      await sb.from('site_slider').insert({ ...sliderForm, sira: sliderler.length })
    }
    setSliderModal(null)
    yukle()
    goster('Slider kaydedildi')
  }
  async function sliderSil(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await sb.from('site_slider').delete().eq('id', id)
    yukle()
  }
  async function sliderToggle(item: any) {
    await sb.from('site_slider').update({ aktif: !item.aktif }).eq('id', item.id)
    yukle()
  }

  // AYARLAR
  async function ayarKaydet() {
    setYukleniyor(true)
    for (const [anahtar, deger] of Object.entries(ayarlar)) {
      await sb.from('site_ayarlar').upsert({ anahtar, deger }, { onConflict: 'anahtar' })
    }
    setYukleniyor(false)
    goster('Ayarlar kaydedildi')
  }

  // HİZMETLER
  async function hizmetKaydet() {
    if (!hizmetForm.baslik) { alert('Başlık zorunludur'); return }
    if (hizmetModal?.id) {
      await sb.from('site_hizmetler').update(hizmetForm).eq('id', hizmetModal.id)
    } else {
      await sb.from('site_hizmetler').insert({ ...hizmetForm, sira: hizmetler.length })
    }
    setHizmetModal(null)
    yukle()
    goster('Hizmet kaydedildi')
  }
  async function hizmetSil(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await sb.from('site_hizmetler').delete().eq('id', id)
    yukle()
  }
  async function hizmetToggle(item: any) {
    await sb.from('site_hizmetler').update({ aktif: !item.aktif }).eq('id', item.id)
    yukle()
  }

  // EĞİTİMLER
  async function egitimKaydet() {
    if (!egitimForm.baslik) { alert('Başlık zorunludur'); return }
    if (egitimModal?.id) {
      await sb.from('site_egitimler').update(egitimForm).eq('id', egitimModal.id)
    } else {
      await sb.from('site_egitimler').insert({ ...egitimForm, sira: egitimler.length })
    }
    setEgitimModal(null)
    yukle()
    goster('Eğitim kaydedildi')
  }
  async function egitimSil(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await sb.from('site_egitimler').delete().eq('id', id)
    yukle()
  }

  // EKİP
  async function ekipKaydet() {
    if (!ekipForm.ad_soyad) { alert('Ad Soyad zorunludur'); return }
    if (ekipModal?.id) {
      await sb.from('site_ekip').update(ekipForm).eq('id', ekipModal.id)
    } else {
      await sb.from('site_ekip').insert({ ...ekipForm, sira: ekip.length })
    }
    setEkipModal(null)
    yukle()
    goster('Ekip üyesi kaydedildi')
  }
  async function ekipSil(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await sb.from('site_ekip').delete().eq('id', id)
    yukle()
  }

  // REFERANSLAR
  async function refKaydet() {
    if (!refForm.firma_adi) { alert('Firma adı zorunludur'); return }
    if (refModal?.id) {
      await sb.from('site_referanslar').update(refForm).eq('id', refModal.id)
    } else {
      await sb.from('site_referanslar').insert({ ...refForm, sira: referanslar.length })
    }
    setRefModal(null)
    yukle()
    goster('Referans kaydedildi')
  }
  async function refSil(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await sb.from('site_referanslar').delete().eq('id', id)
    yukle()
  }

  // YAZILAR
  function slugOlustur(baslik: string) {
    return baslik.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  async function yaziKaydet() {
    if (!yaziForm.baslik) { alert('Başlık zorunludur'); return }
    const form = { ...yaziForm, slug: yaziForm.slug || slugOlustur(yaziForm.baslik) }
    if (yaziModal?.id) {
      await sb.from('site_yazilar').update(form).eq('id', yaziModal.id)
    } else {
      await sb.from('site_yazilar').insert({ ...form, yayinlandi_at: new Date().toISOString() })
    }
    setYaziModal(null)
    yukle()
    goster('Yazı kaydedildi')
  }
  async function yaziSil(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await sb.from('site_yazilar').delete().eq('id', id)
    yukle()
  }
  async function yaziToggle(item: any) {
    await sb.from('site_yazilar').update({ yayinda: !item.yayinda }).eq('id', item.id)
    yukle()
  }

  // TEHLİKE SINIFLARI
  async function tehlikeKaydet() {
    if (!tehlikeForm.kod || !tehlikeForm.tanim) { alert('Kod ve tanım zorunludur'); return }
    if (tehlikeModal?.id) {
      await sb.from('tehlike_siniflari').update(tehlikeForm).eq('id', tehlikeModal.id)
    } else {
      await sb.from('tehlike_siniflari').insert(tehlikeForm)
    }
    setTehlikeModal(null)
    yukle()
    goster('Kaydedildi')
  }
  async function tehlikeSil(id: number) {
    if (!confirm('Silinsin mi?')) return
    await sb.from('tehlike_siniflari').delete().eq('id', id)
    yukle()
  }
  async function excelYukle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setExcelYukleniyor(true)
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 })
      const kayitlar: any[] = []
      for (const row of raw) {
        const kod = String(row[0] || '').trim()
        const tanim = String(row[1] || '').trim()
        const sinif = String(row[2] || '').trim()
        if (kod.includes('.') && tanim && ['Az Tehlikeli','Tehlikeli','Çok Tehlikeli'].includes(sinif)) {
          kayitlar.push({ kod, tanim, sinif })
        }
      }
      if (kayitlar.length === 0) { alert('Geçerli kayıt bulunamadı'); setExcelYukleniyor(false); return }
      // Önce truncate, sonra insert
      await sb.from('tehlike_siniflari').delete().neq('id', 0)
      const chunkSize = 100
      for (let i = 0; i < kayitlar.length; i += chunkSize) {
        await sb.from('tehlike_siniflari').insert(kayitlar.slice(i, i + chunkSize))
      }
      yukle()
      goster(`${kayitlar.length} kayıt yüklendi`)
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
    setExcelYukleniyor(false)
    e.target.value = ''
  }

  // TALEPLER
  async function talepDurum(id: string, durum: string) {
    await sb.from('site_teklif_talepleri').update({ durum }).eq('id', id)
    yukle()
  }

  const inputS = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }
  const labelS = { fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 as const, marginBottom: 5, display: 'block' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 }
  const fieldS = { display: 'flex' as const, flexDirection: 'column' as const, gap: 4 }

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Globe size={22} color="var(--accent)" />
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Site Yönetimi</h1>
        {basari && <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--green)', background: 'rgba(34,197,94,.1)', padding: '4px 12px', borderRadius: 20 }}>✓ {basari}</span>}
      </div>

      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {SEKMELER.map(s => {
          const Icon = s.icon
          return (
            <button key={s.id} onClick={() => setSekme(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: '8px 8px 0 0', border: '1px solid var(--border)', borderBottom: sekme === s.id ? '1px solid var(--surface)' : '1px solid var(--border)', background: sekme === s.id ? 'var(--surface)' : 'transparent', color: sekme === s.id ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 13, fontWeight: sekme === s.id ? 600 : 400, marginBottom: -1, fontFamily: 'inherit' }}>
              <Icon size={14} /> {s.label}
            </button>
          )
        })}
      </div>

      {yukleniyor && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Yükleniyor...</div>}

      {/* ========== SLIDER ========== */}
      {!yukleniyor && sekme === 'slider' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Ana sayfada dönen slider görselleri</div>
            <button onClick={() => { setSliderForm({ baslik: '', altyazi: '', resim_url: '', buton_yazi: '', buton_link: '', sira: sliderler.length, aktif: true }); setSliderModal({}) }}
              className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <Plus size={14} /> Yeni Slide
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sliderler.map(s => (
              <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                {s.resim_url && <img src={s.resim_url} alt="" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.baslik || 'Başlıksız'}</div>
                  {s.altyazi && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{s.altyazi.slice(0, 60)}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button onClick={() => sliderToggle(s)} title={s.aktif ? 'Gizle' : 'Göster'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.aktif ? 'var(--green)' : 'var(--text-faint)', padding: 4 }}>
                    {s.aktif ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => { setSliderForm({ baslik: s.baslik || '', altyazi: s.altyazi || '', resim_url: s.resim_url || '', buton_yazi: s.buton_yazi || '', buton_link: s.buton_link || '', sira: s.sira, aktif: s.aktif }); setSliderModal(s) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => sliderSil(s.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {sliderler.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>Henüz slide eklenmemiş</div>}
          </div>
        </div>
      )}

      {/* ========== AYARLAR ========== */}
      {!yukleniyor && sekme === 'ayarlar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 700 }}>
          {[
            ['sirket_adi', 'Şirket Adı'], ['slogan', 'Slogan'], ['telefon_1', 'Telefon 1'],
            ['telefon_2', 'Telefon 2 (WhatsApp)'], ['email', 'E-posta'], ['adres', 'Adres'],
            ['calisma_saatleri', 'Çalışma Saatleri'], ['facebook', 'Facebook URL'],
            ['instagram', 'Instagram URL'], ['whatsapp', 'WhatsApp URL'],
            ['stat_yil', 'İstatistik: Yıl'], ['stat_kurum', 'İstatistik: Kurum'], ['stat_egitim', 'İstatistik: Eğitim'],
          ].map(([k, l]) => (
            <div key={k} style={fieldS}>
              <label style={labelS}>{l}</label>
              <input value={ayarlar[k] || ''} onChange={e => setAyarlar(a => ({ ...a, [k]: e.target.value }))} style={inputS} />
            </div>
          ))}
          {[['hakkimizda', 'Hakkımızda (Kısa)'], ['hakkimizda_detay', 'Hakkımızda (Detay)'], ['vizyon', 'Vizyon'], ['misyon', 'Misyon'], ['hedeflerimiz', 'Hedeflerimiz'], ['degerlerimiz', 'Değerlerimiz']].map(([k, l]) => (
            <div key={k} style={fieldS}>
              <label style={labelS}>{l}</label>
              <textarea value={ayarlar[k] || ''} onChange={e => setAyarlar(a => ({ ...a, [k]: e.target.value }))}
                style={{ ...inputS, minHeight: 100, resize: 'vertical' }} />
            </div>
          ))}
          <button onClick={ayarKaydet} className="btn" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>Kaydet</button>
        </div>
      )}

      {/* ========== HİZMETLER ========== */}
      {!yukleniyor && sekme === 'hizmetler' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{hizmetler.length} hizmet</div>
            <button onClick={() => { setHizmetForm({ baslik: '', aciklama: '', detay: '', ikon: '', etiketler: '', resim_url: '', sira: hizmetler.length, aktif: true }); setHizmetModal({}) }}
              className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <Plus size={14} /> Yeni Hizmet
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hizmetler.map(h => (
              <div key={h.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                {h.resim_url && <img src={h.resim_url} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{h.baslik}</div>
                  {h.aciklama && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 1 }}>{h.aciklama.slice(0, 60)}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => hizmetToggle(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: h.aktif ? 'var(--green)' : 'var(--text-faint)', padding: 4 }}>
                    {h.aktif ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => { setHizmetForm({ baslik: h.baslik || '', aciklama: h.aciklama || '', detay: h.detay || '', ikon: h.ikon || '', etiketler: h.etiketler || '', resim_url: h.resim_url || '', sira: h.sira, aktif: h.aktif }); setHizmetModal(h) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}><Pencil size={15} /></button>
                  <button onClick={() => hizmetSil(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4 }}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== EĞİTİMLER ========== */}
      {!yukleniyor && sekme === 'egitimler' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{egitimler.length} eğitim</div>
            <button onClick={() => { setEgitimForm({ baslik: '', aciklama: '', sure: '', resim_url: '', sertifika: false, sira: egitimler.length, aktif: true }); setEgitimModal({}) }}
              className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <Plus size={14} /> Yeni Eğitim
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {egitimler.map(e => (
              <div key={e.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                {e.resim_url && <img src={e.resim_url} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{e.baslik}</div>
                  {e.sure && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Süre: {e.sure}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEgitimForm({ baslik: e.baslik || '', aciklama: e.aciklama || '', sure: e.sure || '', resim_url: e.resim_url || '', sertifika: e.sertifika || false, sira: e.sira, aktif: e.aktif }); setEgitimModal(e) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}><Pencil size={15} /></button>
                  <button onClick={() => egitimSil(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4 }}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== EKİP ========== */}
      {!yukleniyor && sekme === 'ekip' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{ekip.length} kişi</div>
            <button onClick={() => { setEkipForm({ ad_soyad: '', unvan: '', uzmanlik: '', foto_url: '', sira: ekip.length, aktif: true }); setEkipModal({}) }}
              className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <Plus size={14} /> Ekip Üyesi Ekle
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
            {ekip.map(k => (
              <div key={k.id} className="card" style={{ padding: 14, textAlign: 'center' }}>
                {k.foto_url ? <img src={k.foto_url} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px' }} />
                  : <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, margin: '0 auto 8px' }}>{k.ad_soyad?.charAt(0)}</div>}
                <div style={{ fontWeight: 600, fontSize: 13 }}>{k.ad_soyad}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{k.unvan}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                  <button onClick={() => { setEkipForm({ ad_soyad: k.ad_soyad || '', unvan: k.unvan || '', uzmanlik: k.uzmanlik || '', foto_url: k.foto_url || '', sira: k.sira, aktif: k.aktif }); setEkipModal(k) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}><Pencil size={14} /></button>
                  <button onClick={() => ekipSil(k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4 }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== REFERANSLAR ========== */}
      {!yukleniyor && sekme === 'referanslar' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{referanslar.length} referans</div>
            <button onClick={() => { setRefForm({ firma_adi: '', logo_url: '', sektor: '', sira: referanslar.length, aktif: true }); setRefModal({}) }}
              className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <Plus size={14} /> Referans Ekle
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
            {referanslar.map(r => (
              <div key={r.id} className="card" style={{ padding: 12, textAlign: 'center' }}>
                {r.logo_url && <img src={r.logo_url} alt="" style={{ height: 40, objectFit: 'contain', margin: '0 auto 8px', display: 'block', maxWidth: '100%' }} />}
                <div style={{ fontSize: 12, fontWeight: 600 }}>{r.firma_adi}</div>
                {r.sektor && <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{r.sektor}</div>}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                  <button onClick={() => { setRefForm({ firma_adi: r.firma_adi || '', logo_url: r.logo_url || '', sektor: r.sektor || '', sira: r.sira, aktif: r.aktif }); setRefModal(r) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}><Pencil size={13} /></button>
                  <button onClick={() => refSil(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4 }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== YAZILAR ========== */}
      {!yukleniyor && sekme === 'yazilar' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{yazilar.length} yazı</div>
            <button onClick={() => { setYaziForm({ baslik: '', ozet: '', icerik: '', foto_url: '', yazar: '', slug: '', yayinda: false }); setYaziModal({}) }}
              className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <Plus size={14} /> Yeni Yazı
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {yazilar.map(y => (
              <div key={y.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                {y.foto_url && <img src={y.foto_url} alt="" style={{ width: 70, height: 46, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{y.baslik}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{y.yazar} · {y.yayinlandi_at ? new Date(y.yayinlandi_at).toLocaleDateString('tr-TR') : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: y.yayinda ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', color: y.yayinda ? 'var(--green)' : 'var(--red)' }}>
                    {y.yayinda ? 'Yayında' : 'Taslak'}
                  </span>
                  <button onClick={() => yaziToggle(y)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}>
                    {y.yayinda ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => { setYaziForm({ baslik: y.baslik || '', ozet: y.ozet || '', icerik: y.icerik || '', foto_url: y.foto_url || '', yazar: y.yazar || '', slug: y.slug || '', yayinda: y.yayinda }); setYaziModal(y) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}><Pencil size={15} /></button>
                  <button onClick={() => yaziSil(y.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4 }}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== TALEPLER ========== */}
      {!yukleniyor && sekme === 'talepler' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {talepler.map(t => (
            <div key={t.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t.ad_soyad}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{t.firma_adi} · {t.telefon} · {t.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                    {t.hizmet_turu} · {t.calisan_sayisi} çalışan · {t.tehlike_sinifi}
                  </div>
                  {t.mesaj && <div style={{ fontSize: 13, marginTop: 8, color: 'var(--text)' }}>{t.mesaj}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{t.olusturuldu_at ? new Date(t.olusturuldu_at).toLocaleDateString('tr-TR') : ''}</div>
                  <select value={t.durum || 'Yeni'} onChange={e => talepDurum(t.id, e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                    {['Yeni', 'Görüşülüyor', 'Tamamlandı', 'İptal'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
          {talepler.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>Henüz teklif talebi yok</div>}
        </div>
      )}

      {/* ========== TEHLİKE SINIFLARI ========== */}
      {!yukleniyor && sekme === 'tehlike' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{tehlikeler.length} kayıt</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} id="excel-input"
                onChange={excelYukle} />
              <button onClick={() => document.getElementById('excel-input')?.click()}
                disabled={excelYukleniyor}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                <Upload size={14} /> {excelYukleniyor ? 'Yükleniyor...' : 'Excel Yükle'}
              </button>
              <button onClick={() => { setTehlikeForm({ kod: '', tanim: '', sinif: 'Tehlikeli' }); setTehlikeModal({}) }}
                className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                <Plus size={14} /> Yeni Ekle
              </button>
            </div>
          </div>

          {/* Arama + Filtre */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input value={tehlikeArama} onChange={e => setTehlikeArama(e.target.value)}
              placeholder="Kod veya faaliyet ara..."
              style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
            {['Tümü','Az Tehlikeli','Tehlikeli','Çok Tehlikeli'].map(s => (
              <button key={s} onClick={() => setTehlikeFiltre(s)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: tehlikeFiltre === s ? 'var(--accent-soft)' : 'transparent', color: tehlikeFiltre === s ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                {s}
              </button>
            ))}
          </div>

          {/* Tablo */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px 80px', padding: '8px 14px', background: 'var(--surface-2)', fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <span>NACE Kodu</span><span>Faaliyet</span><span>Tehlike Sınıfı</span><span></span>
            </div>
            {tehlikeler
              .filter(t => {
                const uyan = !tehlikeArama || t.kod.includes(tehlikeArama) || t.tanim.toLowerCase().includes(tehlikeArama.toLowerCase())
                const filtreli = tehlikeFiltre === 'Tümü' || t.sinif === tehlikeFiltre
                return uyan && filtreli
              })
              .slice(0, 100)
              .map((t, i) => (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px 80px', padding: '8px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', fontSize: 12, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.01)' }}>
                  <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 11 }}>{t.kod}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{t.tanim}</span>
                  <span>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: t.sinif === 'Az Tehlikeli' ? 'rgba(34,197,94,.1)' : t.sinif === 'Tehlikeli' ? 'rgba(245,158,11,.1)' : 'rgba(239,68,68,.1)',
                      color: t.sinif === 'Az Tehlikeli' ? '#22c55e' : t.sinif === 'Tehlikeli' ? '#f59e0b' : '#ef4444'
                    }}>{t.sinif}</span>
                  </span>
                  <span style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setTehlikeForm({ kod: t.kod, tanim: t.tanim, sinif: t.sinif }); setTehlikeModal(t) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 3 }}><Pencil size={13} /></button>
                    <button onClick={() => tehlikeSil(t.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 3 }}><Trash2 size={13} /></button>
                  </span>
                </div>
              ))}
            {tehlikeler.filter(t => {
              const uyan = !tehlikeArama || t.kod.includes(tehlikeArama) || t.tanim.toLowerCase().includes(tehlikeArama.toLowerCase())
              return (tehlikeFiltre === 'Tümü' || t.sinif === tehlikeFiltre) && uyan
            }).length > 100 && (
              <div style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', borderTop: '1px solid var(--border)' }}>
                İlk 100 gösteriliyor, aramayı daraltın
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tehlike Modal */}
      {tehlikeModal !== null && (
        <div className="modal-overlay" onClick={() => setTehlikeModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 17, fontWeight: 700 }}>{tehlikeModal?.id ? 'Düzenle' : 'Yeni Kayıt'}</h2>
              <button onClick={() => setTehlikeModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>NACE Kodu *</label>
                <input value={tehlikeForm.kod} onChange={e => setTehlikeForm(f => ({ ...f, kod: e.target.value }))}
                  placeholder="01.11.07" style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Faaliyet Tanımı *</label>
                <textarea value={tehlikeForm.tanim} onChange={e => setTehlikeForm(f => ({ ...f, tanim: e.target.value }))}
                  style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', minHeight: 80, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Tehlike Sınıfı *</label>
                <select value={tehlikeForm.sinif} onChange={e => setTehlikeForm(f => ({ ...f, sinif: e.target.value }))}
                  style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}>
                  <option>Az Tehlikeli</option>
                  <option>Tehlikeli</option>
                  <option>Çok Tehlikeli</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={tehlikeKaydet} className="btn" style={{ flex: 1, justifyContent: 'center', padding: 12 }}>Kaydet</button>
              <button onClick={() => setTehlikeModal(null)} style={{ padding: '12px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODALLER ========== */}

      {/* Slider Modal */}
      {sliderModal !== null && (
        <div className="modal-overlay" onClick={() => setSliderModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 17, fontWeight: 700 }}>{sliderModal?.id ? 'Slide Düzenle' : 'Yeni Slide'}</h2>
              <button onClick={() => setSliderModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={fieldS}>
                <label style={labelS}>Başlık</label>
                <input value={sliderForm.baslik} onChange={e => setSliderForm(f => ({ ...f, baslik: e.target.value }))} style={inputS} placeholder="Ana başlık" />
              </div>
              <div style={fieldS}>
                <label style={labelS}>Alt Yazı</label>
                <textarea value={sliderForm.altyazi} onChange={e => setSliderForm(f => ({ ...f, altyazi: e.target.value }))} style={{ ...inputS, minHeight: 80, resize: 'vertical' }} placeholder="Açıklama metni" />
              </div>
              <div style={fieldS}>
                <label style={labelS}>Resim <span style={{ color: 'var(--red)' }}>*</span></label>
                <ResimYukleButon mevcut={sliderForm.resim_url} klasor="slider"
                  onUpload={url => setSliderForm(f => ({ ...f, resim_url: url }))} label="Slider Resmi Yükle" />
                {sliderForm.resim_url && <input value={sliderForm.resim_url} onChange={e => setSliderForm(f => ({ ...f, resim_url: e.target.value }))} style={inputS} placeholder="veya URL girin" />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={fieldS}>
                  <label style={labelS}>Buton Yazısı</label>
                  <input value={sliderForm.buton_yazi} onChange={e => setSliderForm(f => ({ ...f, buton_yazi: e.target.value }))} style={inputS} placeholder="İletişime Geç" />
                </div>
                <div style={fieldS}>
                  <label style={labelS}>Buton Linki</label>
                  <input value={sliderForm.buton_link} onChange={e => setSliderForm(f => ({ ...f, buton_link: e.target.value }))} style={inputS} placeholder="/iletisim" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={sliderForm.aktif} onChange={e => setSliderForm(f => ({ ...f, aktif: e.target.checked }))} />
                Aktif (sitede göster)
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={sliderKaydet} className="btn" style={{ flex: 1, justifyContent: 'center', padding: 12 }}>Kaydet</button>
              <button onClick={() => setSliderModal(null)} style={{ padding: '12px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Hizmet Modal */}
      {hizmetModal !== null && (
        <div className="modal-overlay" onClick={() => setHizmetModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 17, fontWeight: 700 }}>{hizmetModal?.id ? 'Hizmet Düzenle' : 'Yeni Hizmet'}</h2>
              <button onClick={() => setHizmetModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={fieldS}><label style={labelS}>Başlık *</label><input value={hizmetForm.baslik} onChange={e => setHizmetForm(f => ({ ...f, baslik: e.target.value }))} style={inputS} /></div>
              <div style={fieldS}><label style={labelS}>Kısa Açıklama</label><textarea value={hizmetForm.aciklama} onChange={e => setHizmetForm(f => ({ ...f, aciklama: e.target.value }))} style={{ ...inputS, minHeight: 80, resize: 'vertical' }} /></div>
              <div style={fieldS}><label style={labelS}>Detaylı Açıklama</label><textarea value={hizmetForm.detay} onChange={e => setHizmetForm(f => ({ ...f, detay: e.target.value }))} style={{ ...inputS, minHeight: 120, resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={fieldS}><label style={labelS}>İkon (emoji)</label><input value={hizmetForm.ikon} onChange={e => setHizmetForm(f => ({ ...f, ikon: e.target.value }))} style={inputS} placeholder="🛡️" /></div>
                <div style={fieldS}><label style={labelS}>Etiketler</label><input value={hizmetForm.etiketler} onChange={e => setHizmetForm(f => ({ ...f, etiketler: e.target.value }))} style={inputS} placeholder="İSG, Güvenlik" /></div>
              </div>
              <div style={fieldS}>
                <label style={labelS}>Görsel</label>
                <ResimYukleButon mevcut={hizmetForm.resim_url} klasor="hizmetler"
                  onUpload={url => setHizmetForm(f => ({ ...f, resim_url: url }))} label="Hizmet Görseli Yükle" />
                <input value={hizmetForm.resim_url} onChange={e => setHizmetForm(f => ({ ...f, resim_url: e.target.value }))} style={{ ...inputS, marginTop: 6 }} placeholder="veya URL girin" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={hizmetForm.aktif} onChange={e => setHizmetForm(f => ({ ...f, aktif: e.target.checked }))} />
                Aktif
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={hizmetKaydet} className="btn" style={{ flex: 1, justifyContent: 'center', padding: 12 }}>Kaydet</button>
              <button onClick={() => setHizmetModal(null)} style={{ padding: '12px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Eğitim Modal */}
      {egitimModal !== null && (
        <div className="modal-overlay" onClick={() => setEgitimModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 17, fontWeight: 700 }}>{egitimModal?.id ? 'Eğitim Düzenle' : 'Yeni Eğitim'}</h2>
              <button onClick={() => setEgitimModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={fieldS}><label style={labelS}>Başlık *</label><input value={egitimForm.baslik} onChange={e => setEgitimForm(f => ({ ...f, baslik: e.target.value }))} style={inputS} /></div>
              <div style={fieldS}><label style={labelS}>Açıklama</label><textarea value={egitimForm.aciklama} onChange={e => setEgitimForm(f => ({ ...f, aciklama: e.target.value }))} style={{ ...inputS, minHeight: 100, resize: 'vertical' }} /></div>
              <div style={fieldS}><label style={labelS}>Süre</label><input value={egitimForm.sure} onChange={e => setEgitimForm(f => ({ ...f, sure: e.target.value }))} style={inputS} placeholder="4 Saat" /></div>
              <div style={fieldS}>
                <label style={labelS}>Görsel</label>
                <ResimYukleButon mevcut={egitimForm.resim_url} klasor="egitimler"
                  onUpload={url => setEgitimForm(f => ({ ...f, resim_url: url }))} label="Eğitim Görseli Yükle" />
                <input value={egitimForm.resim_url} onChange={e => setEgitimForm(f => ({ ...f, resim_url: e.target.value }))} style={{ ...inputS, marginTop: 6 }} placeholder="veya URL girin" />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={egitimForm.sertifika} onChange={e => setEgitimForm(f => ({ ...f, sertifika: e.target.checked }))} /> Sertifikalı
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={egitimForm.aktif} onChange={e => setEgitimForm(f => ({ ...f, aktif: e.target.checked }))} /> Aktif
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={egitimKaydet} className="btn" style={{ flex: 1, justifyContent: 'center', padding: 12 }}>Kaydet</button>
              <button onClick={() => setEgitimModal(null)} style={{ padding: '12px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Ekip Modal */}
      {ekipModal !== null && (
        <div className="modal-overlay" onClick={() => setEkipModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 17, fontWeight: 700 }}>{ekipModal?.id ? 'Ekip Üyesi Düzenle' : 'Ekip Üyesi Ekle'}</h2>
              <button onClick={() => setEkipModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={fieldS}><label style={labelS}>Ad Soyad *</label><input value={ekipForm.ad_soyad} onChange={e => setEkipForm(f => ({ ...f, ad_soyad: e.target.value }))} style={inputS} /></div>
              <div style={fieldS}><label style={labelS}>Ünvan</label><input value={ekipForm.unvan} onChange={e => setEkipForm(f => ({ ...f, unvan: e.target.value }))} style={inputS} placeholder="İş Güvenliği Uzmanı" /></div>
              <div style={fieldS}><label style={labelS}>Uzmanlık</label><input value={ekipForm.uzmanlik} onChange={e => setEkipForm(f => ({ ...f, uzmanlik: e.target.value }))} style={inputS} placeholder="Risk Değerlendirme, Eğitim..." /></div>
              <div style={fieldS}>
                <label style={labelS}>Fotoğraf</label>
                <ResimYukleButon mevcut={ekipForm.foto_url} klasor="ekip"
                  onUpload={url => setEkipForm(f => ({ ...f, foto_url: url }))} label="Fotoğraf Yükle" />
                <input value={ekipForm.foto_url} onChange={e => setEkipForm(f => ({ ...f, foto_url: e.target.value }))} style={{ ...inputS, marginTop: 6 }} placeholder="veya URL girin" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={ekipForm.aktif} onChange={e => setEkipForm(f => ({ ...f, aktif: e.target.checked }))} /> Aktif
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={ekipKaydet} className="btn" style={{ flex: 1, justifyContent: 'center', padding: 12 }}>Kaydet</button>
              <button onClick={() => setEkipModal(null)} style={{ padding: '12px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Referans Modal */}
      {refModal !== null && (
        <div className="modal-overlay" onClick={() => setRefModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 17, fontWeight: 700 }}>{refModal?.id ? 'Referans Düzenle' : 'Referans Ekle'}</h2>
              <button onClick={() => setRefModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={fieldS}><label style={labelS}>Firma Adı *</label><input value={refForm.firma_adi} onChange={e => setRefForm(f => ({ ...f, firma_adi: e.target.value }))} style={inputS} /></div>
              <div style={fieldS}><label style={labelS}>Sektör</label><input value={refForm.sektor} onChange={e => setRefForm(f => ({ ...f, sektor: e.target.value }))} style={inputS} placeholder="İnşaat, Gıda..." /></div>
              <div style={fieldS}>
                <label style={labelS}>Logo</label>
                <ResimYukleButon mevcut={refForm.logo_url} klasor="referanslar"
                  onUpload={url => setRefForm(f => ({ ...f, logo_url: url }))} label="Logo Yükle" />
                <input value={refForm.logo_url} onChange={e => setRefForm(f => ({ ...f, logo_url: e.target.value }))} style={{ ...inputS, marginTop: 6 }} placeholder="veya URL girin" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={refForm.aktif} onChange={e => setRefForm(f => ({ ...f, aktif: e.target.checked }))} /> Aktif
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={refKaydet} className="btn" style={{ flex: 1, justifyContent: 'center', padding: 12 }}>Kaydet</button>
              <button onClick={() => setRefModal(null)} style={{ padding: '12px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Yazı Modal */}
      {yaziModal !== null && (
        <div className="modal-overlay" onClick={() => setYaziModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 17, fontWeight: 700 }}>{yaziModal?.id ? 'Yazıyı Düzenle' : 'Yeni Yazı'}</h2>
              <button onClick={() => setYaziModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={fieldS}><label style={labelS}>Başlık *</label><input value={yaziForm.baslik} onChange={e => setYaziForm(f => ({ ...f, baslik: e.target.value, slug: slugOlustur(e.target.value) }))} style={inputS} /></div>
              <div style={fieldS}><label style={labelS}>URL (Slug)</label><input value={yaziForm.slug} onChange={e => setYaziForm(f => ({ ...f, slug: e.target.value }))} style={inputS} placeholder="otomatik oluşturulur" /></div>
              <div style={fieldS}><label style={labelS}>Yazar</label><input value={yaziForm.yazar} onChange={e => setYaziForm(f => ({ ...f, yazar: e.target.value }))} style={inputS} placeholder="Aktif OSGB" /></div>
              <div style={fieldS}><label style={labelS}>Özet</label><textarea value={yaziForm.ozet} onChange={e => setYaziForm(f => ({ ...f, ozet: e.target.value }))} style={{ ...inputS, minHeight: 80, resize: 'vertical' }} placeholder="Kısa açıklama..." /></div>
              <div style={fieldS}><label style={labelS}>İçerik</label><textarea value={yaziForm.icerik} onChange={e => setYaziForm(f => ({ ...f, icerik: e.target.value }))} style={{ ...inputS, minHeight: 200, resize: 'vertical', lineHeight: 1.6 }} placeholder="Yazı içeriği..." /></div>
              <div style={fieldS}>
                <label style={labelS}>Kapak Görseli</label>
                <ResimYukleButon mevcut={yaziForm.foto_url} klasor="yazilar"
                  onUpload={url => setYaziForm(f => ({ ...f, foto_url: url }))} label="Kapak Resmi Yükle" />
                <input value={yaziForm.foto_url} onChange={e => setYaziForm(f => ({ ...f, foto_url: e.target.value }))} style={{ ...inputS, marginTop: 6 }} placeholder="veya URL girin" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={yaziForm.yayinda} onChange={e => setYaziForm(f => ({ ...f, yayinda: e.target.checked }))} /> Yayınla
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={yaziKaydet} className="btn" style={{ flex: 1, justifyContent: 'center', padding: 12 }}>Kaydet</button>
              <button onClick={() => setYaziModal(null)} style={{ padding: '12px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
