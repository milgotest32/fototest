'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, X, ChevronLeft, ChevronRight, MapPin, Download } from 'lucide-react'
import { csvIndir } from '@/lib/csvExport'

const AYLAR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
const AYLAR_FULL = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

export default function Ziyaretler() {
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [mevcutPersonel, setMevcutPersonel] = useState<any>(null)
  const [arama, setArama] = useState('')
  const [aramaDebounced, setAramaDebounced] = useState('')
  const [yil, setYil] = useState(new Date().getFullYear())
  const [yukleniyor, setYukleniyor] = useState(true)
  const [personeller, setPersoneller] = useState<any[]>([])
  const [ziyaretBilgi, setZiyaretBilgi] = useState<any>(null) // {firma, ayIdx, tur, bilgi}
  const [modal, setModal] = useState<any>(null) // {firma, ayIdx, tur: 'igu'|'ih'}
  const [form, setForm] = useState({ tarih: new Date().toISOString().slice(0,10), notlar: '', operasyon_yapan: '', operasyon_yapan_id: '' })
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false)
  const debounceRef = useRef<any>(null)
  const sb = createClient()

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await sb.from('personeller').select('*').eq('id', data.user.id).single()
        setMevcutPersonel(p || { rol: 'operasyon' })
      } else setMevcutPersonel({ rol: 'operasyon' })
    })
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setAramaDebounced(arama), 400)
    return () => clearTimeout(debounceRef.current)
  }, [arama])

  useEffect(() => { if (mevcutPersonel !== null) yukle() }, [yil, aramaDebounced, mevcutPersonel])

  async function yukle() {
    setYukleniyor(true)
    let q = sb.from('firmalar')
      .select('id, unvan, sgk_sicil, tehlike_sinifi, ih_periyot, gorevli_igu, gorevli_ih, gorevli_dsp, igu_atama_tarihi, ih_atama_tarihi, bhl_atama, igu_atama_durum, ih_atama_durum, bhl_atama_durum, aylik_ziyaretler')
      .eq('aktif', true)
      .not('ih_periyot', 'is', null)
      .order('unvan')
      .limit(300)

    if (aramaDebounced) q = q.ilike('unvan', `%${aramaDebounced}%`)

    const rol = mevcutPersonel?.rol || 'operasyon'
    if (rol === 'saha' && mevcutPersonel?.ad_soyad) {
      const ad = mevcutPersonel.ad_soyad
      q = q.or(`gorevli_igu.ilike.%${ad}%,gorevli_ih.ilike.%${ad}%`)
    }

    const [fData, pData] = await Promise.all([
      q,
      sb.from('personeller').select('id, ad_soyad, rol').eq('aktif', true).order('ad_soyad')
    ])
    setFirmalar((fData.data || []).filter((f: any) => f.ih_periyot !== 'GİDİLMİYOR'))
    setPersoneller(pData.data || [])
    setYukleniyor(false)
  }

  // aylik_ziyaretler formatı:
  // yeni: "2026-01": { igu: {tarih, gidildi, notlar, operasyon_yapan}, ih: {tarih, gidildi, notlar, operasyon_yapan} }
  // eski: "2026-01": { tarih, gidildi, tur, notlar, ... }
  function getZiyaret(firma: any, ayIdx: number, tur: 'igu'|'ih') {
    const ayKey = `${yil}-${String(ayIdx + 1).padStart(2, '0')}`
    const z = (firma.aylik_ziyaretler || {})[ayKey]
    if (!z) return null
    // Yeni format
    if (z.igu !== undefined || z.ih !== undefined) return z[tur] || null
    // Eski format - tur eşleşiyorsa göster
    if (tur === 'igu' && (!z.tur || z.tur === 'İGU')) return z
    if (tur === 'ih' && z.tur === 'İH') return z
    return null
  }

  function ziyaretDurumu(firma: any, ayIdx: number, tur: 'igu'|'ih'): 'gelecek'|'gidildi'|'gidilmedi'|'gerekmiyor' {
    const simdi = new Date()
    const gelecek = yil > simdi.getFullYear() || (yil === simdi.getFullYear() && ayIdx > simdi.getMonth())
    if (gelecek) return 'gelecek'

    const z = getZiyaret(firma, ayIdx, tur)
    if (z?.gidildi || (z && z.tarih)) return 'gidildi'

    const periyot = parseFloat(firma.ih_periyot)
    let gerekirMi = false
    if (periyot <= 0.5) gerekirMi = true
    else if (periyot <= 1.0) gerekirMi = ayIdx % 2 === 0
    else if (periyot <= 2.0) gerekirMi = ayIdx % 4 === 0

    return gerekirMi ? 'gidilmedi' : 'gerekmiyor'
  }

  function atamaDurumu(firma: any) {
    const durumlar = [firma.igu_atama_durum, firma.ih_atama_durum, firma.bhl_atama_durum]
    if (durumlar.every((d: string) => d === 'yok' || !d)) return 'kirmizi'
    if (durumlar.some((d: string) => d === 'bekliyor')) return 'sari'
    if (durumlar.every((d: string) => d === 'onayli')) return 'yesil'
    return 'sari'
  }

  async function ziyaretEkle() {
    if (!modal) return
    setKayitYukleniyor(true)
    const { firma, ayIdx, tur } = modal
    const ayKey = `${yil}-${String(ayIdx + 1).padStart(2, '0')}`
    const mevcut = firma.aylik_ziyaretler || {}
    const mevcutAy = mevcut[ayKey] || {}

    // Yeni format: { igu: {...}, ih: {...} }
    const yeniAy = {
      ...mevcutAy,
      [tur]: {
        tarih: form.tarih,
        gidildi: true,
        notlar: form.notlar,
        operasyon_yapan: form.operasyon_yapan || mevcutPersonel?.ad_soyad || '',
        operasyon_yapan_id: form.operasyon_yapan_id || mevcutPersonel?.id || null,
        ziyaret_eden: mevcutPersonel?.ad_soyad || '',
      }
    }
    const guncel = { ...mevcut, [ayKey]: yeniAy }

    await sb.from('firmalar').update({ aylik_ziyaretler: guncel }).eq('id', firma.id)
    await sb.from('ziyaretler').insert({
      firma_id: firma.id, tarih: form.tarih,
      tur: tur === 'igu' ? 'İGU' : 'İH',
      notlar: form.notlar,
      ziyaret_eden: mevcutPersonel?.ad_soyad || '',
      ziyaret_eden_id: mevcutPersonel?.id || null,
      operasyon_yapan: form.operasyon_yapan || mevcutPersonel?.ad_soyad || '',
      operasyon_yapan_id: form.operasyon_yapan_id || mevcutPersonel?.id || null,
    })
    setModal(null)
    yukle()
    setKayitYukleniyor(false)
  }

  function exportCSV() {
    const rows: any[] = []
    firmalar.forEach(f => {
      for (let ay = 0; ay < 12; ay++) {
        const ayKey = `${yil}-${String(ay+1).padStart(2,'0')}`
        const z = (f.aylik_ziyaretler||{})[ayKey]
        if (!z) continue
        const igu = z.igu || (z.tur === 'İGU' || !z.tur ? z : null)
        const ih = z.ih || (z.tur === 'İH' ? z : null)
        if (igu) rows.push({ 'Firma': f.unvan, 'Ay': ay+1, 'Tür': 'İGU', 'Tarih': igu.tarih||'', 'Operasyon Yapan': igu.operasyon_yapan||'', 'Notlar': igu.notlar||'' })
        if (ih) rows.push({ 'Firma': f.unvan, 'Ay': ay+1, 'Tür': 'İH', 'Tarih': ih.tarih||'', 'Operasyon Yapan': ih.operasyon_yapan||'', 'Notlar': ih.notlar||'' })
      }
    })
    csvIndir(rows, `ziyaretler_${yil}`)
  }

  const simdi = new Date()
  const buAy = simdi.getMonth()
  const buYil = simdi.getFullYear()
  const rol = mevcutPersonel?.rol || 'operasyon'
  const yazabilir = !['saha'].includes(rol)

  const istatistik = {
    toplam: firmalar.length,
    buAyGidilen: firmalar.filter(f => getZiyaret(f, buAy, 'igu') || getZiyaret(f, buAy, 'ih')).length,
    gidilmemis: firmalar.filter(f => ziyaretDurumu(f, buAy, 'igu') === 'gidilmedi' || ziyaretDurumu(f, buAy, 'ih') === 'gidilmedi').length,
    atamasiz: firmalar.filter(f => atamaDurumu(f) === 'kirmizi').length,
  }

  function Tick({ firma, ayIdx, tur }: { firma: any, ayIdx: number, tur: 'igu'|'ih' }) {
    const durum = ziyaretDurumu(firma, ayIdx, tur)
    const bilgi = getZiyaret(firma, ayIdx, tur)
    const tiklanabilir = yazabilir || (firma.gorevli_igu?.includes(mevcutPersonel?.ad_soyad) || firma.gorevli_ih?.includes(mevcutPersonel?.ad_soyad))

    if (durum === 'gelecek') {
      // Yönetici gelecek aya da girebilir
      if (rol === 'yonetici') {
        return (
          <div onClick={() => setModal({ firma, ayIdx, tur })}
            style={{ width:16, height:16, border:'1px dashed var(--border)', borderRadius:3, margin:'0 auto', opacity:0.4, cursor:'pointer' }}/>
        )
      }
      return <div style={{ width:16, height:16, border:'1px dashed var(--border)', borderRadius:3, margin:'0 auto', opacity:0.5 }}/>
    }
    if (durum === 'gidildi') {
      return (
        <div onClick={() => setZiyaretBilgi({ firma, ayIdx, tur, bilgi })}
          style={{ width:18, height:18, background:'#22c55e', borderRadius:3, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <span style={{ color:'white', fontSize:9, fontWeight:700 }}>✓</span>
        </div>
      )
    }
    if (durum === 'gerekmiyor') {
      if (rol === 'yonetici') {
        return (
          <div onClick={() => setModal({ firma, ayIdx, tur })}
            style={{ width:16, height:16, border:'1px dashed var(--border)', borderRadius:3, margin:'0 auto', opacity:0.4, cursor:'pointer' }}/>
        )
      }
      return <div style={{ width:16, height:16, border:'1px solid var(--border)', borderRadius:3, margin:'0 auto', opacity:0.45 }}/>
    }
    // gidilmedi
    return (
      <div onClick={() => tiklanabilir && yazabilir ? setModal({ firma, ayIdx, tur }) : null}
        style={{ width:18, height:18, border:'2px solid #ef4444', borderRadius:3, margin:'0 auto', cursor:tiklanabilir&&yazabilir?'pointer':'default', background:'rgba(239,68,68,0.08)' }}/>
    )
  }

  return (
    <div className="page-wrap" style={{ maxWidth: '100%', paddingRight: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Ziyaret Takibi</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 2 }}>
            {rol === 'saha' ? `${mevcutPersonel?.ad_soyad} — sadece atandığın firmalar görünüyor` : 'Tüm firmalar'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setYil(y => y-1)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text)' }}><ChevronLeft size={15}/></button>
          <span style={{ fontWeight: 700, fontSize: 20, minWidth: 55, textAlign: 'center' }}>{yil}</span>
          <button onClick={() => setYil(y => y+1)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text)' }}><ChevronRight size={15}/></button>
          <button onClick={exportCSV} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', color:'var(--text-dim)', fontSize:13, display:'flex', alignItems:'center', gap:5 }}>
            <Download size={14}/> CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Toplam Firma', val: istatistik.toplam, renk: 'var(--accent)' },
          { label: 'Bu Ay Gidilen', val: istatistik.buAyGidilen, renk: 'var(--green)' },
          { label: 'Bu Ay Geciken', val: istatistik.gidilmemis, renk: 'var(--red)' },
          { label: 'Atamasız', val: istatistik.atamasiz, renk: 'var(--amber)' },
        ].map((k,i) => (
          <div key={i} className="card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 26, fontWeight: 700, color: k.renk }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-faint)' }}/>
          <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Firma ara..." style={{ paddingLeft: 30, width: 180 }}/>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 11 }}>
          {[['#22c55e','Gidildi'],['#ef4444','Gecikme'],['var(--amber)','Atama Onay Bekliyor'],['#ef4444','Atamasız']].map(([r,l],i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:r }}/>
              <span style={{ color:'var(--text-faint)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {yukleniyor ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-faint)' }}>Yükleniyor...</div>
      ) : (
        <div className="card" style={{ overflow:'auto', padding:0 }}>
          <table style={{ minWidth:1400, fontSize:11 }}>
            <thead>
              <tr style={{ background:'var(--surface-2)', borderBottom:'1px solid var(--border)' }}>
                <th style={{ textAlign:'left', padding:'10px 12px', position:'sticky', left:0, background:'var(--surface-2)', zIndex:2, minWidth:220, borderRight:'1px solid var(--border)' }}>FİRMA</th>
                <th style={{ textAlign:'center', padding:'10px 6px', minWidth:70 }}>TEHLİKE</th>
                <th style={{ textAlign:'center', padding:'10px 6px', minWidth:60 }}>PERİYOT</th>
                <th style={{ textAlign:'center', padding:'10px 6px', minWidth:90, color:'#22c55e', background:'#22c55e11' }}>İGU ATAMA</th>
                <th style={{ textAlign:'center', padding:'10px 6px', minWidth:90, color:'var(--blue)', background:'#3b82f611' }}>DR. ATAMA</th>
                <th style={{ textAlign:'center', padding:'10px 6px', minWidth:90, color:'#f59e0b', background:'#f59e0b11' }}>BHL ATAMA</th>
                {AYLAR.map((ay,i) => (
                  <th key={i} colSpan={2} style={{
                    textAlign:'center', padding:'6px 2px', minWidth:64,
                    color: i===buAy&&yil===buYil ? 'var(--accent)' : 'var(--text-dim)',
                    borderLeft: '1px solid var(--border)',
                    fontWeight: i===buAy&&yil===buYil ? 700 : 500,
                    background: i===buAy&&yil===buYil ? 'rgba(99,102,241,0.06)' : 'transparent'
                  }}>
                    {ay}
                    <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:2 }}>
                      <span style={{ fontSize:9, color:'#22c55e', width:28, textAlign:'center' }}>İGU</span>
                      <span style={{ fontSize:9, color:'var(--blue)', width:28, textAlign:'center' }}>İH</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {firmalar.length === 0 ? (
                <tr><td colSpan={20} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>Firma bulunamadı</td></tr>
              ) : firmalar.map((firma, fi) => {
                const atama = atamaDurumu(firma)
                const satirBg = fi%2===0 ? 'var(--surface)' : 'var(--surface-2)'
                return (
                  <tr key={firma.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'7px 12px', position:'sticky', left:0, background:satirBg, zIndex:1, borderRight:'1px solid var(--border)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: atama==='kirmizi'?'#ef4444':atama==='sari'?'#f59e0b':'#22c55e' }}/>
                        <div>
                          <span style={{ fontWeight:500 }}>{firma.unvan}</span>
                          {firma.sgk_sicil && <div style={{ fontSize:9, color:'var(--text-faint)', marginTop:1, fontFamily:'monospace' }}>{firma.sgk_sicil}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign:'center', padding:'7px 4px' }}>
                      <span style={{ fontSize:10, color: firma.tehlike_sinifi==='Az Tehlikeli'?'var(--green)':firma.tehlike_sinifi==='Çok Tehlikeli'?'var(--red)':'var(--amber)' }}>
                        {firma.tehlike_sinifi==='Az Tehlikeli'?'Az':firma.tehlike_sinifi==='Çok Tehlikeli'?'Çok T.':'Teh.'}
                      </span>
                    </td>
                    <td style={{ textAlign:'center', padding:'7px 4px', color:'var(--text-dim)', fontSize:10 }}>
                      {firma.ih_periyot==='0.5'?'Her ay':firma.ih_periyot==='1.0'?'2 ayda':`${parseFloat(firma.ih_periyot)*2}ayda`}
                    </td>
                    {[
                      { isim: firma.gorevli_igu, durum: firma.igu_atama_durum, tarih: firma.igu_atama_tarihi },
                      { isim: firma.gorevli_ih,  durum: firma.ih_atama_durum,  tarih: firma.ih_atama_tarihi },
                      { isim: firma.bhl_atama,   durum: firma.bhl_atama_durum, tarih: null },
                    ].map((a, i) => {
                      const renk = a.durum === 'onayli' ? '#22c55e' : a.durum === 'bekliyor' ? '#f59e0b' : '#ef4444'
                      const bg = a.durum === 'onayli' ? '#22c55e18' : a.durum === 'bekliyor' ? '#f59e0b18' : '#ef444418'
                      return (
                        <td key={i} style={{ padding:'4px 8px', background: bg }}>
                          <div style={{ fontSize:10, fontWeight:700, color: renk, textAlign:'center' }}>{a.isim || 'YOK'}</div>
                          {a.tarih && <div style={{ fontSize:9, color:'var(--text-faint)', textAlign:'center' }}>{new Date(a.tarih).toLocaleDateString('tr-TR')}</div>}
                        </td>
                      )
                    })}
                    {AYLAR.map((_,ayIdx) => {
                      const iguDurum = ziyaretDurumu(firma, ayIdx, 'igu')
                      const ihDurum = ziyaretDurumu(firma, ayIdx, 'ih')
                      const ayBg = (iguDurum==='gidildi'||ihDurum==='gidildi') ? 'rgba(34,197,94,0.05)'
                               : (iguDurum==='gidilmedi'||ihDurum==='gidilmedi') ? 'rgba(239,68,68,0.05)' : 'transparent'
                      return [
                        <td key={`igu${ayIdx}`} style={{ textAlign:'center', padding:'5px 2px', borderLeft:'1px solid var(--border)', background:ayBg, minWidth:28 }}>
                          <Tick firma={firma} ayIdx={ayIdx} tur="igu"/>
                        </td>,
                        <td key={`ih${ayIdx}`} style={{ textAlign:'center', padding:'5px 2px', background:ayBg, minWidth:28 }}>
                          <Tick firma={firma} ayIdx={ayIdx} tur="ih"/>
                        </td>
                      ]
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display:'flex', gap:16, marginTop:10, fontSize:11 }}>
        {[['#ef4444','KIRMIZI · Atama Yok'],['#f59e0b','SARI · Onay Bekliyor'],['#22c55e','YEŞİL · Atama Onaylı']].map(([r,l],i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:r }}/>
            <span style={{ color:'var(--text-faint)' }}>{l}</span>
          </div>
        ))}
      </div>

      {/* ZİYARET BİLGİ POPUP */}
      {ziyaretBilgi && (
        <div className="modal-overlay" onClick={() => setZiyaretBilgi(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:360 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:17, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                <MapPin size={16} color="#22c55e"/> Ziyaret Detayı
              </h2>
              <button onClick={() => setZiyaretBilgi(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)' }}><X size={20}/></button>
            </div>
            <div style={{ background:'var(--surface-2)', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{ziyaretBilgi.firma.unvan}</div>
              <div style={{ fontSize:13, color:'var(--text-dim)' }}>{AYLAR_FULL[ziyaretBilgi.ayIdx]} {yil} — {ziyaretBilgi.tur === 'igu' ? 'İGU' : 'İH'}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['📅 Tarih', ziyaretBilgi.bilgi?.tarih ? new Date(ziyaretBilgi.bilgi.tarih + 'T00:00:00').toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : '—'],
                ['👤 Ziyaret Eden', ziyaretBilgi.bilgi?.ziyaret_eden || '—'],
                ['⚙️ Operasyon Yapan', ziyaretBilgi.bilgi?.operasyon_yapan || '—'],
                ['📝 Notlar', ziyaretBilgi.bilgi?.notlar || '—'],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display:'flex', gap:10, fontSize:13 }}>
                  <span style={{ color:'var(--text-dim)', minWidth:130, flexShrink:0 }}>{k}</span>
                  <span style={{ fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>
            {yazabilir && (
              <button onClick={async () => {
                if (!confirm('Bu ziyareti silmek istiyor musunuz?')) return
                const ayKey = `${yil}-${String(ziyaretBilgi.ayIdx + 1).padStart(2, '0')}`
                const mevcut = { ...(ziyaretBilgi.firma.aylik_ziyaretler || {}) }
                const mevcutAy = mevcut[ayKey] || {}
                if (mevcutAy.igu !== undefined || mevcutAy.ih !== undefined) {
                  // Yeni format - sadece o türü sil
                  const yeniAy = { ...mevcutAy }
                  delete yeniAy[ziyaretBilgi.tur]
                  if (Object.keys(yeniAy).length === 0) delete mevcut[ayKey]
                  else mevcut[ayKey] = yeniAy
                } else {
                  delete mevcut[ayKey]
                }
                await createClient().from('firmalar').update({ aylik_ziyaretler: mevcut }).eq('id', ziyaretBilgi.firma.id)
                setZiyaretBilgi(null)
                yukle()
              }} style={{ marginTop:16, width:'100%', padding:'10px', borderRadius:9, border:'1px solid var(--red)', background:'var(--red-soft)', color:'var(--red)', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:600 }}>
                🗑️ Ziyareti Sil
              </button>
            )}
          </div>
        </div>
      )}

      {/* ZİYARET EKLE MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{ maxWidth:400 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:18, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                  <MapPin size={17} color="var(--green)"/> Ziyaret Kaydet
                </h2>
                <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:3 }}>
                  {modal.firma.unvan} — {AYLAR_FULL[modal.ayIdx]} {yil} — <strong>{modal.tur === 'igu' ? 'İGU' : 'İH'}</strong>
                </p>
              </div>
              <button onClick={()=>setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)' }}><X size={20}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:12, color:'var(--text-dim)', display:'block', marginBottom:6, fontWeight:500 }}>Tarih</label>
                <input type="date" value={form.tarih} onChange={e=>setForm(f=>({...f,tarih:e.target.value}))}/>
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text-dim)', display:'block', marginBottom:6, fontWeight:500 }}>
                  Operasyon Yapan
                  <span style={{ fontSize:10, color:'var(--text-faint)', marginLeft:6 }}>— fiilen giden uzman</span>
                </label>
                <select value={form.operasyon_yapan_id} onChange={e=>{
                  const p = personeller.find((x:any)=>x.id===e.target.value)
                  setForm(f=>({...f, operasyon_yapan_id:e.target.value, operasyon_yapan:p?.ad_soyad||''}))
                }} style={{ width:'100%', padding:'10px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
                  <option value="">Seçiniz (boş = giriş yapan)...</option>
                  {personeller.filter((p:any)=>['saha','operasyon','yonetici'].includes(p.rol)).map((p:any)=>(
                    <option key={p.id} value={p.id}>{p.ad_soyad} ({p.rol})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text-dim)', display:'block', marginBottom:6, fontWeight:500 }}>Notlar</label>
                <textarea value={form.notlar} onChange={e=>setForm(f=>({...f,notlar:e.target.value}))} placeholder="Ziyaret notu..." rows={3}
                  style={{ width:'100%', padding:'10px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:13, fontFamily:'inherit', resize:'vertical' }}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-ghost btn" style={{ flex:1, justifyContent:'center' }} onClick={()=>setModal(null)}>İptal</button>
                <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={ziyaretEkle} disabled={kayitYukleniyor}>
                  {kayitYukleniyor?'Kaydediliyor...':'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
