'use client'
import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

async function getHizmetler() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await sb.from('site_hizmetler').select('*').eq('aktif', true).order('sira')
  return data || []
}

export default async function Hizmetlerimiz() {
  const hizmetler = await getHizmetler()
  return (
    <div style={{ background: '#f8f8f6', minHeight: '100vh', width: '100%', color: '#1a1a2e', fontFamily: "'Inter',-apple-system,system-ui,sans-serif" }}>
      <SiteNav />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 20, height: 2, background: '#6366f1', borderRadius: 2, display: 'inline-block' }} />Hizmetlerimiz
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, letterSpacing: -1.5, color: '#111118', marginBottom: 16, lineHeight: 1.1 }}>Kapsamlı OSGB Çözümleri</h1>
        <p style={{ fontSize: 18, color: '#6b6b88', maxWidth: 560, lineHeight: 1.7, marginBottom: 64 }}>
          6331 sayılı İş Sağlığı ve Güvenliği Kanunu kapsamında işletmenize özel, eksiksiz hizmet paketi.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {hizmetler.map((h: any) => (
            <div key={h.id} style={{ background: '#ffffff', border: '1px solid #e8e8ed', borderRadius: 20, padding: 32 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20 }}>{h.ikon}</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>{h.baslik}</h2>
              <p style={{ fontSize: 14, color: '#444455', lineHeight: 1.7 }}>{h.aciklama}</p>
              {h.etiketler && <div style={{ marginTop: 20, fontSize: 12, color: '#6366f1', fontWeight: 600, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {h.etiketler.split('·').map((e: string) => (
                  <span key={e} style={{ background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 100, padding: '4px 12px' }}>{e.trim()}</span>
                ))}
              </div>}
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
