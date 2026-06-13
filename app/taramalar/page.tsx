'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { csvIndir } from '@/lib/csvExport'
import { Plus, X, Activity, Trash2, ChevronRight } from 'lucide-react'

const ASAMALAR = ['Planlandı','Tarama Yapıldı','Rapor Hazırlanıyor','Teslim Edildi','Faturalandı','Tahsil Edildi']
const ASAMA_RENK: any = {
  'Planlandı':'var(--blue)', 'Tarama Yapıldı':'var(--amber)',
  'Rapor Hazırlanıyor':'var(--accent)', 'Teslim Edildi':'var(--green)',
  'Faturalandı':'var(--green)', 'Tahsil Edildi':'var(--text-faint)'
}

export default function Taramalar() {
  const [taramalar, setTaramalar] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [asamaFiltre, setAsamaFiltre] = useState('Hepsi')
  const [teklifler, setTeklifler] = useState<any[]>([])
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [filtre, setFiltre] = useState('Hepsi')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return { firma_adi:'', firma_id:'', teklif_id:'', planlanan_tarih:'', gerceklesen_tarih:'', kisi_sayisi:'', ekip:'', asama:'Planlandı', tutar:'', fatura_no:'', rapor_teslim_tarihi:'', tahsilat_tarihi:'', notlar:'' }
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
    let q = sb.from('tarama_operasyonlari').select('*').order('planlanan_tarih', { ascending:false })
    if (arama) q = q.ilike('firma_adi', `%${arama}%`)
    const [tRes, tekRes, fRes] = await Promise.all([
      q,
      sb.from('teklifler').select('id, musteri_unvan, teklif_tarihi').eq('surec_durumu', 'Olumlu').order('created_at', { ascending:false }),
      sb.from('firmalar').select('id, unvan').order('unvan')
    ])
    if (tRes.error) { setHata('Yüklenemedi'); setYukleniyor(false); return }
    setTaramalar(tRes.data || [])
    setTeklifler(tekRes.data || [])
    setFirmalar(fRes.data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.firma_adi) return
    setHata('')
    const { error } = await sb.from('tarama_operasyonlari').insert({
      ...form,
      kisi_sayisi: Number(form.kisi_sayisi)||null,
      tutar: Number(form.tutar)||0,
      teklif_id: form.teklif_id||null,
      firma_id: form.firma_id||null,
      planlanan_tarih: form.planlanan_tarih||null,
      gerceklesen_tarih: form.gerceklesen_tarih||null,
      rapor_teslim_tarihi: form.rapor_teslim_tarihi||null,
      tahsilat_tarihi: form.tahsilat_tarihi||null,
      fatura_no: form.fatura_no||null,
    })
    if (error) { setHata(error.message); return }
    setModal(false); setForm(bosForm()); yukle()
  }

  async function asamaGuncelle(id: string, asama: string) {
    await sb.from('tarama_operasyonlari').update({ asama }).eq('id', id)
    yukle()
  }

  async function sil(id: string) {
    if (!confirm('Silmek istiyor musunuz?')) return
    await sb.from('tarama_operasyonlari').delete().eq('id', id)
    yukle()
  }

  const filtreli = taramalar // server-side  function exportCSV() {
    csvIndir(filtreli.map(t => ({
      'Firma': t.firma_adi||'', 'Planlanan': t.planlanan_tarih||'', 'Gerçekleşen': t.gerceklesen_tarih||'',
      'Kişi Sayısı': t.kisi_sayisi||'', 'Aşama': t.asama||'', 'Tutar': t.tutar||0, 'Fatura No': t.fatura_no||'',
    })), 'taramalar')
  }
  const tl = (n:number) => new Intl.NumberFormat('tr-TR').format(n) + ' ₺'
  const toplamTutar = filtreli.reduce((s,t)=>s+(Number(t.tutar)||0),0)
  const sayilar = ASAMALAR.reduce((acc:any,a) => ({ ...acc, [a]: taramalar.filter(t=>t.asama===a).length }), {})

  return (
    <div className="page-wrap" >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>Sağlık Tarama Operasyonları</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{filtreli.length} operasyon · {tl(toplamTutar)}</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
            <input value={arama} onChange={e=>setArama(e.target.value)} placeholder="Firma ara..." style={{ padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13, fontFamily:'inherit', width:180 }}/>
            <button onClick={exportCSV} style={{ padding:'8px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-dim)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>↓ CSV</button>
          </div>
        </div>
        <button className="btn" onClick={()=>setModal(true)}><Plus size={18}/> Yeni Operasyon</button>
      </div>

      {/* AŞAMA ÖZETİ */}
      <div style={{ display:'flex', gap:0, marginBottom:20, overflow:'hidden', borderRadius:12, border:'1px solid var(--border)' }}>
        {ASAMALAR.map((a,i) => (
          <button key={a} onClick={()=>setFiltre(filtre===a?'Hepsi':a)}
            style={{ flex:1, padding:'10px 6px', border:'none', borderRight: i<ASAMALAR.length-1?'1px solid var(--border)':undefined,
              background: filtre===a ? `${ASAMA_RENK[a]}22` : 'var(--surface)',
              cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:700, color:ASAMA_RENK[a] }}>{sayilar[a]}</div>
            <div style={{ fontSize:10, color:'var(--text-faint)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a}</div>
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:'var(--green-soft)', border:'1px solid rgba(99,102,241,0.1)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <span style={{ fontSize:18, flexShrink:0 }}>💡</span>
        <p style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>Sağlık Tarama Operasyonları — Teklif aşamasından fatura tahsilatına kadar tüm süreci takip edin. Aşama barındaki sayılara tıklayarak filtreleyin. Tablo üzerindeki menüden aşamayı güncelleyebilirsiniz.</p>
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>Firma</th><th>Planlanan</th><th>Gerçekleşen</th><th>Kişi</th><th>Ekip</th><th>Tutar</th><th>Fatura</th><th>Aşama</th><th></th></tr>
            </thead>
            <tbody>
              {yukleniyor ? <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Yükleniyor...</td></tr>
               : filtreli.length === 0 ? <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Operasyon yok</td></tr>
               : filtreli.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight:500 }}>{t.firma_adi}</td>
                  <td style={{ color:'var(--text-dim)', whiteSpace:'nowrap', fontSize:13 }}>{t.planlanan_tarih ? new Date(t.planlanan_tarih+'T00:00:00').toLocaleDateString('tr-TR') : '—'}</td>
                  <td style={{ color:'var(--text-dim)', whiteSpace:'nowrap', fontSize:13 }}>{t.gerceklesen_tarih ? new Date(t.gerceklesen_tarih+'T00:00:00').toLocaleDateString('tr-TR') : '—'}</td>
                  <td style={{ color:'var(--text-dim)' }}>{t.kisi_sayisi||'—'}</td>
                  <td style={{ color:'var(--text-dim)', fontSize:13 }}>{t.ekip||'—'}</td>
                  <td style={{ fontWeight:600, whiteSpace:'nowrap' }}>{t.tutar>0?tl(Number(t.tutar)):'—'}</td>
                  <td style={{ fontSize:12, color:'var(--text-dim)' }}>{t.fatura_no||'—'}</td>
                  <td>
                    <select value={t.asama} onChange={e=>asamaGuncelle(t.id, e.target.value)}
                      style={{ width:'auto', padding:'4px 8px', fontSize:12, color:ASAMA_RENK[t.asama], background:'var(--surface-2)', border:'none', borderRadius:6 }}>
                      {ASAMALAR.map(a=><option key={a} value={a}>{a}</option>)}
                    </select>
                  </td>
                  <td>
                    <button onClick={()=>sil(t.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={mHead}><h2 style={mTitle}><Activity size={20} color="var(--green)"/> Yeni Tarama Operasyonu</h2><button onClick={()=>setModal(false)} style={xBtn}><X size={22}/></button></div>
            <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/3' }}>
                <label style={lbl}>Firma *</label>
                <select value={form.firma_id} onChange={e=>{
                  const f = firmalar.find(x=>x.id===e.target.value)
                  setForm({...form, firma_id:e.target.value, firma_adi:f?.unvan||''})
                }}>
                  <option value="">Seçiniz...</option>
                  {firmalar.map(f=><option key={f.id} value={f.id}>{f.unvan}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/3' }}>
                <label style={lbl}>Bağlı Teklif</label>
                <select value={form.teklif_id} onChange={e=>setForm({...form, teklif_id:e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {teklifler.map(t=><option key={t.id} value={t.id}>{t.musteri_unvan}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Planlanan Tarih</label><input type="date" value={form.planlanan_tarih} onChange={e=>setForm({...form, planlanan_tarih:e.target.value})} /></div>
              <div><label style={lbl}>Gerçekleşen Tarih</label><input type="date" value={form.gerceklesen_tarih} onChange={e=>setForm({...form, gerceklesen_tarih:e.target.value})} /></div>
              <div><label style={lbl}>Kişi Sayısı</label><input type="number" value={form.kisi_sayisi} onChange={e=>setForm({...form, kisi_sayisi:e.target.value})} /></div>
              <div><label style={lbl}>Ekip</label><input value={form.ekip} onChange={e=>setForm({...form, ekip:e.target.value})} placeholder="Doktor + hemşire..." /></div>
              <div><label style={lbl}>Tutar (₺)</label><input type="number" value={form.tutar} onChange={e=>setForm({...form, tutar:e.target.value})} /></div>
              <div><label style={lbl}>Fatura No</label><input value={form.fatura_no} onChange={e=>setForm({...form, fatura_no:e.target.value})} /></div>
              <div><label style={lbl}>Rapor Teslim</label><input type="date" value={form.rapor_teslim_tarihi} onChange={e=>setForm({...form, rapor_teslim_tarihi:e.target.value})} /></div>
              <div><label style={lbl}>Tahsilat Tarihi</label><input type="date" value={form.tahsilat_tarihi} onChange={e=>setForm({...form, tahsilat_tarihi:e.target.value})} /></div>
              <div><label style={lbl}>Aşama</label>
                <select value={form.asama} onChange={e=>setForm({...form, asama:e.target.value})}>
                  {ASAMALAR.map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Notlar</label><textarea rows={2} value={form.notlar} onChange={e=>setForm({...form, notlar:e.target.value})} /></div>
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
const mBox: any = { width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', padding:28 }
const mHead: any = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }
const mTitle: any = { fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
