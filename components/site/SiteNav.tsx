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

  useEffect(() => { setMenuAcik(false) }, [pathname])

  return (
    <>
      <style>{`
        .snav-infobar{background:#f5c200;padding:6px 24px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#1a1a1a;font-weight:600}
        .snav-wrap{position:sticky;top:0;z-index:100;background:#0a0a0f;border-bottom:1px solid rgba(245,194,0,.15)}
        .snav-inner{max-width:1280px;margin:0 auto;padding:0 20px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .snav-links{display:flex;gap:2px;list-style:none;margin:0;padding:0}
        .snav-link{color:#c8c8d8;text-decoration:none;font-size:13px;font-weight:600;padding:8px 12px;border-radius:8px;display:block;white-space:nowrap}
        .snav-link.on{color:#f5c200;background:rgba(245,194,0,.08)}
        .snav-giris{padding:8px 16px;border-radius:8px;background:#f5c200;color:#1a1a1a;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap;flex-shrink:0}
        .snav-burger{display:none;background:none;border:none;color:#c8c8d8;cursor:pointer;font-size:28px;padding:4px 8px;line-height:1;flex-shrink:0}
        .snav-tehlike{padding:8px 12px;border-radius:8px;background:rgba(245,194,0,.1);border:1px solid rgba(245,194,0,.3);color:#f5c200;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}
        /* Drawer */
        .snav-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9998}
        .snav-panel{position:fixed;top:0;left:0;bottom:0;width:280px;background:#0e0e1c;border-right:1px solid rgba(245,194,0,.15);z-index:9999;display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .25s ease}
        .snav-overlay.open{display:block}
        .snav-panel.open{transform:translateX(0)}
        .snav-panel-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
        .snav-panel-close{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#c8c8d8;cursor:pointer;width:36px;height:36px;font-size:18px;display:flex;align-items:center;justify-content:center}
        .snav-panel-link{display:block;padding:14px 20px;color:#c8c8d8;text-decoration:none;font-size:15px;font-weight:600;border-bottom:1px solid rgba(255,255,255,.04)}
        .snav-panel-link.on{color:#f5c200;background:rgba(245,194,0,.06);border-left:3px solid #f5c200;padding-left:17px}
        .snav-panel-footer{padding:20px;display:flex;flex-direction:column;gap:10px;margin-top:auto;border-top:1px solid rgba(255,255,255,.06)}
        .snav-panel-giris{display:block;padding:13px;border-radius:10px;background:#f5c200;color:#0a0a0f;font-size:15px;font-weight:800;text-decoration:none;text-align:center}
        .snav-panel-tehlike{display:block;padding:12px;border-radius:10px;background:rgba(245,194,0,.08);border:1px solid rgba(245,194,0,.15);color:#f5c200;font-size:14px;font-weight:700;text-decoration:none;text-align:center}
        @media(max-width:900px){
          .snav-links{display:none!important}
          .snav-tehlike{display:none!important}
          .snav-burger{display:flex!important}
        }
      `}</style>

      {/* Info bar */}
      <div className="snav-infobar">
        <span>📞 0 553 169 68 67 &nbsp;|&nbsp; ✉️ info@aktifosgb.com.tr</span>
        <span style={{display:'flex',gap:16}}>
          <a href="https://www.facebook.com/afyonaktifOSGB/" target="_blank" rel="noopener noreferrer" style={{color:'#1a1a1a',textDecoration:'none',fontWeight:700}}>FB</a>
          <a href="https://www.instagram.com/aktifosgb/" target="_blank" rel="noopener noreferrer" style={{color:'#1a1a1a',textDecoration:'none',fontWeight:700}}>IG</a>
          <a href="https://wa.me/905531696867" target="_blank" rel="noopener noreferrer" style={{color:'#1a1a1a',textDecoration:'none',fontWeight:700}}>WA</a>
        </span>
      </div>

      {/* Nav */}
      <div className="snav-wrap">
        <div className="snav-inner">
          <Link href="/" style={{flexShrink:0}}>
            <img src="/logo.png" alt="Aktif OSGB" style={{height:40,objectFit:'contain',display:'block'}} />
          </Link>
          <ul className="snav-links">
            {LINKLER.map(l => (
              <li key={l.href}>
                <Link href={l.href} className={`snav-link${pathname.startsWith(l.href) ? ' on' : ''}`}>{l.label}</Link>
              </li>
            ))}
          </ul>
          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <Link href="/tehlike-sinifi" className="snav-tehlike">Tehlike Sınıfı</Link>
            <Link href={user ? '/firmalar' : '/giris'} className="snav-giris">{user ? 'Panel →' : 'Giriş'}</Link>
            <button className="snav-burger" onClick={() => setMenuAcik(true)} aria-label="Menü">☰</button>
          </div>
        </div>
      </div>

      {/* Overlay — her zaman DOM'da, CSS ile göster/gizle */}
      <div className={`snav-overlay${menuAcik ? ' open' : ''}`} onClick={() => setMenuAcik(false)} />

      {/* Drawer panel — her zaman DOM'da, transform ile aç/kapat */}
      <div className={`snav-panel${menuAcik ? ' open' : ''}`}>
        <div className="snav-panel-head">
          <img src="/logo.png" alt="Aktif OSGB" style={{height:34,objectFit:'contain'}} />
          <button className="snav-panel-close" onClick={() => setMenuAcik(false)}>✕</button>
        </div>
        <nav style={{flex:1,overflowY:'auto'}}>
          {LINKLER.map(l => (
            <Link key={l.href} href={l.href} className={`snav-panel-link${pathname.startsWith(l.href) ? ' on' : ''}`} onClick={() => setMenuAcik(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="snav-panel-footer">
          <Link href={user ? '/firmalar' : '/giris'} className="snav-panel-giris" onClick={() => setMenuAcik(false)}>
            {user ? 'Panel →' : 'Giriş Yap'}
          </Link>
          <Link href="/tehlike-sinifi" className="snav-panel-tehlike" onClick={() => setMenuAcik(false)}>
            🔍 Tehlike Sınıfı Sorgula
          </Link>
        </div>
      </div>
    </>
  )
}
