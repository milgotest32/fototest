'use client'
import { useState, useEffect } from 'react'
import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import { createClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

async function getReferanslar() {
  const sb = createClient()
  const { data } = await sb.from('site_referanslar').select('*').eq('aktif', true).order('sira')
  return data || []
}

export default function Referanslar() {
  const [referanslar, setReferanslar] = useState<any>([])
  useEffect(() => { getReferanslar().then(setReferanslar) }, [])
  return (
    <div style={{ background: '#f8f8f6', minHeight: '100vh', width: '100%', color: '#1a1a2e', fontFamily: "'Inter',-apple-system,system-ui,sans-serif" }}>
      <SiteNav />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 20, height: 2, background: '#6366f1', borderRadius: 2, display: 'inline-block' }} />Referanslar
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, letterSpacing: -1.5, color: '#f8f9fb', marginBottom: 16, lineHeight: 1.1 }}>Güven Duyulan Markalar</h1>
        <p style={{ fontSize: 18, color: '#6b6b88', maxWidth: 560, lineHeight: 1.7, marginBottom: 64 }}>
          Afyon ve çevre illerinde 500'den fazla kuruma verdiğimiz kesintisiz hizmetle güven inşa ettik.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
          {(referanslar || []).map((r: any) => (
            <div key={r.id} style={{
              background: '#ffffff', border: '1px solid #e8e8ed',
              borderRadius: 16, padding: 24, textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              {r.logo_url ? (
                <img src={r.logo_url} alt={r.firma_adi}
                  style={{ width: '100%', maxHeight: 80, objectFit: 'contain', filter: 'grayscale(100%) brightness(1.5)', opacity: 0.8 }} />
              ) : (
                <div style={{ fontSize: 14, fontWeight: 700, color: '#c0c0e0' }}>{r.firma_adi}</div>
              )}
              <div style={{ fontSize: 12, color: '#444455' }}>{r.sektor}</div>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
