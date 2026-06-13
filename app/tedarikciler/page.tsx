'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { csvIndir } from '@/lib/csvExport'
import { Plus, X, Truck, Trash2, Pencil } from 'lucide-react'

const KATEGORILER = ['Yangın Güvenliği','Sağlık','Kişisel Koruyucu','Ölçüm','Ofis','Genel']

export default function Tedarikciler() {
  const [tedarikciler, setTedarikciler] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [katFiltre, setKatFiltre] = useState('Hepsi')
  const [modal, setModal] = useState(false)
  const [duzenle, setDuzenle] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return { unvan:'', yetkili:'', telefon:'', email:'', adres:'', kategori:'Genel', notlar:'' }
  }

  const filtreli = tedarikciler // server-side filtre aktif  function exportCSV() {
    csvIndir(filtreli.map(t => ({
      'Ünvan': t.unvan||'', 'Yetkili': t.yetkili||'', 'Telefon': t.telefon||'',
      'E-posta': t.email||'', 'Kategori': t.kategori||'',
    })), 'tedarikciler')
  }
  const sb = createClient()
  useEffect(() => { yukle() }, [])

  const debounceRef = useRef<any>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => yukle(), 400)
    return () => clearTimeout(debounceRef.current)
  }, [arama])


  async function yukle() {
    setYukleniyor(true)
    let q = sb.from('tedarikciler').select('*').order('unvan', { ascending:false })
    if (arama) q = q.ilike('unvan', \`%${arama}%\`)
    const { data, error } = await q
    if (error) { setHata('Yüklenemedi'); return }
    setTedarikciler(data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.unvan) return
    setHata('')
    if (duzenle) {
      const { error } = await sb.from('tedarikciler').update(form).eq('id', duzenle.id)
      if (error) { setHata(error.message); return }
      setDuzenle(null)
    } else {
      const { error } = await sb.from('tedarikciler').insert(form)
      if (error) { setHata(error.message); return }
      setModal(false)
    }
    setForm(bosForm()); yukle()
  }

  async function sil(id: string) {
    if (!confirm('Silmek istiyor musunuz?')) return
    await sb.from('tedarikciler').delete().eq('id', id)
    yukle()
  }

  function duzenleAc(t: any) {
    setDuzenle(t)
    setForm({ unvan:t.unvan||'', yetkili:t.yetkili||'', telefon:t.telefon||'', email:t.email||'', adres:t.adres||'', kategori:t.kategori||'Genel', notlar:t.notlar||'' })
  }

  return (
    <div className="page-wrap" >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>Tedarikçiler</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{tedarikciler.length} tedarikçi</p>
        </div>
        <button className="btn" onClick={()=>{ setDuzenle(null); setForm(bosForm()); setModal(true) }}><Plus size={18}/> Yeni Tedarikçi</button>
      </div>

      <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:'var(--blue-soft)', border:'1px solid rgba(99,102,241,0.1)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <span style={{ fontSize:18, flexShrink:0 }}>💡</span>
        <p style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>Tedarikçiler — Malzeme ve hizmet tedarikçilerinin listesi. Malzemeler sayfasında tedarikçi seçiminde kullanılır. ✏️ ile düzenleyebilir, 🗑️ ile silebilirsiniz.</p>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:16 }}>
        <input value={arama} onChange={e=>setArama(e.target.value)} placeholder="Tedarikçi ara..." style={{ padding:'9px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13, fontFamily:'inherit', width:180 }}/>
        <select value={katFiltre} onChange={e=>setKatFiltre(e.target.value)} style={{ padding:'9px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
          {['Hepsi','Genel','Yangın','KKD','Tıbbi','İnşaat','Yazılım'].map(k=><option key={k}>{k}</option>)}
        </select>
        <button onClick={exportCSV} style={{ padding:'9px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-dim)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>↓ CSV</button>
      </div>
      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
        {yukleniyor ? <div style={{ color:'var(--text-faint)', padding:40 }}>Yükleniyor...</div>
         : tedarikciler.length === 0 ? <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-faint)', gridColumn:'1/-1' }}>Tedarikçi yok</div>
         : filtreli.map(t => (
          <div key={t.id} className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:15 }}>{t.unvan}</div>
                {t.kategori && <span style={{ fontSize:11, background:'var(--accent-soft)', color:'var(--accent)', padding:'2px 8px', borderRadius:5, marginTop:4, display:'inline-block' }}>{t.kategori}</span>}
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={()=>duzenleAc(t)} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:4 }}><Pencil size={14}/></button>
                <button onClick={()=>sil(t.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14}/></button>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13 }}>
              {t.yetkili && <div><span style={{ color:'var(--text-faint)', marginRight:8 }}>Yetkili</span>{t.yetkili}</div>}
              {t.telefon && <div><span style={{ color:'var(--text-faint)', marginRight:8 }}>Tel</span>{t.telefon}</div>}
              {t.email && <div><span style={{ color:'var(--text-faint)', marginRight:8 }}>E-posta</span>{t.email}</div>}
              {t.adres && <div><span style={{ color:'var(--text-faint)', marginRight:8 }}>Adres</span>{t.adres}</div>}
              {t.notlar && <div style={{ marginTop:6, padding:'8px 10px', background:'var(--surface-2)', borderRadius:7, color:'var(--text-dim)', fontStyle:'italic' }}>{t.notlar}</div>}
            </div>
          </div>
        ))}
      </div>

      {(modal || duzenle) && (
        <div className="modal-overlay" onClick={()=>{ setModal(false); setDuzenle(null) }}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={mHead}><h2 style={mTitle}><Truck size={20} color="var(--blue)"/> {duzenle?'Tedarikçi Düzenle':'Yeni Tedarikçi'}</h2><button onClick={()=>{ setModal(false); setDuzenle(null) }} style={xBtn}><X size={22}/></button></div>
            <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Ünvan *</label><input value={form.unvan} onChange={e=>setForm({...form, unvan:e.target.value})} /></div>
              <div><label style={lbl}>Yetkili</label><input value={form.yetkili} onChange={e=>setForm({...form, yetkili:e.target.value})} /></div>
              <div><label style={lbl}>Telefon</label><input value={form.telefon} onChange={e=>setForm({...form, telefon:e.target.value})} /></div>
              <div><label style={lbl}>E-posta</label><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
              <div><label style={lbl}>Kategori</label><select value={form.kategori} onChange={e=>setForm({...form, kategori:e.target.value})}>{KATEGORILER.map(k=><option key={k}>{k}</option>)}</select></div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Adres</label><input value={form.adres} onChange={e=>setForm({...form, adres:e.target.value})} /></div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Notlar</label><textarea rows={2} value={form.notlar} onChange={e=>setForm({...form, notlar:e.target.value})} /></div>
            </div>
            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginTop:12 }}>{hata}</div>}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn-ghost btn" style={{ flex:1, justifyContent:'center' }} onClick={()=>{ setModal(false); setDuzenle(null) }}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={kaydet}>{duzenle?'Güncelle':'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const lbl: any = { display:'block', fontSize:12, color:'var(--text-dim)', marginBottom:6, fontWeight:500 }
const ovl: any = { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
const mBox: any = { width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', padding:28 }
const mHead: any = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }
const mTitle: any = { fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
