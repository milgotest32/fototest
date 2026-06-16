'use client'
import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getSeoMetadata } from '@/lib/seo'
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return getSeoMetadata('/yazilarimiz')
}

async function getYazilar() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await sb.from('site_yazilar').select('*').eq('yayinda', true).order('yayinlandi_at', { ascending: false })
  return data || []
}

export default async function Yazilarimiz() {
  const yazilar = await getYazilar()
  return (
    <div style={{ background: '#f8f8f6', minHeight: '100vh', width: '100%', color: '#1a1a2e', fontFamily: "'Inter',-apple-system,system-ui,sans-serif" }}>
      <SiteNav />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 20, height: 2, background: '#6366f1', borderRadius: 2, display: 'inline-block' }} />Yazılarımız
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, letterSpacing: -1.5, color: '#111118', marginBottom: 16, lineHeight: 1.1 }}>İSG Dünyasından Haberler</h1>
        <p style={{ fontSize: 18, color: '#6b6b88', maxWidth: 560, lineHeight: 1.7, marginBottom: 64 }}>
          İş sağlığı ve güvenliği alanındaki güncel gelişmeleri takip edin.
        </p>
        {yazilar.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#4a4a68' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <p>Henüz yayında yazı bulunmuyor. Panelden yazı ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            {yazilar.map((y: any) => (
              <div key={y.id} style={{ background: '#ffffff', border: '1px solid #e8e8ed', borderRadius: 20, overflow: 'hidden' }}>
                {y.foto_url && <img src={y.foto_url} alt={y.baslik} style={{ width: '100%', height: 200, objectFit: 'cover' }} />}
                <div style={{ padding: 28 }}>
                  <div style={{ fontSize: 11, color: '#444455', marginBottom: 12 }}>
                    {y.yazar} · {y.yayinlandi_at ? new Date(y.yayinlandi_at).toLocaleDateString('tr-TR') : ''}
                  </div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 10, lineHeight: 1.4 }}>{y.baslik}</h2>
                  <p style={{ fontSize: 13, color: '#444455', lineHeight: 1.6 }}>{y.ozet}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  )
}
