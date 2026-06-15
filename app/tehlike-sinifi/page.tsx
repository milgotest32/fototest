import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import SiteFloating from '@/components/site/SiteFloating'

export const metadata = { title: 'Tehlike Sınıfı Sorgulama - NACE Kodu Sorgulama | Aktif OSGB', description: 'İşyerinizin NACE kodunu ve tehlike sınıfını ücretsiz sorgulayın. Az tehlikeli, tehlikeli, çok tehlikeli sınıf tespiti.' }

export default function TehlikeSinifi() {
  const bg = { background: 'linear-gradient(135deg,#0a0a0f 0%,#0e0e18 100%)', minHeight: '100vh', color: '#e8e8f0', fontFamily: "'Inter',-apple-system,system-ui,sans-serif" }
  return (
    <div style={bg}>
      <SiteNav />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 32px 80px' }}>
        {/* Başlık */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,194,0,.1)', border: '1px solid rgba(245,194,0,.25)', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, color: '#f5c200', marginBottom: 20 }}>
            🔍 Ücretsiz Sorgulama Aracı
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: -1 }}>Tehlike Sınıfı & NACE Kodu Sorgulama</h1>
          <p style={{ fontSize: 16, color: '#6b6b88', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            6331 sayılı Kanun gereği işyerleri <strong style={{ color: '#f5c200' }}>az tehlikeli</strong>, <strong style={{ color: '#fb923c' }}>tehlikeli</strong> ve <strong style={{ color: '#f87171' }}>çok tehlikeli</strong> olarak sınıflandırılır. NACE kodunuzla tehlike sınıfınızı öğrenin.
          </p>
        </div>

        {/* Bilgi kartları */}
        <div className="site-tehlike-info" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { sinif: 'Az Tehlikeli', renk: '#22c55e', aciklama: 'Büro, ticaret, eğitim gibi düşük riskli sektörler', icon: '🟢' },
            { sinif: 'Tehlikeli', renk: '#fb923c', aciklama: 'İmalat, inşaat, taşımacılık gibi orta riskli sektörler', icon: '🟡' },
            { sinif: 'Çok Tehlikeli', renk: '#f87171', aciklama: 'Madencilik, kimya, patlayıcı gibi yüksek riskli sektörler', icon: '🔴' },
          ].map(({ sinif, renk, aciklama, icon }) => (
            <div key={sinif} style={{ background: '#0e0e1c', border: `1px solid ${renk}30`, borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: renk, marginBottom: 6 }}>{sinif}</div>
              <div style={{ fontSize: 12, color: '#5d5d7a', lineHeight: 1.5 }}>{aciklama}</div>
            </div>
          ))}
        </div>

        {/* NACE iframe */}
        <div style={{ background: '#0e0e1c', border: '1px solid rgba(245,194,0,.15)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(245,194,0,.1),transparent)', padding: '16px 24px', borderBottom: '1px solid rgba(245,194,0,.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🏭</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f5c200' }}>NACE Kodu Sorgulama</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#5d5d7a' }}>Kaynak: aktifosgb.com.tr/nace</span>
          </div>
          <iframe
            src="https://aktifosgb.com.tr/nace/"
            style={{ width: '100%', height: 600, border: 'none', display: 'block', background: '#fff' }}
            title="NACE Kodu Tehlike Sınıfı Sorgulama"
          />
        </div>

        {/* Alt CTA */}
        <div style={{ marginTop: 40, background: 'linear-gradient(135deg,rgba(245,194,0,.08),rgba(245,194,0,.03))', border: '1px solid rgba(245,194,0,.15)', borderRadius: 16, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Tehlike sınıfınıza uygun fiyat teklifi alın</div>
            <div style={{ fontSize: 13, color: '#6b6b88' }}>Uzmanlarımız sizin için en uygun paketi hazırlasın.</div>
          </div>
          <a href="/iletisim" style={{ padding: '12px 28px', borderRadius: 10, background: '#f5c200', color: '#0a0a0f', fontSize: 14, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>Teklif Al →</a>
        </div>
      </div>
      <SiteFooter />
      <SiteFloating />
    </div>
  )
}
