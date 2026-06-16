'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FileText, Download, LogOut, FolderOpen } from 'lucide-react'

export default function PortalDosyalar() {
  const [firma, setFirma] = useState<any>(null)
  const [dosyalar, setDosyalar] = useState<any[]>([])
  const [evraklar, setEvraklar] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const firmaStr = sessionStorage.getItem('portal_firma')
    if (!firmaStr) { router.push('/portal'); return }
    const f = JSON.parse(firmaStr)
    setFirma(f)
    yukle(f.id)
  }, [])

  async function yukle(firmaId: string) {
    setYukleniyor(true)
    const sb = createClient()

    // firma_evrak_durumu tablosundan dosya URL'leri
    const { data: evrakDurum } = await sb
      .from('firma_evrak_durumu')
      .select('*')
      .eq('firma_id', firmaId)

    // dosya_url dolu olanları filtrele
    const dosyaliEvraklar = (evrakDurum || []).filter((e: any) => e.dosya_url)
    setDosyalar(dosyaliEvraklar)

    // firma_evraklar (checkbox durumları)
    const { data: evrakData } = await sb
      .from('firma_evraklar')
      .select('*')
      .eq('firma_id', firmaId)
      .single()
    setEvraklar(evrakData)

    setYukleniyor(false)
  }

  function cikisYap() {
    sessionStorage.removeItem('portal_firma')
    router.push('/portal')
  }

  if (!firma) return null

  const EVRAK_LISTESI = [
    ['dr_sozlesme', 'Dr. Sözleşmesi'],
    ['igu_sozlesme', 'İGU Sözleşmesi'],
    ['bhl_sozlesmesi', 'BHL Sözleşmesi'],
    ['risk_analizi', 'Risk Analizi'],
    ['acil_durum_plani', 'Acil Durum Planı'],
    ['egitim_kayitlari', 'Eğitim Kayıtları'],
    ['yillik_calisma_plani', 'Yıllık Çalışma Planı'],
    ['yillik_egitim_plani', 'Yıllık Eğitim Planı'],
    ['saglik_kayitlari', 'Sağlık Kayıtları'],
    ['periyodik_kontroller', 'Periyodik Kontroller'],
    ['ortam_olcumleri', 'Ortam Ölçümleri'],
    ['ziyaret_formlari', 'Ziyaret Formları'],
    ['ilk_yardim_belgeleri', 'İlk Yardım Belgeleri'],
    ['levha_calismalari', 'Levha Çalışmaları'],
    ['kroki', 'Kroki'],
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Inter',-apple-system,system-ui,sans-serif", color: '#e8e8f0' }}>
      {/* Header */}
      <div style={{ background: '#0e0e1c', borderBottom: '1px solid rgba(245,194,0,.12)', padding: '0 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="https://aktifosgb.com.tr/wp-content/uploads/2020/02/aktifosgblogo.png" alt="Aktif OSGB" style={{ height: 36, objectFit: 'contain' }} />
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.1)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{firma.unvan}</div>
              <div style={{ fontSize: 11, color: '#5d5d7a' }}>SGK: {firma.sgk_sicil}</div>
            </div>
          </div>
          <button onClick={cikisYap} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 8, padding: '7px 14px', color: '#9b9bb8',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <LogOut size={14} /> Çıkış
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 'clamp(20px,4vw,30px)', fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: -0.5 }}>
          Firma Dosyalarım
        </h1>
        <p style={{ fontSize: 14, color: '#5d5d7a', marginBottom: 36 }}>
          Aktif OSGB tarafından hazırlanan belgeleriniz aşağıda listelenmiştir.
        </p>

        {yukleniyor ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#5d5d7a' }}>Yükleniyor...</div>
        ) : (
          <>
            {/* Dosya URL'li evraklar */}
            {dosyalar.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f5c200', marginBottom: 16 }}>📎 İndirilebilir Belgeler</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dosyalar.map((d: any) => (
                    <div key={d.id} style={{
                      background: '#0e0e1c', border: '1px solid rgba(245,194,0,.12)',
                      borderRadius: 12, padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,194,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={18} color="#f5c200" />
                      </div>
                      <div style={{ flex: 1, minWidth: 150 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e0f0' }}>{d.dosya_ad || 'Belge'}</div>
                        <div style={{ fontSize: 11, color: '#5d5d7a', marginTop: 2 }}>
                          {new Date(d.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <a href={d.dosya_url} target="_blank" rel="noopener noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', borderRadius: 8,
                        background: 'linear-gradient(135deg,#f5c200,#e6a800)',
                        color: '#0a0a0f', fontSize: 13, fontWeight: 800,
                        textDecoration: 'none', whiteSpace: 'nowrap',
                      }}>
                        <Download size={14} /> İndir
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evrak durumu (checkbox listesi) */}
            {evraklar && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>📋 Evrak Durumu</h2>
                <div style={{ background: '#0e0e1c', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                    {EVRAK_LISTESI.map(([key, label]) => {
                      const var_ = evraklar[key]
                      return (
                        <div key={key} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 8,
                          background: var_ ? 'rgba(34,197,94,.08)' : 'rgba(255,255,255,.03)',
                          border: `1px solid ${var_ ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.06)'}`,
                        }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                            background: var_ ? '#22c55e' : 'transparent',
                            border: `2px solid ${var_ ? '#22c55e' : 'rgba(255,255,255,.15)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {var_ && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 13, color: var_ ? '#e0e0f0' : '#5d5d7a', fontWeight: var_ ? 600 : 400 }}>
                            {label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <p style={{ fontSize: 12, color: '#3a3a58', marginTop: 16 }}>
                    ✓ işaretli evraklar tamamlanmıştır. Evraklarınızla ilgili sorularınız için bize ulaşın.
                  </p>
                </div>
              </div>
            )}

            {dosyalar.length === 0 && !evraklar && (
              <div style={{ textAlign: 'center', padding: '80px 32px', background: '#0e0e1c', border: '1px solid rgba(255,255,255,.06)', borderRadius: 20 }}>
                <FolderOpen size={48} color="#3a3a58" style={{ marginBottom: 16 }} />
                <p style={{ color: '#5d5d7a', fontSize: 15 }}>Henüz belge bulunmuyor.</p>
                <p style={{ color: '#3a3a58', fontSize: 13, marginTop: 8 }}>
                  Belgeleriniz hazırlandığında burada görünecektir.
                </p>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 48, textAlign: 'center', padding: 20, background: 'rgba(245,194,0,.04)', border: '1px solid rgba(245,194,0,.1)', borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: '#5d5d7a' }}>
            Sorularınız için: <a href="tel:05531696867" style={{ color: '#f5c200', fontWeight: 700, textDecoration: 'none' }}>0 553 169 68 67</a>
            {' · '}
            <a href="mailto:info@aktifosgb.com.tr" style={{ color: '#f5c200', fontWeight: 700, textDecoration: 'none' }}>info@aktifosgb.com.tr</a>
          </p>
        </div>
      </div>
    </div>
  )
}
