import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer style={{ background: 'linear-gradient(180deg,#0a0a0f 0%,#050508 100%)', borderTop: '1px solid rgba(245,194,0,.12)', marginTop: 0 }}>
      {/* CTA band */}
      <div style={{ background: 'linear-gradient(135deg,#f5c200 0%,#e6a800 100%)', padding: '48px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: '#0a0a0f', marginBottom: 12, letterSpacing: -0.5 }}>
          İşyeriniz için ücretsiz teklif alın
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(0,0,0,.65)', marginBottom: 28 }}>Uzmanlarımız 24 saat içinde size dönecektir.</p>
        <div className="site-footer-cta" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/iletisim" style={{ padding: '13px 32px', borderRadius: 10, background: '#0a0a0f', color: '#f5c200', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>Teklif Al →</Link>
          <a href="tel:05531696867" style={{ padding: '13px 32px', borderRadius: 10, background: 'rgba(0,0,0,.15)', color: '#0a0a0f', fontSize: 15, fontWeight: 700, textDecoration: 'none', border: '2px solid rgba(0,0,0,.2)' }}>📞 0 553 169 68 67</a>
        </div>
      </div>

      {/* Footer body */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 32px' }}>
        <div className="site-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', gap: 48, marginBottom: 48, borderBottom: '1px solid rgba(255,255,255,.06)', paddingBottom: 48 }}>
          <div>
            <img src="https://aktifosgb.com.tr/wp-content/uploads/2020/02/aktifosgblogo.png" alt="Aktif OSGB" style={{ height: 50, objectFit: 'contain', marginBottom: 16, filter: 'brightness(1.1)' }} />
            <p style={{ fontSize: 13, color: '#5d5d7a', lineHeight: 1.7, maxWidth: 260, marginBottom: 20 }}>
              2014'ten bu yana Afyonkarahisar ve çevre illerinde iş sağlığı ve güvenliği alanında profesyonel hizmet.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['📍', 'Dumlupınar Mah., Atatürk Cad. No:49/1A, AFYONKARAHİSAR'],['📞', '+90 272 223 20 03 · +90 553 169 68 67'],['✉️', 'info@aktifosgb.com.tr'],['🕐', 'Pzt–Cum 09:00–18:00 · Cts 09:00–15:00']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#5d5d7a' }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {[['https://www.facebook.com/afyonaktifOSGB/', 'f'], ['https://www.instagram.com/aktifosgb/', 'in'], ['https://wa.me/905531696867', 'wa']].map(([href, label]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245,194,0,.08)', border: '1px solid rgba(245,194,0,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5c200', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>{label}</a>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: '#f5c200', marginBottom: 20 }}>Hizmetler</h4>
            {['İşyeri Hekimliği', 'İş Güvenliği', 'Mobil Sağlık Tarama', 'TMGD', 'LPG Müdürlük', 'Ölçüm Hizmetleri'].map(s => (
              <Link key={s} href="/hizmetlerimiz" style={{ display: 'block', color: '#5d5d7a', fontSize: 13, textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}>{s}</Link>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: '#f5c200', marginBottom: 20 }}>Eğitimler</h4>
            {['İlk Yardım', 'Yangın Eğitimi', 'Hijyen Eğitimi', 'Mesleki Eğitim'].map(s => (
              <Link key={s} href="/egitimler" style={{ display: 'block', color: '#5d5d7a', fontSize: 13, textDecoration: 'none', marginBottom: 10 }}>{s}</Link>
            ))}
            <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: '#f5c200', margin: '24px 0 20px' }}>Araçlar</h4>
            <Link href="/tehlike-sinifi" style={{ display: 'block', color: '#5d5d7a', fontSize: 13, textDecoration: 'none', marginBottom: 10 }}>Tehlike Sınıfı Sorgula</Link>
            <Link href="/ramak-kala" style={{ display: 'block', color: '#5d5d7a', fontSize: 13, textDecoration: 'none', marginBottom: 10 }}>Ramak Kala Bildir</Link>
          </div>

          <div>
            <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: '#f5c200', marginBottom: 20 }}>Kurumsal</h4>
            {[['Hakkımızda', '/kurumsal'], ['Ekibimiz', '/ekibimiz'], ['Referanslar', '/referanslar'], ['Yazılarımız', '/yazilarimiz'], ['İletişim', '/iletisim']].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: 'block', color: '#5d5d7a', fontSize: 13, textDecoration: 'none', marginBottom: 10 }}>{label}</Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#3a3a58' }}>© 2014–2026 Aktif OSGB · Tüm hakları saklıdır. · AFYONKARAHİSAR</p>
          <p style={{ fontSize: 12, color: '#3a3a58' }}>6331 Sayılı İş Sağlığı ve Güvenliği Kanunu kapsamında yetkili OSGB</p>
        </div>
      </div>
    </footer>
  )
}
