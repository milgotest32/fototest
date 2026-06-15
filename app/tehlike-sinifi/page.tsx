import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import SiteFloating from '@/components/site/SiteFloating'
import NaceSorgulama from './NaceSorgulama'

export const metadata = {
  title: 'Tehlike Sınıfı & NACE Kodu Sorgulama | Aktif OSGB Afyonkarahisar',
  description: 'İşyerinizin NACE kodunu ve tehlike sınıfını ücretsiz sorgulayın. 6331 sayılı Kanun kapsamında az tehlikeli, tehlikeli, çok tehlikeli sınıf tespiti.',
  keywords: 'NACE kodu sorgulama, tehlike sınıfı, iş güvenliği, OSGB, Afyonkarahisar',
}

export default function TehlikeSinifi() {
  return (
    <div style={{ background: 'linear-gradient(135deg,#0a0a0f 0%,#0e0e18 100%)', minHeight: '100vh', color: '#e8e8f0', fontFamily: "'Inter',-apple-system,system-ui,sans-serif" }}>
      <SiteNav />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 20px 80px' }}>
        {/* Başlık */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,194,0,.1)', border: '1px solid rgba(245,194,0,.25)', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, color: '#f5c200', marginBottom: 20 }}>
            🔍 Ücretsiz Sorgulama Aracı
          </div>
          <h1 style={{ fontSize: 'clamp(26px,5vw,46px)', fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: -1, lineHeight: 1.1 }}>
            Tehlike Sınıfı & NACE Kodu Sorgulama
          </h1>
          <p style={{ fontSize: 15, color: '#6b6b88', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            6331 sayılı Kanun kapsamında işyerinizin tehlike sınıfını NACE kodu veya faaliyet adıyla anında sorgulayın.
          </p>
        </div>

        {/* Bilgi kartları */}
        <div className="site-tehlike-info" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 36 }}>
          {[
            { renk: '#22c55e', bg: 'rgba(34,197,94,.08)', border: 'rgba(34,197,94,.2)', sinif: 'Az Tehlikeli', icon: '🟢', aciklama: 'Büro, ticaret, eğitim, konaklama' },
            { renk: '#f59e0b', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)', sinif: 'Tehlikeli', icon: '🟡', aciklama: 'İmalat, taşımacılık, sağlık, inşaat' },
            { renk: '#ef4444', bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.2)', sinif: 'Çok Tehlikeli', icon: '🔴', aciklama: 'Madencilik, kimya, patlayıcı üretimi' },
          ].map(({ renk, bg, border, sinif, icon, aciklama }) => (
            <div key={sinif} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: renk, marginBottom: 4 }}>{sinif}</div>
              <div style={{ fontSize: 12, color: '#5d5d7a', lineHeight: 1.4 }}>{aciklama}</div>
            </div>
          ))}
        </div>

        {/* Arama sistemi */}
        <NaceSorgulama />

        {/* Alt CTA */}
        <div style={{ marginTop: 40, background: 'linear-gradient(135deg,rgba(245,194,0,.08),rgba(245,194,0,.03))', border: '1px solid rgba(245,194,0,.15)', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Tehlike sınıfınıza uygun fiyat teklifi alın</div>
            <div style={{ fontSize: 13, color: '#6b6b88' }}>Uzmanlarımız en uygun paketi sizin için hazırlasın.</div>
          </div>
          <a href="/iletisim" style={{ padding: '11px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#f5c200,#e6a800)', color: '#0a0a0f', fontSize: 14, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>Teklif Al →</a>
        </div>
      </div>
      <SiteFooter />
      <SiteFloating />
    </div>
  )
}
