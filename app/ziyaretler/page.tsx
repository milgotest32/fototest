'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { csvIndir } from '@/lib/csvExport'
import { Plus, X, MapPin, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const TUR_RENK: any = { 'İGU':'var(--blue)', 'İH':'var(--green)', 'DSP':'var(--amber)' }

export default function Ziyaretler() {
  const [ziyaretler, setZiyaretler] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [turFiltre, setTurFiltre] = useState('Hepsi')
  const [uzmanFiltre, setUzmanFiltre] = useState('Hepsi')
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [personeller, setPersoneller] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [ay, setAy] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}` })
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return { firma_id:'', ziyaret_eden_id:'', tarih:new Date().toISOString().slice(0,10), tur:'İGU', notlar:'' }
  }

  const sb = createClient()
  useEffect(() => { yukle() }, [ay])

  async function yukle() {
    const [ayBas, ayBit] = ayAraligi(ay)
    const [zRes, fRes, pRes] = await Promise.all([
      sb.from('ziyaretler').select('*, firmalar(unvan, tehlike_sinifi), personeller(ad_soyad, rol)').gte('tarih', ayBas).lte('tarih', ayBit).order('tarih', { ascending:false }),
      (() => { let q = sb.from('firmalar').select('id, unvan, ziyaret_periyodu, tehlike_sinifi, aylik_ziyaretler, gorevli_ih').order('unvan'); if (arama) q = q.ilike('unvan', `%${arama}%`); return q })(),
      sb.from('personeller').select('id, ad_soyad, rol').eq('aktif', true).order('ad_soyad')
    ])
    if (zRes.error) { setHata('Yüklenemedi'); return }
    setZiyaretler(zRes.data || [])
    setFirmalar(fRes.data || [])
    setPersoneller(pRes.data || [])
    setYukleniyor(false)
  }

  function ayAraligi(ayStr: string) {
    const [y, m] = ayStr.split('-').map(Number)
    return [`${ayStr}-01`, new Date(y, m, 0).toISOString().slice(0,10)]
  }

  function ayDegistir(fark: number) {
    const [y, m] = ay.split('-').map(Number)
    const d = new Date(y, m - 1 + fark, 1)
    setAy(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  }

  async function kaydet() {
    if (!form.firma_id || !form.ziyaret_eden_id) { setHata('Firma ve ziyaret eden seçiniz'); return }
    setHata('')
    const personel = personeller.find(p => p.id === form.ziyaret_eden_id)
    const { error } = await sb.from('ziyaretler').insert({
      firma_id: form.firma_id,
      ziyaret_eden_id: form.ziyaret_eden_id,
      ziyaret_eden: personel?.ad_soyad || '',
      tarih: form.tarih,
      tur: form.tur,
      notlar: form.notlar
    })
    if (error) { setHata(error.message); return }

    // aylik_ziyaretler güncelle
    const firma = firmalar.find(f => f.id === form.firma_id)
    if (firma) {
      const mevcut = firma.aylik_ziyaretler || {}
      const ayKey = form.tarih.slice(0,7)
      const guncel = { ...mevcut, [ayKey]: { ...mevcut[ayKey], [form.tur]: (mevcut[ayKey]?.[form.tur] || 0) + 1 } }
      await sb.from('firmalar').update({ aylik_ziyaretler: guncel }).eq('id', form.firma_id)
    }

    setModal(false); setForm(bosForm()); yukle()
  }

  async function sil(z: any) {
    if (!confirm('Silmek istiyor musunuz?')) return
    await sb.from('ziyaretler').delete().eq('id', z.id)
    const firma = firmalar.find(f => f.id === z.firma_id)
    if (firma) {
      const mevcut = firma.aylik_ziyaretler || {}
      const ayKey = z.tarih.slice(0,7)
      const sayac = Math.max(0, (mevcut[ayKey]?.[z.tur] || 1) - 1)
      const guncel = { ...mevcut, [ayKey]: { ...mevcut[ayKey], [z.tur]: sayac } }
      await sb.from('firmalar').update({ aylik_ziyaretler: guncel }).eq('id', z.firma_id)
    }
    yukle()
  }

  const firmaOzet = firmalar.map(f => {
    const fz = ziyaretler.filter(z => z.firma_id === f.id)
    return { ...f, ziyaretler: fz }
  })

  const ayLabel = new Date(ay + '-15').toLocaleDateString('tr-TR', { month:'long', year:'numeric' })

  // Personelleri role göre grupla
  const uzmanlar = personeller.filter(p => ['operasyon','saha','yonetici'].includes(p.rol))
  const filtreli = ziyaretler // server-side  function exportCSV() {
    csvIndir(filtreli.map(z => ({
      'Tarih': z.tarih||'', 'Firma': z.firmalar?.unvan||'', 'Tür': z.tur||'',
      'Ziyaret Eden': z.ziyaret_eden||'', 'Not': z.notlar||'',
    })), 'ziyaretler')
  }
  const hekimler = personeller.filter(p => p.rol === 'hekim')

  return (
    <div className="page-wrap">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 className="page-title">İSG Ziyaretleri</h1>
          <p className="page-sub">{ziyaretler.length} ziyaret · {ayLabel}</p>
        </div>
        <button className="btn" onClick={()=>setModal(true)}><Plus size={18}/> Ziyaret Ekle</button>
      </div>

      <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:'var(--blue-soft)', border:'1px solid rgba(99,102,241,0.1)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <span style={{ fontSize:18, flexShrink:0 }}>💡</span>
        <p style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>ISG Ziyaretleri — Aylık firma ziyaret takibi. Üst tabloda firma bazında İGU, İH, DSP sayıları görünür. Ziyaret eklerken personeli listeden seçin. Her kayıt firmanın aylık sayacına otomatik eklenir.</p>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:16 }}>
        <input value={arama} onChange={e=>setArama(e.target.value)} placeholder="Firma veya kişi ara..." style={{ padding:'9px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13, fontFamily:'inherit', width:180 }}/>
        <select value={turFiltre} onChange={e=>setTurFiltre(e.target.value)} style={{ padding:'9px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
          {['Hepsi','İGU','İH','DSP'].map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={uzmanFiltre} onChange={e=>setUzmanFiltre(e.target.value)} style={{ padding:'9px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
          <option value="Hepsi">Tüm Uzmanlar</option>
          {[...uzmanlar,...hekimler].map((p:any)=><option key={p.id} value={p.ad_soyad}>{p.ad_soyad}</option>)}
        </select>
        <button onClick={exportCSV} style={{ padding:'9px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-dim)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>↓ CSV</button>
      </div>
      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20 }}>
        <button onClick={()=>ayDegistir(-1)} style={navBtn}><ChevronLeft size={18}/></button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:16, minWidth:160, textAlign:'center' }}>{ayLabel}</span>
        <button onClick={()=>ayDegistir(1)} style={navBtn}><ChevronRight size={18}/></button>
      </div>

      {/* FİRMA BAZLI TAKİP */}
      <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:16, fontWeight:600, marginBottom:12 }}>Firma Bazlı Takip</h2>
      <div className="card" style={{ overflow:'hidden', marginBottom:24 }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>Firma</th><th>Tehlike</th><th>Periyot</th><th>Bu Ay İGU</th><th>Bu Ay İH</th><th>Bu Ay DSP</th><th>Toplam</th></tr>
            </thead>
            <tbody>
              {yukleniyor ? <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-faint)', padding:32 }}>Yükleniyor...</td></tr>
               : firmaOzet.map(f => {
                const igu = f.ziyaretler.filter((z:any)=>z.tur==='İGU').length
                const ih = f.ziyaretler.filter((z:any)=>z.tur==='İH').length
                const dsp = f.ziyaretler.filter((z:any)=>z.tur==='DSP').length
                return (
                  <tr key={f.id}>
                    <td style={{ fontWeight:500 }}>{f.unvan}</td>
                    <td><span style={{ fontSize:12, color:f.tehlike_sinifi==='Çok Tehlikeli'?'var(--red)':f.tehlike_sinifi==='Tehlikeli'?'var(--amber)':'var(--green)' }}>{f.tehlike_sinifi}</span></td>
                    <td style={{ color:'var(--text-dim)', fontSize:13 }}>{f.ziyaret_periyodu||'—'}</td>
                    <td><span style={{ background:'var(--blue-soft)', color:'var(--blue)', padding:'3px 10px', borderRadius:6, fontSize:13, fontWeight:600 }}>{igu}</span></td>
                    <td><span style={{ background:'var(--green-soft)', color:'var(--green)', padding:'3px 10px', borderRadius:6, fontSize:13, fontWeight:600 }}>{ih}</span></td>
                    <td><span style={{ background:'var(--amber-soft)', color:'var(--amber)', padding:'3px 10px', borderRadius:6, fontSize:13, fontWeight:600 }}>{dsp}</span></td>
                    <td style={{ fontWeight:700 }}>{igu+ih+dsp}</td>
                    <td>
                      {ih > 0
                        ? <span style={{ color:'var(--green)', fontSize:12, fontWeight:600 }}>✓ Gidildi</span>
                        : f.gorevli_ih
                          ? <span style={{ color:'var(--red)', fontSize:12 }}>✗ {f.gorevli_ih || '—'}</span>
                          : <span style={{ color:'var(--text-faint)', fontSize:12 }}>Atanmamış</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ZİYARET LİSTESİ */}
      <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:16, fontWeight:600, marginBottom:12 }}>Ziyaret Kayıtları</h2>
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>Tarih</th><th>Firma</th><th>Ziyaret Eden</th><th>Rol</th><th>Tür</th><th>Notlar</th><th></th></tr>
            </thead>
            <tbody>
              {yukleniyor ? <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-faint)', padding:32 }}>Yükleniyor...</td></tr>
               : ziyaretler.length === 0 ? <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-faint)', padding:32 }}>Bu ay ziyaret yok</td></tr>
               : filtreli.map(z => (
                <tr key={z.id}>
                  <td style={{ color:'var(--text-dim)', whiteSpace:'nowrap' }}>{new Date(z.tarih+'T00:00:00').toLocaleDateString('tr-TR')}</td>
                  <td style={{ fontWeight:500 }}>{z.firmalar?.unvan||'—'}</td>
                  <td>{z.personeller?.ad_soyad || z.ziyaret_eden || '—'}</td>
                  <td style={{ fontSize:12, color:'var(--text-faint)' }}>{z.personeller?.rol ? (({'yonetici':'Yönetici','operasyon':'Operasyon','hekim':'Hekim','satis':'Satış','muhasebe':'Muhasebe','saha':'Saha'} as Record<string,string>)[String(z.personeller.rol)]||'—') : '—'}</td>
                  <td><span className="badge" style={{ background:`${TUR_RENK[z.tur]}22`, color:TUR_RENK[z.tur] }}>{z.tur}</span></td>
                  <td style={{ color:'var(--text-dim)', fontSize:13 }}>{z.notlar||'—'}</td>
                  <td><button onClick={()=>sil(z)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }}><MapPin size={20} color="var(--blue)"/> Ziyaret Ekle</h2>
              <button onClick={()=>setModal(false)} style={xBtn}><X size={22}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Firma *</label>
                <select value={form.firma_id} onChange={e=>setForm({...form, firma_id:e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {firmalar.map(f=><option key={f.id} value={f.id}>{f.unvan}</option>)}
                </select>
              </div>
              <div className="modal-grid">
                <div>
                  <label style={lbl}>Tarih</label>
                  <input type="date" value={form.tarih} onChange={e=>setForm({...form, tarih:e.target.value})}/>
                </div>
                <div>
                  <label style={lbl}>Tür</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {['İGU','İH','DSP'].map(t=>(
                      <button key={t} type="button" onClick={()=>setForm({...form, tur:t})}
                        style={{ flex:1, padding:'9px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                          background:form.tur===t?`${TUR_RENK[t]}22`:'var(--surface-2)',
                          border:`1px solid ${form.tur===t?TUR_RENK[t]:'var(--border)'}`,
                          color:form.tur===t?TUR_RENK[t]:'var(--text-dim)' }}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label style={lbl}>Ziyaret Eden *</label>
                <select value={form.ziyaret_eden_id} onChange={e=>setForm({...form, ziyaret_eden_id:e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {uzmanlar.length > 0 && <optgroup label="Uzman / Operasyon">{uzmanlar.map(p=><option key={p.id} value={p.id}>{p.ad_soyad}</option>)}</optgroup>}
                  {hekimler.length > 0 && <optgroup label="Hekim">{hekimler.map(p=><option key={p.id} value={p.id}>{p.ad_soyad}</option>)}</optgroup>}
                </select>
              </div>
              <div>
                <label style={lbl}>Notlar</label>
                <textarea rows={2} value={form.notlar} onChange={e=>setForm({...form, notlar:e.target.value})} placeholder="Ziyaret özeti..."/>
              </div>
            </div>
            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginTop:12 }}>{hata}</div>}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }} onClick={()=>setModal(false)}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={kaydet}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const lbl: any = { display:'block', fontSize:12, color:'var(--text-dim)', marginBottom:6, fontWeight:500 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
const navBtn: any = { background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'8px', cursor:'pointer', display:'flex', alignItems:'center' }
