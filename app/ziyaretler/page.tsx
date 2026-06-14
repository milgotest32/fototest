'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'

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
  const [detayFirma, setDetayFirma] = useState<any>(null)
  const [detayAy, setDetayAy] = useState<number|null>(null)
  const [form, setForm] = useState({ tarih: new Date().toISOString().slice(0,10), tur: 'İGU', notlar: '', fatura: false, operasyon_yapan: '', operasyon_yapan_id: '' })
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false)
  const debounceRef = useRef<any>(null)
  const sb = createClient()

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await sb.from('personeller').select('*').eq('id', data.user.id).single()
        setMevcutPersonel(p || { rol: 'operasyon' })
      } else {
        setMevcutPersonel({ rol: 'operasyon' })
      }
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
      .select('id, unvan, tehlike_sinifi, ih_periyot, gorevli_igu, gorevli_ih, aylik_ziyaretler')
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

  function ayZiyaretSayisi(firma: any, ayIdx: number) {
    const ayKey = `${yil}-${String(ayIdx + 1).padStart(2, '0')}`
    const z = (firma.aylik_ziyaretler || {})[ayKey]
    return z ? (z.sayi || 1) : 0
  }

  function ayFaturaDurumu(firma: any, ayIdx: number) {
    const ayKey = `${yil}-${String(ayIdx + 1).padStart(2, '0')}`
    const z = (firma.aylik_ziyaretler || {})[ayKey]
    return z?.fatura || false
  }

  async function faturaToggle(firma: any, ayIdx: number) {
    const ayKey = `${yil}-${String(ayIdx + 1).padStart(2, '0')}`
    const mevcut = firma.aylik_ziyaretler || {}
    const mevcutAy = mevcut[ayKey] || {}
    const guncel = { ...mevcut, [ayKey]: { ...mevcutAy, fatura: !mevcutAy.fatura } }
    await sb.from('firmalar').update({ aylik_ziyaretler: guncel }).eq('id', firma.id)
    yukle()
  }

  function ziyaretDurumu(firma: any, ayIdx: number) {
    const ayKey = `${yil}-${String(ayIdx + 1).padStart(2, '0')}`
    const periyot = parseFloat(firma.ih_periyot)
    const gidildi = !!(firma.aylik_ziyaretler || {})[ayKey]
    const simdi = new Date()
    const gelecek = yil > simdi.getFullYear() || (yil === simdi.getFullYear() && ayIdx > simdi.getMonth())

    if (gelecek) return 'gelecek'
    if (gidildi) return 'gidildi'

    let gerekirMi = false
    if (periyot <= 0.5) gerekirMi = true
    else if (periyot <= 1.0) gerekirMi = ayIdx % 2 === 0
    else if (periyot <= 2.0) gerekirMi = ayIdx % 4 === 0

    return gerekirMi ? 'gidilmedi' : 'gerekmiyor'
  }

  function atamaDurumu(firma: any) {
    if (!firma.gorevli_igu && !firma.gorevli_ih) return 'kirmizi'
    if (firma.gorevli_igu && firma.gorevli_ih) return 'yesil'
    return 'sari'
  }

  async function ziyaretEkle() {
    if (!detayFirma || detayAy === null) return
    setKayitYukleniyor(true)
    const ayKey = `${yil}-${String(detayAy + 1).padStart(2, '0')}`
    const mevcut = detayFirma.aylik_ziyaretler || {}
    const guncel = { ...mevcut, [ayKey]: { ...mevcut[ayKey], gidildi: true, tarih: form.tarih, tur: form.tur, notlar: form.notlar, fatura: form.fatura || false, operasyon_yapan: form.operasyon_yapan || mevcutPersonel?.ad_soyad || '' } }

    await sb.from('firmalar').update({ aylik_ziyaretler: guncel }).eq('id', detayFirma.id)
    await sb.from('ziyaretler').insert({
      firma_id: detayFirma.id, tarih: form.tarih, tur: form.tur, notlar: form.notlar,
      ziyaret_eden: mevcutPersonel?.ad_soyad || '', ziyaret_eden_id: mevcutPersonel?.id || null,
      operasyon_yapan: form.operasyon_yapan || mevcutPersonel?.ad_soyad || '',
      operasyon_yapan_id: form.operasyon_yapan_id || mevcutPersonel?.id || null,
      fatura_kesildi: form.fatura || false
    })
    setDetayFirma(null); setDetayAy(null)
    yukle()
    setKayitYukleniyor(false)
  }

  const simdi = new Date()
  const buAy = simdi.getMonth()
  const buYil = simdi.getFullYear()
  const rol = mevcutPersonel?.rol || 'operasyon'
  const yazabilir = !['saha'].includes(rol)

  const istatistik = {
    toplam: firmalar.length,
    buAyGidilen: firmalar.filter(f => !!(f.aylik_ziyaretler || {})[`${yil}-${String(buAy+1).padStart(2,'0')}`]).length,
    gidilmemis: firmalar.filter(f => ziyaretDurumu(f, buAy) === 'gidilmedi').length,
    atamasiz: firmalar.filter(f => atamaDurumu(f) === 'kirmizi').length,
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
          <table style={{ minWidth:1100, fontSize:11 }}>
            <thead>
              <tr style={{ background:'var(--surface-2)', borderBottom:'1px solid var(--border)' }}>
                <th style={{ textAlign:'left', padding:'10px 12px', position:'sticky', left:0, background:'var(--surface-2)', zIndex:2, minWidth:220, borderRight:'1px solid var(--border)' }}>FİRMA</th>
                <th style={{ textAlign:'center', padding:'10px 6px', minWidth:70 }}>TEHLİKE</th>
                <th style={{ textAlign:'center', padding:'10px 6px', minWidth:60 }}>PERİYOT</th>
                <th style={{ textAlign:'center', padding:'10px 6px', minWidth:80, color:'var(--blue)' }}>İGU</th>
                <th style={{ textAlign:'center', padding:'10px 6px', minWidth:70, color:'var(--green)' }}>İH</th>
                {AYLAR.map((ay,i) => (
                  <th key={i} colSpan={2} style={{
                    textAlign:'center', padding:'8px 2px', minWidth:72,
                    color: i===buAy&&yil===buYil ? 'var(--accent)' : 'var(--text-dim)',
                    borderLeft: `1px solid var(--border)`,
                    fontWeight: i===buAy&&yil===buYil ? 700 : 500,
                    background: i===buAy&&yil===buYil ? 'rgba(99,102,241,0.06)' : 'transparent'
                  }}>
                    {ay}
                    <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:2 }}>
                      <span style={{ fontSize:9, color:'var(--text-faint)', width:32, textAlign:'center' }}>Sayı</span>
                      <span style={{ fontSize:9, color:'var(--text-faint)', width:32, textAlign:'center' }}>Fat.</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {firmalar.length === 0 ? (
                <tr><td colSpan={17} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>Firma bulunamadı</td></tr>
              ) : firmalar.map((firma, fi) => {
                const atama = atamaDurumu(firma)
                const satirBg = fi%2===0 ? 'var(--surface)' : 'var(--surface-2)'
                const tiklanabilir = rol !== 'saha' || (firma.gorevli_igu?.includes(mevcutPersonel?.ad_soyad) || firma.gorevli_ih?.includes(mevcutPersonel?.ad_soyad))
                return (
                  <tr key={firma.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'7px 12px', position:'sticky', left:0, background:satirBg, zIndex:1, borderRight:'1px solid var(--border)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: atama==='kirmizi'?'#ef4444':atama==='sari'?'#f59e0b':'#22c55e' }}/>
                        <span style={{ fontWeight:500 }}>{firma.unvan}</span>
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
                    <td style={{ textAlign:'center', padding:'7px 4px' }}>
                      <span style={{ fontSize:10, fontWeight:600, color:firma.gorevli_igu?'var(--blue)':'#ef4444' }}>{firma.gorevli_igu||'—'}</span>
                    </td>
                    <td style={{ textAlign:'center', padding:'7px 4px' }}>
                      <span style={{ fontSize:10, fontWeight:600, color:firma.gorevli_ih?'var(--green)':'#ef4444' }}>{firma.gorevli_ih||'—'}</span>
                    </td>
                    {AYLAR.map((_,ayIdx) => {
                      const durum = ziyaretDurumu(firma, ayIdx)
                      const ayKey = `${yil}-${String(ayIdx+1).padStart(2,'0')}`
                      const bilgi = (firma.aylik_ziyaretler||{})[ayKey]
                      const sayi = ayZiyaretSayisi(firma, ayIdx)
                      const fatura = ayFaturaDurumu(firma, ayIdx)
                      const ayBg = durum==='gidildi'?'rgba(34,197,94,0.08)':durum==='gidilmedi'?'rgba(239,68,68,0.06)':'transparent'
                      return [
                        // Sayı hücresi
                        <td key={`s${ayIdx}`} style={{
                          textAlign:'center', padding:'5px 2px', borderLeft:'1px solid var(--border)',
                          background: ayBg, minWidth:32
                        }}>
                          {durum==='gelecek' ? (
                            <div style={{ width:16, height:16, border:'1px dashed var(--border)', borderRadius:3, margin:'0 auto', opacity:0.3 }}/>
                          ) : durum==='gidildi' ? (
                            <div title={bilgi?.tarih?`${bilgi.tarih} · ${bilgi.tur}${bilgi.operasyon_yapan?' · '+bilgi.operasyon_yapan:''}`:''} style={{ width:18, height:18, background:'#22c55e', borderRadius:3, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ color:'white', fontSize:9, fontWeight:700 }}>✓</span>
                            </div>
                          ) : (
                            <div onClick={() => yazabilir?(setDetayFirma(firma),setDetayAy(ayIdx)):null}
                              style={{ width:18, height:18, border:`2px solid ${durum==='gidilmedi'?'#ef4444':'var(--border)'}`, borderRadius:3, margin:'0 auto', cursor:tiklanabilir?'pointer':'default', background:durum==='gidilmedi'?'rgba(239,68,68,0.08)':'transparent' }}/>
                          )}
                        </td>,
                        // Fatura hücresi
                        <td key={`f${ayIdx}`} style={{
                          textAlign:'center', padding:'5px 2px',
                          background: ayBg, minWidth:32
                        }}>
                          {durum==='gelecek' || durum==='gerekmiyor' ? (
                            <div style={{ width:16, height:16, border:'1px dashed var(--border)', borderRadius:3, margin:'0 auto', opacity:0.2 }}/>
                          ) : (
                            <div onClick={() => (yazabilir||rol==='muhasebe')&&durum==='gidildi'?faturaToggle(firma,ayIdx):null}
                              title={fatura?'Fatura kesildi':'Fatura bekleniyor'}
                              style={{ width:18, height:18, border:`2px solid ${fatura?'#f59e0b':'var(--border)'}`, borderRadius:3, margin:'0 auto', cursor:(yazabilir||rol==='muhasebe')&&durum==='gidildi'?'pointer':'default', background:fatura?'rgba(245,158,11,0.3)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              {fatura && <span style={{ color:'#f59e0b', fontSize:9, fontWeight:700 }}>✓</span>}
                            </div>
                          )}
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

      {detayFirma && detayAy!==null && (
        <div className="modal-overlay" onClick={()=>{setDetayFirma(null);setDetayAy(null)}}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{ maxWidth:400 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:18, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                  <MapPin size={17} color="var(--green)"/> Ziyaret Kaydet
                </h2>
                <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:3 }}>{detayFirma.unvan} — {AYLAR_FULL[detayAy]} {yil}</p>
              </div>
              <button onClick={()=>{setDetayFirma(null);setDetayAy(null)}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)' }}><X size={20}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:12, color:'var(--text-dim)', display:'block', marginBottom:6, fontWeight:500 }}>Tarih</label>
                <input type="date" value={form.tarih} onChange={e=>setForm(f=>({...f,tarih:e.target.value}))}/>
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text-dim)', display:'block', marginBottom:6, fontWeight:500 }}>Tür</label>
                <div style={{ display:'flex', gap:8 }}>
                  {['İGU','İH','DSP'].map(t=>(
                    <button key={t} onClick={()=>setForm(f=>({...f,tur:t}))}
                      style={{ flex:1, padding:'9px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                        background:form.tur===t?'var(--accent-soft)':'var(--surface-2)',
                        border:`1px solid ${form.tur===t?'var(--accent)':'var(--border)'}`,
                        color:form.tur===t?'var(--accent)':'var(--text-dim)' }}>{t}</button>
                  ))}
                </div>
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
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--surface-2)', borderRadius:10, border:'1px solid var(--border)' }}>
                <input type="checkbox" id="fatura_cb" checked={form.fatura} onChange={e=>setForm(f=>({...f,fatura:e.target.checked}))} style={{ width:16, height:16, cursor:'pointer' }}/>
                <label htmlFor="fatura_cb" style={{ fontSize:13, color:'var(--text)', cursor:'pointer', fontWeight:500 }}>Fatura kesildi</label>
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text-dim)', display:'block', marginBottom:6, fontWeight:500 }}>Notlar</label>
                <textarea value={form.notlar} onChange={e=>setForm(f=>({...f,notlar:e.target.value}))} placeholder="Ziyaret notu..." rows={3}
                  style={{ width:'100%', padding:'10px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:13, fontFamily:'inherit', resize:'vertical' }}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-ghost btn" style={{ flex:1, justifyContent:'center' }} onClick={()=>{setDetayFirma(null);setDetayAy(null)}}>İptal</button>
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
