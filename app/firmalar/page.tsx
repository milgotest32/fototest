'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Search, X, Building2, Trash2, Pencil } from 'lucide-react'

const TEHLIKE_RENK: any = { 'Az Tehlikeli':'var(--green)', 'Tehlikeli':'var(--amber)', 'Çok Tehlikeli':'var(--red)' }
const TEHLIKE = ['Az Tehlikeli','Tehlikeli','Çok Tehlikeli']

export default function Firmalar() {
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [modal, setModal] = useState(false)
  const [duzenle, setDuzenle] = useState<any>(null)
  const [detay, setDetay] = useState<any>(null)
  const [sekme, setSekme] = useState<'temel'|'atama'|'ucret'|'ziyaret'>('temel')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return {
      unvan:'', isg_katip_unvan:'', yetkili:'', telefon:'', adres:'', bolge:'', faaliyet:'',
      tehlike_sinifi:'Az Tehlikeli', sgk_sicil:'', calisan_sayisi:'', plan_sayi:'',
      fatura: false, fatura_aciklama:'', klasor:'', cari_sozlesme: false,
      gorevli_igu:'', igu_atama_tarihi:'', gorevli_ih:'', ih_atama_tarihi:'',
      gorevli_dsp:'', bhl_atama:'', atama_aciklama:'', dr_sure:'', uzman_sure:'',
      ziyaret_periyodu:'', gorevli_ih_giden:'', ih_periyot:'',
      kisi_basi_ucret:'', kisi_basi_ucret_yeni:'', paket_3000:'', paket_3434:''
    }
  }

  const sb = createClient()
  useEffect(() => { yukle() }, [])

  async function yukle() {
    const { data, error } = await sb.from('firmalar').select('*').order('unvan')
    if (error) { setHata('Yüklenemedi'); return }
    setFirmalar(data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.unvan) return
    setHata('')
    const payload = {
      ...form,
      calisan_sayisi: Number(form.calisan_sayisi)||null,
      plan_sayi: Number(form.plan_sayi)||null,
      dr_sure: Number(form.dr_sure)||null,
      uzman_sure: Number(form.uzman_sure)||null,
      kisi_basi_ucret: Number(form.kisi_basi_ucret)||0,
      kisi_basi_ucret_yeni: Number(form.kisi_basi_ucret_yeni)||0,
      paket_3000: Number(form.paket_3000)||0,
      paket_3434: Number(form.paket_3434)||0,
      igu_atama_tarihi: form.igu_atama_tarihi||null,
      ih_atama_tarihi: form.ih_atama_tarihi||null,
    }
    if (duzenle) {
      const { error } = await sb.from('firmalar').update(payload).eq('id', duzenle.id)
      if (error) { setHata(error.message); return }
      setDuzenle(null)
    } else {
      const { error } = await sb.from('firmalar').insert(payload)
      if (error) { setHata(error.message); return }
      setModal(false)
    }
    setForm(bosForm()); yukle()
  }

  async function sil(id: string) {
    if (!confirm('Silmek istiyor musunuz?')) return
    await sb.from('firmalar').delete().eq('id', id); yukle()
  }

  function duzenleAc(f: any) {
    setDuzenle(f)
    setSekme('temel')
    setForm({
      unvan: f.unvan||'', isg_katip_unvan: f.isg_katip_unvan||'', yetkili: f.yetkili||'',
      telefon: f.telefon||'', adres: f.adres||'', bolge: f.bolge||'', faaliyet: f.faaliyet||'',
      tehlike_sinifi: f.tehlike_sinifi||'Az Tehlikeli', sgk_sicil: f.sgk_sicil||'',
      calisan_sayisi: f.calisan_sayisi?.toString()||'', plan_sayi: f.plan_sayi?.toString()||'',
      fatura: f.fatura||false, fatura_aciklama: f.fatura_aciklama||'', klasor: f.klasor||'',
      cari_sozlesme: f.cari_sozlesme||false,
      gorevli_igu: f.gorevli_igu||'', igu_atama_tarihi: f.igu_atama_tarihi||'',
      gorevli_ih: f.gorevli_ih||'', ih_atama_tarihi: f.ih_atama_tarihi||'',
      gorevli_dsp: f.gorevli_dsp||'', bhl_atama: f.bhl_atama||'',
      atama_aciklama: f.atama_aciklama||'', dr_sure: f.dr_sure?.toString()||'',
      uzman_sure: f.uzman_sure?.toString()||'', ziyaret_periyodu: f.ziyaret_periyodu||'',
      gorevli_ih_giden: f.gorevli_ih_giden||'', ih_periyot: f.ih_periyot||'',
      kisi_basi_ucret: f.kisi_basi_ucret?.toString()||'',
      kisi_basi_ucret_yeni: f.kisi_basi_ucret_yeni?.toString()||'',
      paket_3000: f.paket_3000?.toString()||'', paket_3434: f.paket_3434?.toString()||''
    })
  }

  const filtreli = firmalar.filter(f =>
    f.unvan?.toLowerCase().includes(arama.toLowerCase()) ||
    f.bolge?.toLowerCase().includes(arama.toLowerCase()) ||
    f.faaliyet?.toLowerCase().includes(arama.toLowerCase())
  )

  const tl = (n:number) => n > 0 ? new Intl.NumberFormat('tr-TR').format(n) + ' ₺' : '—'

  const SEKMELER: {key: 'temel'|'atama'|'ucret'|'ziyaret', label: string}[] = [
    { key:'temel', label:'Temel Bilgiler' },
    { key:'atama', label:'Atama' },
    { key:'ucret', label:'Ücretlendirme' },
    { key:'ziyaret', label:'Ziyaret' },
  ]

  return (
    <div className="page-wrap fade-in" style={{ padding:'28px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>Firmalar</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{filtreli.length} firma</p>
        </div>
        <button className="btn" onClick={()=>{ setDuzenle(null); setForm(bosForm()); setSekme('temel'); setModal(true) }}><Plus size={18}/> Yeni Firma</button>
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      <div style={{ position:'relative', marginBottom:20, maxWidth:360 }}>
        <Search size={17} style={{ position:'absolute', left:14, top:12, color:'var(--text-faint)' }}/>
        <input value={arama} onChange={e=>setArama(e.target.value)} placeholder="Firma, bölge veya faaliyet ara..." style={{ paddingLeft:40 }}/>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>Ünvan</th><th>Bölge</th><th>Tehlike</th><th>Çalışan</th><th>İGU</th><th>İH</th><th>DSP</th><th>Kişi Başı</th><th>Fatura</th><th>Periyot</th><th></th></tr>
            </thead>
            <tbody>
              {yukleniyor ? <tr><td colSpan={11} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Yükleniyor...</td></tr>
               : filtreli.length === 0 ? <tr><td colSpan={11} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Firma yok</td></tr>
               : filtreli.map(f => (
                <tr key={f.id} style={{ cursor:'pointer' }} onClick={()=>setDetay(f)}>
                  <td style={{ fontWeight:500 }}>
                    {f.unvan}
                    {f.isg_katip_unvan && f.isg_katip_unvan !== f.unvan && <div style={{ fontSize:11, color:'var(--text-faint)' }}>{f.isg_katip_unvan}</div>}
                  </td>
                  <td style={{ color:'var(--text-dim)' }}>{f.bolge||'—'}</td>
                  <td><span className="badge" style={{ background:`${TEHLIKE_RENK[f.tehlike_sinifi]}22`, color:TEHLIKE_RENK[f.tehlike_sinifi] }}>{f.tehlike_sinifi}</span></td>
                  <td style={{ color:'var(--text-dim)' }}>{f.calisan_sayisi||'—'}</td>
                  <td style={{ color:'var(--text-dim)', fontSize:13 }}>{f.gorevli_igu||'—'}</td>
                  <td style={{ color:'var(--text-dim)', fontSize:13 }}>{f.gorevli_ih||'—'}</td>
                  <td style={{ color:'var(--text-dim)', fontSize:13 }}>{f.gorevli_dsp||'—'}</td>
                  <td style={{ fontSize:13, color:'var(--text-dim)' }}>{tl(Number(f.kisi_basi_ucret)||0)}</td>
                  <td>{f.fatura ? <span style={{ color:'var(--green)', fontSize:12 }}>✓</span> : <span style={{ color:'var(--text-faint)', fontSize:12 }}>—</span>}</td>
                  <td style={{ color:'var(--text-dim)', fontSize:13 }}>{f.ziyaret_periyodu||'—'}</td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>duzenleAc(f)} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:4 }}><Pencil size={14}/></button>
                      <button onClick={()=>sil(f.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAY MODAL */}
      {detay && (
        <div className="modal-overlay" onClick={()=>setDetay(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={mHead}>
              <h2 style={mTitle}><Building2 size={20} color="var(--blue)"/> {detay.unvan}</h2>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>{ setDetay(null); duzenleAc(detay) }} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:6 }}><Pencil size={13}/> Düzenle</button>
                <button onClick={()=>setDetay(null)} style={xBtn}><X size={22}/></button>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:13 }}>
              {[
                ['İSG Katip Ünvan', detay.isg_katip_unvan||'—'],
                ['Yetkili', detay.yetkili||'—'],
                ['Telefon', detay.telefon||'—'],
                ['Bölge', detay.bolge||'—'],
                ['Tehlike', detay.tehlike_sinifi],
                ['SGK Sicil', detay.sgk_sicil||'—'],
                ['Çalışan', detay.calisan_sayisi||'—'],
                ['Plan Sayı', detay.plan_sayi||'—'],
                ['İGU', detay.gorevli_igu||'—'],
                ['İGU Atama', detay.igu_atama_tarihi ? new Date(detay.igu_atama_tarihi).toLocaleDateString('tr-TR') : '—'],
                ['İH', detay.gorevli_ih||'—'],
                ['İH Atama', detay.ih_atama_tarihi ? new Date(detay.ih_atama_tarihi).toLocaleDateString('tr-TR') : '—'],
                ['DSP', detay.gorevli_dsp||'—'],
                ['BHL', detay.bhl_atama||'—'],
                ['Uzman Süre', detay.uzman_sure ? detay.uzman_sure + ' dk' : '—'],
                ['Dr Süre', detay.dr_sure ? detay.dr_sure + ' dk' : '—'],
                ['Uzman Periyot', detay.ziyaret_periyodu||'—'],
                ['İH Giden', detay.gorevli_ih_giden||'—'],
                ['İH Periyot', detay.ih_periyot||'—'],
                ['Kişi Başı', tl(Number(detay.kisi_basi_ucret)||0)],
                ['Kişi Başı (Yeni)', tl(Number(detay.kisi_basi_ucret_yeni)||0)],
                ['Fatura', detay.fatura ? 'Evet' : 'Hayır'],
                ['Sözleşme', detay.cari_sozlesme ? 'Var' : 'Yok'],
                ['Klasör', detay.klasor||'—'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  <span style={{ color:'var(--text-faint)', fontSize:11 }}>{k}</span>
                  <span style={{ fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>
            {detay.atama_aciklama && (
              <div style={{ marginTop:12, padding:'10px 12px', background:'var(--surface-2)', borderRadius:8, fontSize:13, color:'var(--text-dim)' }}>
                <span style={{ color:'var(--text-faint)', fontSize:11, display:'block', marginBottom:4 }}>Atama Açıklaması</span>
                {detay.atama_aciklama}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EKLE / DÜZENLE MODAL */}
      {(modal || duzenle) && (
        <div className="modal-overlay" onClick={()=>{ setModal(false); setDuzenle(null) }}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={mHead}>
              <h2 style={mTitle}><Building2 size={20} color="var(--blue)"/> {duzenle?'Firma Düzenle':'Yeni Firma'}</h2>
              <button onClick={()=>{ setModal(false); setDuzenle(null) }} style={xBtn}><X size={22}/></button>
            </div>

            {/* SEKME */}
            <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
              {SEKMELER.map(s => (
                <button key={s.key} onClick={()=>setSekme(s.key)}
                  style={{ padding:'8px 14px', border:'none', borderBottom:`2px solid ${sekme===s.key?'var(--accent)':'transparent'}`,
                    background:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13,
                    color: sekme===s.key?'var(--accent)':'var(--text-dim)', fontWeight: sekme===s.key?600:400 }}>
                  {s.label}
                </button>
              ))}
            </div>

            {sekme === 'temel' && (
              <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/3' }}><label style={lbl}>Ünvan *</label><input value={form.unvan} onChange={e=>setForm({...form, unvan:e.target.value})} /></div>
                <div style={{ gridColumn:'1/3' }}><label style={lbl}>İSG Katip Ünvanı</label><input value={form.isg_katip_unvan} onChange={e=>setForm({...form, isg_katip_unvan:e.target.value})} /></div>
                <div><label style={lbl}>Yetkili</label><input value={form.yetkili} onChange={e=>setForm({...form, yetkili:e.target.value})} /></div>
                <div><label style={lbl}>Telefon</label><input value={form.telefon} onChange={e=>setForm({...form, telefon:e.target.value})} /></div>
                <div style={{ gridColumn:'1/3' }}><label style={lbl}>Adres</label><input value={form.adres} onChange={e=>setForm({...form, adres:e.target.value})} /></div>
                <div><label style={lbl}>Bölge</label><input value={form.bolge} onChange={e=>setForm({...form, bolge:e.target.value})} /></div>
                <div><label style={lbl}>Faaliyet</label><input value={form.faaliyet} onChange={e=>setForm({...form, faaliyet:e.target.value})} /></div>
                <div><label style={lbl}>Tehlike Sınıfı</label><select value={form.tehlike_sinifi} onChange={e=>setForm({...form, tehlike_sinifi:e.target.value})}>{TEHLIKE.map(t=><option key={t}>{t}</option>)}</select></div>
                <div><label style={lbl}>SGK Sicil No</label><input value={form.sgk_sicil} onChange={e=>setForm({...form, sgk_sicil:e.target.value})} /></div>
                <div><label style={lbl}>Çalışan Sayısı</label><input type="number" value={form.calisan_sayisi} onChange={e=>setForm({...form, calisan_sayisi:e.target.value})} /></div>
                <div><label style={lbl}>Plan Sayısı</label><input type="number" value={form.plan_sayi} onChange={e=>setForm({...form, plan_sayi:e.target.value})} /></div>
                <div><label style={lbl}>Klasör</label><input value={form.klasor} onChange={e=>setForm({...form, klasor:e.target.value})} /></div>
                <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:20 }}>
                  <input type="checkbox" id="fatura" checked={form.fatura} onChange={e=>setForm({...form, fatura:e.target.checked})} style={{ width:16, height:16 }} />
                  <label htmlFor="fatura" style={{ fontSize:13, cursor:'pointer' }}>Fatura Kesiliyor</label>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:20 }}>
                  <input type="checkbox" id="sozlesme" checked={form.cari_sozlesme} onChange={e=>setForm({...form, cari_sozlesme:e.target.checked})} style={{ width:16, height:16 }} />
                  <label htmlFor="sozlesme" style={{ fontSize:13, cursor:'pointer' }}>Cari Sözleşme Var</label>
                </div>
                <div style={{ gridColumn:'1/3' }}><label style={lbl}>Fatura Açıklaması</label><input value={form.fatura_aciklama} onChange={e=>setForm({...form, fatura_aciklama:e.target.value})} /></div>
              </div>
            )}

            {sekme === 'atama' && (
              <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>İSG Uzmanı (İGU)</label><input value={form.gorevli_igu} onChange={e=>setForm({...form, gorevli_igu:e.target.value})} /></div>
                <div><label style={lbl}>İGU Atama Tarihi</label><input type="date" value={form.igu_atama_tarihi} onChange={e=>setForm({...form, igu_atama_tarihi:e.target.value})} /></div>
                <div><label style={lbl}>İş Hekimi (İH)</label><input value={form.gorevli_ih} onChange={e=>setForm({...form, gorevli_ih:e.target.value})} /></div>
                <div><label style={lbl}>İH Atama Tarihi</label><input type="date" value={form.ih_atama_tarihi} onChange={e=>setForm({...form, ih_atama_tarihi:e.target.value})} /></div>
                <div><label style={lbl}>DSP</label><input value={form.gorevli_dsp} onChange={e=>setForm({...form, gorevli_dsp:e.target.value})} /></div>
                <div><label style={lbl}>BHL Atama</label><input value={form.bhl_atama} onChange={e=>setForm({...form, bhl_atama:e.target.value})} /></div>
                <div><label style={lbl}>Uzman Süre (dk)</label><input type="number" value={form.uzman_sure} onChange={e=>setForm({...form, uzman_sure:e.target.value})} /></div>
                <div><label style={lbl}>Dr Süre (dk)</label><input type="number" value={form.dr_sure} onChange={e=>setForm({...form, dr_sure:e.target.value})} /></div>
                <div style={{ gridColumn:'1/3' }}><label style={lbl}>Atama Açıklaması</label><textarea rows={2} value={form.atama_aciklama} onChange={e=>setForm({...form, atama_aciklama:e.target.value})} /></div>
              </div>
            )}

            {sekme === 'ucret' && (
              <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Kişi Başı Ücret (₺)</label><input type="number" value={form.kisi_basi_ucret} onChange={e=>setForm({...form, kisi_basi_ucret:e.target.value})} /></div>
                <div><label style={lbl}>Kişi Başı (Yeni) (₺)</label><input type="number" value={form.kisi_basi_ucret_yeni} onChange={e=>setForm({...form, kisi_basi_ucret_yeni:e.target.value})} /></div>
                <div><label style={lbl}>Paket 3000 (₺)</label><input type="number" value={form.paket_3000} onChange={e=>setForm({...form, paket_3000:e.target.value})} /></div>
                <div><label style={lbl}>Paket 3434 (₺)</label><input type="number" value={form.paket_3434} onChange={e=>setForm({...form, paket_3434:e.target.value})} /></div>
              </div>
            )}

            {sekme === 'ziyaret' && (
              <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Uzman Periyot</label><input value={form.ziyaret_periyodu} onChange={e=>setForm({...form, ziyaret_periyodu:e.target.value})} placeholder="Aylık / 3 Aylık" /></div>
                <div><label style={lbl}>İH Giden</label><input value={form.gorevli_ih_giden} onChange={e=>setForm({...form, gorevli_ih_giden:e.target.value})} /></div>
                <div><label style={lbl}>İH Periyot</label><input value={form.ih_periyot} onChange={e=>setForm({...form, ih_periyot:e.target.value})} placeholder="Aylık / 3 Aylık" /></div>
              </div>
            )}

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
const mBox: any = { width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', padding:28 }
const mHead: any = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }
const mTitle: any = { fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
