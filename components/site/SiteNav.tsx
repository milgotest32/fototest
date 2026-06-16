'use client'
import { usePathname, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [acik, setAcik] = useState(false)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  // Sayfa değişince menüyü kapat ve overflow'u temizle
  useEffect(() => {
    setAcik(false)
    document.body.style.overflow = ''
    document.body.style.position = ''
  }, [pathname])

  // Başlangıçta body overflow temizle (önceki yüklemeden kalma olabilir)
  useEffect(() => {
    document.body.style.overflow = ''
    document.body.style.position = ''
  }, [])

  function ac() {
    setAcik(true)
    document.body.style.overflow = 'hidden'
  }

  function kapat() {
    setAcik(false)
    document.body.style.overflow = ''
  }

  function git(href: string) {
    // Önce her şeyi temizle
    setAcik(false)
    document.body.style.overflow = ''
    document.body.style.position = ''
    // Sonra navigate et
    router.push(href)
  }

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

      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:100,background:'#0a0a0f',borderBottom:'1px solid rgba(245,194,0,.15)'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 20px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <a href="/" style={{flexShrink:0,display:'flex'}}>
            <img src="/logo.png" alt="Aktif OSGB" style={{height:40,objectFit:'contain'}} />
          </a>

          {/* Desktop */}
          <ul style={{display:'flex',gap:2,listStyle:'none',margin:0,padding:0}} className="snav-desk">
            {LINKLER.map(l => (
              <li key={l.href}>
                <a href={l.href} style={{
                  color: pathname.startsWith(l.href) ? '#f5c200' : '#c8c8d8',
                  background: pathname.startsWith(l.href) ? 'rgba(245,194,0,.08)' : 'transparent',
                  textDecoration:'none',fontSize:13,fontWeight:600,
                  padding:'8px 12px',borderRadius:8,display:'block',whiteSpace:'nowrap'
                }}>{l.label}</a>
              </li>
            ))}
          </ul>

          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <a href="/tehlike-sinifi" className="snav-teh" style={{
              padding:'8px 12px',borderRadius:8,background:'rgba(245,194,0,.1)',
              border:'1px solid rgba(245,194,0,.3)',color:'#f5c200',
              fontSize:12,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap'
            }}>Tehlike Sınıfı</a>

            <a href={user ? '/firmalar' : '/giris'} style={{
              padding:'8px 16px',borderRadius:8,background:'#f5c200',
              color:'#1a1a1a',fontSize:13,fontWeight:700,textDecoration:'none',whiteSpace:'nowrap'
            }}>{user ? 'Panel →' : 'Giriş'}</a>

            <button type="button" onClick={ac} className="snav-burger"
              style={{display:'none',background:'none',border:'none',color:'#f5c200',
                cursor:'pointer',fontSize:28,padding:'6px 8px',lineHeight:1,flexShrink:0}}>
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* OVERLAY */}
      {acik && (
        <div onClick={kapat} style={{
          position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:9998
        }} />
      )}

      {/* DRAWER */}
      <div style={{
        position:'fixed',top:0,left:0,bottom:0,width:300,maxWidth:'85vw',
        background:'#0e0e1c',borderRight:'1px solid rgba(245,194,0,.15)',
        zIndex:9999,display:'flex',flexDirection:'column',
        transform: acik ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform .25s ease',
        visibility: acik ? 'visible' : 'hidden',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'18px 20px',borderBottom:'1px solid rgba(255,255,255,.06)',flexShrink:0}}>
          <img src="/logo.png" alt="Aktif OSGB" style={{height:36,objectFit:'contain'}} />
          <button type="button" onClick={kapat}
            style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',
              borderRadius:8,color:'#fff',cursor:'pointer',width:38,height:38,
              fontSize:20,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>

        <nav style={{flex:1,overflowY:'auto'}}>
          {LINKLER.map(l => (
            <button key={l.href} type="button" onClick={() => git(l.href)}
              style={{
                display:'block',width:'100%',textAlign:'left',
                padding:'16px 20px',
                color: pathname.startsWith(l.href) ? '#f5c200' : '#c8c8d8',
                background: pathname.startsWith(l.href) ? 'rgba(245,194,0,.06)' : 'transparent',
                borderBottom:'1px solid rgba(255,255,255,.04)',
                borderTop:'none',borderRight:'none',
                borderLeft: pathname.startsWith(l.href) ? '3px solid #f5c200' : '3px solid transparent',
                fontSize:16,fontWeight:600,cursor:'pointer',fontFamily:'inherit',
              }}
            >{l.label}</button>
          ))}
        </nav>

        <div style={{padding:20,display:'flex',flexDirection:'column',gap:10,
          borderTop:'1px solid rgba(255,255,255,.06)',flexShrink:0}}>
          <button type="button" onClick={() => git(user ? '/firmalar' : '/giris')}
            style={{padding:14,borderRadius:10,background:'#f5c200',color:'#0a0a0f',
              fontSize:15,fontWeight:800,border:'none',cursor:'pointer',fontFamily:'inherit'}}>
            {user ? 'Panel →' : 'Giriş Yap'}
          </button>
          <button type="button" onClick={() => git('/tehlike-sinifi')}
            style={{padding:12,borderRadius:10,background:'rgba(245,194,0,.08)',
              border:'1px solid rgba(245,194,0,.15)',color:'#f5c200',
              fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            🔍 Tehlike Sınıfı Sorgula
          </button>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .snav-desk{display:none!important}
          .snav-burger{display:flex!important}
          .snav-teh{display:none!important}
        }
      `}</style>
    </>
  )
}
