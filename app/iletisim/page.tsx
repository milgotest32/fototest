'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useEffect } from 'react'
import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import SiteFloating from '@/components/site/SiteFloating'
import { createClient } from '@/lib/supabase'

export default function Iletisim() {
  const [form, setForm] = useState({ ad_soyad:'', telefon:'', email:'', firma_adi:'', calisan_sayisi:'', tehlike_sinifi:'', hizmet_turu:'', mesaj:'' })
  const [gonderildi, setGonderildi] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)

  async function gonder() {
    if (!form.ad_soyad || !form.telefon) return
    setYukleniyor(true)
    const sb = createClient()
    await sb.from('site_teklif_talepleri').insert(form)
    setGonderildi(true)
    setYukleniyor(false)
  }

  const inp: any = { width:'100%', background:'#f4f4f8', border:'1px solid #e8e8ed', borderRadius:10, padding:'12px 16px', color:'#1a1a2e', fontSize:14, fontFamily:'inherit', outline:'none' }
  const lbl: any = { display:'block', fontSize:12, fontWeight:600, color:'#444455', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }

  return (
    <div style={{ background:'#f8f8f6', minHeight:'100vh', color:'#1a1a2e', fontFamily:"'Inter',-apple-system,system-ui,sans-serif" }}>
      <SiteNav />
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'80px 32px' }}>
        <div className="site-iletisim-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:64, alignItems:'start' }}>
          {/* Sol */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:2, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:20, height:2, background:'#6366f1', borderRadius:2, display:'inline-block' }} />İletişim
            </div>
            <h1 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:-1, color:'#f8f9fb', marginBottom:16, lineHeight:1.1 }}>Teklif İçin Bize Ulaşın</h1>
            <p style={{ fontSize:15, color:'#6b7280', lineHeight:1.7, marginBottom:40 }}>Uzmanlarımız en kısa sürede size dönecektir.</p>
            {[
              { ikon:'📍', lbl:'Adres', val:'Dumlupınar Mah., Atatürk Cad. No:49/1A\nMerkez – Afyonkarahisar' },
              { ikon:'📞', lbl:'Telefon', val:'+90 272 223 20 03 · +90 553 169 68 67' },
              { ikon:'✉️', lbl:'E-Posta', val:'info@aktifosgb.com.tr' },
              { ikon:'🕐', lbl:'Çalışma Saatleri', val:'Pzt–Cum 08:30–18:00 · Cts 09:00–15:00' },
            ].map(({ ikon, lbl: l, val }) => (
              <div key={l} style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:24 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{ikon}</div>
                <div>
                  <div style={{ fontSize:11, color:'#4a4a68', fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>{l}</div>
                  <div style={{ fontSize:14, color:'#c0c0e0', marginTop:4, whiteSpace:'pre-line' }}>{val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div style={{ background:'#ffffff', border:'1px solid #e8e8ed', borderRadius:20, padding:36 }}>
            {gonderildi ? (
              <div style={{ textAlign:'center', padding:'60px 0' }}>
                <div style={{ fontSize:52, marginBottom:20 }}>✅</div>
                <h2 style={{ fontSize:22, fontWeight:800, color:'#f8f9fb', marginBottom:12 }}>Talebiniz Alındı!</h2>
                <p style={{ fontSize:15, color:'#6b7280' }}>En kısa sürede sizi arayacağız.</p>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div><label style={lbl}>Ad Soyad *</label><input style={inp} placeholder="Adınız Soyadınız" value={form.ad_soyad} onChange={e=>setForm({...form,ad_soyad:e.target.value})} /></div>
                  <div><label style={lbl}>Telefon *</label><input style={inp} placeholder="05xx xxx xx xx" value={form.telefon} onChange={e=>setForm({...form,telefon:e.target.value})} /></div>
                </div>
                <div style={{ marginBottom:16 }}><label style={lbl}>E-Posta</label><input style={inp} placeholder="email@firma.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
                <div style={{ marginBottom:16 }}><label style={lbl}>Firma Adı</label><input style={inp} placeholder="İşyeri / Firma Adı" value={form.firma_adi} onChange={e=>setForm({...form,firma_adi:e.target.value})} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div><label style={lbl}>Çalışan Sayısı</label><input style={inp} type="number" placeholder="0" value={form.calisan_sayisi} onChange={e=>setForm({...form,calisan_sayisi:e.target.value})} /></div>
                  <div><label style={lbl}>Tehlike Sınıfı</label>
                    <select style={{...inp,color:form.tehlike_sinifi?'#e0e0f0':'#3a3a58'}} value={form.tehlike_sinifi} onChange={e=>setForm({...form,tehlike_sinifi:e.target.value})}>
                      <option value="">Seçiniz</option>
                      <option>Az Tehlikeli</option><option>Tehlikeli</option><option>Çok Tehlikeli</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:16 }}><label style={lbl}>İhtiyaç Duyulan Hizmet</label>
                  <select style={{...inp,color:form.hizmet_turu?'#e0e0f0':'#3a3a58'}} value={form.hizmet_turu} onChange={e=>setForm({...form,hizmet_turu:e.target.value})}>
                    <option value="">Seçiniz</option>
                    <option>İş Güvenliği Uzmanlığı</option><option>İşyeri Hekimliği</option>
                    <option>Her İkisi (Paket)</option><option>Ölçüm Hizmetleri</option>
                    <option>Eğitim Hizmetleri</option><option>TMGD Hizmeti</option><option>Diğer</option>
                  </select>
                </div>
                <div style={{ marginBottom:24 }}><label style={lbl}>Mesajınız</label>
                  <textarea style={{...inp,minHeight:100,resize:'vertical'}} placeholder="Detaylarınızı kısaca belirtebilirsiniz..." value={form.mesaj} onChange={e=>setForm({...form,mesaj:e.target.value})} />
                </div>
                <button onClick={gonder} disabled={yukleniyor} style={{
                  width:'100%', padding:14, borderRadius:10, background:'#6366f1', color:'#f8f9fb',
                  fontSize:15, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit',
                  opacity:yukleniyor?.7:1,
                }}>
                  {yukleniyor ? 'Gönderiliyor...' : 'Teklif Talebi Gönder →'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <SiteFloating />
      <SiteFooter />
    </div>
  )
}
