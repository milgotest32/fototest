'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
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
  const panelRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  // pathname değişince kapat
  useEffect(() => { setAcik(false) }, [pathname])

  // DOM'a direkt müdahale — class değil style
  useEffect(() => {
    const panel = panelRef.current
    const overlay = overlayRef.current
    if (!panel || !overlay) return
    if (acik) {
      panel.style.transform = 'translateX(0)'
      overlay.style.display = 'block'
      document.body.style.overflow = 'hidden'
    } else {
      panel.style.transform = 'translateX(-100%)'
      overlay.style.display = 'none'
      document.body.style.overflow = ''
    }
  }, [acik])

  function ac() { setAcik(true) }
  function kapat() { setAcik(false) }

  return (
    <>
      {/* INFO BAR */}
      <div style={{background:'#f5c200',padding:'6px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,color:'#1a1a1a',fontWeight:600}}>
        <span>📞 0 553 169 68 67 &nbsp;|&nbsp; ✉️ info@aktifosgb.com.tr</span>
        <span style={{display:'flex',gap:14}}>
          <a href="https://www.facebook.com/afyonaktifOSGB/" target="_blank" rel="noopener noreferrer" style={{color:'#1a1a1a',textDecoration:'none',fontWeight:700}}>FB</a>
          <a href="https://www.instagram.com/aktifosgb/" target="_blank" rel="noopener noreferrer" style={{color:'#1a1a1a',textDecoration:'none',fontWeight:700}}>IG</a>
          <a href="https://wa.me/905531696867" target="_blank" rel="noopener noreferrer" style={{color:'#1a1a1a',textDecoration:'none',fontWeight:700}}>WA</a>
        </span>
      </div>

      {/* NAV BAR */}
      <nav style={{position:'sticky',top:0,zIndex:100,background:'#0a0a0f',borderBottom:'1px solid rgba(245,194,0,.15)'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 20px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          
          {/* Logo */}
          <Link href="/" style={{flexShrink:0,display:'flex'}}>
            <img src="/logo.png" alt="Aktif OSGB" style={{height:40,objectFit:'contain'}} />
          </Link>

          {/* Desktop linkler */}
          <ul style={{display:'flex',gap:2,listStyle:'none',margin:0,padding:0}} className="snav-desktop">
            {LINKLER.map(l => (
              <li key={l.href}>
                <Link href={l.href} style={{
                  color: pathname.startsWith(l.href) ? '#f5c200' : '#c8c8d8',
                  background: pathname.startsWith(l.href) ? 'rgba(245,194,0,.08)' : 'transparent',
                  textDecoration:'none',fontSize:13,fontWeight:600,
                  padding:'8px 12px',borderRadius:8,display:'block',whiteSpace:'nowrap'
                }}>{l.label}</Link>
              </li>
            ))}
          </ul>

          {/* Sağ */}
          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <Link href="/tehlike-sinifi" className="snav-tehlike" style={{
              padding:'8px 12px',borderRadius:8,
              background:'rgba(245,194,0,.1)',border:'1px solid rgba(245,194,0,.3)',
              color:'#f5c200',fontSize:12,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap'
            }}>Tehlike Sınıfı</Link>

            <Link href={user ? '/firmalar' : '/giris'} style={{
              padding:'8px 16px',borderRadius:8,background:'#f5c200',
              color:'#1a1a1a',fontSize:13,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap'
            }}>{user ? 'Panel →' : 'Giriş'}</Link>

            {/* HAMBURGER — onClick garantili */}
            <button
              type="button"
              onClick={ac}
              className="snav-burger"
              style={{display:'none',background:'none',border:'none',color:'#f5c200',cursor:'pointer',fontSize:28,padding:'6px 8px',lineHeight:1,flexShrink:0,touchAction:'manipulation'}}
            >☰</button>
          </div>
        </div>
      </nav>

      {/* OVERLAY */}
      <div
        ref={overlayRef}
        onClick={kapat}
        style={{display:'none',position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:9998,touchAction:'manipulation'}}
      />

      {/* DRAWER PANEL */}
      <div
        ref={panelRef}
        style={{
          position:'fixed',top:0,left:0,bottom:0,width:300,maxWidth:'85vw',
          background:'#0e0e1c',borderRight:'1px solid rgba(245,194,0,.15)',
          zIndex:9999,display:'flex',flexDirection:'column',
          transform:'translateX(-100%)',transition:'transform .25s ease',
          willChange:'transform'
        }}
      >
        {/* Panel baş */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px',borderBottom:'1px solid rgba(255,255,255,.06)',flexShrink:0}}>
          <img src="/logo.png" alt="Aktif OSGB" style={{height:36,objectFit:'contain'}} />
          <button
            type="button"
            onClick={kapat}
            style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,color:'#fff',cursor:'pointer',width:38,height:38,fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',touchAction:'manipulation'}}
          >✕</button>
        </div>

        {/* Linkler */}
        <nav style={{flex:1,overflowY:'auto'}}>
          {LINKLER.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={kapat}
              style={{
                display:'block',padding:'16px 20px',
                color: pathname.startsWith(l.href) ? '#f5c200' : '#c8c8d8',
                background: pathname.startsWith(l.href) ? 'rgba(245,194,0,.06)' : 'transparent',
                borderBottom:'1px solid rgba(255,255,255,.04)',
                textDecoration:'none',fontSize:16,fontWeight:600,
                borderLeft: pathname.startsWith(l.href) ? '3px solid #f5c200' : '3px solid transparent',
              }}
            >{l.label}</Link>
          ))}
        </nav>

        {/* Alt butonlar */}
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:10,borderTop:'1px solid rgba(255,255,255,.06)',flexShrink:0}}>
          <Link href={user ? '/firmalar' : '/giris'} onClick={kapat} style={{
            display:'block',padding:14,borderRadius:10,background:'#f5c200',
            color:'#0a0a0f',fontSize:15,fontWeight:800,textDecoration:'none',textAlign:'center'
          }}>{user ? 'Panel →' : 'Giriş Yap'}</Link>
          <Link href="/tehlike-sinifi" onClick={kapat} style={{
            display:'block',padding:12,borderRadius:10,
            background:'rgba(245,194,0,.08)',border:'1px solid rgba(245,194,0,.15)',
            color:'#f5c200',fontSize:14,fontWeight:700,textDecoration:'none',textAlign:'center'
          }}>🔍 Tehlike Sınıfı Sorgula</Link>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .snav-desktop{display:none!important}
          .snav-burger{display:flex!important}
          .snav-tehlike{display:none!important}
        }
      `}</style>
    </>
  )
}
