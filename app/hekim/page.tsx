'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { HeartPulse, Search, ChevronLeft, ChevronRight, Check, Building2, Clock, AlertTriangle, Download } from 'lucide-react'
import { csvIndir } from '@/lib/csvExport'

const TETKIKLER = ['EK2','AKC','ODİO','SFT','EKG','CBC','AST','ALT','ÜRE','KREATİNİN','GLUKOZ','BURUN','BOĞAZ']
const ODEME_RENK: any = { Cari:'var(--amber)', İBAN:'var(--blue)', Peşin:'var(--green)', POS:'var(--accent)' }

export default function HekimEkrani() {
  const [kayitlar, setKayitlar] = useState<any[]>([])
  const [benimatanFirmalar, setBenimatanFirmalar] = useState<any[]>([])
  const [ziyaretDurumlari, setZiyaretDurumlari] = useState<any[]>([])
  const [mevcutHekim, setMevcutHekim] = useState<any>(null)
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [gun, setGun] = useState(new Date().toISOString().slice(0,10))
  const [mod, setMod] = useState<'gorev'|'gun'|'hafta'|'tum'>('gorev')
  const [detay, setDetay] = useState<any>(null)
  const [hata, setHata] = useState('')

  const buAy = new Date().toISOString().slice(0,7)
  const sb = createClient()

  useEffect(() => { yukle() }, [gun, mod])

  async function yukle() {
    // Mevcut kullanıcıyı bul
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return

    const { data: personel } = await sb.from('personeller').select('*').eq('id', user.id).single()
    setMevcutHekim(personel)

    // Bana atanmış firmalar (ih_id = benim id)
    const { data: firmalar } = await sb.from('firmalar')
      .select('id, unvan, tehlike_sinifi, bolge, calisan_sayisi, ih_periyot')
      .eq('ih_id', user.id)
      .order('unvan')
    setBenimatanFirmalar(firmalar || [])

    // Bu ay ziyaret durumları
    const { data: durumlar } = await sb.from('hekim_ziyaret_durumu')
      .select('*')
      .eq('hekim_id', user.id)
      .eq('ay', buAy)
    setZiyaretDurumlari(durumlar || [])

    // Hasta kayıtları
    let q = sb.from('hasta_kayitlari').select('*').order('tarih', { ascending:false })
    if (mod === 'gun') q = q.eq('tarih', gun)
    else if (mod === 'hafta') {
      const bas = haftaBas(gun); const bit = haftaBit(gun)
      q = q.gte('tarih', bas).lte('tarih', bit)
    } else if (mod === 'tum') q = q.limit(500)
    else q = q.eq('tarih', gun) // gorev modunda da bugün

    // Eğer hekim ise kendi hastalarını filtrele
    if (personel?.rol === 'hekim') {
      q = q.eq('hekim_id', user.id)
    } else {
      q = q.limit(200)
    }

    const { data } = await q
    setKayitlar(data || [])
    setYukleniyor(false)
  }

  async function ziyaretIsaretle(firma_id: string, gidildi: boolean) {
    if (!mevcutHekim) return
    setHata('')
    const bugun = new Date().toISOString().slice(0,10)
    const { error } = await sb.from('hekim_ziyaret_durumu').upsert({
      firma_id,
      hekim_id: mevcutHekim.id,
      ay: buAy,
      gidildi,
      gidilen_tarih: gidildi ? bugun : null,
    }, { onConflict: 'firma_id,hekim_id,ay' })
    if (error) { setHata(error.message); return }

    if (gidildi) {
      // ziyaretler tablosuna İH kaydı
      await sb.from('ziyaretler').insert({
        firma_id,
        tarih: bugun,
        ziyaret_eden: mevcutHekim.ad_soyad,
        ziyaret_eden_id: mevcutHekim.id,
        tur: 'İH',
        notlar: 'Hekim ziyareti — otomatik oluşturuldu',
      })
      // aylik_ziyaretler JSONB güncelle — İH ziyareti de görünsün
      const { data: firma } = await sb.from('firmalar').select('aylik_ziyaretler').eq('id', firma_id).single()
      const mevcut = firma?.aylik_ziyaretler || {}
      const guncellenmis = {
        ...mevcut,
        [buAy]: {
          ...(mevcut[buAy] || {}),
          ih_tarih: bugun,
          ih_ziyaret_eden: mevcutHekim.ad_soyad,
        }
      }
      await sb.from('firmalar').update({ aylik_ziyaretler: guncellenmis }).eq('id', firma_id)
    }

    setZiyaretDurumlari(prev => {
      const filtered = prev.filter(d => d.firma_id !== firma_id)
      return [...filtered, { firma_id, hekim_id: mevcutHekim.id, ay: buAy, gidildi, gidilen_tarih: gidildi ? bugun : null }]
    })
  }

  function haftaBas(tarih: string) {
    const d = new Date(tarih+'T00:00:00')
    const g = d.getDay()
    d.setDate(d.getDate() - (g === 0 ? 6 : g - 1))
    return d.toISOString().slice(0,10)
  }
  function haftaBit(tarih: string) {
    const d = new Date(haftaBas(tarih)+'T00:00:00')
    d.setDate(d.getDate() + 6)
    return d.toISOString().slice(0,10)
  }
  function gunDegistir(fark: number) {
    const d = new Date(gun+'T00:00:00'); d.setDate(d.getDate() + fark)
    setGun(d.toISOString().slice(0,10))
  }

  const filtreli = kayitlar.filter(k =>
    k.ad_soyad?.toLowerCase().includes(arama.toLowerCase()) ||
    k.firma?.toLowerCase().includes(arama.toLowerCase())
  )
  const tl = (n:number) => new Intl.NumberFormat('tr-TR').format(n) + ' ₺'

  const gidilenFirma = (firma_id: string) => ziyaretDurumlari.find(d => d.firma_id === firma_id && d.gidildi)
  const gidenSayi = benimatanFirmalar.filter(f => gidilenFirma(f.id)).length
  const gitmeyen = benimatanFirmalar.filter(f => !gidilenFirma(f.id))

  const ayLabel = new Date().toLocaleDateString('tr-TR', { month:'long', year:'numeric' })


  function exportCSV() {
    const simdi = new Date()
    const buAy = `${simdi.getFullYear()}-${String(simdi.getMonth()+1).padStart(2,'0')}`
    const rows = benimatanFirmalar.map((f: any) => {
      const d = ziyaretDurumlari.find((z: any) => z.firma_id === f.id && z.ay === buAy)
      return {
        'Firma': f.unvan||'', 'Tehlike': f.tehlike_sinifi||'', 'Bölge': f.bolge||'',
        'Çalışan': f.calisan_sayisi||'', 'İH Periyot': f.ih_periyot||'',
        'Ziyaret Edildi': d?.gidildi ? 'Evet' : 'Hayır',
        'Ziyaret Tarihi': d?.gidilen_tarih||'', 'Notlar': d?.notlar||'',
      }
    })
    csvIndir(rows, `hekim_ziyaret_${buAy}`)
  }
  return (
    <div className="page-wrap">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
        <div>
          <h1 className="page-title">Hekim Ekranı</h1>
          <p className="page-sub">{mevcutHekim?.ad_soyad || '...'} · {ayLabel}</p>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {(['gorev','gun','hafta','tum'] as const).map(m => (
            <button key={m} onClick={()=>setMod(m)}
              style={{ padding:'8px 14px', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                background:mod===m?'var(--accent)':'var(--surface-2)',
                border:`1px solid ${mod===m?'var(--accent)':'var(--border)'}`,
                color:mod===m?'#fff':'var(--text-dim)', fontWeight:mod===m?600:400 }}>
              {m==='gorev'?'Bu Ay Görevler':m==='gun'?'Günlük':m==='hafta'?'Haftalık':'Tümü'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:'var(--green-soft)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <span style={{ fontSize:18, flexShrink:0 }}>💡</span>
        <p style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>
          Hekim Ekranı — Size atanmış firmaları ve hasta kayıtlarını görüntüleyin. <strong>"Bu Ay Görevler"</strong> sekmesinde bu ay hangi firmalara gitmeniz gerektiği listelenir. Ziyareti tamamladığınızda <strong>"Gittim"</strong> butonuna basın, sistem otomatik kaydeder.
        </p>
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      {/* ── BU AY GÖREVLER ── */}
      {mod === 'gorev' && (
        <div>
          {/* Özet */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
            <div className="card" style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:6 }}>Toplam Firma</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:24, fontWeight:700 }}>{benimatanFirmalar.length}</div>
            </div>
            <div className="card" style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:6 }}>Ziyaret Edildi</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:24, fontWeight:700, color:'var(--green)' }}>{gidenSayi}</div>
            </div>
            <div className="card" style={{ padding:'14px 16px', borderColor:gitmeyen.length>0?'rgba(248,113,113,0.3)':undefined }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:6 }}>Kalan</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:24, fontWeight:700, color:gitmeyen.length>0?'var(--red)':'var(--green)' }}>
                {gitmeyen.length}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {benimatanFirmalar.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-faint)', marginBottom:6 }}>
                <span>{ayLabel} İlerleme</span>
                <span>%{Math.round(gidenSayi/benimatanFirmalar.length*100)}</span>
              </div>
              <div style={{ height:8, background:'var(--surface-2)', borderRadius:8 }}>
                <div style={{ height:8, background:'var(--green)', borderRadius:8, width:`${Math.round(gidenSayi/benimatanFirmalar.length*100)}%`, transition:'width .4s' }}/>
              </div>
            </div>
          )}

          {/* Gitmeyen firmalar */}
          {gitmeyen.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                <AlertTriangle size={15}/> Ziyaret Edilmeyenler ({gitmeyen.length})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {gitmeyen.map(f => (
                  <div key={f.id} className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{f.unvan}</div>
                      <div style={{ fontSize:12, color:'var(--text-faint)', marginTop:3, display:'flex', gap:10 }}>
                        {f.bolge && <span>{f.bolge}</span>}
                        <span style={{ color:f.tehlike_sinifi?.includes('Çok')?'var(--red)':f.tehlike_sinifi?.includes('Tehlikeli')&&!f.tehlike_sinifi?.includes('Az')?'var(--amber)':'var(--green)' }}>{f.tehlike_sinifi}</span>
                        {f.calisan_sayisi && <span>{f.calisan_sayisi} çalışan</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => ziyaretIsaretle(f.id, true)}
                      style={{ display:'flex', alignItems:'center', gap:8, background:'var(--green)', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                      <Check size={16}/> Gittim
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gidilen firmalar */}
          {gidenSayi > 0 && (
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--green)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                <Check size={15}/> Ziyaret Edilenler ({gidenSayi})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {benimatanFirmalar.filter(f => gidilenFirma(f.id)).map(f => {
                  const durum = gidilenFirma(f.id)
                  return (
                    <div key={f.id} className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', opacity:0.7 }}>
                      <div>
                        <div style={{ fontWeight:500, fontSize:14 }}>{f.unvan}</div>
                        {durum?.gidilen_tarih && (
                          <div style={{ fontSize:12, color:'var(--green)', marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
                            <Check size={12}/> {new Date(durum.gidilen_tarih+'T00:00:00').toLocaleDateString('tr-TR')} tarihinde ziyaret edildi
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => ziyaretIsaretle(f.id, false)}
                        style={{ fontSize:12, background:'none', border:'1px solid var(--border)', color:'var(--text-faint)', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit' }}>
                        Geri Al
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {benimatanFirmalar.length === 0 && (
            <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-faint)' }}>
              <Building2 size={36} style={{ margin:'0 auto 12px', opacity:0.3 }}/>
              <div>Size atanmış firma bulunmuyor.</div>
              <div style={{ fontSize:12, marginTop:6 }}>Yönetici firmalar sayfasından İH ataması yapmalıdır.</div>
            </div>
          )}
        </div>
      )}

      {/* ── HASTA KAYITLARI (günlük/haftalık/tümü) ── */}
      {mod !== 'gorev' && (
        <div>
          {mod !== 'tum' && (
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20, flexWrap:'wrap' }}>
              <button onClick={()=>gunDegistir(mod==='gun'?-1:-7)} style={navBtn}><ChevronLeft size={18}/></button>
              <input type="date" value={gun} onChange={e=>setGun(e.target.value)} style={{ maxWidth:180 }}/>
              <button onClick={()=>gunDegistir(mod==='gun'?1:7)} style={navBtn}><ChevronRight size={18}/></button>
              <button onClick={()=>setGun(new Date().toISOString().slice(0,10))}
                style={{ padding:'6px 12px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit', background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-dim)' }}>
                Bugün
              </button>
              <span style={{ fontSize:13, color:'var(--text-dim)' }}>
                {mod==='gun'
                  ? new Date(gun+'T00:00:00').toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' })
                  : `${new Date(haftaBas(gun)+'T00:00:00').toLocaleDateString('tr-TR', { day:'numeric', month:'short' })} – ${new Date(haftaBit(gun)+'T00:00:00').toLocaleDateString('tr-TR', { day:'numeric', month:'short' })}`
                }
              </span>
            </div>
          )}

          {/* Tetkik istatistik kartları */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:20 }}>
            <div className="card" style={{ padding:'12px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:4 }}>Hasta</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700 }}>{filtreli.length}</div>
            </div>
            <div className="card" style={{ padding:'12px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:4 }}>Ciro</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:18, fontWeight:700, color:'var(--green)' }}>{tl(filtreli.reduce((s,k)=>s+(Number(k.ucret)||0),0))}</div>
            </div>
            {TETKIKLER.map(t => {
              const sayi = filtreli.filter(k=>k.tetkikler?.[t]).length
              if (!sayi) return null
              return (
                <div key={t} className="card" style={{ padding:'12px 14px' }}>
                  <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:4 }}>{t}</div>
                  <div style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700, color:'var(--accent)' }}>{sayi}</div>
                </div>
              )
            })}
          </div>

          <div style={{ position:'relative', marginBottom:16, maxWidth:360 }}>
            <Search size={17} style={{ position:'absolute', left:14, top:12, color:'var(--text-faint)' }}/>
            <input value={arama} onChange={e=>setArama(e.target.value)} placeholder="Hasta veya firma ara..." style={{ paddingLeft:40 }}/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>
            {yukleniyor ? <div style={{ color:'var(--text-faint)', padding:40 }}>Yükleniyor...</div>
             : filtreli.length === 0 ? (
              <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-faint)', gridColumn:'1/-1' }}>
                <HeartPulse size={36} style={{ margin:'0 auto 12px', opacity:0.3 }}/>
                {mod==='gun'?'Bu gün hasta kaydı yok':'Kayıt bulunamadı'}
              </div>
             ) : filtreli.map(k => {
              const aktifTetkik = Object.entries(k.tetkikler||{}).filter(([,v])=>v).map(([t])=>t)
              return (
                <div key={k.id} className="card" style={{ padding:16, cursor:'pointer' }} onClick={()=>setDetay(detay?.id===k.id?null:k)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{k.ad_soyad}</div>
                      {k.dogum_tarihi && <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>{new Date(k.dogum_tarihi+'T00:00:00').toLocaleDateString('tr-TR')}</div>}
                    </div>
                    <span className="badge" style={{ background:`${ODEME_RENK[k.odeme_sekli]}22`, color:ODEME_RENK[k.odeme_sekli] }}>{k.odeme_sekli}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:13, color:'var(--text-dim)' }}>{k.firma||'—'}</span>
                    <span style={{ fontWeight:700, color:'var(--green)' }}>{tl(Number(k.ucret)||0)}</span>
                  </div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {aktifTetkik.length === 0
                      ? <span style={{ fontSize:12, color:'var(--text-faint)' }}>Tetkik seçilmedi</span>
                      : aktifTetkik.map(t => <span key={t} style={{ fontSize:11, background:'var(--accent-soft)', color:'var(--accent)', padding:'2px 7px', borderRadius:5 }}>{t}</span>)
                    }
                  </div>
                  {detay?.id === k.id && (
                    <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:6 }}>
                      {k.telefon && <div style={{ fontSize:13 }}><span style={{ color:'var(--text-faint)', marginRight:8 }}>Tel</span>{k.telefon}</div>}
                      <div style={{ fontSize:13 }}><span style={{ color:'var(--text-faint)', marginRight:8 }}>Tarih</span>{new Date(k.tarih+'T00:00:00').toLocaleDateString('tr-TR')}</div>
                      <div style={{ fontSize:13 }}>
                        <span style={{ color:'var(--text-faint)', marginRight:8 }}>Tetkikler</span>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
                          {TETKIKLER.map(t => (
                            <span key={t} style={{ fontSize:11, padding:'2px 7px', borderRadius:5,
                              background:k.tetkikler?.[t]?'var(--green-soft)':'var(--surface-2)',
                              color:k.tetkikler?.[t]?'var(--green)':'var(--text-faint)',
                              border:`1px solid ${k.tetkikler?.[t]?'rgba(52,211,153,0.3)':'var(--border)'}` }}>
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
      )}
    </div>
  )
}

const navBtn: any = { background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'8px', cursor:'pointer', display:'flex', alignItems:'center' }
