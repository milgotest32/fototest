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

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setUser(data.user))
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Üst info bar */}
      <div style={{ background: '#f5c200', padding: '6px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#1a1a1a', fontWeight: 600 }}>
        <span>📞 0 553 169 68 67 &nbsp;|&nbsp; ✉️ info@aktifosgb.com.tr</span>
        <span className="site-infobar-right" style={{ display: 'flex', gap: 16 }}>
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
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="https://aktifosgb.com.tr/wp-content/uploads/2020/02/aktifosgblogo.png" alt="Aktif OSGB" style={{ height: 44, objectFit: 'contain' }} />
          </Link>

          {/* Desktop */}
          <ul className="site-nav-links" style={{ display: 'flex', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}>
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

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/tehlike-sinifi" style={{
              padding: '8px 14px', borderRadius: 8, background: 'rgba(245,194,0,.1)',
              border: '1px solid rgba(245,194,0,.3)', color: '#f5c200',
              fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>Tehlike Sınıfı Sorgula</Link>
            {user ? (
              <Link href="/firmalar" style={{ padding: '8px 16px', borderRadius: 8, background: '#f5c200', color: '#1a1a1a', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Panel →</Link>
            ) : (
              <Link href="/giris" style={{ padding: '8px 16px', borderRadius: 8, background: '#f5c200', color: '#1a1a1a', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Giriş</Link>
            )}
            <button onClick={() => setMenuAcik(!menuAcik)} className="site-burger"
              style={{ background: 'none', border: 'none', color: '#c8c8d8', cursor: 'pointer', fontSize: 22, display: 'none' }}>☰</button>
          </div>
        </div>

        {/* Mobil menü */}
        {menuAcik && (
          <div style={{ background: '#0e0e18', borderTop: '1px solid rgba(245,194,0,.1)', padding: '12px 24px 20px' }}>
            {LINKLER.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuAcik(false)} style={{
                display: 'block', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.05)',
                color: pathname.startsWith(l.href) ? '#f5c200' : '#c8c8d8', textDecoration: 'none', fontSize: 15, fontWeight: 600,
              }}>{l.label}</Link>
            ))}
            <Link href="/tehlike-sinifi" onClick={() => setMenuAcik(false)} style={{ display: 'block', marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(245,194,0,.1)', border: '1px solid rgba(245,194,0,.2)', color: '#f5c200', textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
              🔍 Tehlike Sınıfı Sorgula
            </Link>
          </div>
        )}
      </nav>
      <style>{`
        @media(max-width:900px){ .site-nav-links{display:none!important} .site-burger{display:flex!important} }
      `}</style>
    </>
  )
}
