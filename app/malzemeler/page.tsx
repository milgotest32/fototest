'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, X, Package, Trash2, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from 'lucide-react'

const KATEGORILER = ['Yangın Güvenliği','İlk Yardım','Kişisel Koruyucu','Ölçüm Cihazı','Ofis','Diğer']

export default function Malzemeler() {
  const [malzemeler, setMalzemeler] = useState<any[]>([])
  const [tedarikciler, setTedarikciler] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [hareketModal, setHareketModal] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [katFiltre, setKatFiltre] = useState('Hepsi')
  const [form, setForm] = useState<any>(bosForm())
  const [hForm, setHForm] = useState<any>({ hareket_turu:'Giriş', miktar:'', birim_fiyat:'', aciklama:'' })

  function bosForm() {
    return { ad:'', kategori:'Yangın Güvenliği', birim:'Adet', stok:'', kritik_stok:'', alis_fiyat:'', satis_fiyat:'', tedarikci:'', aciklama:'' }
  }

  const sb = createClient()
  useEffect(() => { yukle() }, [])

  async function yukle() {
    const [mRes, tRes] = await Promise.all([
      sb.from('malzemeler').select('*').order('ad'),
      sb.from('tedarikciler').select('id, unvan').order('unvan')
    ])
    if (mRes.error) { setHata('Yüklenemedi'); return }
    setMalzemeler(mRes.data || [])
    setTedarikciler(tRes.data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.ad) return
    setHata('')
    const { error } = await sb.from('malzemeler').insert({
      ...form,
      stok: Number(form.stok)||0,
      kritik_stok: Number(form.kritik_stok)||0,
      alis_fiyat: Number(form.alis_fiyat)||0,
      satis_fiyat: Number(form.satis_fiyat)||0,
    })
    if (error) { setHata(error.message); return }
    setModal(false); setForm(bosForm()); yukle()
  }

  async function sil(id: string) {
    if (!confirm('Silmek istiyor musunuz?')) return
    await sb.from('malzemeler').delete().eq('id', id)
    yukle()
  }

  async function hareketKaydet() {
    const miktar = Number(hForm.miktar)||0
    if (!miktar || !hareketModal) return
    setHata('')
    await sb.from('malzeme_hareketleri').insert({
      malzeme_id: hareketModal.id,
      hareket_turu: hForm.hareket_turu,
      miktar,
      birim_fiyat: Number(hForm.birim_fiyat)||0,
      aciklama: hForm.aciklama,
      tarih: new Date().toISOString().slice(0,10)
    })
    const yeniStok = hForm.hareket_turu === 'Giriş'
      ? (hareketModal.stok || 0) + miktar
      : Math.max(0, (hareketModal.stok || 0) - miktar)
    await sb.from('malzemeler').update({ stok: yeniStok }).eq('id', hareketModal.id)
    setHareketModal(null)
    setHForm({ hareket_turu:'Giriş', miktar:'', birim_fiyat:'', aciklama:'' })
    yukle()
  }

  const filtreli = katFiltre === 'Hepsi' ? malzemeler : malzemeler.filter(m => m.kategori === katFiltre)
  const kritikler = malzemeler.filter(m => m.stok <= m.kritik_stok && m.kritik_stok > 0)
  const tl = (n:number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits:2 }).format(n) + ' ₺'

  return (
    <div className="page-wrap fade-in" style={{ padding:'28px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>Malzeme Stok</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{filtreli.length} malzeme</p>
        </div>
        <button className="btn" onClick={()=>setModal(true)}><Plus size={18}/> Yeni Malzeme</button>
      </div>

      {kritikler.length > 0 && (
        <div className="card" style={{ padding:'14px 18px', marginBottom:20, borderColor:'rgba(251,191,36,0.3)', background:'var(--amber-soft)', display:'flex', alignItems:'center', gap:12 }}>
          <AlertTriangle size={18} color="var(--amber)"/>
          <span style={{ fontSize:14 }}><strong style={{ color:'var(--amber)' }}>{kritikler.length} malzeme</strong> kritik stok seviyesinde: {kritikler.map(m=>m.ad).join(', ')}</span>
        </div>
      )}

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {['Hepsi',...KATEGORILER].map(k => (
          <button key={k} onClick={()=>setKatFiltre(k)}
            style={{ padding:'7px 13px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
              background: katFiltre===k?'var(--accent-soft)':'var(--surface)',
              border:`1px solid ${katFiltre===k?'var(--accent)':'var(--border)'}`,
              color: katFiltre===k?'var(--accent)':'var(--text-dim)' }}>{k}</button>
        ))}
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>Malzeme</th><th>Kategori</th><th>Stok</th><th>Kritik</th><th>Alış</th><th>Satış</th><th>Tedarikçi</th><th></th></tr>
            </thead>
            <tbody>
              {yukleniyor ? <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Yükleniyor...</td></tr>
               : filtreli.length === 0 ? <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Malzeme yok</td></tr>
               : filtreli.map(m => {
                const kritik = m.kritik_stok > 0 && m.stok <= m.kritik_stok
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight:500 }}>
                      {m.ad}
                      {m.aciklama && <div style={{ fontSize:11, color:'var(--text-faint)' }}>{m.aciklama}</div>}
                    </td>
                    <td style={{ fontSize:12, color:'var(--text-dim)' }}>{m.kategori}</td>
                    <td>
                      <span style={{ fontWeight:700, color: kritik?'var(--red)':'var(--text)' }}>{m.stok}</span>
                      <span style={{ fontSize:11, color:'var(--text-faint)', marginLeft:4 }}>{m.birim}</span>
                    </td>
                    <td style={{ color:'var(--text-dim)', fontSize:13 }}>{m.kritik_stok||'—'}</td>
                    <td style={{ whiteSpace:'nowrap', color:'var(--text-dim)' }}>{m.alis_fiyat>0?tl(m.alis_fiyat):'—'}</td>
                    <td style={{ whiteSpace:'nowrap', fontWeight:500 }}>{m.satis_fiyat>0?tl(m.satis_fiyat):'—'}</td>
                    <td style={{ fontSize:12, color:'var(--text-dim)' }}>{m.tedarikci||'—'}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={()=>{ setHareketModal(m); setHForm({...hForm, hareket_turu:'Giriş'}) }} title="Stok Giriş" style={{ background:'var(--green-soft)', border:'none', color:'var(--green)', borderRadius:7, padding:'5px 8px', cursor:'pointer', display:'flex', alignItems:'center' }}><ArrowUpCircle size={15}/></button>
                        <button onClick={()=>{ setHareketModal(m); setHForm({...hForm, hareket_turu:'Çıkış'}) }} title="Stok Çıkış" style={{ background:'var(--amber-soft)', border:'none', color:'var(--amber)', borderRadius:7, padding:'5px 8px', cursor:'pointer', display:'flex', alignItems:'center' }}><ArrowDownCircle size={15}/></button>
                        <button onClick={()=>sil(m.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOK HAREKET MODAL */}
      {hareketModal && (
        <div className="modal-overlay" onClick={()=>setHareketModal(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={mHead}>
              <h2 style={mTitle}>{hForm.hareket_turu === 'Giriş' ? <ArrowUpCircle size={20} color="var(--green)"/> : <ArrowDownCircle size={20} color="var(--amber)"/>} {hareketModal.ad}</h2>
              <button onClick={()=>setHareketModal(null)} style={xBtn}><X size={22}/></button>
            </div>
            <div style={{ background:'var(--surface-2)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13 }}>
              Mevcut stok: <strong>{hareketModal.stok} {hareketModal.birim}</strong>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              {['Giriş','Çıkış'].map(t => (
                <button key={t} type="button" onClick={()=>setHForm({...hForm, hareket_turu:t})}
                  style={{ flex:1, padding:'9px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                    background: hForm.hareket_turu===t ? (t==='Giriş'?'var(--green-soft)':'var(--amber-soft)') : 'var(--surface-2)',
                    border:`1px solid ${hForm.hareket_turu===t ? (t==='Giriş'?'var(--green)':'var(--amber)') : 'var(--border)'}`,
                    color: hForm.hareket_turu===t ? (t==='Giriş'?'var(--green)':'var(--amber)') : 'var(--text-dim)' }}>{t}</button>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label style={lbl}>Miktar ({hareketModal.birim})</label><input type="number" value={hForm.miktar} onChange={e=>setHForm({...hForm, miktar:e.target.value})} autoFocus /></div>
              <div><label style={lbl}>Birim Fiyat (₺)</label><input type="number" value={hForm.birim_fiyat} onChange={e=>setHForm({...hForm, birim_fiyat:e.target.value})} /></div>
              <div><label style={lbl}>Açıklama</label><input value={hForm.aciklama} onChange={e=>setHForm({...hForm, aciklama:e.target.value})} placeholder="Tedarikçi, fatura no..." /></div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn-ghost btn" style={{ flex:1, justifyContent:'center' }} onClick={()=>setHareketModal(null)}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={hareketKaydet}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* YENİ MALZEME MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={mHead}><h2 style={mTitle}><Package size={20} color="var(--accent)"/> Yeni Malzeme</h2><button onClick={()=>setModal(false)} style={xBtn}><X size={22}/></button></div>
            <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Malzeme Adı *</label><input value={form.ad} onChange={e=>setForm({...form, ad:e.target.value})} placeholder="Yangın tüpü 6kg" /></div>
              <div><label style={lbl}>Kategori</label><select value={form.kategori} onChange={e=>setForm({...form, kategori:e.target.value})}>{KATEGORILER.map(k=><option key={k}>{k}</option>)}</select></div>
              <div><label style={lbl}>Birim</label><select value={form.birim} onChange={e=>setForm({...form, birim:e.target.value})}><option>Adet</option><option>Kg</option><option>Lt</option><option>Kutu</option><option>Paket</option></select></div>
              <div><label style={lbl}>Mevcut Stok</label><input type="number" value={form.stok} onChange={e=>setForm({...form, stok:e.target.value})} /></div>
              <div><label style={lbl}>Kritik Stok</label><input type="number" value={form.kritik_stok} onChange={e=>setForm({...form, kritik_stok:e.target.value})} /></div>
              <div><label style={lbl}>Alış Fiyatı (₺)</label><input type="number" value={form.alis_fiyat} onChange={e=>setForm({...form, alis_fiyat:e.target.value})} /></div>
              <div><label style={lbl}>Satış Fiyatı (₺)</label><input type="number" value={form.satis_fiyat} onChange={e=>setForm({...form, satis_fiyat:e.target.value})} /></div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Tedarikçi</label>
                <select value={form.tedarikci} onChange={e=>setForm({...form, tedarikci:e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {tedarikciler.map(t=><option key={t.id} value={t.unvan}>{t.unvan}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Açıklama</label><input value={form.aciklama} onChange={e=>setForm({...form, aciklama:e.target.value})} /></div>
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
const mBox: any = { width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', padding:28 }
const mHead: any = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }
const mTitle: any = { fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
