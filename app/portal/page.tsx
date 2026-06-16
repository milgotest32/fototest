'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PortalGiris() {
  const [sicil, setSicil] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const router = useRouter()

  async function girisYap() {
    if (!sicil.trim()) { setHata('SGK sicil numarası giriniz.'); return }
    setYukleniyor(true); setHata('')
    const sb = createClient()
    
    // SGK sicil numarası ile firmayı bul
    const { data: firma, error } = await sb
      .from('firmalar')
      .select('id, unvan, sgk_sicil')
      .eq('sgk_sicil', sicil.trim())
      .eq('aktif', true)
      .single()

    if (error || !firma) {
      setHata('SGK sicil numarası bulunamadı. Lütfen kontrol edin.')
      setYukleniyor(false)
      return
    }

    // Session'a firma bilgisini kaydet
    sessionStorage.setItem('portal_firma', JSON.stringify(firma))
    router.push('/portal/dosyalar')
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter',-apple-system,system-ui,sans-serif", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="https://aktifosgb.com.tr/wp-content/uploads/2020/02/aktifosgblogo.png"
            alt="Aktif OSGB" style={{ height: 52, objectFit: 'contain' }} />
          <p style={{ fontSize: 13, color: '#5d5d7a', marginTop: 12 }}>Firma Portali</p>
        </div>

        {/* Kart */}
        <div style={{
          background: '#0e0e1c', border: '1px solid rgba(245,194,0,.15)',
          borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 20px 60px rgba(0,0,0,.5)',
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: -0.5 }}>
            Firma Girişi
          </h1>
          <p style={{ fontSize: 13, color: '#5d5d7a', marginBottom: 28, lineHeight: 1.6 }}>
            SGK sicil numaranız hem kullanıcı adınız hem de şifrenizdir.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8b8ba8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
              SGK Sicil Numarası
            </label>
            <input
              type="text"
              value={sicil}
              onChange={e => setSicil(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && girisYap()}
              placeholder="Sicil numaranızı girin"
              style={{
                width: '100%', background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(245,194,0,.2)', borderRadius: 10,
                padding: '13px 16px', color: '#e0e0f0', fontSize: 15,
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {hata && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
              {hata}
            </div>
          )}

          <button onClick={girisYap} disabled={yukleniyor} style={{
            width: '100%', padding: 14, borderRadius: 10,
            background: yukleniyor ? 'rgba(245,194,0,.5)' : 'linear-gradient(135deg,#f5c200,#e6a800)',
            color: '#0a0a0f', fontSize: 15, fontWeight: 800,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(245,194,0,.25)',
          }}>
            {yukleniyor ? 'Giriş yapılıyor...' : 'Portale Giriş →'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a href="https://wa.me/905531696867" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#5d5d7a', textDecoration: 'none' }}>
              Sorun mu yaşıyorsunuz? Bize ulaşın
            </a>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#3a3a58', marginTop: 24 }}>
          © 2026 Aktif OSGB · Afyonkarahisar
        </p>
      </div>
    </div>
  )
}
