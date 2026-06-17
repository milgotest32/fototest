'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

type NaceItem = { id: number; kod: string; tanim: string; sinif: string }

export default function NaceSorgulama() {
  const [veri, setVeri] = useState<NaceItem[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [arama, setArama] = useState('')
  const [filtre, setFiltre] = useState<string>('Tümü')

  useEffect(() => {
    const sb = createClient()
    sb.from('tehlike_siniflari')
      .select('*')
      .order('kod')
      .then(({ data }) => {
        setVeri(data || [])
        setYukleniyor(false)
      })
  }, [])

  const sonuclar = useMemo(() => {
    if (!arama && filtre === 'Tümü') return veri
    return veri.filter(item => {
      const aramaUygun = !arama || 
        item.kod.toLowerCase().includes(arama.toLowerCase()) ||
        item.tanim.toLowerCase().includes(arama.toLowerCase())
      const filtreUygun = filtre === 'Tümü' || item.sinif === filtre
      return aramaUygun && filtreUygun
    })
  }, [veri, arama, filtre])

  const sinifRenk = (sinif: string) => {
    if (sinif === 'Az Tehlikeli') return { color: '#22c55e', bg: 'rgba(34,197,94,.1)', border: 'rgba(34,197,94,.2)' }
    if (sinif === 'Tehlikeli') return { color: '#f59e0b', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.2)' }
    return { color: '#ef4444', bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.2)' }
  }

  return (
    <div>
      {/* Arama ve filtre */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={arama}
          onChange={e => setArama(e.target.value)}
          placeholder="NACE kodu veya faaliyet adı ara..."
          style={{
            flex: 1, minWidth: 200, padding: '12px 16px', borderRadius: 10,
            border: '1px solid rgba(245,194,0,.2)', background: 'rgba(255,255,255,.04)',
            color: '#e8e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none'
          }}
        />
        {['Tümü', 'Az Tehlikeli', 'Tehlikeli', 'Çok Tehlikeli'].map(s => (
          <button key={s} onClick={() => setFiltre(s)}
            style={{
              padding: '10px 16px', borderRadius: 10, border: '1px solid',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              borderColor: filtre === s ? 'rgba(245,194,0,.4)' : 'rgba(255,255,255,.1)',
              background: filtre === s ? 'rgba(245,194,0,.1)' : 'transparent',
              color: filtre === s ? '#f5c200' : '#6b6b88',
            }}>{s}</button>
        ))}
      </div>

      {/* Sonuç sayısı */}
      <div style={{ fontSize: 12, color: '#5d5d7a', marginBottom: 10 }}>
        {yukleniyor ? 'Yükleniyor...' : `${sonuclar.length} sonuç bulundu`}
        {veri.length > 0 && ` (toplam ${veri.length} kayıt)`}
      </div>

      {/* Tablo */}
      {yukleniyor ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#5d5d7a' }}>Veriler yükleniyor...</div>
      ) : sonuclar.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#5d5d7a' }}>
          {veri.length === 0 ? 'Henüz kayıt eklenmemiş. Admin panelinden tehlike sınıflarını ekleyin.' : 'Sonuç bulunamadı.'}
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 150px', background: 'rgba(255,255,255,.05)', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#5d5d7a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <span>NACE Kodu</span><span>Faaliyet</span><span>Tehlike Sınıfı</span>
          </div>
          {sonuclar.slice(0, 200).map((item, i) => {
            const r = sinifRenk(item.sinif)
            return (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '130px 1fr 150px',
                padding: '10px 16px', fontSize: 13,
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,.04)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)',
              }}>
                <span style={{ fontFamily: 'monospace', color: '#f5c200', fontSize: 12 }}>{item.kod}</span>
                <span style={{ color: '#c8c8d8', lineHeight: 1.4 }}>{item.tanim}</span>
                <span>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: r.color, background: r.bg, border: `1px solid ${r.border}` }}>
                    {item.sinif}
                  </span>
                </span>
              </div>
            )
          })}
          {sonuclar.length > 200 && (
            <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: '#5d5d7a', borderTop: '1px solid rgba(255,255,255,.04)' }}>
              İlk 200 sonuç gösteriliyor. Aramayı daraltın.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
