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

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(8,8,15,.88)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(99,102,241,.1)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>
            Aktif OSGB
          </span>
        </Link>

        {/* Desktop links */}
        <ul style={{ display: 'flex', gap: 28, listStyle: 'none', margin: 0, padding: 0 }} className="site-desktop-links">
          {LINKLER.map(l => (
            <li key={l.href}>
              <Link href={l.href} style={{
                color: pathname === l.href ? '#a5b4fc' : '#9b9bb8',
                textDecoration: 'none', fontSize: 13, fontWeight: 500,
                borderBottom: pathname === l.href ? '1px solid #6366f1' : 'none',
                paddingBottom: 2,
              }}>{l.label}</Link>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {user ? (
            <Link href="/" style={{
              padding: '8px 18px', borderRadius: 8, background: '#6366f1',
              color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>Panele Git →</Link>
          ) : (
            <>
              <Link href="/iletisim" style={{
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,.1)',
                color: '#c8c8e0', fontSize: 13, fontWeight: 500, textDecoration: 'none',
              }}>Teklif Al</Link>
              <Link href="/giris" style={{
                padding: '8px 18px', borderRadius: 8, background: '#6366f1',
                color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>Giriş</Link>
            </>
          )}
          {/* Burger */}
          <button onClick={() => setMenuAcik(!menuAcik)} className="site-burger"
            style={{ background: 'none', border: 'none', color: '#9b9bb8', cursor: 'pointer', display: 'none', fontSize: 22 }}>
            ☰
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuAcik && (
        <div style={{
          background: '#0e0e1c', borderTop: '1px solid rgba(255,255,255,.06)',
          padding: '16px 24px',
        }}>
          {LINKLER.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuAcik(false)} style={{
              display: 'block', padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,.04)',
              color: '#c8c8e0', textDecoration: 'none', fontSize: 15,
            }}>{l.label}</Link>
          ))}
        </div>
      )}

      <style>{`
        @media(max-width:768px){
          .site-desktop-links{display:none!important}
          .site-burger{display:block!important}
        }
      `}</style>
    </nav>
  )
}
