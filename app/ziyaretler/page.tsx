'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, X, MapPin, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const TUR_RENK: any = { 'İGU':'var(--blue)', 'İH':'var(--green)', 'DSP':'var(--amber)' }

export default function Ziyaretler() {
  const [ziyaretler, setZiyaretler] = useState<any[]>([])
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [ay, setAy] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  })
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return { firma_id:'', tarih: new Date().toISOString().slice(0,10), ziyaret_eden:'', tur:'İGU', notlar:'' }
  }

  const sb = createClient()
  useEffect(() => { yukle() }, [ay])

  async function yukle() {
    const [ayBas, ayBit] = ayAraligi(ay)
    const [zRes, fRes] = await Promise.all([
      sb.from('ziyaretler').select('*, firmalar(unvan, tehlike_sinifi, ziyaret_periyodu)').gte('tarih', ayBas).lte('tarih', ayBit).order('tarih', { ascending:false }),
      sb.from('firmalar').select('id, unvan, ziyaret_periyodu, tehlike_sinifi, gorevli_igu, gorevli_ih, gorevli_dsp, aylik_ziyaretler').order('unvan')
    ])
    if (zRes.error) { setHata('Veriler yüklenemedi.'); return }
    setZiyaretler(zRes.data || [])
    setFirmalar(fRes.data || [])
    setYukleniyor(false)
  }

  function ayAraligi(ayStr: string) {
    const [y, m] = ayStr.split('-').map(Number)
    const bas = `${ayStr}-01`
    const son = new Date(y, m, 0).toISOString().slice(0,10)
    return [bas, son]
  }

  function ayDegistir(fark: number) {
    const [y, m] = ay.split('-').map(Number)
    const d = new Date(y, m - 1 + fark, 1)
    setAy(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  }

  async function kaydet() {
    if (!form.firma_id || !form.ziyaret_eden) return
    setHata('')
    const { error } = await sb.from('ziyaretler').insert(form)
    if (error) { setHata('Kayıt hatası: ' + error.message); return }

    // aylik_ziyaretler JSONB güncelle
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
    if (!confirm('Bu ziyareti silmek istiyor musunuz?')) return
    await sb.from('ziyaretler').delete().eq('id', z.id)
    // aylik_ziyaretler'den düş
    const firma = firmalar.find(f => f.id === z.firma_id)
    if (firma) {
      const mevcut = firma.aylik_ziyaretler || {}
      const ayKey = z.tarih.slice(0,7)
      const sayac = (mevcut[ayKey]?.[z.tur] || 1) - 1
      const guncel = { ...mevcut, [ayKey]: { ...mevcut[ayKey], [z.tur]: Math.max(0, sayac) } }
      await sb.from('firmalar').update({ aylik_ziyaretler: guncel }).eq('id', z.firma_id)
    }
    yukle()
  }

  // Firma bazlı bu ay ziyaret özeti
  const firmaOzet = firmalar.map(f => {
    const fZiyaret = ziyaretler.filter(z => z.firma_id === f.id)
    return { ...f, ziyaretSayisi: fZiyaret.length, ziyaretler: fZiyaret }
  })

  const ayLabel = new Date(ay + '-15').toLocaleDateString('tr-TR', { month:'long', year:'numeric' })

  return (
    <div className="page-wrap fade-in" style={{ padding:'32px 28px', maxWidth:1400, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora, sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>İSG Ziyaretleri</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{ziyaretler.length} ziyaret · {ayLabel}</p>
        </div>
        <button className="btn" onClick={()=>setModal(true)}><Plus size={18} /> Ziyaret Ekle</button>
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      {/* AY NAVİGASYON */}
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:24 }}>
        <button onClick={()=>ayDegistir(-1)} style={navBtn}><ChevronLeft size={18} /></button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:16, minWidth:160, textAlign:'center' }}>{ayLabel}</span>
        <button onClick={()=>ayDegistir(1)} style={navBtn}><ChevronRight size={18} /></button>
      </div>

      {/* FİRMA BAZLI TAKİP */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:16, fontWeight:600, marginBottom:12 }}>Firma Bazlı Takip</h2>
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead>
                <tr><th>Firma</th><th>Tehlike</th><th>Periyot</th><th>Bu Ay İGU</th><th>Bu Ay İH</th><th>Bu Ay DSP</th><th>Toplam</th></tr>
              </thead>
              <tbody>
                {yukleniyor ? <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-faint)', padding:32 }}>Yükleniyor...</td></tr>
                 : firmaOzet.length === 0 ? <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-faint)', padding:32 }}>Firma yok</td></tr>
                 : firmaOzet.map(f => {
                    const igu = f.ziyaretler.filter((z:any)=>z.tur==='İGU').length
                    const ih = f.ziyaretler.filter((z:any)=>z.tur==='İH').length
                    const dsp = f.ziyaretler.filter((z:any)=>z.tur==='DSP').length
                    const toplamSayac = igu + ih + dsp
                    return (
                      <tr key={f.id}>
                        <td style={{ fontWeight:500 }}>{f.unvan}</td>
                        <td><span style={{ fontSize:12, color: f.tehlike_sinifi==='Çok Tehlikeli'?'var(--red)':f.tehlike_sinifi==='Tehlikeli'?'var(--amber)':'var(--green)' }}>{f.tehlike_sinifi}</span></td>
                        <td style={{ color:'var(--text-dim)', fontSize:13 }}>{f.ziyaret_periyodu||'—'}</td>
                        <td><span style={{ background:'var(--blue-soft)', color:'var(--blue)', padding:'3px 10px', borderRadius:6, fontSize:13, fontWeight:600 }}>{igu}</span></td>
                        <td><span style={{ background:'var(--green-soft)', color:'var(--green)', padding:'3px 10px', borderRadius:6, fontSize:13, fontWeight:600 }}>{ih}</span></td>
                        <td><span style={{ background:'var(--amber-soft)', color:'var(--amber)', padding:'3px 10px', borderRadius:6, fontSize:13, fontWeight:600 }}>{dsp}</span></td>
                        <td style={{ fontWeight:700 }}>{toplamSayac}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ZİYARET LİSTESİ */}
      <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:16, fontWeight:600, marginBottom:12 }}>Ziyaret Kayıtları</h2>
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>Tarih</th><th>Firma</th><th>Ziyaret Eden</th><th>Tür</th><th>Notlar</th><th></th></tr>
            </thead>
            <tbody>
              {yukleniyor ? <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-faint)', padding:32 }}>Yükleniyor...</td></tr>
               : ziyaretler.length === 0 ? <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-faint)', padding:32 }}>Bu ay ziyaret yok</td></tr>
               : ziyaretler.map(z => (
                <tr key={z.id}>
                  <td style={{ color:'var(--text-dim)', whiteSpace:'nowrap' }}>{new Date(z.tarih+'T00:00:00').toLocaleDateString('tr-TR')}</td>
                  <td style={{ fontWeight:500 }}>{z.firmalar?.unvan||'—'}</td>
                  <td>{z.ziyaret_eden}</td>
                  <td><span className="badge" style={{ background:`${TUR_RENK[z.tur]}22`, color:TUR_RENK[z.tur] }}>{z.tur}</span></td>
                  <td style={{ color:'var(--text-dim)', fontSize:13 }}>{z.notlar||'—'}</td>
                  <td><button onClick={()=>sil(z)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={modalHead}>
              <h2 style={modalTitle}><MapPin size={20} color="var(--blue)" /> Ziyaret Ekle</h2>
              <button onClick={()=>setModal(false)} style={xBtn}><X size={22} /></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Firma *</label>
                <select value={form.firma_id} onChange={e=>setForm({...form, firma_id:e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {firmalar.map(f=><option key={f.id} value={f.id}>{f.unvan}</option>)}
                </select>
              </div>
              <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Tarih</label>
                  <input type="date" value={form.tarih} onChange={e=>setForm({...form, tarih:e.target.value})} />
                </div>
                <div>
                  <label style={lbl}>Tür</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {['İGU','İH','DSP'].map(t=>(
                      <button key={t} type="button" onClick={()=>setForm({...form, tur:t})}
                        style={{ flex:1, padding:'9px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                          background: form.tur===t ? `${TUR_RENK[t]}22` : 'var(--surface-2)',
                          border:`1px solid ${form.tur===t ? TUR_RENK[t] : 'var(--border)'}`,
                          color: form.tur===t ? TUR_RENK[t] : 'var(--text-dim)' }}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label style={lbl}>Ziyaret Eden *</label>
                <input value={form.ziyaret_eden} onChange={e=>setForm({...form, ziyaret_eden:e.target.value})} placeholder="Uzman adı" />
              </div>
              <div>
                <label style={lbl}>Notlar</label>
                <textarea rows={2} value={form.notlar} onChange={e=>setForm({...form, notlar:e.target.value})} placeholder="Ziyaret özeti..." />
              </div>
            </div>
            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginTop:12 }}>{hata}</div>}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn-ghost btn" style={{ flex:1, justifyContent:'center' }} onClick={()=>setModal(false)}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={kaydet}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl: any = { display:'block', fontSize:12, color:'var(--text-dim)', marginBottom:6, fontWeight:500 }
const ovl: any = { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
const modalBox: any = { width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', padding:28 }
const modalHead: any = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }
const modalTitle: any = { fontFamily:'Sora, sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
const navBtn: any = { background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'8px', cursor:'pointer', display:'flex', alignItems:'center' }
