'use client'
import { useState, useEffect } from 'react'

export default function SiteFloating() {
  const [cerezGoster, setCerezGoster] = useState(false)
  const [menuAcik, setMenuAcik] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cerez-onay')) setCerezGoster(true)
  }, [])

  function cerezKabul() {
    localStorage.setItem('cerez-onay', '1')
    setCerezGoster(false)
  }

  const EYLEMLER = [
    { label: 'WhatsApp', href: 'https://wa.me/905531696867', bg: '#25d366', icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    )},
    { label: 'Ara', href: 'tel:05531696867', bg: '#3b82f6', icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
      </svg>
    )},
    { label: 'Konum', href: 'https://maps.app.goo.gl/1y7Lhc2VPbH6Puzp6', bg: '#ef4444', icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    )},
  ]

  return (
    <>
      {/* Speed Dial */}
      <div style={{ position: 'fixed', bottom: 28, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        {/* Alt eylemler */}
        {EYLEMLER.map((e, i) => (
          <a key={e.label} href={e.href} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              textDecoration: 'none',
              transition: 'all .25s ease',
              opacity: menuAcik ? 1 : 0,
              transform: menuAcik ? 'translateY(0) scale(1)' : `translateY(${(EYLEMLER.length - i) * 20}px) scale(0.7)`,
              pointerEvents: menuAcik ? 'auto' : 'none',
              transitionDelay: menuAcik ? `${i * 60}ms` : '0ms',
            }}>
            <span style={{ background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 8, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)' }}>
              {e.label}
            </span>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: e.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${e.bg}60`,
            }}>{e.icon}</div>
          </a>
        ))}

        {/* Ana buton */}
        <button onClick={() => setMenuAcik(!menuAcik)} style={{
          width: 56, height: 56, borderRadius: '50%',
          background: menuAcik ? '#1a1a1a' : 'linear-gradient(135deg,#f5c200,#e6a800)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: menuAcik ? '0 4px 20px rgba(0,0,0,.4)' : '0 4px 20px rgba(245,194,0,.5)',
          transition: 'all .3s ease',
          transform: menuAcik ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>
          {menuAcik ? (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#0a0a0f">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Çerez banner */}
      {cerezGoster && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 998,
          background: 'linear-gradient(135deg,rgba(10,10,15,.98),rgba(18,18,26,.98))',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(245,194,0,.2)',
          padding: '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 28 }}>🍪</span>
            <div>
              <p style={{ fontSize: 14, color: '#e0e0f0', fontWeight: 600, marginBottom: 4 }}>Bu site çerezleri kullanmaktadır</p>
              <p style={{ fontSize: 12, color: '#5d5d7a' }}>Deneyiminizi geliştirmek için çerezler kullanıyoruz.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={cerezKabul} style={{ padding: '10px 24px', borderRadius: 8, background: '#f5c200', color: '#0a0a0f', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Kabul Et</button>
            <button onClick={() => setCerezGoster(false)} style={{ padding: '10px 18px', borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#9b9bb8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Reddet</button>
          </div>
        </div>
      )}
    </>
  )
}
