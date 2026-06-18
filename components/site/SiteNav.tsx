'use client'
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
  const [acik, setAcik] = useState(false)

  useEffect(() => {
    document.body.style.overflow = ''
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  useEffect(() => {
    document.body.style.overflow = ''
    setAcik(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = acik ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [acik])

  return (
    <header style={{ position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 0 #e5e7eb' }}>
      {/* Info bar */}
      <div style={{ background:'#f5c200', padding:'6px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'#1a1a1a', fontWeight:600 }}>
        <span style={{ display:'flex', gap:14 }}>
          <a href="tel:05531696867" style={{ color:'#1a1a1a', textDecoration:'none' }}>📞 0 553 169 68 67</a>
          <span style={{ opacity:.4 }}>|</span>
          <a href="mailto:info@aktifosgb.com.tr" style={{ color:'#1a1a1a', textDecoration:'none' }}>✉️ info@aktifosgb.com.tr</a>
        </span>
        <span className="site-infobar-right">
          <a href="https://wa.me/905531696867" target="_blank" rel="noopener noreferrer" style={{ color:'#1a1a1a', textDecoration:'none', fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>💬 WhatsApp İletişim</a>
        </span>
      </div>

      {/* Ana nav */}
      <nav style={{ background:'#ffffff', borderBottom:'3px solid #f5c200' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 20px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <a href="/" style={{ flexShrink:0 }}>
            <img src="/logo.png" alt="Aktif OSGB" style={{ height:40, objectFit:'contain', display:'block' }} />
          </a>

          {/* Desktop linkler */}
          <ul className="snav-desk" style={{ display:'flex', gap:2, listStyle:'none', margin:0, padding:0 }}>
            {LINKLER.map(l => (
              <li key={l.href}>
                <a href={l.href} style={{
                  color: pathname.startsWith(l.href) ? '#1a1a1a' : '#4a4a6a',
                  background: pathname.startsWith(l.href) ? '#f5c200' : 'transparent',
                  borderRadius: 8, padding:'8px 12px',
                  fontSize: 13, fontWeight: pathname.startsWith(l.href) ? 700 : 500,
                  textDecoration:'none', display:'block', whiteSpace:'nowrap',
                  transition:'all .15s'
                }}>{l.label}</a>
              </li>
            ))}
          </ul>

          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <a href="/tehlike-sinifi" className="snav-teh" style={{ padding:'8px 12px', borderRadius:8, background:'rgba(245,194,0,.15)', border:'1px solid rgba(245,194,0,.4)', color:'#1a1a1a', fontSize:12, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}>Tehlike Sınıfı</a>
            <a href={user ? '/firmalar' : '/giris'} style={{ padding:'8px 16px', borderRadius:8, background:'#f5c200', color:'#1a1a1a', fontSize:13, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(245,194,0,.3)' }}>{user ? 'Panel →' : 'Giriş'}</a>
            <button className="snav-ham" onClick={() => setAcik(v => !v)}
              style={{ display:'none', background:'#f5c200', border:'none', color:'#1a1a1a', cursor:'pointer', fontSize:22, padding:'8px 12px', lineHeight:1, flexShrink:0, borderRadius:8, fontWeight:900 }}>
              {acik ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobil overlay */}
      {acik && <div onClick={() => setAcik(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:9998 }} />}

      {/* Mobil menü */}
      <div style={{
        position:'fixed', top:0, right: acik ? 0 : '-100%', bottom:0, width:'min(280px,85vw)',
        background:'#ffffff', borderLeft:'3px solid #f5c200',
        zIndex:9999, transition:'right .25s cubic-bezier(.4,0,.2,1)',
        display:'flex', flexDirection:'column'
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', borderBottom:'1px solid #e5e7eb', flexShrink:0 }}>
          <img src="/logo.png" alt="Aktif OSGB" style={{ height:34, objectFit:'contain' }} />
          <button onClick={() => setAcik(false)}
            style={{ background:'#f5f5f5', border:'1px solid #e5e7eb', borderRadius:8, color:'#1a1a1a', cursor:'pointer', width:36, height:36, fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
            ✕
          </button>
        </div>
        <nav style={{ flex:1, overflowY:'auto' }}>
          {LINKLER.map(l => (
            <a key={l.href} href={l.href} style={{
              display:'block', padding:'14px 20px', fontSize:15, textDecoration:'none',
              color: pathname.startsWith(l.href) ? '#1a1a1a' : '#4a4a6a',
              background: pathname.startsWith(l.href) ? 'rgba(245,194,0,.12)' : 'transparent',
              borderLeft: pathname.startsWith(l.href) ? '3px solid #f5c200' : '3px solid transparent',
              fontWeight: pathname.startsWith(l.href) ? 700 : 400,
            }}>{l.label}</a>
          ))}
        </nav>
        <div style={{ padding:'16px 18px', borderTop:'1px solid #e5e7eb', display:'flex', flexDirection:'column', gap:10 }}>
          <a href="/tehlike-sinifi" style={{ padding:'12px', borderRadius:8, background:'rgba(245,194,0,.1)', border:'1px solid rgba(245,194,0,.3)', color:'#1a1a1a', fontSize:13, fontWeight:700, textDecoration:'none', textAlign:'center' }}>Tehlike Sınıfı</a>
          <a href={user ? '/firmalar' : '/giris'} style={{ padding:'12px', borderRadius:8, background:'#f5c200', color:'#1a1a1a', fontSize:14, fontWeight:700, textDecoration:'none', textAlign:'center' }}>{user ? 'Panel →' : 'Giriş Yap'}</a>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .snav-desk { display:none !important; } .snav-ham { display:flex !important; } .snav-teh { display:none !important; } }
      `}</style>
    </header>
  )
}
