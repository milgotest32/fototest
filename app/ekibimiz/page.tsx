'use client'
import { useState, useEffect } from 'react'
import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import { createClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

async function getEkip() {
  const sb = createClient()
  const { data } = await sb.from('site_ekip').select('*').eq('aktif', true).order('sira')
  return data || []
}

export default function Ekibimiz() {
  const [ekip, setEkip] = useState<any>([])
  useEffect(() => { getEkip().then(setEkip) }, [])
  return (
    <div style={{ background: '#f8f8f6', minHeight: '100vh', width: '100%', color: '#1a1a2e', fontFamily: "'Inter',-apple-system,system-ui,sans-serif" }}>
      <SiteNav />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 20, height: 2, background: '#6366f1', borderRadius: 2, display: 'inline-block' }} />Ekibimiz
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, letterSpacing: -1.5, color: '#f8f9fb', marginBottom: 16, lineHeight: 1.1 }}>Uzman Kadromuz</h1>
        <p style={{ fontSize: 18, color: '#6b6b88', maxWidth: 560, lineHeight: 1.7, marginBottom: 64 }}>
          Alanında sertifikalı ve deneyimli uzmanlarımızla hizmetinizdeyiz.
        </p>
        {ekip.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#4a4a68' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <p>Ekip bilgileri panelden eklenebilir.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
            {(ekip || []).map((u: any) => (
              <div key={u.id} style={{ background: '#ffffff', border: '1px solid #e8e8ed', borderRadius: 20, padding: 32, textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,.15)', border: '2px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28, fontWeight: 800, color: '#a5b4fc' }}>
                  {u.ad_soyad?.charAt(0)}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{u.ad_soyad}</h3>
                <p style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginBottom: 8 }}>{u.unvan}</p>
                {u.uzmanlik && <p style={{ fontSize: 12, color: '#444455' }}>{u.uzmanlik}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  )
}
