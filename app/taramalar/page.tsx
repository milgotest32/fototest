'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { csvIndir } from '@/lib/csvExport'
import { Plus, X, Activity, Trash2, Pencil } from 'lucide-react'

const ASAMALAR = ['Planlandı','Tarama Yapıldı','Rapor Hazırlanıyor','Teslim Edildi','Faturalandı','Tahsil Edildi']
const ASAMA_RENK: any = {
  'Planlandı':'var(--blue)', 'Tarama Yapıldı':'var(--amber)',
  'Rapor Hazırlanıyor':'var(--accent)', 'Teslim Edildi':'var(--green)',
  'Faturalandı':'var(--green)', 'Tahsil Edildi':'var(--text-faint)'
}
const ODEME_TURLERI = ['Nakit','Cari','Kredi Kartı','Havale']
const TEKIKLER_SECENEKLER = ['AC','SFT','Odyo','Hemo','EKG','Röntgen','Göz','PA Akciğer']

export default function Taramalar() {
  const [taramalar, setTaramalar] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [duzenle, setDuzenle] = useState<any>(null)
  const [filtre, setFiltre] = useState('Hepsi')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return {
      tarih: new Date().toISOString().slice(0,10),
      ad_soyad: '', dogum_tarihi: '', telefon: '',
      firma_adi: '', firma_id: '',
      ucret: '', odeme_turu: 'Nakit',
      tetkikler: [] as string[],
      asama: 'Planlandı',
      notlar: ''
    }
  }

  const sb = createClient()
  const debounceRef = useRef<any>(null)

  useEffect(() => { yukle() }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => yukle(), 400)
    return () => clearTimeout(debounceRef.current)
  }, [arama])

  async function yukle() {
    setYukleniyor(true)
    let q = sb.from('tarama_operasyonlari').select('*').order('tarih', { ascending: false })
    if (arama) q = q.or(`firma_adi.ilike.%${arama}%,ad_soyad.ilike.%${arama}%`)
    const [tRes, fRes] = await Promise.all([
      q,
      sb.from('firmalar').select('id, unvan').order('unvan')
    ])
    if (tRes.error) { setHata('Yüklenemedi'); setYukleniyor(false); return }
    setTaramalar(tRes.data || [])
    setFirmalar(fRes.data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.firma_adi && !form.ad_soyad) { setHata('Firma veya kişi adı gerekli'); return }
    setHata('')
    const payload = {
      tarih: form.tarih || null,
      ad_soyad: form.ad_soyad || null,
      dogum_tarihi: form.dogum_tarihi || null,
      telefon: form.telefon || null,
      firma_adi: form.firma_adi || null,
      firma_id: form.firma_id || null,
      tutar: Number(form.ucret) || 0,
      odeme_turu: form.odeme_turu,
      tetkikler: form.tetkikler.join(', '),
      asama: form.asama,
      notlar: form.notlar || null,
      // eski alanlar uyum için
      planlanan_tarih: form.tarih || null,
    }
    let error
    if (duzenle) {
      const r = await sb.from('tarama_operasyonlari').update(payload).eq('id', duzenle.id)
      error = r.error
    } else {
      const r = await sb.from('tarama_operasyonlari').insert(payload)
      error = r.error
    }
    if (error) { setHata(error.message); return }
    setModal(false); setDuzenle(null); setForm(bosForm()); yukle()
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

  function duzenleAc(t: any) {
    setDuzenle(t)
    setForm({
      tarih: t.tarih || t.planlanan_tarih || '',
      ad_soyad: t.ad_soyad || '',
      dogum_tarihi: t.dogum_tarihi || '',
      telefon: t.telefon || '',
      firma_adi: t.firma_adi || '',
      firma_id: t.firma_id || '',
      ucret: t.tutar?.toString() || '',
      odeme_turu: t.odeme_turu || 'Nakit',
      tetkikler: t.tetkikler ? t.tetkikler.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      asama: t.asama || 'Planlandı',
      notlar: t.notlar || ''
    })
    setModal(true)
  }

  function toggleTetkik(t: string) {
    setForm((f: any) => ({
      ...f,
      tetkikler: f.tetkikler.includes(t)
        ? f.tetkikler.filter((x: string) => x !== t)
        : [...f.tetkikler, t]
    }))
  }

  function exportCSV() {
    csvIndir(filtreli.map(t => ({
      'Tarih': t.tarih || t.planlanan_tarih || '',
      'Ad Soyad': t.ad_soyad || '',
      'Doğum Tarihi': t.dogum_tarihi || '',
      'Telefon': t.telefon || '',
      'Firma': t.firma_adi || '',
      'Ücret': t.tutar || 0,
      'Ödeme': t.odeme_turu || '',
      'Tetkikler': t.tetkikler || '',
      'Aşama': t.asama || '',
    })), 'saglik-raporu')
  }

  const filtreli = taramalar.filter(t => filtre === 'Hepsi' || t.asama === filtre)
  const tl = (n: number) => new Intl.NumberFormat('tr-TR').format(n) + ' ₺'
  const toplamTutar = filtreli.reduce((s, t) => s + (Number(t.tutar) || 0), 0)
  const sayilar = ASAMALAR.reduce((acc: any, a) => ({ ...acc, [a]: taramalar.filter(t => t.asama === a).length }), {})

  // Bugün / Bu Hafta / Bu Ay / Bu Yıl
  const bugun = new Date().toISOString().slice(0, 10)
  const ayBas = bugun.slice(0, 7) + '-01'
  const yilBas = bugun.slice(0, 4) + '-01-01'
  const haftaBas = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().slice(0, 10)
  })()

  const stat = {
    bugun: taramalar.filter(t => (t.tarih || t.planlanan_tarih) === bugun).length,
    hafta: taramalar.filter(t => (t.tarih || t.planlanan_tarih) >= haftaBas).length,
    ay: taramalar.filter(t => (t.tarih || t.planlanan_tarih) >= ayBas).length,
    yil: taramalar.filter(t => (t.tarih || t.planlanan_tarih) >= yilBas).length,
    ciroBugun: taramalar.filter(t => (t.tarih || t.planlanan_tarih) === bugun).reduce((s, t) => s + (Number(t.tutar) || 0), 0),
    ciroAy: taramalar.filter(t => (t.tarih || t.planlanan_tarih) >= ayBas).reduce((s, t) => s + (Number(t.tutar) || 0), 0),
  }

  return (
    <div className="page-wrap">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>Sağlık Raporu</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{filtreli.length} kayıt · {tl(toplamTutar)}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportCSV} style={{ padding:'9px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-dim)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>↓ CSV</button>
          <button className="btn" onClick={() => { setDuzenle(null); setForm(bosForm()); setModal(true) }}><Plus size={18} /> Yeni Kayıt</button>
        </div>
      </div>

      {/* İSTATİSTİK */}
      <div className="card" style={{ padding:18, marginBottom:20 }}>
        <div style={{ fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:14, marginBottom:14 }}>🏥 Merkez Sağlık Raporu</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
          {[['Bugün', stat.bugun], ['Bu Hafta', stat.hafta], ['Bu Ay', stat.ay], ['Bu Yıl', stat.yil]].map(([k, v]) => (
            <div key={k as string} style={{ textAlign:'center', padding:'10px 6px', background:'var(--surface-2)', borderRadius:10 }}>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700 }}>{v}</div>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:3 }}>{k}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-dim)', paddingTop:10, borderTop:'1px solid var(--border)' }}>
          <span>Bugün ciro: <strong style={{ color:'var(--green)' }}>{tl(stat.ciroBugun)}</strong></span>
          <span>Aylık ciro: <strong style={{ color:'var(--green)' }}>{tl(stat.ciroAy)}</strong></span>
        </div>
      </div>

      {/* AŞAMA BARI */}
      <div style={{ display:'flex', gap:0, marginBottom:20, overflow:'hidden', borderRadius:12, border:'1px solid var(--border)' }}>
        {ASAMALAR.map((a, i) => (
          <button key={a} onClick={() => setFiltre(filtre === a ? 'Hepsi' : a)}
            style={{ flex:1, padding:'10px 4px', border:'none', borderRight: i < ASAMALAR.length - 1 ? '1px solid var(--border)' : undefined,
              background: filtre === a ? `${ASAMA_RENK[a]}22` : 'var(--surface)', cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:700, color: ASAMA_RENK[a] }}>{sayilar[a]}</div>
            <div style={{ fontSize:10, color:'var(--text-faint)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', padding:'0 4px' }}>{a}</div>
          </button>
        ))}
      </div>

      {/* ARAMA */}
      <div style={{ marginBottom:16 }}>
        <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Kişi veya firma ara..."
          style={{ padding:'9px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:9, color:'var(--text)', fontSize:13, fontFamily:'inherit', width:240 }} />
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      {/* TABLO */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ad Soyad</th>
                <th>Doğum T.</th>
                <th>Telefon</th>
                <th>Firma</th>
                <th>Ücret</th>
                <th>Ödeme</th>
                <th>Tetkikler</th>
                <th>Aşama</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {yukleniyor
                ? <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Yükleniyor...</td></tr>
                : filtreli.length === 0
                  ? <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Kayıt yok</td></tr>
                  : filtreli.map(t => (
                    <tr key={t.id}>
                      <td style={{ whiteSpace:'nowrap', fontSize:13, color:'var(--text-dim)' }}>
                        {(t.tarih || t.planlanan_tarih) ? new Date((t.tarih || t.planlanan_tarih) + 'T00:00:00').toLocaleDateString('tr-TR') : '—'}
                      </td>
                      <td style={{ fontWeight:500 }}>{t.ad_soyad || '—'}</td>
                      <td style={{ fontSize:12, color:'var(--text-dim)' }}>{t.dogum_tarihi ? new Date(t.dogum_tarihi + 'T00:00:00').toLocaleDateString('tr-TR') : '—'}</td>
                      <td style={{ fontSize:12, color:'var(--text-dim)' }}>{t.telefon || '—'}</td>
                      <td style={{ fontSize:13, color:'var(--text-dim)' }}>{t.firma_adi || '—'}</td>
                      <td style={{ fontWeight:600, whiteSpace:'nowrap' }}>{t.tutar > 0 ? tl(Number(t.tutar)) : '—'}</td>
                      <td>
                        <span style={{ fontSize:11, padding:'2px 7px', borderRadius:5, background:'var(--surface-2)', color:'var(--text-dim)' }}>
                          {t.odeme_turu || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize:11, color:'var(--text-dim)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {t.tetkikler || '—'}
                      </td>
                      <td>
                        <select value={t.asama} onChange={e => asamaGuncelle(t.id, e.target.value)}
                          style={{ width:'auto', padding:'4px 8px', fontSize:11, color: ASAMA_RENK[t.asama], background:'var(--surface-2)', border:'none', borderRadius:6 }}>
                          {ASAMALAR.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => duzenleAc(t)} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:4 }}><Pencil size={13} /></button>
                          <button onClick={() => sil(t.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={() => { setModal(false); setDuzenle(null) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={mHead}>
              <h2 style={mTitle}><Activity size={20} color="var(--green)" /> {duzenle ? 'Kaydı Düzenle' : 'Yeni Sağlık Raporu'}</h2>
              <button onClick={() => { setModal(false); setDuzenle(null) }} style={xBtn}><X size={22} /></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div><label style={lbl}>Tarih</label><input type="date" value={form.tarih} onChange={e => setForm({ ...form, tarih: e.target.value })} /></div>
              <div><label style={lbl}>Aşama</label>
                <select value={form.asama} onChange={e => setForm({ ...form, asama: e.target.value })}>
                  {ASAMALAR.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Ad Soyad</label><input value={form.ad_soyad} onChange={e => setForm({ ...form, ad_soyad: e.target.value })} placeholder="İlker Sarıöz" /></div>
              <div><label style={lbl}>Doğum Tarihi</label><input type="date" value={form.dogum_tarihi} onChange={e => setForm({ ...form, dogum_tarihi: e.target.value })} /></div>
              <div><label style={lbl}>Telefon</label><input value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} placeholder="0532..." /></div>
              <div style={{ gridColumn:'1/3' }}>
                <label style={lbl}>Firma</label>
                <select value={form.firma_id} onChange={e => {
                  const f = firmalar.find(x => x.id === e.target.value)
                  setForm({ ...form, firma_id: e.target.value, firma_adi: f?.unvan || '' })
                }}>
                  <option value="">Seçiniz...</option>
                  {firmalar.map(f => <option key={f.id} value={f.id}>{f.unvan}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Ücret (₺)</label><input type="number" value={form.ucret} onChange={e => setForm({ ...form, ucret: e.target.value })} /></div>
              <div><label style={lbl}>Ödeme Türü</label>
                <select value={form.odeme_turu} onChange={e => setForm({ ...form, odeme_turu: e.target.value })}>
                  {ODEME_TURLERI.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              {/* Tetkikler */}
              <div style={{ gridColumn:'1/3' }}>
                <label style={lbl}>Tetkikler</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {TEKIKLER_SECENEKLER.map(t => (
                    <button key={t} type="button" onClick={() => toggleTetkik(t)}
                      style={{ padding:'6px 12px', borderRadius:7, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                        background: form.tetkikler.includes(t) ? 'var(--accent-soft)' : 'var(--surface-2)',
                        border: `1px solid ${form.tetkikler.includes(t) ? 'var(--accent)' : 'var(--border)'}`,
                        color: form.tetkikler.includes(t) ? 'var(--accent)' : 'var(--text-dim)',
                        fontWeight: form.tetkikler.includes(t) ? 600 : 400 }}>
                      {t}
                    </button>
                  ))}
                </div>
                {form.tetkikler.length > 0 && (
                  <div style={{ marginTop:8, fontSize:12, color:'var(--text-dim)' }}>
                    Seçili: <strong>{form.tetkikler.join(', ')}</strong>
                  </div>
                )}
              </div>
              <div style={{ gridColumn:'1/3' }}><label style={lbl}>Notlar</label><textarea rows={2} value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })}
                style={{ width:'100%', padding:'10px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:13, fontFamily:'inherit', resize:'vertical' }} /></div>
            </div>
            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginTop:12 }}>{hata}</div>}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn-ghost btn" style={{ flex:1, justifyContent:'center' }} onClick={() => { setModal(false); setDuzenle(null) }}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={kaydet}>{duzenle ? 'Güncelle' : 'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const lbl: any = { display:'block', fontSize:12, color:'var(--text-dim)', marginBottom:6, fontWeight:500 }
const mHead: any = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }
const mTitle: any = { fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
