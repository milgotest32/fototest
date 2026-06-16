'use client'
import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import { createClient } from '@supabase/supabase-js'
import { getSeoMetadata } from '@/lib/seo'
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return getSeoMetadata('/egitimler')
}

async function getEgitimler() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await sb.from('site_egitimler').select('*').eq('aktif', true).order('sira')
  return data || []
}

export default async function Egitimler() {
  const egitimler = await getEgitimler()
  return (
    <div style={{ background: '#f8f8f6', minHeight: '100vh', width: '100%', color: '#1a1a2e', fontFamily: "'Inter',-apple-system,system-ui,sans-serif" }}>
      <SiteNav />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 20, height: 2, background: '#6366f1', borderRadius: 2, display: 'inline-block' }} />Eğitimler
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, letterSpacing: -1.5, color: '#111118', marginBottom: 16, lineHeight: 1.1 }}>Sertifikalı Eğitim Programları</h1>
        <p style={{ fontSize: 18, color: '#6b6b88', maxWidth: 560, lineHeight: 1.7, marginBottom: 64 }}>
          Yasal zorunluluklar kapsamında çalışanlarınızı eğitiyor, sertifikalandırıyoruz.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {egitimler.map((e: any, i: number) => (
            <div key={e.id} style={{ background: '#ffffff', border: '1px solid #e8e8ed', borderRadius: 20, padding: 32 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'rgba(99,102,241,.15)', lineHeight: 1, marginBottom: 20 }}>{String(i+1).padStart(2,'0')}</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>{e.baslik}</h2>
              <p style={{ fontSize: 14, color: '#444455', lineHeight: 1.7, marginBottom: 20 }}>{e.aciklama}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {e.sure && <span style={{ fontSize: 12, color: '#7c7cf0', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.12)', borderRadius: 100, padding: '4px 12px', fontWeight: 600 }}>⏱ {e.sure}</span>}
                {e.sertifika && <span style={{ fontSize: 12, color: '#34d399', background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.15)', borderRadius: 100, padding: '4px 12px', fontWeight: 600 }}>✓ Sertifikalı</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
