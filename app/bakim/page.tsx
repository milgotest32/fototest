export default function Bakim() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter',-apple-system,system-ui,sans-serif",
      padding: 32, textAlign: 'center',
    }}>
      <div>
        <img src="https://aktifosgb.com.tr/wp-content/uploads/2020/02/aktifosgblogo.png" alt="Aktif OSGB" style={{ height: 60, marginBottom: 40, opacity: .9 }} />
        <div style={{ fontSize: 56, marginBottom: 24 }}>🔧</div>
        <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: '#fff', marginBottom: 20, letterSpacing: -1 }}>
          Bakım Çalışması
        </h1>
        <p style={{
          fontSize: 'clamp(15px,2.5vw,20px)', color: '#f5c200',
          fontWeight: 700, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 32px',
          fontStyle: 'italic',
        }}>
          "İşçinin ücretini, alnının teri kurumadan önce ödeyiniz."
        </p>
        <p style={{ fontSize: 14, color: '#5d5d7a', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 40px' }}>
          Sitemiz şu anda bakım çalışması nedeniyle geçici olarak hizmet dışıdır. Kısa süre içinde tekrar hizmetinizdeyiz.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="tel:05531696867" style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#f5c200,#e6a800)', color: '#0a0a0f', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
            📞 0 553 169 68 67
          </a>
          <a href="mailto:info@aktifosgb.com.tr" style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#c8c8e0', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            ✉️ info@aktifosgb.com.tr
          </a>
        </div>
      </div>
    </div>
  )
}
