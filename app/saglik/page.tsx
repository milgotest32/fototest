'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Search, X, HeartPulse, Trash2 } from 'lucide-react'

const TETKIKLER = ['EK2','AKC','ODİO','SFT','EKG','CBC','AST','ALT','ÜRE','KREATİNİN','GLUKOZ','BURUN','BOĞAZ']
const ODEME = ['Cari','İBAN','Peşin','POS']
const ODEME_RENK: any = { Cari:'var(--amber)', İBAN:'var(--blue)', Peşin:'var(--green)', POS:'var(--accent)' }

export default function Saglik() {
  const [kayitlar, setKayitlar] = useState<any[]>([])
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [modal, setModal] = useState(false)
  const [detay, setDetay] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return { tarih:new Date().toISOString().slice(0,10), ad_soyad:'', dogum_tarihi:'', telefon:'', firma:'', firma_id:'', ucret:'', odeme_sekli:'Peşin', tetkikler:{} }
  }

  const sb = createClient()
  useEffect(() => { yukle() }, [])

  async function yukle() {
    const [kRes, fRes] = await Promise.all([
      sb.from('hasta_kayitlari').select('*').order('tarih', { ascending:false }).limit(500),
      sb.from('firmalar').select('id, unvan').order('unvan')
    ])
    if (kRes.error) { setHata('Yüklenemedi'); return }
    setKayitlar(kRes.data || [])
    setFirmalar(fRes.data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.ad_soyad) return
    setHata('')
    const { error } = await sb.from('hasta_kayitlari').insert({
      ...form, ucret:Number(form.ucret)||0,
      dogum_tarihi:form.dogum_tarihi||null,
      firma_id:form.firma_id||null
    })
    if (error) { setHata(error.message); return }
    setModal(false); setForm(bosForm()); yukle()
  }

  async function sil(id:string) {
    if (!confirm('Silmek istiyor musunuz?')) return
    await sb.from('hasta_kayitlari').delete().eq('id', id); yukle()
  }

  function toggleTetkik(t:string) {
    setForm((f:any) => ({ ...f, tetkikler:{ ...f.tetkikler, [t]:!f.tetkikler[t] } }))
  }

  const filtreli = kayitlar.filter(k =>
    k.ad_soyad?.toLowerCase().includes(arama.toLowerCase()) ||
    k.firma?.toLowerCase().includes(arama.toLowerCase())
  )
  const tl = (n:number) => new Intl.NumberFormat('tr-TR').format(n) + ' ₺'
  const toplamCiro = filtreli.reduce((s,k)=>s+(Number(k.ucret)||0),0)

  return (
    <div className="page-wrap" >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>Sağlık Tarama</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{filtreli.length} kayıt · Toplam {tl(toplamCiro)}</p>
        </div>
        <button className="btn" onClick={()=>setModal(true)}><Plus size={18}/> Yeni Kayıt</button>
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      <div style={{ position:'relative', marginBottom:20, maxWidth:360 }}>
        <Search size={17} style={{ position:'absolute', left:14, top:12, color:'var(--text-faint)' }}/>
        <input value={arama} onChange={e=>setArama(e.target.value)} placeholder="Hasta veya firma ara..." style={{ paddingLeft:40 }}/>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead><tr><th>Tarih</th><th>Ad Soyad</th><th>D. Tarihi</th><th>Firma</th><th>Ücret</th><th>Ödeme</th><th>Tetkikler</th><th></th></tr></thead>
            <tbody>
              {yukleniyor ? <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Yükleniyor...</td></tr>
               : filtreli.length === 0 ? <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Kayıt yok</td></tr>
               : filtreli.map(k => {
                const aktifTetkik = Object.entries(k.tetkikler||{}).filter(([,v])=>v).map(([t])=>t)
                return (
                  <tr key={k.id} style={{ cursor:'pointer' }} onClick={()=>setDetay(k)}>
                    <td style={{ color:'var(--text-dim)', whiteSpace:'nowrap' }}>{new Date(k.tarih+'T00:00:00').toLocaleDateString('tr-TR')}</td>
                    <td style={{ fontWeight:500 }}>{k.ad_soyad}</td>
                    <td style={{ color:'var(--text-dim)', whiteSpace:'nowrap' }}>{k.dogum_tarihi?new Date(k.dogum_tarihi+'T00:00:00').toLocaleDateString('tr-TR'):'—'}</td>
                    <td style={{ color:'var(--text-dim)' }}>{k.firma||'—'}</td>
                    <td style={{ fontWeight:600, whiteSpace:'nowrap' }}>{tl(Number(k.ucret)||0)}</td>
                    <td><span className="badge" style={{ background:`${ODEME_RENK[k.odeme_sekli]}22`, color:ODEME_RENK[k.odeme_sekli] }}>{k.odeme_sekli}</span></td>
                    <td><div style={{ display:'flex', gap:4, flexWrap:'wrap', maxWidth:260 }}>{aktifTetkik.length===0?<span style={{ color:'var(--text-faint)' }}>—</span>:aktifTetkik.map(t=><span key={t} style={{ fontSize:10, background:'var(--surface-2)', color:'var(--text-dim)', padding:'2px 7px', borderRadius:5, border:'1px solid var(--border)' }}>{t}</span>)}</div></td>
                    <td onClick={e=>e.stopPropagation()}><button onClick={()=>sil(k.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={15}/></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detay && (
        <div className="modal-overlay" onClick={()=>setDetay(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={mHead}><h2 style={mTitle}><HeartPulse size={20} color="var(--green)"/> Hasta Detayı</h2><button onClick={()=>setDetay(null)} style={xBtn}><X size={22}/></button></div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[['Ad Soyad',detay.ad_soyad],['Doğum Tarihi',detay.dogum_tarihi?new Date(detay.dogum_tarihi+'T00:00:00').toLocaleDateString('tr-TR'):'—'],
                ['Telefon',detay.telefon||'—'],['Firma',detay.firma||'—'],
                ['Tarih',new Date(detay.tarih+'T00:00:00').toLocaleDateString('tr-TR')],
                ['Ücret',tl(Number(detay.ucret)||0)],['Ödeme',detay.odeme_sekli]
              ].map(([k,v])=>(<div key={k} style={{ display:'flex', gap:12, fontSize:14 }}><span style={{ color:'var(--text-dim)', minWidth:110 }}>{k}</span><span style={{ fontWeight:500 }}>{v}</span></div>))}
              <div style={{ display:'flex', gap:12, fontSize:14 }}>
                <span style={{ color:'var(--text-dim)', minWidth:110 }}>Tetkikler</span>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {Object.entries(detay.tetkikler||{}).filter(([,v])=>v).map(([t])=><span key={t} style={{ fontSize:11, background:'var(--green-soft)', color:'var(--green)', padding:'2px 8px', borderRadius:5 }}>{t}</span>)}
                  {Object.values(detay.tetkikler||{}).every(v=>!v) && <span style={{ color:'var(--text-faint)' }}>—</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={mHead}><h2 style={mTitle}><HeartPulse size={20} color="var(--green)"/> Yeni Hasta Kaydı</h2><button onClick={()=>setModal(false)} style={xBtn}><X size={22}/></button></div>
            <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={lbl}>Tarih</label><input type="date" value={form.tarih} onChange={e=>setForm({...form, tarih:e.target.value})} /></div>
              <div><label style={lbl}>Ad Soyad *</label><input value={form.ad_soyad} onChange={e=>setForm({...form, ad_soyad:e.target.value})} placeholder="Hasta adı" /></div>
              <div><label style={lbl}>Doğum Tarihi</label><input type="date" value={form.dogum_tarihi} onChange={e=>setForm({...form, dogum_tarihi:e.target.value})} /></div>
              <div><label style={lbl}>Telefon</label><input value={form.telefon} onChange={e=>setForm({...form, telefon:e.target.value})} placeholder="05..." /></div>
              <div style={{ gridColumn:'1/3' }}>
                <label style={lbl}>Firma</label>
                <select value={form.firma_id} onChange={e=>{
                  const f = firmalar.find(x=>x.id===e.target.value)
                  setForm({...form, firma_id:e.target.value, firma:f?.unvan||''})
                }}>
                  <option value="">Seçiniz veya yazınız...</option>
                  {firmalar.map(f=><option key={f.id} value={f.id}>{f.unvan}</option>)}
                </select>
                {!form.firma_id && <input style={{ marginTop:8 }} value={form.firma} onChange={e=>setForm({...form, firma:e.target.value})} placeholder="Veya firma adını yazın..." />}
              </div>
              <div><label style={lbl}>Ücret (₺)</label><input type="number" value={form.ucret} onChange={e=>setForm({...form, ucret:e.target.value})} /></div>
              <div style={{ gridColumn:'1/3' }}>
                <label style={lbl}>Ödeme Şekli</label>
                <div style={{ display:'flex', gap:8 }}>
                  {ODEME.map(o=>(
                    <button key={o} type="button" onClick={()=>setForm({...form, odeme_sekli:o})}
                      style={{ flex:1, padding:'9px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                        background:form.odeme_sekli===o?`${ODEME_RENK[o]}22`:'var(--surface-2)',
                        border:`1px solid ${form.odeme_sekli===o?ODEME_RENK[o]:'var(--border)'}`,
                        color:form.odeme_sekli===o?ODEME_RENK[o]:'var(--text-dim)' }}>{o}</button>
                  ))}
                </div>
              </div>
            </div>
            <label style={lbl}>Tetkikler</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
              {TETKIKLER.map(t=>{
                const aktif = form.tetkikler[t]
                return <button key={t} type="button" onClick={()=>toggleTetkik(t)}
                  style={{ padding:'7px 13px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                    background:aktif?'var(--green-soft)':'var(--surface-2)',
                    border:`1px solid ${aktif?'var(--green)':'var(--border)'}`,
                    color:aktif?'var(--green)':'var(--text-dim)' }}>{t}</button>
              })}
            </div>
            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:12 }}>{hata}</div>}
            <div style={{ display:'flex', gap:10 }}>
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
const mBox: any = { width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', padding:28 }
const mHead: any = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }
const mTitle: any = { fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
