'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const LINKLER = [
  { href: '/kurumsal', label: 'Kurumsal' },
  { href: '/hizmetlerimiz', label: 'Hizmetler' },
  { href: '/egitimler', label: 'Eğitimler' },
  { href: '/ekibimiz', label: 'Ekibimiz' },
  { href: '/referanslar', label: 'Referanslar' },
  { href: '/yazilarimiz', label: 'Yazılarımız' },
  { href: '/iletisim', label: 'İletişim' },
]

export default function SiteNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [menuAcik, setMenuAcik] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setUser(data.user))
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Menü açıkken body scroll engelle
  useEffect(() => {
    if (menuAcik) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuAcik])

  return (
    <>
      {/* Üst info bar */}
      <div style={{ background: '#f5c200', padding: '6px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#1a1a1a', fontWeight: 600 }}>
        <span>📞 0 553 169 68 67 &nbsp;|&nbsp; ✉️ info@aktifosgb.com.tr</span>
        <span style={{ display: 'flex', gap: 16 }}>
          <a href="https://www.facebook.com/afyonaktifOSGB/" target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a1a', textDecoration: 'none', fontWeight: 700 }}>FB</a>
          <a href="https://www.instagram.com/aktifosgb/" target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a1a', textDecoration: 'none', fontWeight: 700 }}>IG</a>
          <a href="https://wa.me/905531696867" target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a1a', textDecoration: 'none', fontWeight: 700 }}>WA</a>
        </span>
      </div>

      {/* Ana nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,10,15,.97)' : '#0a0a0f',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(245,194,0,.15)',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,.4)' : 'none',
        transition: 'all .3s',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src="/logo.png" alt="Aktif OSGB" style={{ height: 40, objectFit: 'contain' }} />
          </Link>

          {/* Desktop linkler */}
          <ul style={{ display: 'flex', gap: 4, listStyle: 'none', margin: 0, padding: 0 }} className="sitenav-desktop">
            {LINKLER.map(l => (
              <li key={l.href}>
                <Link href={l.href} style={{
                  color: pathname.startsWith(l.href) ? '#f5c200' : '#c8c8d8',
                  textDecoration: 'none', fontSize: 13, fontWeight: 600,
                  padding: '8px 12px', borderRadius: 8, display: 'block',
                  background: pathname.startsWith(l.href) ? 'rgba(245,194,0,.08)' : 'transparent',
                  transition: 'all .15s',
                }}>{l.label}</Link>
              </li>
            ))}
          </ul>

          {/* Sağ aksiyon */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <Link href="/tehlike-sinifi" style={{
              padding: '8px 14px', borderRadius: 8, background: 'rgba(245,194,0,.1)',
              border: '1px solid rgba(245,194,0,.3)', color: '#f5c200',
              fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
            }} className="sitenav-tehlike">Tehlike Sınıfı Sorgula</Link>

            {user ? (
              <Link href="/firmalar" style={{ padding: '8px 16px', borderRadius: 8, background: '#f5c200', color: '#1a1a1a', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>Panel →</Link>
            ) : (
              <Link href="/giris" style={{ padding: '8px 16px', borderRadius: 8, background: '#f5c200', color: '#1a1a1a', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>Giriş</Link>
            )}

            {/* Hamburger — inline style ile kontrol, CSS class yok */}
            <button
              onClick={() => setMenuAcik(v => !v)}
              aria-label="Menü"
              style={{
                display: 'none',
                background: 'none', border: 'none',
                color: '#c8c8d8', cursor: 'pointer',
                fontSize: 26, padding: '4px 6px',
                lineHeight: 1, alignItems: 'center', justifyContent: 'center',
              }}
              className="sitenav-burger"
            >
              {menuAcik ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobil overlay + drawer */}
      {mounted && menuAcik && (
        <div
          onClick={() => setMenuAcik(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
          }}
        />
      )}

      {mounted && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 300, maxWidth: '85vw',
          background: '#0e0e18',
          borderRight: '1px solid rgba(245,194,0,.15)',
          zIndex: 201,
          transform: menuAcik ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .25s ease',
          display: 'flex', flexDirection: 'column',
          padding: '20px 0',
          overflowY: 'auto',
        }} className="sitenav-drawer">
          {/* Logo */}
          <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="/logo.png" alt="Aktif OSGB" style={{ height: 36, objectFit: 'contain' }} />
            <button onClick={() => setMenuAcik(false)} style={{ background: 'none', border: 'none', color: '#c8c8d8', fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
          </div>

          {/* Linkler */}
          <nav style={{ flex: 1, padding: '12px 0' }}>
            {LINKLER.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuAcik(false)} style={{
                display: 'flex', alignItems: 'center', padding: '14px 24px',
                color: pathname.startsWith(l.href) ? '#f5c200' : '#c8c8d8',
                textDecoration: 'none', fontSize: 15, fontWeight: 600,
                background: pathname.startsWith(l.href) ? 'rgba(245,194,0,.06)' : 'transparent',
                borderLeft: pathname.startsWith(l.href) ? '3px solid #f5c200' : '3px solid transparent',
              }}>{l.label}</Link>
            ))}
          </nav>

          {/* Alt butonlar */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user ? (
              <Link href="/firmalar" onClick={() => setMenuAcik(false)} style={{ display: 'block', padding: '13px 16px', borderRadius: 10, background: '#f5c200', color: '#1a1a1a', textDecoration: 'none', fontSize: 15, fontWeight: 800, textAlign: 'center' }}>
                Panel →
              </Link>
            ) : (
              <Link href="/giris" onClick={() => setMenuAcik(false)} style={{ display: 'block', padding: '13px 16px', borderRadius: 10, background: '#f5c200', color: '#1a1a1a', textDecoration: 'none', fontSize: 15, fontWeight: 800, textAlign: 'center' }}>
                Giriş Yap
              </Link>
            )}
            <Link href="/tehlike-sinifi" onClick={() => setMenuAcik(false)} style={{ display: 'block', padding: '12px 16px', borderRadius: 10, background: 'rgba(245,194,0,.08)', border: '1px solid rgba(245,194,0,.2)', color: '#f5c200', textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
              🔍 Tehlike Sınıfı Sorgula
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .sitenav-desktop { display: none !important; }
          .sitenav-burger { display: flex !important; }
          .sitenav-tehlike { display: none !important; }
        }
      `}</style>
    </>
  )
}
