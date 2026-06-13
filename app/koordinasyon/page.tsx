'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, X, Check, Trash2, ChevronLeft, ChevronRight, ClipboardList, CalendarDays, Search, Grid3X3 } from 'lucide-react'

const DURUM_RENK: any = { 'Planlandı':'var(--blue)', 'Tamamlandı':'var(--green)', 'Bekliyor':'var(--amber)', 'İptal':'var(--red)' }
const DURUMLAR = ['Planlandı','Bekliyor','Tamamlandı','İptal']
const KATEGORILER = ['Saha ziyareti','Risk değerlendirme','Eğitim','Ölçüm','Sağlık taraması','Teklif','Diğer']
const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const AY_KISA = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']

export default function Koordinasyon() {
  const [sekme, setSekme] = useState<'liste'|'takvim'|'grid'>('liste')
  const [gorevler, setGorevler] = useState<any[]>([])
  const [ziyaretlerData, setZiyaretlerData] = useState<any[]>([])
  const [personeller, setPersoneller] = useState<any[]>([])
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [mevcutPersonel, setMevcutPersonel] = useState<any>(null)
  const [modal, setModal] = useState(false)
  const [duzenle, setDuzenle] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [arama, setArama] = useState('')
  const [durumFiltre, setDurumFiltre] = useState('Hepsi')
  const [seciliTarih, setSeciliTarih] = useState(new Date().toISOString().slice(0,10))
  const [haftalikMi, setHaftalikMi] = useState(false)
  const [gridYil, setGridYil] = useState(new Date().getFullYear())
  const [form, setForm] = useState<any>(bosForm())
  const debounceRef = useRef<any>(null)
  const sb = createClient()

  function bosForm() {
    return { tarih: new Date().toISOString().slice(0,10), uzman_id:'', firma_id:'', firma_adi:'', gorev_turu:'Saha ziyareti', konu:'', karar:'', yetkili_sorumlu:'', aciklama:'', durum:'Planlandı' }
  }

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await sb.from('personeller').select('*').eq('id', data.user.id).single()
        setMevcutPersonel(p || { rol: 'operasyon' })
      } else setMevcutPersonel({ rol: 'operasyon' })
    })
  }, [])

  useEffect(() => { if (mevcutPersonel !== null) yukle() }, [mevcutPersonel, durumFiltre])

  async function yukle() {
    setYukleniyor(true)
    const rol = mevcutPersonel?.rol || 'operasyon'
    let q = sb.from('gorevler').select('*, personeller(ad_soyad), firmalar(unvan)').order('tarih', { ascending: false })
    if (rol === 'saha' && mevcutPersonel?.id) q = q.eq('uzman_id', mevcutPersonel.id)
    if (durumFiltre !== 'Hepsi') q = q.eq('durum', durumFiltre)

    const [gRes, pRes, fRes, zRes] = await Promise.all([
      q.limit(500),
      sb.from('personeller').select('id, ad_soyad, rol').eq('aktif', true).order('ad_soyad'),
      sb.from('firmalar').select('id, unvan, gorevli_igu, gorevli_ih, igu_id, ih_id').order('unvan').limit(300),
      sb.from('ziyaretler').select('firma_id, tarih, tur, ziyaret_eden_id').order('tarih')
    ])
    setGorevler(gRes.data || [])
    setPersoneller(pRes.data || [])
    setFirmalar(fRes.data || [])
    setZiyaretlerData(zRes.data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.uzman_id && !form.yetkili_sorumlu) { setHata('Yetkili/Uzman seçiniz'); return }
    setHata('')
    const firma = firmalar.find(f => f.id === form.firma_id)
    const payload = {
      tarih: form.tarih,
      uzman_id: form.uzman_id || null,
      uzman: personeller.find(p => p.id === form.uzman_id)?.ad_soyad || form.yetkili_sorumlu || '',
      firma_id: form.firma_id || null,
      firma_adi: firma?.unvan || form.firma_adi || '',
      gorev_turu: form.gorev_turu,
      konu: form.konu,
      karar: form.karar,
      yetkili_sorumlu: form.yetkili_sorumlu,
      aciklama: form.aciklama,
      durum: form.durum,
      kategori: 'gorev'
    }
    let error
    if (duzenle) {
      const r = await sb.from('gorevler').update(payload).eq('id', duzenle.id)
      error = r.error
    } else {
      const r = await sb.from('gorevler').insert(payload)
      error = r.error
    }
    if (error) { setHata(error.message); return }
    setModal(false); setDuzenle(null); setForm(bosForm()); yukle()
  }

  async function durumGuncelle(id: string, durum: string) {
    await sb.from('gorevler').update({ durum }).eq('id', id); yukle()
  }

  async function sil(id: string) {
    if (!confirm('Görevi silmek istiyor musunuz?')) return
    await sb.from('gorevler').delete().eq('id', id); yukle()
  }

  function duzenleAc(g: any) {
    setDuzenle(g)
    setForm({ tarih: g.tarih, uzman_id: g.uzman_id || '', firma_id: g.firma_id || '',
      firma_adi: g.firma_adi || '', gorev_turu: g.gorev_turu || 'Saha ziyareti',
      konu: g.konu || '', karar: g.karar || '', yetkili_sorumlu: g.yetkili_sorumlu || '',
      aciklama: g.aciklama || '', durum: g.durum || 'Planlandı' })
    setModal(true)
  }

  function takvimGorevleri() {
    if (!haftalikMi) return gorevler.filter(g => g.tarih === seciliTarih)
    const bas = new Date(seciliTarih)
    bas.setDate(bas.getDate() - bas.getDay() + 1)
    const bit = new Date(bas); bit.setDate(bas.getDate() + 6)
    return gorevler.filter(g => { const t = new Date(g.tarih); return t >= bas && t <= bit })
  }

  const filtreliGorevler = gorevler.filter(g => {
    if (!arama) return true
    const s = arama.toLowerCase()
    return (g.konu||'').toLowerCase().includes(s) || (g.firma_adi||'').toLowerCase().includes(s) ||
      (g.uzman||'').toLowerCase().includes(s) || (g.aciklama||'').toLowerCase().includes(s)
  })

  // GRID: firma başına IGU/IH aylık ziyaret durumu — ziyaretler tablosundan
  function gridHesapla() {
    return firmalar.map(f => {
      const iguAylar: Record<number, boolean> = {}
      const ihAylar: Record<number, boolean> = {}
      ziyaretlerData.forEach(z => {
        if (!z.tarih || !z.firma_id) return
        const tarihYil = new Date(z.tarih).getFullYear()
        if (tarihYil !== gridYil) return
        if (z.firma_id !== f.id) return
        const ay = new Date(z.tarih).getMonth() // 0-11
        if (z.tur === 'İGU') iguAylar[ay] = true
        if (z.tur === 'İH') ihAylar[ay] = true
        if (z.tur === 'DSP') iguAylar[ay] = true // DSP'yi IGU satırında göster
      })
      return { ...f, iguAylar, ihAylar }
    })
  }

  const rol = mevcutPersonel?.rol || 'operasyon'
  const yazabilir = rol !== 'saha'
  const istatistik = {
    toplam: gorevler.length,
    bekliyor: gorevler.filter(g => g.durum === 'Bekliyor').length,
    tamamlandi: gorevler.filter(g => g.durum === 'Tamamlandı').length,
    planlandi: gorevler.filter(g => g.durum === 'Planlandı').length,
  }

  const gridData = sekme === 'grid' ? gridHesapla() : []

  return (
    <div className="page-wrap">
      {/* BAŞLIK */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:26, fontWeight:700, letterSpacing:-0.5 }}>İSG Koordinasyon</h1>
          <p style={{ color:'var(--text-dim)', fontSize:13, marginTop:2 }}>
            {rol === 'saha' ? `${mevcutPersonel?.ad_soyad} — sadece kendi görevlerin` : 'Tüm görev ve kararlar'}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ display:'flex', background:'var(--surface-2)', borderRadius:10, padding:3, border:'1px solid var(--border)' }}>
            {([['liste','Liste',ClipboardList],['takvim','Takvim',CalendarDays],['grid','Ziyaret Grid',Grid3X3]] as any[]).map(([k,l,Icon]) => (
              <button key={k} onClick={() => setSekme(k)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                  background: sekme === k ? 'var(--surface)' : 'transparent', border:'none',
                  color: sekme === k ? 'var(--text)' : 'var(--text-dim)', fontWeight: sekme === k ? 600 : 400,
                  boxShadow: sekme === k ? '0 1px 3px rgba(0,0,0,0.2)' : 'none', transition:'all 0.15s' }}>
                <Icon size={13}/>{l}
              </button>
            ))}
          </div>
          {yazabilir && (
            <button className="btn" onClick={() => { setDuzenle(null); setForm(bosForm()); setModal(true) }}>
              <Plus size={16}/> Görev Ekle
            </button>
          )}
        </div>
      </div>

      {/* ÖZET KARTLAR */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Toplam', val: istatistik.toplam, renk:'var(--accent)' },
          { label:'Planlandı', val: istatistik.planlandi, renk:'var(--blue)' },
          { label:'Bekliyor', val: istatistik.bekliyor, renk:'var(--amber)' },
          { label:'Tamamlandı', val: istatistik.tamamlandi, renk:'var(--green)' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:4 }}>{k.label}</div>
            <div style={{ fontFamily:'Sora,sans-serif', fontSize:26, fontWeight:700, color: k.renk }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ===== LİSTE ===== */}
      {sekme === 'liste' && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:10, top:11, color:'var(--text-faint)' }}/>
              <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Ara..." style={{ paddingLeft:30, width:180 }}/>
            </div>
            {['Hepsi',...DURUMLAR].map(d => (
              <button key={d} onClick={() => setDurumFiltre(d)}
                style={{ padding:'8px 14px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                  background: durumFiltre === d ? `${DURUM_RENK[d] || 'var(--accent)'}22` : 'var(--surface-2)',
                  border: `1px solid ${durumFiltre === d ? DURUM_RENK[d] || 'var(--accent)' : 'var(--border)'}`,
                  color: durumFiltre === d ? DURUM_RENK[d] || 'var(--accent)' : 'var(--text-dim)',
                  fontWeight: durumFiltre === d ? 600 : 400 }}>
                {d}
              </button>
            ))}
          </div>

          {yukleniyor ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--text-faint)' }}>Yükleniyor...</div>
          ) : (
            <div className="card" style={{ overflow:'auto', padding:0 }}>
              <table style={{ width:'100%', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'var(--surface-2)' }}>
                    <th style={{ textAlign:'center', padding:'10px 12px', width:40 }}>No</th>
                    <th style={{ textAlign:'left', padding:'10px 12px', minWidth:200 }}>KONU / GÖREV</th>
                    <th style={{ textAlign:'left', padding:'10px 12px', minWidth:180 }}>KARAR / AÇIKLAMA</th>
                    <th style={{ textAlign:'center', padding:'10px 12px', width:110 }}>DURUM</th>
                    <th style={{ textAlign:'left', padding:'10px 12px', minWidth:130 }}>YETKİLİ</th>
                    <th style={{ textAlign:'center', padding:'10px 12px', width:100 }}>TARİH</th>
                    {yazabilir && <th style={{ width:80 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtreliGorevler.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>Görev bulunamadı</td></tr>
                    : filtreliGorevler.map((g, i) => (
                      <tr key={g.id} style={{ borderBottom:'1px solid var(--border)', cursor: yazabilir ? 'pointer' : 'default' }}
                        onClick={() => yazabilir && duzenleAc(g)}>
                        <td style={{ textAlign:'center', padding:'10px 12px', color:'var(--text-faint)', fontWeight:600 }}>{i + 1}</td>
                        <td style={{ padding:'10px 12px' }}>
                          <div style={{ fontWeight:600, marginBottom:2 }}>{g.konu || g.firma_adi || '—'}</div>
                          <div style={{ fontSize:11, color:'var(--text-dim)' }}>{g.gorev_turu}</div>
                          {g.firma_adi && g.konu && <div style={{ fontSize:10, color:'var(--text-faint)', marginTop:2 }}>{g.firma_adi}</div>}
                        </td>
                        <td style={{ padding:'10px 12px', color:'var(--text-dim)' }}>{g.karar || '—'}</td>
                        <td style={{ textAlign:'center', padding:'10px 8px' }}>
                          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:600, background:`${DURUM_RENK[g.durum] || 'var(--accent)'}22`, color: DURUM_RENK[g.durum] || 'var(--accent)' }}>
                            {g.durum}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <div style={{ fontWeight:500 }}>{g.yetkili_sorumlu || g.uzman || '—'}</div>
                        </td>
                        <td style={{ textAlign:'center', padding:'10px 8px', color:'var(--text-faint)', fontSize:11, whiteSpace:'nowrap' }}>
                          {g.tarih ? new Date(g.tarih + 'T00:00:00').toLocaleDateString('tr-TR') : '—'}
                        </td>
                        {yazabilir && (
                          <td style={{ padding:'8px', textAlign:'center' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                              {g.durum !== 'Tamamlandı' && (
                                <button onClick={() => durumGuncelle(g.id, 'Tamamlandı')}
                                  style={{ padding:'5px 8px', borderRadius:6, background:'var(--green-soft)', border:'1px solid var(--green)', color:'var(--green)', cursor:'pointer' }}>
                                  <Check size={12}/>
                                </button>
                              )}
                              <button onClick={() => sil(g.id)}
                                style={{ padding:'5px 8px', borderRadius:6, background:'var(--red-soft)', border:'1px solid var(--red)', color:'var(--red)', cursor:'pointer' }}>
                                <Trash2 size={12}/>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== TAKVİM ===== */}
      {sekme === 'takvim' && (
        <>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:20 }}>
            <button onClick={() => { const d = new Date(seciliTarih); d.setDate(d.getDate()-1); setSeciliTarih(d.toISOString().slice(0,10)) }}
              style={{ padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', color:'var(--text)' }}>
              <ChevronLeft size={15}/>
            </button>
            <input type="date" value={seciliTarih} onChange={e => setSeciliTarih(e.target.value)}
              style={{ padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:14, fontFamily:'inherit' }}/>
            <button onClick={() => { const d = new Date(seciliTarih); d.setDate(d.getDate()+1); setSeciliTarih(d.toISOString().slice(0,10)) }}
              style={{ padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', color:'var(--text)' }}>
              <ChevronRight size={15}/>
            </button>
            <span style={{ color:'var(--text-dim)', fontSize:13 }}>
              {new Date(seciliTarih+'T00:00:00').toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'})}
            </span>
            <button onClick={() => setSeciliTarih(new Date().toISOString().slice(0,10))}
              style={{ padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', color:'var(--text-dim)', fontSize:13, fontFamily:'inherit' }}>
              Bugün
            </button>
            <button onClick={() => setHaftalikMi(h => !h)}
              style={{ padding:'7px 12px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                background: haftalikMi ? 'var(--accent-soft)' : 'var(--surface)',
                border: `1px solid ${haftalikMi ? 'var(--accent)' : 'var(--border)'}`,
                color: haftalikMi ? 'var(--accent)' : 'var(--text-dim)' }}>
              Haftalık
            </button>
          </div>
          {(() => {
            const tGorevler = takvimGorevleri()
            return (
              <div>
                <p style={{ color:'var(--text-dim)', fontSize:13, marginBottom:16 }}>{tGorevler.length} görev</p>
                {tGorevler.length === 0
                  ? <div className="card" style={{ padding:40, textAlign:'center', color:'var(--text-faint)' }}>Bu tarihte görev yok</div>
                  : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
                      {tGorevler.map(g => (
                        <div key={g.id} className="card" style={{ padding:18, cursor: yazabilir ? 'pointer' : 'default' }} onClick={() => yazabilir && duzenleAc(g)}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                            <div>
                              <div style={{ fontWeight:700 }}>{g.yetkili_sorumlu || g.uzman || '—'}</div>
                              <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>{g.gorev_turu}</div>
                            </div>
                            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:600, background:`${DURUM_RENK[g.durum] || 'var(--accent)'}22`, color: DURUM_RENK[g.durum] || 'var(--accent)' }}>
                              {g.durum}
                            </span>
                          </div>
                          <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{g.konu || g.firma_adi || '—'}</div>
                          {g.karar && <div style={{ fontSize:12, color:'var(--text-dim)' }}>{g.karar}</div>}
                          {yazabilir && (
                            <div style={{ display:'flex', gap:8, marginTop:12 }} onClick={e => e.stopPropagation()}>
                              {g.durum !== 'Tamamlandı' && (
                                <button onClick={() => durumGuncelle(g.id, 'Tamamlandı')}
                                  style={{ flex:1, padding:'7px', borderRadius:8, background:'var(--green-soft)', border:'1px solid var(--green)', color:'var(--green)', cursor:'pointer', fontSize:12, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                                  <Check size={12}/> Tamamlandı
                                </button>
                              )}
                              <button onClick={() => sil(g.id)}
                                style={{ padding:'7px 10px', borderRadius:8, background:'transparent', border:'none', color:'var(--text-faint)', cursor:'pointer' }}>
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                }
              </div>
            )
          })()}
        </>
      )}

      {/* ===== ZİYARET GRİD ===== */}
      {sekme === 'grid' && (
        <>
          {/* Yıl seçici */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <button onClick={() => setGridYil(y => y - 1)}
              style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', color:'var(--text)' }}>
              <ChevronLeft size={15}/>
            </button>
            <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18 }}>{gridYil}</span>
            <button onClick={() => setGridYil(y => y + 1)}
              style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', color:'var(--text)' }}>
              <ChevronRight size={15}/>
            </button>
            {/* Renk açıklama */}
            <div style={{ display:'flex', gap:14, marginLeft:16, fontSize:12, color:'var(--text-dim)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:14, height:14, borderRadius:3, background:'#22c55e', display:'inline-block' }}/>Ziyaret Tamamlandı
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:14, height:14, borderRadius:3, background:'var(--surface-2)', border:'1px solid var(--border)', display:'inline-block' }}/>Ziyaret Yok
              </span>
            </div>
          </div>

          {/* Legand: IGU / IH */}
          <div style={{ display:'flex', gap:10, marginBottom:16, fontSize:12 }}>
            <span style={{ padding:'4px 12px', borderRadius:20, background:'rgba(99,102,241,0.15)', color:'var(--accent)', fontWeight:600 }}>İGU — İSG Uzmanı</span>
            <span style={{ padding:'4px 12px', borderRadius:20, background:'rgba(34,197,94,0.15)', color:'var(--green)', fontWeight:600 }}>İH — İş Hekimi</span>
          </div>

          {yukleniyor ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--text-faint)' }}>Yükleniyor...</div>
          ) : (
            <div className="card" style={{ overflow:'auto', padding:0 }}>
              <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--surface-2)', position:'sticky', top:0, zIndex:1 }}>
                    <th style={{ textAlign:'left', padding:'10px 14px', minWidth:200, fontWeight:600, borderRight:'1px solid var(--border)' }}>FİRMA</th>
                    <th style={{ textAlign:'center', padding:'8px 6px', fontWeight:600, minWidth:80, borderRight:'1px solid var(--border)' }}>İGU / İH</th>
                    {AY_KISA.map((ay, i) => (
                      <th key={i} style={{ textAlign:'center', padding:'8px 4px', fontWeight:600, minWidth:44,
                        color: i === new Date().getMonth() && gridYil === new Date().getFullYear() ? 'var(--accent)' : 'var(--text-dim)' }}>
                        {ay}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridData.length === 0
                    ? <tr><td colSpan={14} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>Firma bulunamadı</td></tr>
                    : gridData.map((f, fi) => (
                      <>
                        {/* IGU satırı */}
                        <tr key={`${f.id}-igu`} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background: fi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding:'8px 14px', fontWeight:500, borderRight:'1px solid var(--border)', verticalAlign:'middle' }} rowSpan={2}>
                            <div style={{ fontSize:12 }}>{f.unvan}</div>
                            {f.gorevli_igu && <div style={{ fontSize:10, color:'var(--text-faint)', marginTop:2 }}>İGU: {f.gorevli_igu}</div>}
                            {f.gorevli_ih && <div style={{ fontSize:10, color:'var(--text-faint)' }}>İH: {f.gorevli_ih}</div>}
                          </td>
                          <td style={{ textAlign:'center', padding:'6px', borderRight:'1px solid var(--border)' }}>
                            <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'rgba(99,102,241,0.15)', color:'var(--accent)', fontWeight:600 }}>İGU</span>
                          </td>
                          {Array.from({ length: 12 }, (_, ay) => (
                            <td key={ay} style={{ textAlign:'center', padding:'6px 4px' }}>
                              <div style={{ width:28, height:28, borderRadius:6, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center',
                                background: f.iguAylar[ay] ? '#22c55e' : 'var(--surface-2)',
                                border: `1px solid ${f.iguAylar[ay] ? '#22c55e' : 'var(--border)'}` }}>
                                {f.iguAylar[ay] && <span style={{ fontSize:13, color:'white', fontWeight:700 }}>✓</span>}
                              </div>
                            </td>
                          ))}
                        </tr>
                        {/* IH satırı */}
                        <tr key={`${f.id}-ih`} style={{ borderBottom:'2px solid var(--border)', background: fi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ textAlign:'center', padding:'6px', borderRight:'1px solid var(--border)' }}>
                            <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'rgba(34,197,94,0.15)', color:'var(--green)', fontWeight:600 }}>İH</span>
                          </td>
                          {Array.from({ length: 12 }, (_, ay) => (
                            <td key={ay} style={{ textAlign:'center', padding:'6px 4px' }}>
                              <div style={{ width:28, height:28, borderRadius:6, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center',
                                background: f.ihAylar[ay] ? '#22c55e' : 'var(--surface-2)',
                                border: `1px solid ${f.ihAylar[ay] ? '#22c55e' : 'var(--border)'}` }}>
                                {f.ihAylar[ay] && <span style={{ fontSize:13, color:'white', fontWeight:700 }}>✓</span>}
                              </div>
                            </td>
                          ))}
                        </tr>
                      </>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={() => { setModal(false); setDuzenle(null); setForm(bosForm()) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:520 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:19, fontWeight:600 }}>
                {duzenle ? 'Görevi Düzenle' : 'Yeni Görev / Karar'}
              </h2>
              <button onClick={() => { setModal(false); setDuzenle(null); setForm(bosForm()) }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)' }}><X size={20}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div><label style={lbl}>Tarih</label><input type="date" value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})}/></div>
              <div><label style={lbl}>Durum</label>
                <select value={form.durum} onChange={e => setForm({...form, durum: e.target.value})}>
                  {DURUMLAR.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Konu *</label><input value={form.konu} onChange={e => setForm({...form, konu: e.target.value})} placeholder="Görev konusu..."/></div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Karar / Açıklama</label>
                <textarea value={form.karar} onChange={e => setForm({...form, karar: e.target.value})} placeholder="Alınan karar..." rows={2}
                  style={{ width:'100%', padding:'10px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:13, fontFamily:'inherit', resize:'vertical' }}/>
              </div>
              <div><label style={lbl}>Yetkili/Sorumlu</label>
                <select value={form.uzman_id} onChange={e => {
                  const p = personeller.find(x => x.id === e.target.value)
                  setForm({...form, uzman_id: e.target.value, yetkili_sorumlu: p?.ad_soyad || ''})
                }}>
                  <option value="">Seçiniz...</option>
                  {personeller.map(p => <option key={p.id} value={p.id}>{p.ad_soyad}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Kategori</label>
                <select value={form.gorev_turu} onChange={e => setForm({...form, gorev_turu: e.target.value})}>
                  {KATEGORILER.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Firma (isteğe bağlı)</label>
                <select value={form.firma_id} onChange={e => setForm({...form, firma_id: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {firmalar.map(f => <option key={f.id} value={f.id}>{f.unvan}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Ek Notlar</label><input value={form.aciklama} onChange={e => setForm({...form, aciklama: e.target.value})} placeholder="Ek notlar..."/></div>
            </div>
            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginTop:14 }}>{hata}</div>}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn-ghost btn" style={{ flex:1, justifyContent:'center' }} onClick={() => { setModal(false); setDuzenle(null); setForm(bosForm()) }}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={kaydet}>{duzenle ? 'Güncelle' : 'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl: any = { display:'block', fontSize:12, color:'var(--text-dim)', marginBottom:6, fontWeight:500 }
