'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { csvIndir } from '@/lib/csvExport'
import { Plus, Search, X, Building2, Trash2, Pencil } from 'lucide-react'

const TEHLIKE_RENK: any = { 'Az Tehlikeli':'var(--green)', 'Tehlikeli':'var(--amber)', 'Çok Tehlikeli':'var(--red)' }
const TEHLIKE = ['Az Tehlikeli','Tehlikeli','Çok Tehlikeli']

export default function Firmalar() {
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [personeller, setPersoneller] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [tehlikeFiltre, setTehlikeFiltre] = useState('Hepsi')
  const [bolgeFiltre, setBolgeFiltre] = useState('Hepsi')
  const [modal, setModal] = useState(false)
  const [duzenle, setDuzenle] = useState<any>(null)
  const [detay, setDetay] = useState<any>(null)
  const [sekme, setSekme] = useState<'temel'|'atama'|'ucret'|'ziyaret'|'katip'|'evraklar'>('temel')
  const [evraklar, setEvraklar] = useState<any>(null)
  const [evrakKayit, setEvrakKayit] = useState(false)
  const [katipSozlesmeler, setKatipSozlesmeler] = useState<any[]>([])
  const [katipForm, setKatipForm] = useState<any>(bosKatipForm())
  const [katipYukleniyor, setKatipYukleniyor] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(bosForm())
  const [kulRol, setKulRol] = useState<string>('operasyon')

  function bosKatipForm() {
    return { sozlesme_id:'', sozlesme_turu:'İGU', gorevlendirilen_tc:'', gorevlendirilen_ad:'', sertifika_tipi:'C Sınıfı', sertifika_no:'', calisma_suresi_dk:'', baslangic_tarihi:'', bitis_tarihi:'', sozlesme_durumu:'Devam Ediyor' }
  }

  // sekme değişince katip yükle
  useEffect(() => { if (sekme==='katip' && duzenle) katipYukle(duzenle.id) }, [sekme, duzenle])
  useEffect(() => { if (sekme==='evraklar' && duzenle) evraklarYukle(duzenle.id) }, [sekme, duzenle])

  function bosForm() {
    return {
      unvan:'', isg_katip_unvan:'', yetkili:'', telefon:'', adres:'', bolge:'', faaliyet:'',
      tehlike_sinifi:'Az Tehlikeli', sgk_sicil:'', calisan_sayisi:'', plan_sayi:'',
      fatura: false, fatura_aciklama:'', klasor:'', cari_sozlesme: false,
      gorevli_igu:'', igu_id:'', igu_atama_tarihi:'', gorevli_ih:'', ih_id:'', ih_atama_tarihi:'',
      gorevli_dsp:'', dsp_id:'', bhl_atama:'', atama_aciklama:'', dr_sure:'', uzman_sure:'',
      ziyaret_periyodu:'', gorevli_ih_giden:'', ih_periyot:'',
      kisi_basi_ucret:'', kisi_basi_ucret_yeni:'', paket_2808:'', paket_3000:'', paket_3434:''
    }
  }

  const sb = createClient()
  const debounceRef = useRef<any>(null)

  useEffect(() => {
    sb.from('personeller').select('id, ad_soyad, rol').eq('aktif', true).order('ad_soyad')
      .then(({ data }) => setPersoneller(data || []))
    sb.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await sb.from('personeller').select('rol').eq('id', data.user.id).single()
        setKulRol(p?.rol || 'operasyon')
      }
    })
    yukle()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => yukle(), 400)
    return () => clearTimeout(debounceRef.current)
  }, [arama, tehlikeFiltre, bolgeFiltre])

  async function yukle() {
    setYukleniyor(true)
    let q = sb.from('firmalar').select('*').order('unvan')
    if (arama) q = q.ilike('unvan', `%${arama}%`)
    if (tehlikeFiltre !== 'Hepsi') q = q.eq('tehlike_sinifi', tehlikeFiltre)
    if (bolgeFiltre !== 'Hepsi') q = q.eq('bolge', bolgeFiltre)
    const { data, error } = await q
    if (error) { setHata('Yüklenemedi'); setYukleniyor(false); return }
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
      paket_2808: Number(form.paket_2808)||0,
      paket_3000: Number(form.paket_3000)||0,
      paket_3434: Number(form.paket_3434)||0,
      igu_atama_tarihi: form.igu_atama_tarihi||null,
      ih_atama_tarihi: form.ih_atama_tarihi||null,
      // UUID alanları boş string olamaz — null olmalı
      igu_id: form.igu_id||null,
      ih_id: form.ih_id||null,
      dsp_id: form.dsp_id||null,
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

  async function evraklarYukle(firma_id: string) {
    const { data } = await sb.from('firma_evraklar').select('*').eq('firma_id', firma_id).single()
    setEvraklar(data || null)
  }

  async function evraklarKaydet(firma_id: string, yeniEvraklar: any) {
    setEvrakKayit(true)
    const sb2 = createClient()
    const { data: user } = await sb2.auth.getUser()
    const guncelleyen = user.user?.email || ''
    if (evraklar) {
      await sb.from('firma_evraklar').update({ ...yeniEvraklar, guncelleme_tarihi: new Date().toISOString(), guncelleyen }).eq('firma_id', firma_id)
    } else {
      await sb.from('firma_evraklar').insert({ firma_id, ...yeniEvraklar, guncelleyen })
    }
    await evraklarYukle(firma_id)
    setEvrakKayit(false)
  }

  async function katipYukle(firma_id: string) {
    const { data } = await sb.from('katip_sozlesmeleri').select('*').eq('firma_id', firma_id).order('sozlesme_turu')
    setKatipSozlesmeler(data || [])
  }

  async function katipKaydet(firma_id: string) {
    if (!katipForm.gorevlendirilen_ad) return
    setKatipYukleniyor(true)
    await sb.from('katip_sozlesmeleri').insert({ firma_id, sgk_sicil: duzenle?.sgk_sicil, ...katipForm, sozlesme_id: katipForm.sozlesme_id ? Number(katipForm.sozlesme_id) : null, calisma_suresi_dk: Number(katipForm.calisma_suresi_dk)||null, baslangic_tarihi: katipForm.baslangic_tarihi||null, bitis_tarihi: katipForm.bitis_tarihi||null })
    setKatipForm(bosKatipForm())
    katipYukle(firma_id)
    setKatipYukleniyor(false)
  }

  async function katipSil(id: string, firma_id: string) {
    if (!confirm('Silinsin mi?')) return
    await sb.from('katip_sozlesmeleri').delete().eq('id', id)
    katipYukle(firma_id)
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
      gorevli_igu: f.gorevli_igu||'', igu_id: f.igu_id||'', igu_atama_tarihi: f.igu_atama_tarihi||'',
      gorevli_ih: f.gorevli_ih||'', ih_id: f.ih_id||'', ih_atama_tarihi: f.ih_atama_tarihi||'',
      gorevli_dsp: f.gorevli_dsp||'', dsp_id: f.dsp_id||'', bhl_atama: f.bhl_atama||'',
      atama_aciklama: f.atama_aciklama||'', dr_sure: f.dr_sure?.toString()||'',
      uzman_sure: f.uzman_sure?.toString()||'', ziyaret_periyodu: f.ziyaret_periyodu||'',
      gorevli_ih_giden: f.gorevli_ih_giden||'', ih_periyot: f.ih_periyot||'',
      kisi_basi_ucret: f.kisi_basi_ucret?.toString()||'',
      kisi_basi_ucret_yeni: f.kisi_basi_ucret_yeni?.toString()||'',
      paket_2808: f.paket_2808?.toString()||'', paket_3000: f.paket_3000?.toString()||'', paket_3434: f.paket_3434?.toString()||''
    })
  }

  function exportCSV() {
    csvIndir(filtreli.map(f => ({
      'Ünvan': f.unvan||'', 'Katip Ünvan': f.isg_katip_unvan||'', 'SGK Sicil': f.sgk_sicil||'',
      'Tehlike Sınıfı': f.tehlike_sinifi||'', 'Çalışan': f.calisan_sayisi||'',
      'Bölge': f.bolge||'', 'Kişi Başı': f.kisi_basi_ucret||'',
      'İGU': f.gorevli_igu||'', 'İH': f.gorevli_ih||'',
      'Fatura': f.fatura ? 'Evet' : 'Hayır',
    })), 'firmalar')
  }

  const filtreli = firmalar // Filtreleme server-side yapılıyor

  const tl = (n:number) => n > 0 ? new Intl.NumberFormat('tr-TR').format(n) + ' ₺' : '—'

  const SEKMELER: {key: 'temel'|'atama'|'ucret'|'ziyaret'|'katip', label: string}[] = [
    { key:'temel', label:'Temel Bilgiler' },
    { key:'atama', label:'Atama' },
    { key:'ucret', label:'Ücretlendirme' },
    { key:'ziyaret', label:'Ziyaret' },
    { key:'katip', label:'Katip Sözleşmeleri' },
  ]

  return (
    <div className="page-wrap" >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>Firmalar</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{filtreli.length} firma</p>
        </div>
        <button className="btn" onClick={()=>{ setDuzenle(null); setForm(bosForm()); setSekme('temel'); setModal(true) }}><Plus size={18}/> Yeni Firma</button>
      </div>

      <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:'var(--blue-soft)', border:'1px solid rgba(99,102,241,0.1)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <span style={{ fontSize:18, flexShrink:0 }}>💡</span>
        <p style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>Firmalar — OSGB'nin tüm müşteri firmalarını yönettiğiniz sayfadır. Firmaya tıklayarak detay, ✏️ ile düzenleme yapabilirsiniz. Atama sekmesinden İGU, İH ve DSP, Ücretlendirme sekmesinden kişi başı ücret girebilirsiniz.</p>
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
              <tr><th>Ünvan</th><th>Bölge</th><th>Tehlike</th><th>Çalışan</th><th>İGU</th><th>İH</th><th>DSP</th><th>Kişi Başı</th><th>Fatura</th><th>Periyot</th>
                {(kulRol === 'muhasebe' || kulRol === 'yonetici') && (<><th style={{ color:'var(--accent)', fontSize:11 }}>Oca</th><th style={{ color:'var(--accent)', fontSize:11 }}>Şub</th><th style={{ color:'var(--accent)', fontSize:11 }}>Mar</th><th style={{ color:'var(--accent)', fontSize:11 }}>Nis</th><th style={{ color:'var(--accent)', fontSize:11 }}>May</th><th style={{ color:'var(--amber)', fontSize:11 }}>Fark</th><th style={{ color:'var(--green)', fontSize:11 }}>K.Başı ₺</th></>)}
              <th></th></tr>
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
                  {(kulRol === 'muhasebe' || kulRol === 'yonetici') && (() => {
                    const aylar = [f.ocak_kisi, f.subat_kisi, f.mart_kisi, f.nisan_kisi, f.mayis_kisi]
                    const dolu = aylar.filter(Boolean)
                    const sonAy = dolu.length > 0 ? Number(dolu[dolu.length-1]) : 0
                    const oncekiAy = dolu.length > 1 ? Number(dolu[dolu.length-2]) : sonAy
                    const fark = sonAy - oncekiAy
                    const toplamTl = sonAy * (Number(f.kisi_basi_ucret)||0)
                    return (<>
                      {[f.ocak_kisi, f.subat_kisi, f.mart_kisi, f.nisan_kisi, f.mayis_kisi].map((v, i) => (
                        <td key={i} style={{ textAlign:'center', fontSize:12, color: v ? 'var(--text)' : 'var(--text-faint)' }}>{v||'—'}</td>
                      ))}
                      <td style={{ textAlign:'center', fontSize:12, fontWeight:600, color: fark > 0 ? 'var(--green)' : fark < 0 ? 'var(--red)' : 'var(--text-faint)' }}>
                        {fark !== 0 ? (fark > 0 ? '+' : '') + fark : '—'}
                      </td>
                      <td style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap', color:'var(--green)' }}>
                        {toplamTl > 0 ? new Intl.NumberFormat('tr-TR').format(toplamTl) + ' ₺' : '—'}
                      </td>
                    </>)
                  })()}
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
                <div><label style={lbl}>İSG Uzmanı (İGU)</label>
                <select value={form.igu_id} onChange={e=>{
                  const p = personeller.find(x=>x.id===e.target.value)
                  setForm({...form, igu_id:e.target.value, gorevli_igu:p?.ad_soyad||''})
                }}>
                  <option value="">Seçiniz...</option>
                  {personeller.filter(p=>['operasyon','saha','yonetici'].includes(p.rol)).map(p=><option key={p.id} value={p.id}>{p.ad_soyad}</option>)}
                </select>
              </div>
                <div><label style={lbl}>İGU Atama Tarihi</label><input type="date" value={form.igu_atama_tarihi} onChange={e=>setForm({...form, igu_atama_tarihi:e.target.value})} /></div>
                <div><label style={lbl}>İş Hekimi (İH)</label>
                <select value={form.ih_id} onChange={e=>{
                  const p = personeller.find(x=>x.id===e.target.value)
                  setForm({...form, ih_id:e.target.value, gorevli_ih:p?.ad_soyad||''})
                }}>
                  <option value="">Seçiniz...</option>
                  {personeller.filter(p=>p.rol==='hekim'||p.rol==='yonetici').map(p=><option key={p.id} value={p.id}>{p.ad_soyad}</option>)}
                </select>
              </div>
                <div><label style={lbl}>İH Atama Tarihi</label><input type="date" value={form.ih_atama_tarihi} onChange={e=>setForm({...form, ih_atama_tarihi:e.target.value})} /></div>
                <div><label style={lbl}>DSP</label>
                <select value={form.dsp_id} onChange={e=>{
                  const p = personeller.find(x=>x.id===e.target.value)
                  setForm({...form, dsp_id:e.target.value, gorevli_dsp:p?.ad_soyad||''})
                }}>
                  <option value="">Seçiniz...</option>
                  {personeller.map(p=><option key={p.id} value={p.id}>{p.ad_soyad}</option>)}
                </select>
              </div>
                <div><label style={lbl}>BHL Atama</label><input value={form.bhl_atama} onChange={e=>setForm({...form, bhl_atama:e.target.value})} /></div>
                <div><label style={lbl}>Uzman Süre (dk)</label><input type="number" value={form.uzman_sure} onChange={e=>setForm({...form, uzman_sure:e.target.value})} /></div>
                <div><label style={lbl}>Dr Süre (dk)</label><input type="number" value={form.dr_sure} onChange={e=>setForm({...form, dr_sure:e.target.value})} /></div>
                <div style={{ gridColumn:'1/3' }}><label style={lbl}>Atama Açıklaması</label><textarea rows={2} value={form.atama_aciklama} onChange={e=>setForm({...form, atama_aciklama:e.target.value})} /></div>
                {duzenle && katipSozlesmeler.length > 0 && (
                  <div style={{ gridColumn:'1/3', background:'var(--surface-2)', borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8, fontWeight:600 }}>ATANAN PERSONEL SERTİFİKALARI</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {katipSozlesmeler.filter(k=>k.firma_id===duzenle.id).map(k=>(
                        <span key={k.id} style={{ fontSize:12, padding:'3px 10px', borderRadius:6, background:'var(--accent-soft)', color:'var(--accent)', fontWeight:500 }}>
                          {k.sozlesme_turu}: {k.sertifika_tipi}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sekme === 'ucret' && (
              <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Kişi Başı Ücret (₺)</label><input type="number" value={form.kisi_basi_ucret} onChange={e=>setForm({...form, kisi_basi_ucret:e.target.value})} /></div>
                <div><label style={lbl}>Kişi Başı (Yeni) (₺)</label><input type="number" value={form.kisi_basi_ucret_yeni} onChange={e=>setForm({...form, kisi_basi_ucret_yeni:e.target.value})} /></div>
                <div><label style={lbl}>Paket 2808 (₺)</label><input type="number" value={form.paket_2808} onChange={e=>setForm({...form, paket_2808:e.target.value})} /></div>
                <div><label style={lbl}>Paket 3000 (₺)</label><input type="number" value={form.paket_3000} onChange={e=>setForm({...form, paket_3000:e.target.value})} /></div>
                <div><label style={lbl}>Paket 3434 (₺)</label><input type="number" value={form.paket_3434} onChange={e=>setForm({...form, paket_3434:e.target.value})} /></div>
              </div>
            )}

            {sekme === 'ziyaret' && (
              <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Uzman Periyot</label><input value={form.ziyaret_periyodu} onChange={e=>setForm({...form, ziyaret_periyodu:e.target.value})} placeholder="Aylık / 3 Aylık" /></div>
                <div><label style={lbl}>İH Giden</label><input value={form.gorevli_ih_giden} onChange={e=>setForm({...form, gorevli_ih_giden:e.target.value})} /></div>
                <div><label style={lbl}>İH Periyot</label><input value={form.ih_periyot} onChange={e=>setForm({...form, ih_periyot:e.target.value})} placeholder="Aylık / 3 Aylık" /></div>
                {duzenle && (() => {
                  const aylar = ['01','02','03','04','05','06','07','08','09','10','11','12']
                  const ayAd = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
                  const yil = new Date().getFullYear()
                  const ziyaretMap: Record<string,any> = duzenle.aylik_ziyaretler || {}
                  return (
                    <div style={{ gridColumn:'1/3', marginTop:8 }}>
                      <div style={{ fontSize:11, color:'var(--text-faint)', fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 }}>
                        {yil} Yılı Aylık Ziyaret Özeti
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6 }}>
                        {aylar.map((ay, i) => {
                          const key = `${yil}-${ay}`
                          const z = ziyaretMap[key]
                          return (
                            <div key={ay} style={{ background:'var(--surface-2)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:4 }}>{ayAd[i]}</div>
                              {z ? (
                                <>
                                  <div style={{ fontSize:11, color:'var(--green)', fontWeight:600 }}>✓</div>
                                  <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:2 }}>{z.ziyaret_eden || ''}</div>
                                </>
                              ) : (
                                <div style={{ fontSize:11, color:'var(--text-faint)' }}>—</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {sekme === 'katip' && duzenle && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                  {[
                    { key:'sozlesme_turu', label:'Tür', type:'select', opts:['İGU','İH','DSP','BHL'] },
                    { key:'sozlesme_id', label:'Katip ID', type:'text', ph:'25821971' },
                    { key:'gorevlendirilen_ad', label:'Görevlendirilen *', type:'text', ph:'Ad Soyad' },
                    { key:'gorevlendirilen_tc', label:'TC No', type:'text', ph:'12345...' },
                    { key:'sertifika_tipi', label:'Sertifika Tipi', type:'select', opts:['A Sınıfı','B Sınıfı','C Sınıfı','İH Sertifikası','DSP Sertifikası'] },
                    { key:'sertifika_no', label:'Sertifika No', type:'text', ph:'İGU-406910' },
                    { key:'calisma_suresi_dk', label:'Süre (dk/ay)', type:'number', ph:'70' },
                    { key:'sozlesme_durumu', label:'Durum', type:'select', opts:['Devam Ediyor','Sona Erdi','Askıya Alındı'] },
                    { key:'baslangic_tarihi', label:'Başlangıç', type:'date' },
                    { key:'bitis_tarihi', label:'Bitiş', type:'date' },
                  ].map((f:any) => (
                    <div key={f.key}>
                      <label style={lbl}>{f.label}</label>
                      {f.type==='select'
                        ? <select value={(katipForm as any)[f.key]} onChange={e=>setKatipForm({...katipForm,[f.key]:e.target.value})}>{f.opts.map((o:string)=><option key={o}>{o}</option>)}</select>
                        : <input type={f.type||'text'} value={(katipForm as any)[f.key]} onChange={e=>setKatipForm({...katipForm,[f.key]:e.target.value})} placeholder={f.ph||''}/>
                      }
                    </div>
                  ))}
                </div>
                <button className="btn" style={{ width:'100%', justifyContent:'center', marginBottom:20 }} onClick={()=>katipKaydet(duzenle.id)} disabled={katipYukleniyor}>
                  + Sözleşme Ekle
                </button>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {katipSozlesmeler.map(k=>(
                    <div key={k.id} style={{ background:'var(--surface-2)', borderRadius:10, padding:'12px 14px', display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13, color:k.sozlesme_turu==='İGU'?'var(--blue)':k.sozlesme_turu==='İH'?'var(--green)':'var(--amber)' }}>{k.sozlesme_turu} — {k.gorevlendirilen_ad}</div>
                        <div style={{ fontSize:12, color:'var(--text-faint)', marginTop:2 }}>{k.sertifika_no} · {k.calisma_suresi_dk}dk/ay · {k.sozlesme_durumu}</div>
                        {k.baslangic_tarihi && <div style={{ fontSize:11, color:'var(--text-faint)' }}>{new Date(k.baslangic_tarihi+'T00:00:00').toLocaleDateString('tr-TR')} {k.bitis_tarihi ? '→ '+new Date(k.bitis_tarihi+'T00:00:00').toLocaleDateString('tr-TR') : ''}</div>}
                      </div>
                      <button onClick={()=>katipSil(k.id,duzenle.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4, fontSize:13 }}>🗑️</button>
                    </div>
                  ))}
                  {katipSozlesmeler.length===0 && <div style={{ fontSize:13, color:'var(--text-faint)', textAlign:'center', padding:20 }}>Henüz sözleşme eklenmemiş</div>}
                </div>
              </div>
            )}


            {sekme === 'evraklar' && duzenle && (
              <div>
                {(() => {
                  const toplam = 25
                  const tamamlanan = (evraklar?.['dr_sozlesme']?1:0) + (evraklar?.['igu_sozlesme']?1:0) + (evraklar?.['bhl_sozlesmesi']?1:0) + (evraklar?.['acil_durum_ekipleri']?1:0) + (evraklar?.['acil_durum_plani']?1:0) + (evraklar?.['ad_tatbikatlari']?1:0) + (evraklar?.['calisan_temsilcisi']?1:0) + (evraklar?.['egitim_kayitlari']?1:0) + (evraklar?.['risk_analizi']?1:0) + (evraklar?.['yillik_calisma_plani']?1:0) + (evraklar?.['yillik_egitim_plani']?1:0) + (evraklar?.['yillik_degerlendirme']?1:0) + (evraklar?.['defter_nushasi']?1:0) + (evraklar?.['isg_kurul']?1:0) + (evraklar?.['kroki']?1:0) + (evraklar?.['calisma_talimati']?1:0) + (evraklar?.['ilk_yardim_belgeleri']?1:0) + (evraklar?.['is_kazasi_evraklari']?1:0) + (evraklar?.['levha_calismalari']?1:0) + (evraklar?.['mesleki_egitimler']?1:0) + (evraklar?.['ortam_olcumleri']?1:0) + (evraklar?.['periyodik_kontroller']?1:0) + (evraklar?.['saglik_kayitlari']?1:0) + (evraklar?.['ysc_kontrolleri']?1:0) + (evraklar?.['ziyaret_formlari']?1:0)
                  const oran = Math.round((tamamlanan/toplam)*100)
                  return (
                    <div style={{marginBottom:16}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}>
                        <span style={{fontWeight:600}}>Tamamlama Oranı</span>
                        <span style={{fontWeight:700,color:oran>=70?'#22c55e':oran>=40?'#f59e0b':'#ef4444'}}>%{oran} ({tamamlanan}/{toplam})</span>
                      </div>
                      <div style={{height:8,background:'var(--surface-2)',borderRadius:4,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${oran}%`,background:oran>=70?'#22c55e':oran>=40?'#f59e0b':'#ef4444',borderRadius:4,transition:'width 0.3s'}}/>
                      </div>
                      <div style={{fontSize:11,color:'var(--text-faint)',marginTop:6}}>Tıklayarak onay durumunu değiştirin — otomatik kaydedilir{evrakKayit?' · kaydediliyor...':''}</div>
                    </div>
                  )
                })()}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div key="dr_sozlesme" onClick={()=>{
                  const yeni = {...(evraklar||{}), dr_sozlesme: !(evraklar?.['dr_sozlesme']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['dr_sozlesme'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['dr_sozlesme'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['dr_sozlesme'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['dr_sozlesme'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['dr_sozlesme']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['dr_sozlesme'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['dr_sozlesme'])?500:400}}>Dr. Sözleşmesi</span>
                </div>
                <div key="igu_sozlesme" onClick={()=>{
                  const yeni = {...(evraklar||{}), igu_sozlesme: !(evraklar?.['igu_sozlesme']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['igu_sozlesme'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['igu_sozlesme'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['igu_sozlesme'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['igu_sozlesme'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['igu_sozlesme']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['igu_sozlesme'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['igu_sozlesme'])?500:400}}>İGU Sözleşmesi</span>
                </div>
                <div key="bhl_sozlesmesi" onClick={()=>{
                  const yeni = {...(evraklar||{}), bhl_sozlesmesi: !(evraklar?.['bhl_sozlesmesi']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['bhl_sozlesmesi'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['bhl_sozlesmesi'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['bhl_sozlesmesi'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['bhl_sozlesmesi'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['bhl_sozlesmesi']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['bhl_sozlesmesi'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['bhl_sozlesmesi'])?500:400}}>BHL Sözleşmesi</span>
                </div>
                <div key="acil_durum_ekipleri" onClick={()=>{
                  const yeni = {...(evraklar||{}), acil_durum_ekipleri: !(evraklar?.['acil_durum_ekipleri']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['acil_durum_ekipleri'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['acil_durum_ekipleri'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['acil_durum_ekipleri'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['acil_durum_ekipleri'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['acil_durum_ekipleri']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['acil_durum_ekipleri'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['acil_durum_ekipleri'])?500:400}}>Acil Durum Ekipleri</span>
                </div>
                <div key="acil_durum_plani" onClick={()=>{
                  const yeni = {...(evraklar||{}), acil_durum_plani: !(evraklar?.['acil_durum_plani']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['acil_durum_plani'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['acil_durum_plani'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['acil_durum_plani'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['acil_durum_plani'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['acil_durum_plani']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['acil_durum_plani'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['acil_durum_plani'])?500:400}}>Acil Durum Planı</span>
                </div>
                <div key="ad_tatbikatlari" onClick={()=>{
                  const yeni = {...(evraklar||{}), ad_tatbikatlari: !(evraklar?.['ad_tatbikatlari']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['ad_tatbikatlari'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['ad_tatbikatlari'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['ad_tatbikatlari'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['ad_tatbikatlari'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['ad_tatbikatlari']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['ad_tatbikatlari'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['ad_tatbikatlari'])?500:400}}>AD Tatbikatları</span>
                </div>
                <div key="calisan_temsilcisi" onClick={()=>{
                  const yeni = {...(evraklar||{}), calisan_temsilcisi: !(evraklar?.['calisan_temsilcisi']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['calisan_temsilcisi'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['calisan_temsilcisi'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['calisan_temsilcisi'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['calisan_temsilcisi'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['calisan_temsilcisi']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['calisan_temsilcisi'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['calisan_temsilcisi'])?500:400}}>Çalışan Temsilcisi</span>
                </div>
                <div key="egitim_kayitlari" onClick={()=>{
                  const yeni = {...(evraklar||{}), egitim_kayitlari: !(evraklar?.['egitim_kayitlari']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['egitim_kayitlari'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['egitim_kayitlari'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['egitim_kayitlari'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['egitim_kayitlari'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['egitim_kayitlari']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['egitim_kayitlari'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['egitim_kayitlari'])?500:400}}>Eğitim Kayıtları</span>
                </div>
                <div key="risk_analizi" onClick={()=>{
                  const yeni = {...(evraklar||{}), risk_analizi: !(evraklar?.['risk_analizi']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['risk_analizi'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['risk_analizi'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['risk_analizi'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['risk_analizi'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['risk_analizi']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['risk_analizi'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['risk_analizi'])?500:400}}>Risk Analizi</span>
                </div>
                <div key="yillik_calisma_plani" onClick={()=>{
                  const yeni = {...(evraklar||{}), yillik_calisma_plani: !(evraklar?.['yillik_calisma_plani']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['yillik_calisma_plani'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['yillik_calisma_plani'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['yillik_calisma_plani'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['yillik_calisma_plani'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['yillik_calisma_plani']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['yillik_calisma_plani'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['yillik_calisma_plani'])?500:400}}>Yıllık Ç. Planı</span>
                </div>
                <div key="yillik_egitim_plani" onClick={()=>{
                  const yeni = {...(evraklar||{}), yillik_egitim_plani: !(evraklar?.['yillik_egitim_plani']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['yillik_egitim_plani'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['yillik_egitim_plani'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['yillik_egitim_plani'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['yillik_egitim_plani'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['yillik_egitim_plani']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['yillik_egitim_plani'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['yillik_egitim_plani'])?500:400}}>Yıllık Eğitim Planı</span>
                </div>
                <div key="yillik_degerlendirme" onClick={()=>{
                  const yeni = {...(evraklar||{}), yillik_degerlendirme: !(evraklar?.['yillik_degerlendirme']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['yillik_degerlendirme'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['yillik_degerlendirme'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['yillik_degerlendirme'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['yillik_degerlendirme'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['yillik_degerlendirme']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['yillik_degerlendirme'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['yillik_degerlendirme'])?500:400}}>Yıllık Değerlendirme</span>
                </div>
                <div key="defter_nushasi" onClick={()=>{
                  const yeni = {...(evraklar||{}), defter_nushasi: !(evraklar?.['defter_nushasi']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['defter_nushasi'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['defter_nushasi'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['defter_nushasi'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['defter_nushasi'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['defter_nushasi']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['defter_nushasi'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['defter_nushasi'])?500:400}}>Defter Nüshası</span>
                </div>
                <div key="isg_kurul" onClick={()=>{
                  const yeni = {...(evraklar||{}), isg_kurul: !(evraklar?.['isg_kurul']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['isg_kurul'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['isg_kurul'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['isg_kurul'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['isg_kurul'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['isg_kurul']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['isg_kurul'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['isg_kurul'])?500:400}}>İSG Kurul</span>
                </div>
                <div key="kroki" onClick={()=>{
                  const yeni = {...(evraklar||{}), kroki: !(evraklar?.['kroki']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['kroki'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['kroki'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['kroki'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['kroki'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['kroki']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['kroki'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['kroki'])?500:400}}>Kroki</span>
                </div>
                <div key="calisma_talimati" onClick={()=>{
                  const yeni = {...(evraklar||{}), calisma_talimati: !(evraklar?.['calisma_talimati']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['calisma_talimati'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['calisma_talimati'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['calisma_talimati'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['calisma_talimati'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['calisma_talimati']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['calisma_talimati'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['calisma_talimati'])?500:400}}>Çalışma Talimatı</span>
                </div>
                <div key="ilk_yardim_belgeleri" onClick={()=>{
                  const yeni = {...(evraklar||{}), ilk_yardim_belgeleri: !(evraklar?.['ilk_yardim_belgeleri']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['ilk_yardim_belgeleri'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['ilk_yardim_belgeleri'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['ilk_yardim_belgeleri'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['ilk_yardim_belgeleri'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['ilk_yardim_belgeleri']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['ilk_yardim_belgeleri'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['ilk_yardim_belgeleri'])?500:400}}>İlk Yardım Belgeleri</span>
                </div>
                <div key="is_kazasi_evraklari" onClick={()=>{
                  const yeni = {...(evraklar||{}), is_kazasi_evraklari: !(evraklar?.['is_kazasi_evraklari']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['is_kazasi_evraklari'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['is_kazasi_evraklari'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['is_kazasi_evraklari'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['is_kazasi_evraklari'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['is_kazasi_evraklari']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['is_kazasi_evraklari'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['is_kazasi_evraklari'])?500:400}}>İş Kazası Evrakları</span>
                </div>
                <div key="levha_calismalari" onClick={()=>{
                  const yeni = {...(evraklar||{}), levha_calismalari: !(evraklar?.['levha_calismalari']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['levha_calismalari'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['levha_calismalari'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['levha_calismalari'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['levha_calismalari'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['levha_calismalari']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['levha_calismalari'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['levha_calismalari'])?500:400}}>Levha Çalışmaları</span>
                </div>
                <div key="mesleki_egitimler" onClick={()=>{
                  const yeni = {...(evraklar||{}), mesleki_egitimler: !(evraklar?.['mesleki_egitimler']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['mesleki_egitimler'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['mesleki_egitimler'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['mesleki_egitimler'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['mesleki_egitimler'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['mesleki_egitimler']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['mesleki_egitimler'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['mesleki_egitimler'])?500:400}}>Mesleki Eğitimler</span>
                </div>
                <div key="ortam_olcumleri" onClick={()=>{
                  const yeni = {...(evraklar||{}), ortam_olcumleri: !(evraklar?.['ortam_olcumleri']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['ortam_olcumleri'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['ortam_olcumleri'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['ortam_olcumleri'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['ortam_olcumleri'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['ortam_olcumleri']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['ortam_olcumleri'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['ortam_olcumleri'])?500:400}}>Ortam Ölçümleri</span>
                </div>
                <div key="periyodik_kontroller" onClick={()=>{
                  const yeni = {...(evraklar||{}), periyodik_kontroller: !(evraklar?.['periyodik_kontroller']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['periyodik_kontroller'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['periyodik_kontroller'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['periyodik_kontroller'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['periyodik_kontroller'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['periyodik_kontroller']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['periyodik_kontroller'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['periyodik_kontroller'])?500:400}}>Periyodik Kontroller</span>
                </div>
                <div key="saglik_kayitlari" onClick={()=>{
                  const yeni = {...(evraklar||{}), saglik_kayitlari: !(evraklar?.['saglik_kayitlari']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['saglik_kayitlari'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['saglik_kayitlari'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['saglik_kayitlari'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['saglik_kayitlari'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['saglik_kayitlari']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['saglik_kayitlari'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['saglik_kayitlari'])?500:400}}>Sağlık Kayıtları</span>
                </div>
                <div key="ysc_kontrolleri" onClick={()=>{
                  const yeni = {...(evraklar||{}), ysc_kontrolleri: !(evraklar?.['ysc_kontrolleri']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['ysc_kontrolleri'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['ysc_kontrolleri'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['ysc_kontrolleri'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['ysc_kontrolleri'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['ysc_kontrolleri']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['ysc_kontrolleri'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['ysc_kontrolleri'])?500:400}}>YSC Kontrolleri</span>
                </div>
                <div key="ziyaret_formlari" onClick={()=>{
                  const yeni = {...(evraklar||{}), ziyaret_formlari: !(evraklar?.['ziyaret_formlari']||false)}
                  setEvraklar(yeni)
                  evraklarKaydet(duzenle.id, yeni)
                }} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:(evraklar?.['ziyaret_formlari'])?'rgba(34,197,94,0.1)':'var(--surface-2)',border:`1px solid ${(evraklar?.['ziyaret_formlari'])?'#22c55e':'var(--border)'}`,transition:'all 0.15s'}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${(evraklar?.['ziyaret_formlari'])?'#22c55e':'var(--border)'}`,background:(evraklar?.['ziyaret_formlari'])?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {(evraklar?.['ziyaret_formlari']) && <span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:(evraklar?.['ziyaret_formlari'])?'var(--text)':'var(--text-dim)',fontWeight:(evraklar?.['ziyaret_formlari'])?500:400}}>Ziyaret Formları</span>
                </div>
                </div>
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
