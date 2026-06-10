'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Search, X, Wallet, AlertTriangle, Trash2, History } from 'lucide-react'

export default function Tahsilat() {
  const [cariler, setCariler] = useState<any[]>([])
  const [tahsilatlar, setTahsilatlar] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [modal, setModal] = useState(false)
  const [tahsilatModal, setTahsilatModal] = useState<any>(null)
  const [gecmisModal, setGecmisModal] = useState<any>(null)
  const [donemAy, setDonemAy] = useState(() => new Date().toISOString().slice(0,7))
  const [donemTahsilatlar, setDonemTahsilatlar] = useState<any[]>([])
  const [donemGoster, setDonemGoster] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(bosForm())
  const [tForm, setTForm] = useState<any>({ tutar:'', odeme_turu:'Havale', aciklama:'' })

  function bosForm() {
    return { unvan:'', musteri_no:'', telefon:'', sinif:'MERKEZ', musteri_vadesi:'', acik_bakiye:'', vadesi_gecen_tutar:'', gecen_gun_sayisi:'', cek_senet_bakiyesi:'', son_tahsilat:'' }
  }

  const sb = createClient()
  useEffect(() => { yukle() }, [])
  useEffect(() => { donemYukle(donemAy) }, [donemAy])

  async function donemYukle(ay: string) {
    const bas = ay + '-01'
    const son = new Date(parseInt(ay.split('-')[0]), parseInt(ay.split('-')[1]), 0).toISOString().slice(0,10)
    const { data } = await sb.from('tahsilatlar').select('*, cariler(unvan)').gte('tarih', bas).lte('tarih', son).order('tarih', { ascending:false })
    setDonemTahsilatlar(data || [])
  }

  async function yukle() {
    const [cariRes, tahsilatRes] = await Promise.all([
      sb.from('cariler').select('*').order('vadesi_gecen_tutar', { ascending:false }),
      sb.from('tahsilatlar').select('*, cariler(unvan)').order('tarih', { ascending:false }).limit(200)
    ])
    if (cariRes.error) { setHata('Veriler yüklenemedi.'); return }
    setCariler(cariRes.data || [])
    setTahsilatlar(tahsilatRes.data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.unvan) return
    setHata('')
    const { error } = await sb.from('cariler').insert({
      ...form,
      musteri_vadesi: Number(form.musteri_vadesi)||null,
      acik_bakiye: Number(form.acik_bakiye)||0,
      vadesi_gecen_tutar: Number(form.vadesi_gecen_tutar)||0,
      gecen_gun_sayisi: Number(form.gecen_gun_sayisi)||0,
      cek_senet_bakiyesi: Number(form.cek_senet_bakiyesi)||0,
      son_tahsilat: form.son_tahsilat||null
    })
    if (error) { setHata('Kayıt hatası: ' + error.message); return }
    setModal(false); setForm(bosForm()); yukle()
  }

  async function tahsilatYap() {
    const tutar = Number(tForm.tutar)||0
    if (!tutar || !tahsilatModal) return
    setHata('')
    const { error: tErr } = await sb.from('tahsilatlar').insert({
      cari_id: tahsilatModal.id,
      tutar,
      odeme_turu: tForm.odeme_turu,
      aciklama: tForm.aciklama,
      tarih: new Date().toISOString().slice(0,10)
    })
    if (tErr) { setHata('Tahsilat hatası: ' + tErr.message); return }

    const mevcutAcik = Number(tahsilatModal.acik_bakiye)||0
    const mevcutVade = Number(tahsilatModal.vadesi_gecen_tutar)||0
    const yeniBakiye = Math.max(0, mevcutAcik - tutar)
    // Vade aşımını orantılı düş; tamamen kapanmışsa sıfırla
    const yeniVade = mevcutAcik > 0
      ? Math.max(0, mevcutVade * (yeniBakiye / mevcutAcik))
      : 0

    await sb.from('cariler').update({
      acik_bakiye: yeniBakiye,
      vadesi_gecen_tutar: Math.round(yeniVade * 100) / 100,
      gecen_gun_sayisi: yeniBakiye === 0 ? 0 : tahsilatModal.gecen_gun_sayisi,
      son_tahsilat: new Date().toISOString().slice(0,10)
    }).eq('id', tahsilatModal.id)

    setTahsilatModal(null)
    setTForm({ tutar:'', odeme_turu:'Havale', aciklama:'' })
    yukle()
  }

  async function cariSil(id: string) {
    if (!confirm('Bu cariyi silmek istiyor musunuz? Tüm tahsilat geçmişi de silinecek.')) return
    await sb.from('tahsilatlar').delete().eq('cari_id', id)
    await sb.from('cariler').delete().eq('id', id)
    yukle()
  }

  const filtreli = cariler.filter(c => c.unvan?.toLowerCase().includes(arama.toLowerCase()))
  const tl = (n:number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(n) + ' ₺'
  const toplamAcik = filtreli.reduce((s,c)=>s+(Number(c.acik_bakiye)||0),0)
  const toplamVade = filtreli.reduce((s,c)=>s+(Number(c.vadesi_gecen_tutar)||0),0)

  return (
    <div className="page-wrap fade-in" style={{ padding:'28px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora, sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>Tahsilat & Cari</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>Vade aşım listesi</p>
        </div>
        <button className="btn" onClick={()=>setModal(true)}><Plus size={18} /> Yeni Cari</button>
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:6 }}>Toplam Açık Bakiye</div>
          <div style={{ fontFamily:'Sora, sans-serif', fontSize:24, fontWeight:700 }}>{tl(toplamAcik)}</div>
        </div>
        <div className="card" style={{ padding:20, borderColor:'rgba(248,113,113,0.25)' }}>
          <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:6 }}>Vadesi Geçen</div>
          <div style={{ fontFamily:'Sora, sans-serif', fontSize:24, fontWeight:700, color:'var(--red)' }}>{tl(toplamVade)}</div>
        </div>
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:6 }}>Cari Sayısı</div>
          <div style={{ fontFamily:'Sora, sans-serif', fontSize:24, fontWeight:700 }}>{filtreli.length}</div>
        </div>
      </div>

      <div style={{ position:'relative', marginBottom:20, maxWidth:360 }}>
        <Search size={17} style={{ position:'absolute', left:14, top:12, color:'var(--text-faint)' }} />
        <input value={arama} onChange={e=>setArama(e.target.value)} placeholder="Cari ara..." style={{ paddingLeft:40 }} />
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>İsim / Ünvan</th><th>Müş. No</th><th>Sınıf</th><th>Açık Bakiye</th><th>Vadesi Geçen</th><th>Gün</th><th>Çek/Senet</th><th>Son Tahsilat</th><th></th></tr>
            </thead>
            <tbody>
              {yukleniyor ? <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Yükleniyor...</td></tr> :
               filtreli.length === 0 ? <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Cari yok</td></tr> :
               filtreli.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight:500 }}>
                    {c.unvan}
                    {c.telefon && <div style={{ fontSize:12, color:'var(--text-faint)' }}>{c.telefon}</div>}
                  </td>
                  <td style={{ color:'var(--text-dim)', fontSize:12 }}>{c.musteri_no||'—'}</td>
                  <td><span style={{ fontSize:12, color:'var(--text-dim)' }}>{c.sinif}</span></td>
                  <td style={{ fontWeight:600, whiteSpace:'nowrap' }}>{tl(Number(c.acik_bakiye)||0)}</td>
                  <td style={{ whiteSpace:'nowrap' }}>
                    {c.vadesi_gecen_tutar > 0
                      ? <span style={{ color:'var(--red)', fontWeight:600 }}>{tl(Number(c.vadesi_gecen_tutar))}</span>
                      : <span style={{ color:'var(--text-faint)' }}>—</span>}
                  </td>
                  <td>
                    {c.gecen_gun_sayisi > 0 && (
                      <span className="badge" style={{
                        background: c.gecen_gun_sayisi>90?'var(--red-soft)':c.gecen_gun_sayisi>30?'var(--amber-soft)':'var(--blue-soft)',
                        color: c.gecen_gun_sayisi>90?'var(--red)':c.gecen_gun_sayisi>30?'var(--amber)':'var(--blue)'
                      }}>
                        {c.gecen_gun_sayisi}g
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace:'nowrap', color:'var(--text-dim)' }}>
                    {c.cek_senet_bakiyesi > 0 ? tl(Number(c.cek_senet_bakiyesi)) : '—'}
                  </td>
                  <td style={{ color:'var(--text-dim)', whiteSpace:'nowrap' }}>
                    {c.son_tahsilat ? new Date(c.son_tahsilat+'T00:00:00').toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn" style={{ padding:'6px 10px', fontSize:12 }} onClick={()=>setTahsilatModal(c)}>Tahsilat</button>
                      <button onClick={()=>setGecmisModal(c)} title="Geçmiş" style={{ background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'6px 8px', cursor:'pointer' }}><History size={14} /></button>
                      <button onClick={()=>cariSil(c.id)} title="Sil" style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DÖNEM TAHSİLAT ANALİZİ */}
      <div className="card" style={{ padding:20, marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:donemGoster?16:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600 }}>Dönem Tahsilat Analizi</h3>
            <input type="month" value={donemAy} onChange={e=>setDonemAy(e.target.value)} style={{ width:'auto', padding:'6px 10px', fontSize:13 }}/>
          </div>
          <button onClick={()=>setDonemGoster(!donemGoster)}
            style={{ padding:'7px 14px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit',
              background:donemGoster?'var(--accent-soft)':'var(--surface-2)',
              border:`1px solid ${donemGoster?'var(--accent)':'var(--border)'}`,
              color:donemGoster?'var(--accent)':'var(--text-dim)' }}>
            {donemGoster?'Gizle':'Göster'}
          </button>
        </div>
        {donemGoster && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:16 }}>
              {[
                { label:'Toplam Tahsilat', val:tl(donemTahsilatlar.reduce((s,t)=>s+(Number(t.tutar)||0),0)), renk:'var(--green)' },
                { label:'İşlem Sayısı', val:donemTahsilatlar.length, renk:'var(--accent)' },
                { label:'Nakit', val:tl(donemTahsilatlar.filter(t=>t.odeme_turu==='Nakit').reduce((s,t)=>s+(Number(t.tutar)||0),0)), renk:'var(--text)' },
                { label:'Havale', val:tl(donemTahsilatlar.filter(t=>t.odeme_turu==='Havale').reduce((s,t)=>s+(Number(t.tutar)||0),0)), renk:'var(--blue)' },
                { label:'Çek/Senet', val:tl(donemTahsilatlar.filter(t=>t.odeme_turu==='Çek'||t.odeme_turu==='Senet').reduce((s,t)=>s+(Number(t.tutar)||0),0)), renk:'var(--amber)' },
              ].map(k=>(
                <div key={k.label} style={{ background:'var(--surface-2)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:4 }}>{k.label}</div>
                  <div style={{ fontWeight:700, color:k.renk, fontFamily:'Sora,sans-serif' }}>{k.val}</div>
                </div>
              ))}
            </div>
            {donemTahsilatlar.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:280, overflowY:'auto' }}>
                {donemTahsilatlar.map(t=>(
                  <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:'var(--surface-2)', borderRadius:8 }}>
                    <div>
                      <div style={{ fontWeight:500, fontSize:14 }}>{t.cariler?.unvan||'—'}</div>
                      <div style={{ fontSize:12, color:'var(--text-dim)' }}>{t.odeme_turu} {t.aciklama?`· ${t.aciklama}`:''}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, color:'var(--green)' }}>{tl(Number(t.tutar))}</div>
                      <div style={{ fontSize:11, color:'var(--text-faint)' }}>{new Date(t.tarih+'T00:00:00').toLocaleDateString('tr-TR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ textAlign:'center', color:'var(--text-faint)', padding:24, fontSize:14 }}>Bu dönemde tahsilat yok</div>}
          </>
        )}
      </div>

      {/* YENİ CARİ MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={modalHead}><h2 style={modalTitle}><Wallet size={20} color="var(--accent)" /> Yeni Cari</h2><button onClick={()=>setModal(false)} style={xBtn}><X size={22} /></button></div>
            <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Ünvan *</label><input value={form.unvan} onChange={e=>setForm({...form, unvan:e.target.value})} /></div>
              <div><label style={lbl}>Müşteri No</label><input value={form.musteri_no} onChange={e=>setForm({...form, musteri_no:e.target.value})} /></div>
              <div><label style={lbl}>Telefon</label><input value={form.telefon} onChange={e=>setForm({...form, telefon:e.target.value})} /></div>
              <div><label style={lbl}>Sınıf</label><input value={form.sinif} onChange={e=>setForm({...form, sinif:e.target.value})} placeholder="MERKEZ / SANDIKLI" /></div>
              <div><label style={lbl}>Müşteri Vadesi (gün)</label><input type="number" value={form.musteri_vadesi} onChange={e=>setForm({...form, musteri_vadesi:e.target.value})} placeholder="30" /></div>
              <div><label style={lbl}>Açık Bakiye</label><input type="number" value={form.acik_bakiye} onChange={e=>setForm({...form, acik_bakiye:e.target.value})} /></div>
              <div><label style={lbl}>Vadesi Geçen</label><input type="number" value={form.vadesi_gecen_tutar} onChange={e=>setForm({...form, vadesi_gecen_tutar:e.target.value})} /></div>
              <div><label style={lbl}>Geçen Gün</label><input type="number" value={form.gecen_gun_sayisi} onChange={e=>setForm({...form, gecen_gun_sayisi:e.target.value})} /></div>
              <div><label style={lbl}>Çek/Senet Bakiyesi</label><input type="number" value={form.cek_senet_bakiyesi} onChange={e=>setForm({...form, cek_senet_bakiyesi:e.target.value})} /></div>
              <div><label style={lbl}>Son Tahsilat Tarihi</label><input type="date" value={form.son_tahsilat} onChange={e=>setForm({...form, son_tahsilat:e.target.value})} /></div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn-ghost btn" style={{ flex:1, justifyContent:'center' }} onClick={()=>setModal(false)}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={kaydet}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* TAHSİLAT MODAL */}
      {tahsilatModal && (
        <div className="modal-overlay" onClick={()=>setTahsilatModal(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={modalHead}><h2 style={modalTitle}><Wallet size={20} color="var(--green)" /> Tahsilat Al</h2><button onClick={()=>setTahsilatModal(null)} style={xBtn}><X size={22} /></button></div>
            <div style={{ background:'var(--surface-2)', borderRadius:10, padding:14, marginBottom:16 }}>
              <div style={{ fontWeight:600 }}>{tahsilatModal.unvan}</div>
              <div style={{ display:'flex', gap:20, marginTop:6, fontSize:13 }}>
                <span style={{ color:'var(--text-dim)' }}>Açık: <strong style={{ color:'var(--text)' }}>{tl(Number(tahsilatModal.acik_bakiye)||0)}</strong></span>
                {tahsilatModal.vadesi_gecen_tutar > 0 && <span style={{ color:'var(--red)' }}>Vadesi geçen: <strong>{tl(Number(tahsilatModal.vadesi_gecen_tutar))}</strong></span>}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={lbl}>Tahsilat Tutarı *</label><input type="number" value={tForm.tutar} onChange={e=>setTForm({...tForm, tutar:e.target.value})} placeholder="0" autoFocus /></div>
              <div><label style={lbl}>Ödeme Türü</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['Nakit','Havale','Çek','Senet','POS'].map(o=>(
                    <button key={o} type="button" onClick={()=>setTForm({...tForm, odeme_turu:o})}
                      style={{ flex:1, minWidth:60, padding:'8px 4px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                        background: tForm.odeme_turu===o ? 'var(--accent-soft)' : 'var(--surface-2)',
                        border:`1px solid ${tForm.odeme_turu===o ? 'var(--accent)' : 'var(--border)'}`,
                        color: tForm.odeme_turu===o ? 'var(--accent)' : 'var(--text-dim)' }}>{o}</button>
                  ))}
                </div>
              </div>
              <div><label style={lbl}>Açıklama</label><input value={tForm.aciklama} onChange={e=>setTForm({...tForm, aciklama:e.target.value})} /></div>
            </div>
            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginTop:12 }}>{hata}</div>}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn-ghost btn" style={{ flex:1, justifyContent:'center' }} onClick={()=>setTahsilatModal(null)}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={tahsilatYap}>Tahsil Et</button>
            </div>
          </div>
        </div>
      )}

      {/* TAHSİLAT GEÇMİŞİ MODAL */}
      {gecmisModal && (
        <div className="modal-overlay" onClick={()=>setGecmisModal(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={modalHead}>
              <h2 style={modalTitle}><History size={20} color="var(--blue)" /> Tahsilat Geçmişi</h2>
              <button onClick={()=>setGecmisModal(null)} style={xBtn}><X size={22} /></button>
            </div>
            <div style={{ fontWeight:600, marginBottom:16 }}>{gecmisModal.unvan}</div>
            {tahsilatlar.filter(t=>t.cari_id===gecmisModal.id).length === 0
              ? <div style={{ color:'var(--text-faint)', textAlign:'center', padding:32 }}>Tahsilat geçmişi yok</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {tahsilatlar.filter(t=>t.cari_id===gecmisModal.id).map(t=>(
                    <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'var(--surface-2)', borderRadius:10 }}>
                      <div>
                        <div style={{ fontWeight:600 }}>{tl(Number(t.tutar))}</div>
                        <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>{t.odeme_turu} {t.aciklama?`· ${t.aciklama}`:''}</div>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-faint)' }}>{new Date(t.tarih+'T00:00:00').toLocaleDateString('tr-TR')}</div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}
    </div>
  )
}

const lbl: any = { display:'block', fontSize:12, color:'var(--text-dim)', marginBottom:6, fontWeight:500 }
const ovl: any = { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
const modalBox: any = { width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', padding:28 }
const modalHead: any = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }
const modalTitle: any = { fontFamily:'Sora, sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
