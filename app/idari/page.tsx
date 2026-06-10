'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, X, ClipboardList, Trash2, AlertCircle } from 'lucide-react'

const KATEGORILER = ['Araç','Ofis','İzin','Proje','Personel','Cihaz','Yazışma','Diğer']
const DURUMLAR = ['Açık','Devam','Tamamlandı','İptal']
const DURUM_RENK: any = { 'Açık':'var(--blue)', 'Devam':'var(--amber)', 'Tamamlandı':'var(--green)', 'İptal':'var(--text-faint)' }

export default function Idari() {
  const [isler, setIsler] = useState<any[]>([])
  const [katFiltre, setKatFiltre] = useState('Hepsi')
  const [durumFiltre, setDurumFiltre] = useState('Aktif') // Aktif = Açık + Devam
  const [modal, setModal] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return { kategori:'Ofis', baslik:'', detay:'', durum:'Açık', son_tarih:'', sorumlu:'' }
  }

  const sb = createClient()
  useEffect(() => { yukle() }, [])

  async function yukle() {
    const { data, error } = await sb.from('idari_isler').select('*').order('created_at', { ascending:false })
    if (error) { setHata('Veriler yüklenemedi.'); return }
    setIsler(data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.baslik) return
    setHata('')
    const { error } = await sb.from('idari_isler').insert({ ...form, son_tarih: form.son_tarih||null })
    if (error) { setHata('Kayıt hatası: ' + error.message); return }
    setModal(false); setForm(bosForm()); yukle()
  }

  async function durumGuncelle(id:string, durum:string) {
    await sb.from('idari_isler').update({ durum }).eq('id', id)
    yukle()
  }

  async function sil(id: string) {
    if (!confirm('Bu kaydı silmek istiyor musunuz?')) return
    await sb.from('idari_isler').delete().eq('id', id)
    yukle()
  }

  function gecmisMi(tarih: string) {
    if (!tarih) return false
    return new Date(tarih) < new Date(new Date().toDateString())
  }

  let filtreli = isler
  if (katFiltre !== 'Hepsi') filtreli = filtreli.filter(i => i.kategori === katFiltre)
  if (durumFiltre === 'Aktif') filtreli = filtreli.filter(i => i.durum === 'Açık' || i.durum === 'Devam')
  else if (durumFiltre !== 'Hepsi') filtreli = filtreli.filter(i => i.durum === durumFiltre)

  const acikSayisi = isler.filter(i=>i.durum==='Açık').length
  const devamSayisi = isler.filter(i=>i.durum==='Devam').length
  const gecmisUyari = isler.filter(i=>i.durum!=='Tamamlandı'&&i.durum!=='İptal'&&gecmisMi(i.son_tarih)).length

  return (
    <div className="page-wrap" >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora, sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>İdari İşler</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{filtreli.length} kayıt</p>
        </div>
        <button className="btn" onClick={()=>setModal(true)}><Plus size={18} /> Yeni Kayıt</button>
      </div>

      {/* ÖZET */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
        <div className="card" style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:22, fontWeight:700, fontFamily:'Sora,sans-serif', color:'var(--blue)' }}>{acikSayisi}</div>
          <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>Açık</div>
        </div>
        <div className="card" style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:22, fontWeight:700, fontFamily:'Sora,sans-serif', color:'var(--amber)' }}>{devamSayisi}</div>
          <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>Devam Ediyor</div>
        </div>
        {gecmisUyari > 0 && (
          <div className="card" style={{ padding:'14px 16px', borderColor:'rgba(248,113,113,0.3)', background:'var(--red-soft)' }}>
            <div style={{ fontSize:22, fontWeight:700, fontFamily:'Sora,sans-serif', color:'var(--red)' }}>{gecmisUyari}</div>
            <div style={{ fontSize:12, color:'var(--red)', marginTop:2 }}>Tarihi Geçmiş</div>
          </div>
        )}
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      {/* FİLTRELER */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        {['Hepsi','Aktif',...DURUMLAR].map(d => (
          <button key={d} onClick={()=>setDurumFiltre(d)}
            style={{ padding:'7px 13px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
              background: durumFiltre===d?'var(--accent-soft)':'var(--surface)',
              border:`1px solid ${durumFiltre===d?'var(--accent)':'var(--border)'}`,
              color: durumFiltre===d?'var(--accent)':'var(--text-dim)' }}>{d}</button>
        ))}
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {['Hepsi',...KATEGORILER].map(k => (
          <button key={k} onClick={()=>setKatFiltre(k)}
            style={{ padding:'6px 12px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
              background: katFiltre===k?'var(--surface-2)':'var(--surface)',
              border:`1px solid ${katFiltre===k?'var(--border-strong)':'var(--border)'}`,
              color: katFiltre===k?'var(--text)':'var(--text-faint)' }}>{k}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
        {yukleniyor ? <div style={{ color:'var(--text-faint)', padding:40 }}>Yükleniyor...</div> :
         filtreli.length === 0 ? <div style={{ color:'var(--text-faint)', padding:40 }}>Kayıt yok</div> :
         filtreli.map(i => {
           const gecmis = gecmisMi(i.son_tarih) && i.durum !== 'Tamamlandı' && i.durum !== 'İptal'
           return (
            <div key={i.id} className="card" style={{ padding:18, borderColor: gecmis ? 'rgba(248,113,113,0.3)' : undefined }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:0.5 }}>{i.kategori}</span>
                  <span style={{ fontWeight:600 }}>{i.baslik}</span>
                </div>
                <span className="badge" style={{ background:`${DURUM_RENK[i.durum]}22`, color:DURUM_RENK[i.durum] }}>{i.durum}</span>
              </div>
              {i.detay && <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:8 }}>{i.detay}</div>}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <div style={{ fontSize:12 }}>
                  {i.sorumlu && <span style={{ color:'var(--text-dim)' }}>{i.sorumlu}</span>}
                  {i.son_tarih && (
                    <span style={{ color: gecmis ? 'var(--red)' : 'var(--text-faint)', marginLeft: i.sorumlu ? 8 : 0, display:'inline-flex', alignItems:'center', gap:4 }}>
                      {gecmis && <AlertCircle size={12} />}
                      {new Date(i.son_tarih+'T00:00:00').toLocaleDateString('tr-TR')}
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <select value={i.durum} onChange={e=>durumGuncelle(i.id, e.target.value)} style={{ width:'auto', padding:'4px 8px', fontSize:12 }}>
                    {DURUMLAR.map(d=><option key={d}>{d}</option>)}
                  </select>
                  <button onClick={()=>sil(i.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
           )
         })}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={modalHead}><h2 style={modalTitle}><ClipboardList size={20} color="var(--accent)" /> Yeni Kayıt</h2><button onClick={()=>setModal(false)} style={xBtn}><X size={22} /></button></div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={lbl}>Kategori</label>
                <select value={form.kategori} onChange={e=>setForm({...form, kategori:e.target.value})}>
                  {KATEGORILER.map(k=><option key={k}>{k}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Başlık *</label><input value={form.baslik} onChange={e=>setForm({...form, baslik:e.target.value})} placeholder="Araç muayene, ofis malzeme..." /></div>
              <div><label style={lbl}>Detay</label><textarea rows={2} value={form.detay} onChange={e=>setForm({...form, detay:e.target.value})} /></div>
              <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Sorumlu</label><input value={form.sorumlu} onChange={e=>setForm({...form, sorumlu:e.target.value})} /></div>
                <div><label style={lbl}>Son Tarih</label><input type="date" value={form.son_tarih} onChange={e=>setForm({...form, son_tarih:e.target.value})} /></div>
                <div><label style={lbl}>Durum</label>
                  <select value={form.durum} onChange={e=>setForm({...form, durum:e.target.value})}>
                    {DURUMLAR.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
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
const modalBox: any = { width:'100%', maxWidth:460, padding:28, maxHeight:'90vh', overflowY:'auto' }
const modalHead: any = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }
const modalTitle: any = { fontFamily:'Sora, sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
