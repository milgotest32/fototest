import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer style={{ background: '#060610', borderTop: '1px solid rgba(255,255,255,.05)', padding: '48px 32px 28px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, paddingBottom: 40, borderBottom: '1px solid rgba(255,255,255,.05)', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
              Aktif OSGB
            </div>
            <p style={{ fontSize: 13, color: '#4a4a68', lineHeight: 1.7, maxWidth: 240 }}>
              2014'ten bu yana iş sağlığı ve güvenliğinde güvenilir çözüm ortağınız.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {[['Facebook', 'https://www.facebook.com/afyonaktifOSGB/'], ['Instagram', 'https://www.instagram.com/aktifosgb/'], ['WhatsApp', 'https://wa.me/905531696867']].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#5d5d7a', fontSize: 11, textDecoration: 'none', fontWeight: 600,
                }}>{label[0]}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#4a4a68', marginBottom: 16 }}>Hizmetler</h4>
            {['İş Güvenliği', 'İşyeri Hekimliği', 'Ölçüm Hizmetleri', 'TMGD', 'LPG Müdürlük'].map(s => (
              <Link key={s} href="/hizmetlerimiz" style={{ display: 'block', color: '#5d5d7a', fontSize: 13, textDecoration: 'none', marginBottom: 8 }}>{s}</Link>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#4a4a68', marginBottom: 16 }}>Eğitimler</h4>
            {['İlk Yardım', 'Yangın Eğitimi', 'Hijyen Eğitimi', 'Mesleki Eğitim'].map(s => (
              <Link key={s} href="/egitimler" style={{ display: 'block', color: '#5d5d7a', fontSize: 13, textDecoration: 'none', marginBottom: 8 }}>{s}</Link>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#4a4a68', marginBottom: 16 }}>Kurumsal</h4>
            {[['Hakkımızda', '/kurumsal'], ['Ekibimiz', '/ekibimiz'], ['Referanslar', '/referanslar'], ['Yazılarımız', '/yazilarimiz'], ['İletişim', '/iletisim']].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: 'block', color: '#5d5d7a', fontSize: 13, textDecoration: 'none', marginBottom: 8 }}>{label}</Link>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#3a3a58' }}>© 2014–2026 Aktif OSGB · Tüm hakları saklıdır.</p>
          <p style={{ fontSize: 12, color: '#3a3a58' }}>Pzt–Cum 08:30–18:00 · Cts 09:00–15:00</p>
        </div>
      </div>
    </footer>
  )
}
