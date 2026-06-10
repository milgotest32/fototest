'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { HeartPulse, Search, ChevronLeft, ChevronRight } from 'lucide-react'

const TETKIKLER = ['EK2','AKC','ODİO','SFT','EKG','CBC','AST','ALT','ÜRE','KREATİNİN','GLUKOZ','BURUN','BOĞAZ']
const ODEME_RENK: any = { Cari:'var(--amber)', İBAN:'var(--blue)', Peşin:'var(--green)', POS:'var(--accent)' }

export default function HekimEkrani() {
  const [kayitlar, setKayitlar] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [gun, setGun] = useState(new Date().toISOString().slice(0,10))
  const [mod, setMod] = useState<'gun'|'hafta'|'tum'>('gun')
  const [detay, setDetay] = useState<any>(null)

  const sb = createClient()
  useEffect(() => { yukle() }, [gun, mod])

  async function yukle() {
    let q = sb.from('hasta_kayitlari').select('*').order('tarih', { ascending:false })
    if (mod === 'gun') {
      q = q.eq('tarih', gun)
    } else if (mod === 'hafta') {
      const bas = haftaBas(gun)
      const bit = haftaBit(gun)
      q = q.gte('tarih', bas).lte('tarih', bit)
    } else {
      q = q.limit(500)
    }
    const { data } = await q
    setKayitlar(data || [])
    setYukleniyor(false)
  }

  function haftaBas(tarih: string) {
    const d = new Date(tarih+'T00:00:00')
    const gun = d.getDay()
    d.setDate(d.getDate() - (gun === 0 ? 6 : gun - 1))
    return d.toISOString().slice(0,10)
  }

  function haftaBit(tarih: string) {
    const d = new Date(haftaBas(tarih)+'T00:00:00')
    d.setDate(d.getDate() + 6)
    return d.toISOString().slice(0,10)
  }

  function gunDegistir(fark: number) {
    const d = new Date(gun+'T00:00:00')
    d.setDate(d.getDate() + fark)
    setGun(d.toISOString().slice(0,10))
  }

  const filtreli = kayitlar.filter(k =>
    k.ad_soyad?.toLowerCase().includes(arama.toLowerCase()) ||
    k.firma?.toLowerCase().includes(arama.toLowerCase())
  )

  const tl = (n:number) => new Intl.NumberFormat('tr-TR').format(n) + ' ₺'
  const gunlukCiro = filtreli.reduce((s,k)=>s+(Number(k.ucret)||0),0)

  // Tetkik istatistikleri
  const tetkikSayilari = TETKIKLER.reduce((acc:any, t) => {
    acc[t] = filtreli.filter(k => k.tetkikler?.[t]).length
    return acc
  }, {})

  const baslikLabel = mod === 'gun'
    ? new Date(gun+'T00:00:00').toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' })
    : mod === 'hafta'
    ? `${new Date(haftaBas(gun)+'T00:00:00').toLocaleDateString('tr-TR', { day:'numeric', month:'short' })} – ${new Date(haftaBit(gun)+'T00:00:00').toLocaleDateString('tr-TR', { day:'numeric', month:'short' })}`
    : 'Tüm Kayıtlar'

  return (
    <div className="page-wrap fade-in" style={{ padding:'32px 28px', maxWidth:1400, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora, sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>Hekim Ekranı</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>{baslikLabel}</p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {(['gun','hafta','tum'] as const).map(m => (
            <button key={m} onClick={()=>setMod(m)}
              style={{ padding:'9px 16px', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                background: mod===m?'var(--accent-soft)':'var(--surface)',
                border:`1px solid ${mod===m?'var(--accent)':'var(--border)'}`,
                color: mod===m?'var(--accent)':'var(--text-dim)' }}>
              {m==='gun'?'Günlük':m==='hafta'?'Haftalık':'Tümü'}
            </button>
          ))}
        </div>
      </div>

      {/* TARİH NAV */}
      {mod !== 'tum' && (
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:24 }}>
          <button onClick={()=>gunDegistir(mod==='gun'?-1:-7)} style={navBtn}><ChevronLeft size={18}/></button>
          <input type="date" value={gun} onChange={e=>setGun(e.target.value)} style={{ maxWidth:180 }} />
          <button onClick={()=>gunDegistir(mod==='gun'?1:7)} style={navBtn}><ChevronRight size={18}/></button>
          <button onClick={()=>setGun(new Date().toISOString().slice(0,10))}
            style={{ padding:'6px 12px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit', background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-dim)' }}>
            Bugün
          </button>
        </div>
      )}

      {/* ÖZET KARTLAR */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Hasta</div>
          <div style={{ fontFamily:'Sora,sans-serif', fontSize:26, fontWeight:700 }}>{filtreli.length}</div>
        </div>
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Ciro</div>
          <div style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700, color:'var(--green)' }}>{tl(gunlukCiro)}</div>
        </div>
        {Object.entries(tetkikSayilari).filter(([,v])=>(v as number)>0).map(([t,v]) => (
          <div key={t} className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:11, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{t}</div>
            <div style={{ fontFamily:'Sora,sans-serif', fontSize:26, fontWeight:700, color:'var(--accent)' }}>{v as number}</div>
          </div>
        ))}
      </div>

      <div style={{ position:'relative', marginBottom:20, maxWidth:360 }}>
        <Search size={17} style={{ position:'absolute', left:14, top:12, color:'var(--text-faint)' }} />
        <input value={arama} onChange={e=>setArama(e.target.value)} placeholder="Hasta veya firma ara..." style={{ paddingLeft:40 }} />
      </div>

      {/* HASTA LİSTESİ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:12 }}>
        {yukleniyor ? <div style={{ color:'var(--text-faint)', padding:40 }}>Yükleniyor...</div>
         : filtreli.length === 0 ? (
          <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-faint)', gridColumn:'1/-1' }}>
            <HeartPulse size={36} style={{ margin:'0 auto 12px', opacity:0.3 }} />
            {mod==='gun' ? 'Bu gün hasta kaydı yok' : 'Kayıt bulunamadı'}
          </div>
         ) : filtreli.map(k => {
          const aktifTetkik = Object.entries(k.tetkikler||{}).filter(([,v])=>v).map(([t])=>t)
          return (
            <div key={k.id} className="card" style={{ padding:18, cursor:'pointer' }} onClick={()=>setDetay(detay?.id===k.id?null:k)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:600 }}>{k.ad_soyad}</div>
                  {k.dogum_tarihi && <div style={{ fontSize:12, color:'var(--text-faint)', marginTop:2 }}>{new Date(k.dogum_tarihi+'T00:00:00').toLocaleDateString('tr-TR')}</div>}
                </div>
                <span className="badge" style={{ background:`${ODEME_RENK[k.odeme_sekli]}22`, color:ODEME_RENK[k.odeme_sekli] }}>{k.odeme_sekli}</span>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:13, color:'var(--text-dim)' }}>{k.firma||'—'}</span>
                <span style={{ fontWeight:700, color:'var(--green)' }}>{tl(Number(k.ucret)||0)}</span>
              </div>

              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {aktifTetkik.length === 0
                  ? <span style={{ fontSize:12, color:'var(--text-faint)' }}>Tetkik seçilmedi</span>
                  : aktifTetkik.map(t => (
                    <span key={t} style={{ fontSize:11, background:'var(--accent-soft)', color:'var(--accent)', padding:'2px 8px', borderRadius:5 }}>{t}</span>
                  ))
                }
              </div>

              {detay?.id === k.id && (
                <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
                  {k.telefon && <div style={{ fontSize:13 }}><span style={{ color:'var(--text-faint)', marginRight:8 }}>Tel</span>{k.telefon}</div>}
                  <div style={{ fontSize:13 }}><span style={{ color:'var(--text-faint)', marginRight:8 }}>Tarih</span>{new Date(k.tarih+'T00:00:00').toLocaleDateString('tr-TR')}</div>
                  <div style={{ fontSize:13 }}>
                    <span style={{ color:'var(--text-faint)', marginRight:8 }}>Tetkikler</span>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
                      {TETKIKLER.map(t => (
                        <span key={t} style={{ fontSize:11, padding:'2px 8px', borderRadius:5,
                          background: k.tetkikler?.[t] ? 'var(--green-soft)' : 'var(--surface-2)',
                          color: k.tetkikler?.[t] ? 'var(--green)' : 'var(--text-faint)',
                          border:`1px solid ${k.tetkikler?.[t] ? 'rgba(52,211,153,0.3)' : 'var(--border)'}` }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const navBtn: any = { background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'8px', cursor:'pointer', display:'flex', alignItems:'center' }
