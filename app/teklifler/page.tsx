'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { csvIndir } from '@/lib/csvExport'
import { Plus, Search, X, FileText, Trash2 } from 'lucide-react'

const DURUMLAR = ['Beklemede','Görüşülüyor','Olumlu','Olumsuz']
const DURUM_RENK: any = { Beklemede:'var(--amber)', Görüşülüyor:'var(--blue)', Olumlu:'var(--green)', Olumsuz:'var(--red)' }
const TURLER = ['ISG','Malzeme','Ölçüm','Tarama']
const TUR_RENK: any = { ISG:'var(--accent)', Malzeme:'var(--blue)', Ölçüm:'var(--amber)', Tarama:'var(--green)' }
const TEHLIKE = ['Az Tehlikeli','Tehlikeli','Çok Tehlikeli']
const ILETIM = ['Whatsapp','Mail','Telefon','Yüz yüze']

export default function Teklifler() {
  const [teklifler, setTeklifler] = useState<any[]>([])
  const [mevcutPersonel, setMevcutPersonel] = useState<any>(null)
  const [arama, setArama] = useState('')
  const [turFiltre, setTurFiltre] = useState('Hepsi')
  const [filtre, setFiltre] = useState('Hepsi')
  const [modal, setModal] = useState(false)
  const [detayModal, setDetayModal] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return { tur:'ISG', musteri_unvan:'', yetkili:'', telefon:'', adres:'', firma_detay:'', tehlike_sinifi:'Az Tehlikeli',
      calisan_sayisi:'', teklif_tarihi:new Date().toISOString().slice(0,10), teklif_icerigi:'',
      surec_durumu:'Beklemede', surec_notu:'', iletim_turu:'Whatsapp', iletisim_notu:'' }
  }

  const sb = createClient()
  useEffect(() => { yukle() }, [])

  const debounceRef = useRef<any>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => yukle(), 400)
    return () => clearTimeout(debounceRef.current)
  }, [arama, filtre, turFiltre])


  async function yukle() {
    setYukleniyor(true)
    let q = sb.from('teklifler').select('*').order('created_at', { ascending:false })
    if (arama) q = q.ilike('musteri_unvan', `%${arama}%`)
    if (filtre !== 'Hepsi') q = q.eq('surec_durumu', filtre)
    if (turFiltre !== 'Hepsi') q = q.eq('tur', turFiltre)
    const { data, error } = await q
    if (error) { setHata('Yüklenemedi'); setYukleniyor(false); return }
    setTeklifler(data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.musteri_unvan) return
    setHata('')
    const { error } = await sb.from('teklifler').insert({ ...form, calisan_sayisi:Number(form.calisan_sayisi)||null })
    if (error) { setHata(error.message); return }
    setModal(false); setForm(bosForm()); yukle()
  }

  async function durumGuncelle(id:string, durum:string) {
    await sb.from('teklifler').update({ surec_durumu:durum }).eq('id', id); yukle()
  }

  async function sil(id:string) {
    if (!confirm('Silmek istiyor musunuz?')) return
    await sb.from('teklifler').delete().eq('id', id); yukle()
  }

  function exportCSV() {
    csvIndir(filtreli.map(t => ({
      'Müşteri': t.musteri_unvan||'', 'Yetkili': t.yetkili||'', 'Telefon': t.telefon||'',
      'Adres': t.adres||'', 'Firma Detay': t.firma_detay||'',
      'Tehlike': t.tehlike_sinifi||'', 'Çalışan': t.calisan_sayisi||'',
      'Tür': t.tur||'', 'Teklif Tarihi': t.teklif_tarihi||'',
      'Teklif İçeriği': t.teklif_icerigi||'',
      'Durum': t.surec_durumu||'', 'Süreç Notu': t.surec_notu||'',
      'İletim Türü': t.iletim_turu||'', 'İletişim Notu': t.iletisim_notu||'',
    })), 'teklifler')
  }
  const filtreli = teklifler // server-side
  const sayilar = DURUMLAR.reduce((acc:any,d)=>({ ...acc, [d]:teklifler.filter(t=>t.surec_durumu===d).length }),{})
  const turSayilari = TURLER.reduce((acc:any,t)=>({ ...acc, [t]:teklifler.filter(x=>x.tur===t).length }),{})

  return (
    <div className="page-wrap" >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>Satış Teklifleri</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{filtreli.length} teklif</p>
        </div>
        <button onClick={exportCSV} style={{ padding:'9px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-dim)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>↓ CSV</button>
        <button className="btn" onClick={()=>setModal(true)}><Plus size={18}/> Yeni Teklif</button>
      </div>

      {/* DURUM KARTLARI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:16 }}>
        {DURUMLAR.map(d=>(
          <div key={d} className="card" style={{ padding:'12px 14px', cursor:'pointer', borderColor:filtre===d?DURUM_RENK[d]:undefined }} onClick={()=>setFiltre(filtre===d?'Hepsi':d)}>
            <div style={{ fontSize:22, fontWeight:700, fontFamily:'Sora,sans-serif', color:DURUM_RENK[d] }}>{sayilar[d]}</div>
            <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>{d}</div>
          </div>
        ))}
      </div>

      {/* TÜR FİLTRE */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['Hepsi',...TURLER].map(t=>(
          <button key={t} onClick={()=>setTurFiltre(t)}
            style={{ padding:'6px 14px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
              background: turFiltre===t?(t==='Hepsi'?'var(--accent-soft)':`${TUR_RENK[t]}22`):'var(--surface)',
              border:`1px solid ${turFiltre===t?(t==='Hepsi'?'var(--accent)':TUR_RENK[t]):'var(--border)'}`,
              color: turFiltre===t?(t==='Hepsi'?'var(--accent)':TUR_RENK[t]):'var(--text-dim)' }}>
            {t} {t!=='Hepsi'?`(${turSayilari[t]})` : ''}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:'var(--amber-soft)', border:'1px solid rgba(99,102,241,0.1)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <span style={{ fontSize:18, flexShrink:0 }}>💡</span>
        <p style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>Satış Teklifleri — ISG, Malzeme, Ölçüm ve Tarama tekliflerini takip edin. Durum kartlarına tıklayarak filtreleyin. Kart üzerindeki açılır menüden durumu güncelleyin. Olumlu teklifler Tarama Operasyonlarına aktarılabilir.</p>
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20, alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:240, maxWidth:360 }}>
          <Search size={17} style={{ position:'absolute', left:14, top:12, color:'var(--text-faint)' }}/>
          <input value={arama} onChange={e=>setArama(e.target.value)} placeholder="Müşteri veya yetkili ara..." style={{ paddingLeft:40 }}/>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['Hepsi',...DURUMLAR].map(d=>(
            <button key={d} onClick={()=>setFiltre(d)}
              style={{ padding:'8px 14px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                background:filtre===d?'var(--accent-soft)':'var(--surface)',
                border:`1px solid ${filtre===d?'var(--accent)':'var(--border)'}`,
                color:filtre===d?'var(--accent)':'var(--text-dim)' }}>{d}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Tür</th>
                <th>Müşteri</th>
                <th>Yetkili</th>
                <th>Telefon</th>
                <th>Tehlike</th>
                <th>Çalışan</th>
                <th>Tarih</th>
                <th>İletim</th>
                <th>Durum</th>
                <th>Süreç Notu</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {yukleniyor
                ? <tr><td colSpan={11} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Yükleniyor...</td></tr>
                : filtreli.length === 0
                ? <tr><td colSpan={11} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Teklif yok</td></tr>
                : filtreli.map(t => (
                  <tr key={t.id} style={{ cursor:'pointer' }} onClick={() => setDetayModal(t)}>
                    <td>
                      <span style={{ fontSize:11, background:`${TUR_RENK[t.tur]||'var(--accent)'}22`, color:TUR_RENK[t.tur]||'var(--accent)', padding:'2px 8px', borderRadius:5, fontWeight:600 }}>{t.tur||'ISG'}</span>
                    </td>
                    <td style={{ fontWeight:600 }}>{t.musteri_unvan}</td>
                    <td style={{ color:'var(--text-dim)', fontSize:13 }}>{t.yetkili||'—'}</td>
                    <td style={{ color:'var(--text-dim)', fontSize:13 }}>{t.telefon||'—'}</td>
                    <td style={{ fontSize:12, color:'var(--text-dim)' }}>{t.tehlike_sinifi||'—'}</td>
                    <td style={{ textAlign:'center', color:'var(--text-dim)' }}>{t.calisan_sayisi||'—'}</td>
                    <td style={{ fontSize:12, color:'var(--text-dim)', whiteSpace:'nowrap' }}>{t.teklif_tarihi ? new Date(t.teklif_tarihi+'T00:00:00').toLocaleDateString('tr-TR') : '—'}</td>
                    <td style={{ fontSize:12, color:'var(--text-dim)' }}>{t.iletim_turu||'—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select value={t.surec_durumu} onChange={e => durumGuncelle(t.id, e.target.value)}
                        style={{ width:'auto', padding:'4px 8px', fontSize:12, color:DURUM_RENK[t.surec_durumu], background:'var(--surface-2)', border:'none', borderRadius:6 }}>
                        {DURUMLAR.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize:12, color:'var(--text-dim)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.surec_notu||'—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      {mevcutPersonel?.rol === 'yonetici' && <button onClick={() => sil(t.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14}/></button>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {detayModal && (
        <div className="modal-overlay" onClick={()=>setDetayModal(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={mHead}><h2 style={mTitle}><FileText size={20} color="var(--amber)"/> Teklif Detayı</h2><button onClick={()=>setDetayModal(null)} style={xBtn}><X size={22}/></button></div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[['Tür', detayModal.tur||'ISG'],['Müşteri',detayModal.musteri_unvan],['Yetkili',detayModal.yetkili||'—'],['Telefon',detayModal.telefon||'—'],['Adres',detayModal.adres||'—'],
                ['Firma Detayı',detayModal.firma_detay||'—'],['Tehlike',detayModal.tehlike_sinifi||'—'],['Çalışan',detayModal.calisan_sayisi||'—'],
                ['Teklif Tarihi',detayModal.teklif_tarihi?new Date(detayModal.teklif_tarihi+'T00:00:00').toLocaleDateString('tr-TR'):'—'],
                ['İçerik',detayModal.teklif_icerigi||'—'],['Durum',detayModal.surec_durumu],['Süreç Notu',detayModal.surec_notu||'—'],
                ['İletim',detayModal.iletim_turu||'—'],['İletişim Notu',detayModal.iletisim_notu||'—']
              ].map(([k,v])=>(<div key={k} style={{ display:'flex', gap:12, fontSize:14 }}><span style={{ color:'var(--text-dim)', minWidth:110 }}>{k}</span><span style={{ fontWeight:500 }}>{v}</span></div>))}
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={mHead}><h2 style={mTitle}><FileText size={20} color="var(--amber)"/> Yeni Teklif</h2><button onClick={()=>setModal(false)} style={xBtn}><X size={22}/></button></div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Teklif Türü</label>
              <div style={{ display:'flex', gap:6 }}>
                {TURLER.map(t=>(
                  <button key={t} type="button" onClick={()=>setForm({...form, tur:t})}
                    style={{ flex:1, padding:'8px 4px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                      background:form.tur===t?`${TUR_RENK[t]}22`:'var(--surface-2)',
                      border:`1px solid ${form.tur===t?TUR_RENK[t]:'var(--border)'}`,
                      color:form.tur===t?TUR_RENK[t]:'var(--text-dim)' }}>{t}</button>
                ))}
              </div>
            </div>
            <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Müşteri Ünvanı *</label><input value={form.musteri_unvan} onChange={e=>setForm({...form, musteri_unvan:e.target.value})} /></div>
              <div><label style={lbl}>Yetkili</label><input value={form.yetkili} onChange={e=>setForm({...form, yetkili:e.target.value})} /></div>
              <div><label style={lbl}>Telefon</label><input value={form.telefon} onChange={e=>setForm({...form, telefon:e.target.value})} /></div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Adres</label><input value={form.adres} onChange={e=>setForm({...form, adres:e.target.value})} /></div>
              <div><label style={lbl}>Firma Detayı</label><input value={form.firma_detay} onChange={e=>setForm({...form, firma_detay:e.target.value})} /></div>
              <div><label style={lbl}>Çalışan Sayısı</label><input type="number" value={form.calisan_sayisi} onChange={e=>setForm({...form, calisan_sayisi:e.target.value})} /></div>
              <div><label style={lbl}>Tehlike Sınıfı</label><select value={form.tehlike_sinifi} onChange={e=>setForm({...form, tehlike_sinifi:e.target.value})}>{TEHLIKE.map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label style={lbl}>Teklif Tarihi</label><input type="date" value={form.teklif_tarihi} onChange={e=>setForm({...form, teklif_tarihi:e.target.value})} /></div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Teklif İçeriği</label><input value={form.teklif_icerigi} onChange={e=>setForm({...form, teklif_icerigi:e.target.value})} /></div>
              <div><label style={lbl}>İletim Türü</label><select value={form.iletim_turu} onChange={e=>setForm({...form, iletim_turu:e.target.value})}>{ILETIM.map(i=><option key={i}>{i}</option>)}</select></div>
              <div><label style={lbl}>Durum</label><select value={form.surec_durumu} onChange={e=>setForm({...form, surec_durumu:e.target.value})}>{DURUMLAR.map(d=><option key={d}>{d}</option>)}</select></div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Süreç Notu</label><textarea rows={2} value={form.surec_notu} onChange={e=>setForm({...form, surec_notu:e.target.value})} /></div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>İletişim Notu</label><textarea rows={2} value={form.iletisim_notu} onChange={e=>setForm({...form, iletisim_notu:e.target.value})} /></div>
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
