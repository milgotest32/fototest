'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const SLIDES = [
  {
    img: 'https://aktifosgb.com.tr/wp-content/uploads/2020/01/slider2.jpg',
    baslik: ['9 Yıldır', 'Güvenli İşyerleri', 'İçin Çalışıyoruz!'],
    aciklama: 'İşyerlerinde olası kaza ve kayıpların önüne geçmek, iş sağlığı ve güvenliğini korumak için profesyonel ekibimizle hizmet veriyoruz.',
  },
  {
    img: 'https://aktifosgb.com.tr/wp-content/uploads/2020/01/slider6-1.jpg',
    baslik: ['Yasal', 'Yükümlülüklerinizi', 'Zamanında Yerine Getirin'],
    aciklama: 'Periyodik sağlık taramaları, işe giriş muayeneleri ve risk analizleri tek çatı altında. 6331 sayılı Kanun kapsamında tüm hizmetler.',
  },
  {
    img: 'https://aktifosgb.com.tr/wp-content/uploads/2023/11/aktif-osgb-9-yil-slider.jpg',
    baslik: ['Afyon\'un', 'Güvenilir', 'OSGB\'si'],
    aciklama: '500\'den fazla firmaya verdiğimiz kesintisiz hizmetle iş sağlığı ve güvenliği alanında sektörün lider kuruluşu.',
  },
]

export default function HeroSlider() {
  const [aktif, setAktif] = useState(0)
  const [animasyon, setAnimasyon] = useState(true)

  useEffect(() => {
    const t = setInterval(() => gecis((aktif + 1) % SLIDES.length), 5500)
    return () => clearInterval(t)
  }, [aktif])

  function gecis(idx: number) {
    setAnimasyon(false)
    setTimeout(() => { setAktif(idx); setAnimasyon(true) }, 350)
  }

  const slide = SLIDES[aktif]

  return (
    <section style={{ position: 'relative', width: '100%', height: 'clamp(500px,85vh,760px)', overflow: 'hidden' }}>
      {/* BG image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${slide.img})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transition: 'opacity .35s ease', opacity: animasyon ? 1 : 0,
        transform: animasyon ? 'scale(1)' : 'scale(1.02)',
      }} />

      {/* Gradient overlay — soldan sağa */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(105deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.6) 55%, rgba(0,0,0,.15) 100%)',
      }} />
      {/* Alt gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top,#08080f,transparent)' }} />

      {/* Sarı dikey şerit (sol dekor) */}
      <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 4, background: 'linear-gradient(180deg,transparent,#f5c200,transparent)', borderRadius: 4 }} />

      {/* İçerik */}
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', padding: 'clamp(24px,6vw,100px)', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ maxWidth: 660, transition: 'opacity .35s ease, transform .35s ease', opacity: animasyon ? 1 : 0, transform: animasyon ? 'translateY(0)' : 'translateY(20px)' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,194,0,.15)', border: '1px solid rgba(245,194,0,.3)', borderRadius: 100, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: '#f5c200', marginBottom: 28, backdropFilter: 'blur(8px)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f5c200', display: 'inline-block', boxShadow: '0 0 8px #f5c200' }} />
            ÇSGB Yetkili OSGB · Afyonkarahisar
          </div>

          {/* Başlık */}
          <h1 style={{ fontSize: 'clamp(32px,6vw,66px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: -1.5, color: '#fff', marginBottom: 20 }}>
            <span style={{ color: '#f5c200', display: 'block' }}>{slide.baslik[0]}</span>
            <span style={{ display: 'block' }}>{slide.baslik[1]}</span>
            <span style={{ display: 'block' }}>{slide.baslik[2]}</span>
          </h1>

          {/* Açıklama */}
          <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: 'rgba(255,255,255,.75)', lineHeight: 1.75, marginBottom: 36, maxWidth: 520 }}>{slide.aciklama}</p>

          {/* Butonlar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/iletisim" style={{ padding: '13px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#f5c200,#e6a800)', color: '#0a0a0f', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 20px rgba(245,194,0,.35)' }}>
              Ücretsiz Teklif Al →
            </Link>
            <Link href="/hizmetlerimiz" style={{ padding: '13px 24px', borderRadius: 10, background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Hizmetlerimiz
            </Link>
          </div>

          {/* Stat mini */}
          <div style={{ display: 'flex', gap: 32, marginTop: 44 }}>
            {[['500+', 'Firma'], ['9+', 'Yıl'], ['1200+', 'Eğitim']].map(([num, lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#f5c200', letterSpacing: -0.5 }}>{num}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nokta navigasyon */}
      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 3 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => gecis(i)} style={{
            width: i === aktif ? 32 : 8, height: 8, borderRadius: 100,
            background: i === aktif ? '#f5c200' : 'rgba(255,255,255,.3)',
            border: 'none', cursor: 'pointer', padding: 0, transition: 'all .3s',
          }} />
        ))}
      </div>

      {/* Ok butonları */}
      {[{ label: '‹', idx: (aktif - 1 + SLIDES.length) % SLIDES.length, side: { left: 20 }, cls: 'site-slider-arrow' }, { label: '›', idx: (aktif + 1) % SLIDES.length, side: { right: 20 }, cls: 'site-slider-arrow' }].map(({ label, idx, side }) => (
        <button key={label} onClick={() => gecis(idx)} style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)', ...side, zIndex: 3,
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(245,194,0,.2)', color: '#f5c200',
          fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .15s',
        }}>{label}</button>
      ))}
    </section>
  )
}
