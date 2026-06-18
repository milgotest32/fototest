'use client'
import { useState } from 'react'
import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import SiteFloating from '@/components/site/SiteFloating'
import { createClient } from '@/lib/supabase'

export default function RamakKala() {
  const [form, setForm] = useState({ ad_soyad: '', telefon: '', firma_adi: '', bolum: '', ileti: '', donus_isteniyor: false })
  const [gonderildi, setGonderildi] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  async function gonder() {
    if (!form.ad_soyad || !form.ileti || !form.firma_adi) { setHata('Zorunlu alanları doldurun.'); return }
    setYukleniyor(true); setHata('')
    const sb = createClient()
    const { error } = await sb.from('site_ramak_kala').insert(form)
    if (error) { setHata('Gönderim sırasında hata oluştu.'); setYukleniyor(false); return }
    setGonderildi(true); setYukleniyor(false)
  }

  const inp: any = { width: '100%', background: '#f8f9fb', border: '1px solid rgba(255,255,255,.09)', borderRadius: 10, padding: '12px 16px', color: '#e0e0f0', fontSize: 14, fontFamily: 'inherit', outline: 'none' }
  const lbl = (t: string, zorunlu = false) => (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8b8ba8', textTransform: 'uppercase' as const, letterSpacing: .5, marginBottom: 7 }}>
      {t}{zorunlu && <span style={{ color: '#f5c200', marginLeft: 4 }}>*</span>}
    </label>
  )

  return (
    <div style={{ background: 'linear-gradient(135deg,#f8f9fb 0%,#0e0e18 100%)', minHeight: '100vh', color: '#1a1a2e', fontFamily: "'Inter',-apple-system,system-ui,sans-serif" }}>
      <SiteNav />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 32px 80px' }}>

        {/* Başlık */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 20 }}>
            ⚠️ İş Güvenliği Bildirimi
          </div>
          <h1 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 900, color: '#1a1a2e', marginBottom: 16, letterSpacing: -1 }}>Ramak Kala Bildirim Formu</h1>
          <p style={{ fontSize: 15, color: '#6b6b88', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            İşyerinde yaşanan ramak kala olaylarını (kaza olmadan atlatılan tehlikeli durumları) bildirerek iş güvenliğine katkı sağlayın.
          </p>
        </div>

        {/* Nedir kutusu */}
        <div style={{ background: 'rgba(245,194,0,.06)', border: '1px solid rgba(245,194,0,.15)', borderRadius: 16, padding: 24, marginBottom: 36 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f5c200', marginBottom: 8 }}>💡 Ramak Kala Nedir?</h3>
          <p style={{ fontSize: 13, color: '#7070a0', lineHeight: 1.7 }}>
            Ramak kala, gerçek bir iş kazasına dönüşmeden önce atlatılan tehlikeli olay ya da durumdur. Bu olayların bildirilmesi, önlem alınmasını sağlayarak gelecekteki kazaları önler.
          </p>
        </div>

        {/* Form */}
        {gonderildi ? (
          <div style={{ background: '#ffffff', border: '1px solid rgba(34,197,94,.2)', borderRadius: 20, padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#22c55e', marginBottom: 12 }}>Bildiriminiz Alındı!</h2>
            <p style={{ fontSize: 15, color: '#6b6b88' }}>İş güvenliği uzmanımız en kısa sürede inceleyecek ve dönüş yapacaktır.</p>
          </div>
        ) : (
          <div style={{ background: '#ffffff', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
            <div className="site-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>{lbl('Ad Soyad', true)}<input style={inp} placeholder="Adınız Soyadınız" value={form.ad_soyad} onChange={e => setForm({ ...form, ad_soyad: e.target.value })} /></div>
              <div>{lbl('Telefon')}<input style={inp} placeholder="05xx xxx xx xx" value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} /></div>
            </div>
            <div className="site-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>{lbl('Firma Adı', true)}<input style={inp} placeholder="Çalıştığınız firma" value={form.firma_adi} onChange={e => setForm({ ...form, firma_adi: e.target.value })} /></div>
              <div>{lbl('Bölüm / Departman')}<input style={inp} placeholder="Üretim, Depo, Ofis..." value={form.bolum} onChange={e => setForm({ ...form, bolum: e.target.value })} /></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              {lbl('Olayın Detayları', true)}
              <textarea style={{ ...inp, minHeight: 140, resize: 'vertical' }}
                placeholder="Ne oldu? Nerede oldu? Nasıl atlatıldı? Tekrar yaşanmaması için ne yapılabilir?"
                value={form.ileti} onChange={e => setForm({ ...form, ileti: e.target.value })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '14px 16px', background: 'rgba(255,255,255,.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,.07)' }}>
              <input type="checkbox" id="donus" checked={form.donus_isteniyor} onChange={e => setForm({ ...form, donus_isteniyor: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#f5c200', cursor: 'pointer' }} />
              <label htmlFor="donus" style={{ fontSize: 14, color: '#9b9bb8', cursor: 'pointer' }}>Konuyla ilgili dönüş rica ediyorum</label>
            </div>
            {hata && <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>{hata}</div>}
            <button onClick={gonder} disabled={yukleniyor} style={{
              width: '100%', padding: 15, borderRadius: 10,
              background: yukleniyor ? 'rgba(245,194,0,.5)' : 'linear-gradient(135deg,#f5c200,#e6a800)',
              color: '#f8f9fb', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(245,194,0,.25)',
            }}>
              {yukleniyor ? 'Gönderiliyor...' : '📨 Bildirimi Gönder'}
            </button>
          </div>
        )}

        {/* QR info */}
        <div style={{ marginTop: 32, textAlign: 'center', color: '#3a3a58', fontSize: 12 }}>
          <p>Bu form QR kod ile erişilebilir. İşyerinize QR kod için iletişime geçin: <span style={{ color: '#f5c200' }}>info@aktifosgb.com.tr</span></p>
        </div>
      </div>
      <SiteFooter />
      <SiteFloating />
    </div>
  )
}
