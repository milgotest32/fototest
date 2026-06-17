'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { csvIndir } from '@/lib/csvExport'
import { Plus, X, Users, Trash2, Pencil, Shield, KeyRound} from 'lucide-react'

const ROLLER = ['yonetici','operasyon','hekim','satis','muhasebe','saha']
const ROL_AD: any = { yonetici:'Yönetici', operasyon:'Operasyon', hekim:'Hekim', satis:'Satış', muhasebe:'Muhasebe', saha:'Saha Uzmanı' }
const ROL_RENK: any = { yonetici:'var(--accent)', operasyon:'var(--blue)', hekim:'var(--green)', satis:'var(--amber)', muhasebe:'var(--red)', saha:'var(--text-dim)' }

export default function Personeller() {
  const [personeller, setPersoneller] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [modal, setModal] = useState(false)
  const [duzenle, setDuzenle] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [basari, setBasari] = useState('')
  const [sifreModal, setSifreModal] = useState<any>(null)
  const [yeniSifre, setYeniSifre] = useState('')
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false)
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return { ad_soyad:'', email:'', sifre:'', rol:'operasyon', aktif: true }
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
    const { data, error } = await sb
      .from('personeller')
      .select('id, ad_soyad, rol, aktif, telefon, tc, kase_no, sertifika_turu, sertifika_no, katip_toplam_dk, katip_kullanilan_dk')
      .order('ad_soyad')
    if (error) { setHata('Yüklenemedi'); return }
    setPersoneller(data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.ad_soyad || (!duzenle && (!form.email || !form.sifre))) return
    setHata(''); setBasari('')

    if (duzenle) {
      // Sadece isim + rol güncelle
      const { error } = await sb.from('personeller').update({
        ad_soyad: form.ad_soyad,
        rol: form.rol,
        aktif: form.aktif
      }).eq('id', duzenle.id)
      if (error) { setHata('Güncelleme hatası: ' + error.message); return }
      setBasari('Güncellendi.')
      setDuzenle(null)
    } else {
      // Yeni kullanıcı — API route üzerinden oluştur
      const res = await fetch('/api/admin/kullanici-olustur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.sifre,
          ad_soyad: form.ad_soyad,
          rol: form.rol,
          secret: process.env.NEXT_PUBLIC_ADMIN_SECRET || 'osgb-admin-2026'
        })
      })
      const json = await res.json()
      if (!res.ok || json.error) { setHata(json.error || 'Kullanıcı oluşturulamadı'); return }
      setBasari(`${form.ad_soyad} oluşturuldu. E-posta: ${form.email}`)
      setModal(false)
    }
    setForm(bosForm())
    yukle()
  }

  async function rolGuncelle(id: string, rol: string) {
    await sb.from('personeller').update({ rol }).eq('id', id)
    yukle()
  }

  async function aktifToggle(id: string, aktif: boolean) {
    await sb.from('personeller').update({ aktif: !aktif }).eq('id', id)
    yukle()
  }

  async function sil(id: string, ad: string) {
    if (!confirm(`${ad} hem sistemden hem girişten silinecek. Emin misiniz?`)) return
    const res = await fetch('/api/admin/kullanici-olustur', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, secret: 'osgb-admin-2026' })
    })
    const json = await res.json()
    if (!res.ok || json.error) {
      alert('Silme hatası: ' + (json.error || 'Bilinmeyen hata'))
      return
    }
    setBasari(`${ad} silindi.`)
    yukle()
  }

  async function sifreSifirla() {
    if (!yeniSifre || yeniSifre.length < 6) { alert('Şifre en az 6 karakter olmalı'); return }
    setSifreYukleniyor(true)
    const res = await fetch('/api/admin/kullanici-olustur', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sifreModal.id, password: yeniSifre, secret: 'osgb-admin-2026' })
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      alert('Hata: ' + (data.error || 'Bilinmeyen hata'))
    } else {
      setBasari(`${sifreModal.ad_soyad} şifresi güncellendi`)
      setSifreModal(null)
      setYeniSifre('')
    }
    setSifreYukleniyor(false)
  }

  function duzenleAc(p: any) {
    setDuzenle(p)
    setForm({ ad_soyad: p.ad_soyad, email:'', sifre:'', rol: p.rol, aktif: p.aktif })
    setModal(true)
  }

  const hepsiFiltresiz = [...personeller]
  const aramaFiltresiz = !arama ? personeller : personeller.filter(p => p.ad_soyad?.toLowerCase().includes(arama.toLowerCase()) || p.email?.toLowerCase().includes(arama.toLowerCase()))
  const aktifler = aramaFiltresiz.filter(p => p.aktif)
  const pasifler = aramaFiltresiz.filter(p => !p.aktif)
  function exportCSV() {
    csvIndir(hepsiFiltresiz.map(p => ({
      'Ad Soyad': p.ad_soyad||'', 'Rol': p.rol||'', 'Aktif': p.aktif ? 'Evet' : 'Hayır',
      'Telefon': p.telefon||'', 'TC': p.tc||'', 'Kase No': p.kase_no||'',
      'Sertifika Türü': p.sertifika_turu||'', 'Sertifika No': p.sertifika_no||'',
      'Katip Toplam (dk)': p.katip_toplam_dk||'', 'Katip Kullanılan (dk)': p.katip_kullanilan_dk||'',
    })), 'personeller')
  }


  return (
    <div className="page-wrap">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 className="page-title">Personel Yönetimi</h1>
          <p className="page-sub">{aktifler.length} aktif · {pasifler.length} pasif</p>
        </div>
        <input value={arama} onChange={e=>setArama(e.target.value)} placeholder="Personel ara..." style={{ padding:'9px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13, fontFamily:'inherit', width:180 }}/>
        <button onClick={exportCSV} style={{ padding:'9px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-dim)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>↓ CSV</button>
        <button className="btn" onClick={()=>{ setDuzenle(null); setForm(bosForm()); setModal(true) }}>
          <Plus size={18}/> Yeni Personel
        </button>
      </div>

      <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:'var(--accent-soft)', border:'1px solid rgba(99,102,241,0.1)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <span style={{ fontSize:18, flexShrink:0 }}>💡</span>
        <p style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>Personel Yönetimi — Sadece yöneticiler erişebilir. Rol değişikliği anında kaydedilir. Aktif/Pasif ile sisteme girişi açıp kapatın. Yeni personel eklerken e-posta ve şifre belirlenir, kullanıcı otomatik oluşturulur.</p>
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 16px', borderRadius:10, fontSize:13, marginBottom:16 }}>{hata}</div>}
      {basari && <div style={{ background:'var(--green-soft)', color:'var(--green)', padding:'10px 16px', borderRadius:10, fontSize:13, marginBottom:16 }}>{basari}</div>}

      {/* ROL ÖZET */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:10, marginBottom:24 }}>
        {ROLLER.map(r => (
          <div key={r} className="card" style={{ padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:700, color:ROL_RENK[r], fontFamily:'Sora,sans-serif' }}>
              {personeller.filter(p => p.rol === r && p.aktif).length}
            </div>
            <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:3 }}>{ROL_AD[r]}</div>
          </div>
        ))}
      </div>

      {/* PERSONEL TABLOSU */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr><th>Ad Soyad</th><th>Telefon</th><th>TC</th><th>Sertifika</th><th>Kase</th><th>Rol</th><th>Durum</th><th>Yetkiler</th><th></th></tr>
            </thead>
            <tbody>
              {yukleniyor
                ? <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Yükleniyor...</td></tr>
                : personeller.length === 0
                ? <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Personel yok</td></tr>
                : personeller.map(p => {
                  const erisim: any = {
                    yonetici:  'Tümü',
                    operasyon: 'Firmalar, Koordinasyon, İdari, Ziyaretler',
                    hekim:     'Sağlık, Hekim Ekranı, Koordinasyon',
                    satis:     'Firmalar, Teklifler, Malzemeler',
                    muhasebe:  'Tahsilat, Sağlık',
                    saha:      'Koordinasyon, Firmalar, Ziyaretler',
                  }
                  return (
                    <tr key={p.id} style={{ opacity: p.aktif ? 1 : 0.45 }}>
                      <td style={{ fontWeight:500 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:10, background:`${ROL_RENK[p.rol]}22`, color:ROL_RENK[p.rol], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0 }}>
                            {p.ad_soyad?.charAt(0).toUpperCase()}
                          </div>
                          {p.ad_soyad}
                        </div>
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-dim)' }}>{p.telefon||'—'}</td>
                      <td style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-faint)' }}>{p.tc||'—'}</td>
                      <td style={{ fontSize:11, color:'var(--text-dim)' }}>
                        {p.sertifika_turu ? <div>{p.sertifika_turu}</div> : '—'}
                        {p.sertifika_no && <div style={{ fontSize:10, color:'var(--text-faint)' }}>{p.sertifika_no}</div>}
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-dim)' }}>{p.kase_no||'—'}</td>
                      <td>
                        <select
                          value={p.rol}
                          onChange={e => rolGuncelle(p.id, e.target.value)}
                          style={{ width:'auto', padding:'6px 10px', fontSize:13, color:ROL_RENK[p.rol], background:'var(--surface-2)', border:`1px solid ${ROL_RENK[p.rol]}44`, borderRadius:8 }}
                        >
                          {ROLLER.map(r => <option key={r} value={r}>{ROL_AD[r]}</option>)}
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => aktifToggle(p.id, p.aktif)}
                          style={{ padding:'5px 12px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit', border:'none',
                            background: p.aktif ? 'var(--green-soft)' : 'var(--surface-2)',
                            color: p.aktif ? 'var(--green)' : 'var(--text-faint)' }}
                        >
                          {p.aktif ? '● Aktif' : '○ Pasif'}
                        </button>
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-faint)', maxWidth:260 }}>{erisim[p.rol]}</td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => duzenleAc(p)} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:4 }}><Pencil size={14}/></button>
                          <button onClick={() => { setSifreModal(p); setYeniSifre('') }} title="Şifre Sıfırla" style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:4 }}><KeyRound size={14}/></button>
                          <button onClick={() => sil(p.id, p.ad_soyad)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {/* Şifre Sıfırlama Modal */}
      {sifreModal && (
        <div className="modal-overlay" onClick={() => setSifreModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:17, fontWeight:700 }}>Şifre Sıfırla</h2>
              <button onClick={() => setSifreModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)' }}>✕</button>
            </div>
            <div style={{ background:'var(--surface-2)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:14, color:'var(--text-dim)' }}>
              <strong style={{ color:'var(--text)' }}>{sifreModal.ad_soyad}</strong> kullanıcısının şifresi değiştirilecek.
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'var(--text-dim)', fontWeight:600, marginBottom:6, display:'block', textTransform:'uppercase' }}>Yeni Şifre</label>
              <input
                type="password"
                value={yeniSifre}
                onChange={e => setYeniSifre(e.target.value)}
                placeholder="En az 6 karakter"
                autoFocus
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text)', fontSize:14, fontFamily:'inherit', boxSizing:'border-box' as const }}
              />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={sifreSifirla} disabled={sifreYukleniyor || yeniSifre.length < 6}
                style={{ flex:1, padding:12, borderRadius:9, background: yeniSifre.length >= 6 ? 'var(--accent)' : 'var(--border)', color: yeniSifre.length >= 6 ? '#000' : 'var(--text-faint)', border:'none', cursor: yeniSifre.length >= 6 ? 'pointer' : 'not-allowed', fontSize:14, fontWeight:700, fontFamily:'inherit' }}>
                {sifreYukleniyor ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
              <button onClick={() => setSifreModal(null)}
                style={{ padding:'12px 20px', borderRadius:9, border:'1px solid var(--border)', background:'transparent', color:'var(--text-dim)', cursor:'pointer', fontFamily:'inherit' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => { setModal(false); setDuzenle(null) }}>
          <div className="modal-content" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }}>
                <Users size={20} color="var(--accent)"/> {duzenle ? 'Personel Düzenle' : 'Yeni Personel'}
              </h2>
              <button onClick={() => { setModal(false); setDuzenle(null) }} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }}><X size={22}/></button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Ad Soyad *</label>
                <input value={form.ad_soyad} onChange={e => setForm({...form, ad_soyad:e.target.value})} placeholder="Ad Soyad" />
              </div>
              {!duzenle && (
                <>
                  <div>
                    <label style={lbl}>E-posta *</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="kullanici@osgb.com" />
                  </div>
                  <div>
                    <label style={lbl}>Şifre *</label>
                    <input type="password" value={form.sifre} onChange={e => setForm({...form, sifre:e.target.value})} placeholder="Min. 6 karakter" />
                  </div>
                </>
              )}
              <div>
                <label style={lbl}>Rol</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {ROLLER.map(r => (
                    <button key={r} type="button" onClick={() => setForm({...form, rol:r})}
                      style={{ padding:'10px', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                        background: form.rol===r ? `${ROL_RENK[r]}18` : 'var(--surface-2)',
                        border:`1px solid ${form.rol===r ? ROL_RENK[r] : 'var(--border)'}`,
                        color: form.rol===r ? ROL_RENK[r] : 'var(--text-dim)' }}>
                      <div style={{ fontWeight:600 }}>{ROL_AD[r]}</div>
                      <div style={{ fontSize:11, marginTop:2, opacity:0.7 }}>{
                        { yonetici:'Tüm yetkiler', operasyon:'ISG operasyon', hekim:'Sağlık işlemleri', satis:'Satış & Malzeme', muhasebe:'Tahsilat', saha:'Saha ziyaretleri' }[r]
                      }</div>
                    </button>
                  ))}
                </div>
              </div>
              {duzenle && (
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="checkbox" id="aktif" checked={form.aktif} onChange={e => setForm({...form, aktif:e.target.checked})} style={{ width:16, height:16 }} />
                  <label htmlFor="aktif" style={{ fontSize:13, cursor:'pointer' }}>Aktif kullanıcı</label>
                </div>
              )}
            </div>

            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginTop:14 }}>{hata}</div>}

            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }} onClick={() => { setModal(false); setDuzenle(null) }}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={kaydet}>{duzenle ? 'Güncelle' : 'Oluştur'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl: any = { display:'block', fontSize:12, color:'var(--text-dim)', marginBottom:6, fontWeight:500 }
