'use client'
import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import { createClient } from '@supabase/supabase-js'
import { getSeoMetadata } from '@/lib/seo'
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return getSeoMetadata('/kurumsal')
}

async function getAyarlar() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await sb.from('site_ayarlar').select('anahtar,deger')
  const a: Record<string,string> = {}
  ;(data||[]).forEach((r:any) => { a[r.anahtar]=r.deger })
  return a
}

export default async function Kurumsal() {
  const a = await getAyarlar()
  const s = (k: string, fb = '') => a[k] || fb

  const stil = { background: '#f8f8f6', minHeight: '100vh', width: '100%', color: '#1a1a2e', fontFamily: "'Inter',-apple-system,system-ui,sans-serif" }
  const wrap = { maxWidth: 1000, margin: '0 auto', padding: '80px 32px' }
  const label = { fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }
  const line = { width: 20, height: 2, background: '#6366f1', borderRadius: 2, display: 'inline-block' }
  const h1s = { fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, letterSpacing: -1.5, color: '#111118', marginBottom: 24, lineHeight: 1.1 }
  const ps = { fontSize: 16, color: '#9b9bb8', lineHeight: 1.8, marginBottom: 16 }
  const card = { borderRadius: 20, padding: 32, marginBottom: 24 }

  return (
    <div style={stil}>
      <SiteNav />
      <div style={wrap}>
        {/* Hakkımızda */}
        <div style={label}><span style={line} />Kurumsal</div>
        <h1 style={h1s}>Hakkımızda</h1>
        <p style={ps}>{s('hakkimizda_detay', s('aciklama'))}</p>
        <p style={ps}>Aktif OSGB uzman ve tecrübeli işyeri hekimleri ve iş güvenliği uzmanları ile ülkemizdeki zorlu çalışma şartlarından, sağlıklı ve güvenli bir çalışma alanı sağlamak amacıyla işin normal akışını bozmadan, iş kazaları ve meslek hastalıklarını en aza indirgeyerek verimli çalışma alanlarının oluşturulmasında hizmet vermektedir.</p>
        <p style={{...ps, marginBottom: 60}}>Aktif OSGB'nin Meditek iş sağlığı ve güvenliği yazılım programı ile tüm firmalarımızın iş sağlığı ve güvenliği faaliyetleri ve planlamalarının sistemsel takibi yapılmaktadır.</p>

        {/* Vizyon Misyon */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24, marginBottom: 60 }}>
          <div style={{ ...card, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 2, color: '#8080f8', marginBottom: 14 }}>Vizyonumuz</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111118', marginBottom: 14 }}>Sektörde Uzman Kuruluş</h2>
            <p style={{ fontSize: 14, color: '#7070a0', lineHeight: 1.7 }}>{s('vizyon')}</p>
          </div>
          <div style={{ ...card, background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.12)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 2, color: '#34d399', marginBottom: 14 }}>Misyonumuz</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111118', marginBottom: 14 }}>Etik ve Güvenilir Hizmet</h2>
            <p style={{ fontSize: 14, color: '#7070a0', lineHeight: 1.7 }}>{s('misyon')}</p>
          </div>
        </div>

        {/* Hedefler */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111118', marginBottom: 20, letterSpacing: -0.5 }}>Hedeflerimiz</h2>
          <div style={{ background: '#ffffff', border: '1px solid #e8e8ed', borderRadius: 16, padding: 28 }}>
            {s('hedeflerimiz').split('\n').filter(Boolean).map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ color: '#6366f1', fontWeight: 700, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 14, color: '#9b9bb8', lineHeight: 1.6 }}>{line.replace('• ', '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Değerler */}
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111118', marginBottom: 20, letterSpacing: -0.5 }}>Değerlerimiz</h2>
          <div style={{ background: '#ffffff', border: '1px solid #e8e8ed', borderRadius: 16, padding: 28 }}>
            {s('degerlerimiz').split('\n').filter(Boolean).map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ color: '#34d399', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 14, color: '#9b9bb8', lineHeight: 1.6 }}>{line.replace('• ', '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'rgba(255,255,255,.05)', borderRadius: 20, overflow: 'hidden', marginTop: 60 }}>
          {[{ num: s('stat_kurum','500')+'+', label: 'Çalışılan Kurum' }, { num: s('stat_yil','10')+'+', label: 'Yıllık Deneyim' }, { num: s('stat_egitim','1200')+'+', label: 'Verilen Eğitim' }].map(({ num, label: l }) => (
            <div key={l} style={{ background: '#ffffff', padding: '40px 32px', textAlign: 'center' as const }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#6366f1', letterSpacing: -2, lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 12, color: '#6b6b88', marginTop: 8, textTransform: 'uppercase' as const, letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
