'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { csvIndir } from '@/lib/csvExport'
import { Plus, X, Users, Trash2, Pencil, Shield, KeyRound } from 'lucide-react'
import { MODUL_LISTESI, getRolDefaults, getModulIzinAlanlari, type IzinMap, type ModulIzin } from '@/lib/izinler'

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
  // Yetki modal
  const [yetkiModal, setYetkiModal] = useState<any>(null)
  const [yetkiForm, setYetkiForm] = useState<IzinMap>({})
  const [yetkiKaydediliyor, setYetkiKaydediliyor] = useState(false)

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
      .select('id, ad_soyad, rol, aktif, telefon, tc, kase_no, sertifika_turu, sertifika_no, katip_toplam_dk, katip_kullanilan_dk, izinler')
      .order('ad_soyad')
    if (error) { setHata('Yüklenemedi'); return }
    setPersoneller(data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.ad_soyad || (!duzenle && (!form.email || !form.sifre))) return
    setHata(''); setBasari('')

    if (duzenle) {
      const { error } = await sb.from('personeller').update({
        ad_soyad: form.ad_soyad,
        rol: form.rol,
        aktif: form.aktif
      }).eq('id', duzenle.id)
      if (error) { setHata('Güncelleme hatası: ' + error.message); return }
      setBasari('Güncellendi.')
      setDuzenle(null)
      setModal(false)
    } else {
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

  // ---- YETKİ MODAL ----
  function yetkiAc(p: any) {
    // Kişisel izinler varsa onu, yoksa rol default'unu yükle
    const mevcutIzinler: IzinMap = p.izinler && Object.keys(p.izinler).length > 0
      ? p.izinler
      : getRolDefaults(p.rol)
    setYetkiModal(p)
    setYetkiForm(mevcutIzinler)
  }

  function yetkiToggle(modul: string, alan: keyof ModulIzin) {
    setYetkiForm(prev => {
      const mevcut = prev[modul as keyof IzinMap] || { goruntur: false, duzenle: false, dosya_yukle: false, sil: false }
      let yeni = { ...mevcut, [alan]: !(mevcut as any)[alan] }
      // Herhangi bir aksiyon açılırsa görüntüleme de açık olmalı
      if (alan !== 'goruntur' && (yeni as any)[alan]) yeni.goruntur = true
      // Görüntüleme kapatılırsa tüm aksiyonlar kapanır
      if (alan === 'goruntur' && !yeni.goruntur) {
        yeni.duzenle = false
        ;(yeni as any).dosya_yukle = false
        ;(yeni as any).sil = false
      }
      return { ...prev, [modul]: yeni }
    })
  }

  async function yetkiKaydet() {
    if (!yetkiModal) return
    setYetkiKaydediliyor(true)
    const { error } = await sb
      .from('personeller')
      .update({ izinler: yetkiForm })
      .eq('id', yetkiModal.id)
    if (error) {
      alert('Kayıt hatası: ' + error.message)
    } else {
      setBasari(`${yetkiModal.ad_soyad} yetkileri güncellendi.`)
      setYetkiModal(null)
      yukle()
    }
    setYetkiKaydediliyor(false)
  }

  function yetkiSifirla() {
    if (!yetkiModal) return
    setYetkiForm(getRolDefaults(yetkiModal.rol))
  }

  const aramaFiltresiz = !arama ? personeller : personeller.filter(p =>
    p.ad_soyad?.toLowerCase().includes(arama.toLowerCase()) ||
    p.email?.toLowerCase().includes(arama.toLowerCase())
  )
  const aktifler = aramaFiltresiz.filter(p => p.aktif)
  const pasifler = aramaFiltresiz.filter(p => !p.aktif)

  function exportCSV() {
    csvIndir(personeller.map(p => ({
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
        <p style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>Personel Yönetimi — Sadece yöneticiler erişebilir. Rol değişikliği anında kaydedilir. Aktif/Pasif ile sisteme girişi açıp kapatın. <strong style={{color:'var(--text)'}}>🛡️ Yetki</strong> butonuyla kişiye özel modül izinleri tanımlayabilirsiniz.</p>
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
              <tr><th>Ad Soyad</th><th>Telefon</th><th>TC</th><th>Sertifika</th><th>Kase</th><th>Rol</th><th>Durum</th><th>Özel İzin</th><th></th></tr>
            </thead>
            <tbody>
              {yukleniyor
                ? <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Yükleniyor...</td></tr>
                : aramaFiltresiz.length === 0
                ? <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-faint)', padding:40 }}>Personel yok</td></tr>
                : aramaFiltresiz.map(p => {
                  const ozIzinVar = p.izinler && Object.keys(p.izinler).length > 0
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
                      <td>
                        {ozIzinVar
                          ? <span style={{ fontSize:11, color:'var(--accent)', background:'var(--accent-soft)', padding:'3px 8px', borderRadius:6, fontWeight:600 }}>Özel</span>
                          : <span style={{ fontSize:11, color:'var(--text-faint)' }}>Rol default</span>
                        }
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => duzenleAc(p)} title="Düzenle" style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:4 }}><Pencil size={14}/></button>
                          <button onClick={() => yetkiAc(p)} title="Yetkileri Düzenle" style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', padding:4 }}><Shield size={14}/></button>
                          <button onClick={() => { setSifreModal(p); setYeniSifre('') }} title="Şifre Sıfırla" style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:4 }}><KeyRound size={14}/></button>
                          <button onClick={() => sil(p.id, p.ad_soyad)} title="Sil" style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4 }}><Trash2 size={14}/></button>
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

      {/* YETKİ MODAL */}
      {yetkiModal && (
        <div className="modal-overlay" onClick={() => setYetkiModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:580, width:'95vw' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div>
                <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:17, fontWeight:700, margin:0 }}>
                  🛡️ Yetki Düzenle
                </h2>
                <p style={{ fontSize:12, color:'var(--text-faint)', margin:'4px 0 0' }}>
                  {yetkiModal.ad_soyad} · {ROL_AD[yetkiModal.rol]}
                </p>
              </div>
              <button onClick={() => setYetkiModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:20 }}>✕</button>
            </div>

            <div style={{ background:'var(--surface-2)', borderRadius:8, padding:'8px 12px', marginBottom:16, fontSize:12, color:'var(--text-faint)' }}>
              Boş bırakılan modüller için rol varsayılanı uygulanır. Özel izin tanımladığınızda o modül için rol yerine bu ayar geçerli olur.
            </div>

            {/* BAŞLIK SATIRI — dinamik, modüle göre değişir */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr repeat(4, 72px)', gap:4, padding:'6px 10px', marginBottom:4 }}>
              <span style={{ fontSize:11, color:'var(--text-faint)', fontWeight:600, textTransform:'uppercase' }}>Modül</span>
              <span style={{ fontSize:11, color:'var(--text-faint)', fontWeight:600, textTransform:'uppercase', textAlign:'center' }}>Göster</span>
              <span style={{ fontSize:11, color:'var(--text-faint)', fontWeight:600, textTransform:'uppercase', textAlign:'center' }}>Düzenle</span>
              <span style={{ fontSize:11, color:'var(--text-faint)', fontWeight:600, textTransform:'uppercase', textAlign:'center' }}>Dosya</span>
              <span style={{ fontSize:11, color:'var(--text-faint)', fontWeight:600, textTransform:'uppercase', textAlign:'center' }}>Sil</span>
            </div>

            {/* MODÜL SATIRLARI — modüle özel alanlar dinamik */}
            <div style={{ display:'flex', flexDirection:'column', gap:2, maxHeight:420, overflowY:'auto' }}>
              {MODUL_LISTESI.map(({ key, label }) => {
                const izin: ModulIzin = yetkiForm[key] || { goruntur: false, duzenle: false, dosya_yukle: false, sil: false }
                const alanlar = getModulIzinAlanlari(key)
                // Renk paleti her alan için
                const ALAN_RENK: Record<string, string> = {
                  goruntur: 'var(--green)', duzenle: 'var(--accent)',
                  dosya_yukle: '#3b82f6', sil: 'var(--red)'
                }
                return (
                  <div key={key} style={{
                    display:'grid', gridTemplateColumns:'1fr repeat(4, 72px)', gap:4,
                    padding:'7px 10px', borderRadius:8,
                    background: izin.goruntur ? 'var(--surface-2)' : 'transparent',
                    alignItems:'center'
                  }}>
                    <span style={{ fontSize:13, color: izin.goruntur ? 'var(--text)' : 'var(--text-faint)' }}>
                      {label}
                    </span>
                    {/* Her zaman 4 slot render et, aktif olmayan modül alanları disabled */}
                    {(['goruntur','duzenle','dosya_yukle','sil'] as (keyof ModulIzin)[]).map(alan => {
                      const aktif = alanlar.some(a => a.key === alan)
                      const deger = !!(izin as any)[alan]
                      const bagimliBozuk = alan !== 'goruntur' && !izin.goruntur
                      return (
                        <div key={alan} style={{ display:'flex', justifyContent:'center' }}>
                          {aktif ? (
                            <button
                              onClick={() => yetkiToggle(key, alan)}
                              title={alan === 'dosya_yukle' ? 'Dosya Yükle' : alan === 'sil' ? 'Sil' : alan}
                              style={{
                                width:26, height:26, borderRadius:6, border: deger ? '2px solid transparent' : '2px solid rgba(255,255,255,0.25)', cursor: bagimliBozuk ? 'not-allowed' : 'pointer',
                                background: deger ? ALAN_RENK[alan] : 'rgba(255,255,255,0.06)',
                                color: deger ? '#fff' : 'var(--text-faint)',
                                fontSize:14, display:'flex', alignItems:'center', justifyContent:'center',
                                opacity: bagimliBozuk ? 0.25 : 1,
                                boxShadow: deger ? `0 0 0 1px ${ALAN_RENK[alan]}` : 'none'
                              }}
                            >
                              {deger ? '✓' : ''}
                            </button>
                          ) : (
                            <div style={{ width:26, height:26, borderRadius:6, background:'rgba(255,255,255,0.04)', border:'2px solid rgba(255,255,255,0.1)', opacity:0.35 }}/>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button
                onClick={yetkiSifirla}
                style={{ padding:'10px 16px', borderRadius:9, border:'1px solid var(--border)', background:'transparent', color:'var(--text-dim)', cursor:'pointer', fontFamily:'inherit', fontSize:13 }}
              >
                ↺ Rol Varsayılanı
              </button>
              <button
                onClick={() => setYetkiModal(null)}
                style={{ padding:'10px 16px', borderRadius:9, border:'1px solid var(--border)', background:'transparent', color:'var(--text-dim)', cursor:'pointer', fontFamily:'inherit', fontSize:13 }}
              >
                İptal
              </button>
              <button
                onClick={yetkiKaydet}
                disabled={yetkiKaydediliyor}
                style={{ flex:1, padding:'10px', borderRadius:9, background:'var(--accent)', color:'#000', border:'none', cursor: yetkiKaydediliyor ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontSize:14, fontWeight:700 }}
              >
                {yetkiKaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ŞİFRE SIFIRLAMA MODAL */}
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

      {/* PERSONEL EKLE/DÜZENLE MODAL */}
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
                        ({ yonetici:'Tüm yetkiler', operasyon:'ISG operasyon', hekim:'Sağlık işlemleri', satis:'Satış & Teklif', muhasebe:'Tahsilat', saha:'Saha ziyaretleri' } as any)[r]
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
