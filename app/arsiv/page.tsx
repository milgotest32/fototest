'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, Plus, Trash2, Download, X, FolderArchive, Upload, FileText, Eye } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function Arsiv() {
  const [personel, setPersonel] = useState<any>(null)
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [evraklar, setEvraklar] = useState<any[]>([])
  const [durumlar, setDurumlar] = useState<Record<string, Record<string, any>>>({})
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yeniEvrak, setYeniEvrak] = useState('')
  const [evrakModal, setEvrakModal] = useState(false)
  const [detayModal, setDetayModal] = useState<any>(null) // {firma, evrak, kayit}
  const [dosyaYukleniyor, setDosyaYukleniyor] = useState(false)
  const dosyaRef = useRef<HTMLInputElement>(null)
  const sb = createClient()

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await sb.from('personeller').select('*').eq('id', data.user.id).single()
        setPersonel(p || { rol: 'operasyon' })
      }
    })
  }, [])

  useEffect(() => { if (personel) yukle() }, [personel])

  async function yukle() {
    setYukleniyor(true)
    const { data: evrakData } = await sb.from('evrak_tanimlari').select('*').eq('aktif', true).order('sira')
    setEvraklar(evrakData || [])

    let q = sb.from('firmalar')
      .select('id, unvan, gorevli_igu, gorevli_ih, igu_id, ih_id')
      .eq('aktif', true).order('unvan')

    const rol = personel?.rol
    if (rol === 'saha' || rol === 'operasyon') {
      const ad = personel.ad_soyad || ''
      q = q.or(`igu_id.eq.${personel.id},ih_id.eq.${personel.id},gorevli_igu.ilike.%${ad}%,gorevli_ih.ilike.%${ad}%`)
    }

    const { data: firmaData } = await q
    const firmListesi = firmaData || []
    setFirmalar(firmListesi)

    if (firmListesi.length === 0) { setYukleniyor(false); return }

    const firmaIds = firmListesi.map((f: any) => f.id)
    const { data: durumData } = await sb.from('firma_evrak_durumu').select('*').in('firma_id', firmaIds)

    const map: Record<string, Record<string, any>> = {}
    for (const d of (durumData || [])) {
      if (!map[d.firma_id]) map[d.firma_id] = {}
      map[d.firma_id][d.evrak_id] = d
    }
    setDurumlar(map)
    setYukleniyor(false)
  }

  async function tikle(firmaId: string, evrakId: string) {
    const mevcut = durumlar[firmaId]?.[evrakId]
    const rol = personel?.rol

    if (mevcut?.tiklandi) {
      // Tikliye tıklayınca detay aç
      const firma = firmalar.find(f => f.id === firmaId)
      const evrak = evraklar.find(e => e.id === evrakId)
      setDetayModal({ firma, evrak, kayit: mevcut })
      return
    }

    if (!['yonetici','operasyon','saha','hekim'].includes(rol)) return
    const kayit = {
      firma_id: firmaId, evrak_id: evrakId, tiklandi: true,
      tikleyen: personel?.ad_soyad || '',
      tikleyen_id: personel?.id,
      tiklama_tarihi: new Date().toISOString(),
    }
    const { data } = await sb.from('firma_evrak_durumu').upsert(kayit, { onConflict: 'firma_id,evrak_id' }).select().single()
    if (data) {
      setDurumlar(d => ({ ...d, [firmaId]: { ...(d[firmaId] || {}), [evrakId]: data } }))
    }
  }

  async function tikSil(firmaId: string, evrakId: string, kayitId: string, dosyaUrl?: string) {
    if (!confirm('Bu evrak kaydını silmek istiyor musunuz?')) return
    // Dosya varsa storage'dan sil
    if (dosyaUrl) {
      const path = dosyaUrl.split('/evrak-dosyalar/')[1]
      if (path) await sb.storage.from('evrak-dosyalar').remove([path])
    }
    await sb.from('firma_evrak_durumu').delete().eq('id', kayitId)
    setDurumlar(d => {
      const yeni = { ...d }
      if (yeni[firmaId]) { yeni[firmaId] = { ...yeni[firmaId] }; delete yeni[firmaId][evrakId] }
      return yeni
    })
    setDetayModal(null)
  }

  async function dosyaYukle(file: File) {
    if (!detayModal) return
    setDosyaYukleniyor(true)
    const { firma, evrak, kayit } = detayModal
    const ext = file.name.split('.').pop()
    const path = `${firma.id}/${evrak.id}_${Date.now()}.${ext}`

    const { error } = await sb.storage.from('evrak-dosyalar').upload(path, file, { upsert: true })
    if (error) { alert('Yükleme hatası: ' + error.message); setDosyaYukleniyor(false); return }

    const { data: urlData } = sb.storage.from('evrak-dosyalar').getPublicUrl(path)
    const dosyaUrl = urlData.publicUrl

    await sb.from('firma_evrak_durumu').update({ dosya_url: dosyaUrl, dosya_ad: file.name }).eq('id', kayit.id)
    const yeniKayit = { ...kayit, dosya_url: dosyaUrl, dosya_ad: file.name }
    setDurumlar(d => ({ ...d, [firma.id]: { ...(d[firma.id] || {}), [evrak.id]: yeniKayit } }))
    setDetayModal((m: any) => ({ ...m, kayit: yeniKayit }))
    setDosyaYukleniyor(false)
  }

  async function dosyaSil() {
    if (!detayModal?.kayit?.dosya_url) return
    if (!confirm('Dosyayı silmek istiyor musunuz?')) return
    const { firma, evrak, kayit } = detayModal
    const path = kayit.dosya_url.split('/evrak-dosyalar/')[1]
    if (path) await sb.storage.from('evrak-dosyalar').remove([decodeURIComponent(path)])
    await sb.from('firma_evrak_durumu').update({ dosya_url: null, dosya_ad: null }).eq('id', kayit.id)
    const yeniKayit = { ...kayit, dosya_url: null, dosya_ad: null }
    setDurumlar(d => ({ ...d, [firma.id]: { ...(d[firma.id] || {}), [evrak.id]: yeniKayit } }))
    setDetayModal((m: any) => ({ ...m, kayit: yeniKayit }))
  }

  async function evrakEkle() {
    if (!yeniEvrak.trim()) return
    const maxSira = evraklar.length > 0 ? Math.max(...evraklar.map(e => e.sira)) + 1 : 1
    const { data } = await sb.from('evrak_tanimlari').insert({ ad: yeniEvrak.trim(), sira: maxSira }).select().single()
    if (data) { setEvraklar(e => [...e, data]); setYeniEvrak('') }
  }

  async function evrakSil(id: string) {
    if (!confirm('Bu evrak başlığını silmek istiyor musunuz?')) return
    await sb.from('evrak_tanimlari').update({ aktif: false }).eq('id', id)
    setEvraklar(e => e.filter(x => x.id !== id))
  }

  function tamamlanmaOrani(firmaId: string) {
    const toplam = evraklar.length
    if (toplam === 0) return 0
    return Math.round((evraklar.filter(e => durumlar[firmaId]?.[e.id]?.tiklandi).length / toplam) * 100)
  }

  function excelIndir() {
    const basliklar = ['Firma Ünvanı', ...evraklar.map(e => e.ad), 'Tamamlanma %']
    const satirlar = gorununFirmalar.map(f => {
      const row: any = { 'Firma Ünvanı': f.unvan }
      evraklar.forEach(e => { row[e.ad] = durumlar[f.id]?.[e.id]?.tiklandi ? '✓' : '' })
      row['Tamamlanma %'] = tamamlanmaOrani(f.id) + '%'
      return row
    })
    const ws = XLSX.utils.json_to_sheet(satirlar, { header: basliklar })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Evrak Takibi')
    XLSX.writeFile(wb, `evrak_takibi_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const gorununFirmalar = firmalar.filter(f => !arama || f.unvan.toLowerCase().includes(arama.toLowerCase()))
  const rol = personel?.rol || 'operasyon'
  const yazabilir = ['yonetici','operasyon','saha','hekim'].includes(rol)

  return (
    <div className="page-wrap" style={{ maxWidth:'100%', paddingRight:8 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <FolderArchive size={22} color="var(--accent)"/>
          <div>
            <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:26, fontWeight:700, letterSpacing:-0.5 }}>Arşiv</h1>
            <p style={{ color:'var(--text-dim)', fontSize:13, marginTop:2 }}>
              {rol === 'saha' || rol === 'operasyon' ? 'Atandığınız firmaların evrak durumu' : 'Tüm firma evrak takibi'}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {rol === 'yonetici' && (
            <button onClick={() => setEvrakModal(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', cursor:'pointer', fontSize:13 }}>
              <Plus size={14}/> Evrak Yönet
            </button>
          )}
          <button onClick={excelIndir}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text-dim)', cursor:'pointer', fontSize:13 }}>
            <Download size={14}/> Excel
          </button>
        </div>
      </div>

      <div style={{ position:'relative', marginBottom:14, maxWidth:260 }}>
        <Search size={14} style={{ position:'absolute', left:10, top:11, color:'var(--text-faint)' }}/>
        <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Firma ara..." style={{ paddingLeft:30, width:'100%' }}/>
      </div>

      {yukleniyor ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-faint)' }}>Yükleniyor...</div>
      ) : (
        <div className="card" style={{ overflow:'auto', padding:0, maxHeight:'calc(100vh - 200px)' }}>
          <table style={{ minWidth: evraklar.length * 40 + 300, fontSize:11, borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--surface-2)', position:'sticky', top:0, zIndex:4 }}>
                <th style={{ textAlign:'left', padding:'10px 14px', position:'sticky', left:0, top:0, background:'var(--surface-2)', zIndex:5, minWidth:220, borderRight:'2px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
                  FİRMA ÜNVANI
                </th>
                {evraklar.map(e => (
                  <th key={e.id} style={{ padding:'4px 2px', borderBottom:'1px solid var(--border)', borderLeft:'1px solid var(--border)', minWidth:36, maxWidth:36, writingMode:'vertical-rl', textOrientation:'mixed', transform:'rotate(180deg)', height:120, verticalAlign:'bottom', color:'var(--text-dim)', fontWeight:500, fontSize:10 }}>
                    {e.ad}
                  </th>
                ))}
                <th style={{ padding:'10px 10px', borderBottom:'1px solid var(--border)', borderLeft:'2px solid var(--border)', minWidth:80, position:'sticky', right:0, top:0, background:'var(--surface-2)', zIndex:4, textAlign:'center', color:'var(--text-dim)', fontSize:10 }}>
                  TAMAMLANMA
                </th>
              </tr>
            </thead>
            <tbody>
              {gorununFirmalar.length === 0 ? (
                <tr><td colSpan={evraklar.length + 2} style={{ textAlign:'center', padding:40, color:'var(--text-faint)' }}>Firma bulunamadı</td></tr>
              ) : gorununFirmalar.map((firma, fi) => {
                const oran = tamamlanmaOrani(firma.id)
                const satirBg = fi % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)'
                return (
                  <tr key={firma.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'8px 14px', position:'sticky', left:0, background:satirBg, zIndex:1, borderRight:'2px solid var(--border)', fontWeight:500 }}>
                      {firma.unvan}
                    </td>
                    {evraklar.map(e => {
                      const kayit = durumlar[firma.id]?.[e.id]
                      const tiklandi = !!kayit?.tiklandi
                      const dosyaVar = !!kayit?.dosya_url

                      return (
                        <td key={e.id} style={{ textAlign:'center', padding:'6px 2px', borderLeft:'1px solid var(--border)', background: tiklandi ? 'rgba(34,197,94,0.07)' : 'transparent', cursor: yazabilir ? 'pointer' : 'default' }}
                          onClick={() => yazabilir && tikle(firma.id, e.id)}
                          title={tiklandi ? `${kayit.tikleyen || ''} — ${kayit.tiklama_tarihi ? new Date(kayit.tiklama_tarihi).toLocaleDateString('tr-TR') : ''}\n${dosyaVar ? '📎 ' + kayit.dosya_ad : 'Dosya yok'}\nDetay için tıkla` : yazabilir ? 'Tiklemek için tıkla' : ''}
                        >
                          {tiklandi ? (
                            <div style={{ position:'relative', width:20, height:20, margin:'0 auto' }}>
                              <div style={{ width:20, height:20, background:'#22c55e', border:'2px solid #16a34a', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 5px rgba(34,197,94,0.3)' }}>
                                <span style={{ color:'white', fontSize:11, fontWeight:700 }}>✓</span>
                              </div>
                              {dosyaVar && (
                                <div style={{ position:'absolute', top:-4, right:-4, width:8, height:8, background:'#3b82f6', borderRadius:'50%', border:'1px solid var(--surface)' }}/>
                              )}
                            </div>
                          ) : (
                            <div style={{ width:20, height:20, border: yazabilir ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(255,255,255,0.1)', borderRadius:4, margin:'0 auto', opacity: yazabilir ? 1 : 0.4 }}/>
                          )}
                        </td>
                      )
                    })}
                    <td style={{ padding:'8px 10px', textAlign:'center', position:'sticky', right:0, background:satirBg, borderLeft:'2px solid var(--border)', zIndex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, fontFamily:'Sora,sans-serif', color: oran >= 80 ? '#22c55e' : oran >= 40 ? '#f59e0b' : '#ef4444' }}>
                        {oran}%
                      </div>
                      <div style={{ marginTop:3, height:3, borderRadius:2, background:'var(--border)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${oran}%`, background: oran >= 80 ? '#22c55e' : oran >= 40 ? '#f59e0b' : '#ef4444', transition:'width 0.3s' }}/>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAY MODAL */}
      {detayModal && (
        <div className="modal-overlay" onClick={() => setDetayModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:420 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:17, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                <FileText size={16} color="var(--accent)"/> Evrak Detayı
              </h2>
              <button onClick={() => setDetayModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)' }}><X size={20}/></button>
            </div>

            <div style={{ background:'var(--surface-2)', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>{detayModal.firma.unvan}</div>
              <div style={{ fontSize:13, color:'var(--text-dim)' }}>{detayModal.evrak.ad}</div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              {[
                ['👤 Tikleyen', detayModal.kayit.tikleyen || '—'],
                ['📅 Tarih', detayModal.kayit.tiklama_tarihi ? new Date(detayModal.kayit.tiklama_tarihi).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display:'flex', gap:10, fontSize:13 }}>
                  <span style={{ color:'var(--text-dim)', minWidth:110, flexShrink:0 }}>{k}</span>
                  <span style={{ fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Dosya bölümü */}
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:14, marginBottom:14 }}>
              <div style={{ fontSize:12, color:'var(--text-dim)', fontWeight:600, marginBottom:10 }}>📎 EVRAK DOSYASI</div>

              {detayModal.kayit.dosya_url ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'var(--surface-2)', borderRadius:8, border:'1px solid var(--border)' }}>
                  <FileText size={16} color="var(--accent)"/>
                  <span style={{ fontSize:13, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {detayModal.kayit.dosya_ad || 'Dosya'}
                  </span>
                  <a href={detayModal.kayit.dosya_url} target="_blank" rel="noopener noreferrer"
                    style={{ color:'var(--accent)', fontSize:12, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
                    <Eye size={14}/> Aç
                  </a>
                  {rol === 'yonetici' && (
                    <button onClick={dosyaSil}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', padding:2, display:'flex' }}>
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <input ref={dosyaRef} type="file" style={{ display:'none' }}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={e => { if (e.target.files?.[0]) dosyaYukle(e.target.files[0]) }}
                  />
                  <button onClick={() => dosyaRef.current?.click()} disabled={dosyaYukleniyor}
                    style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', borderRadius:8, border:'2px dashed var(--border)', background:'transparent', color:'var(--text-dim)', cursor:'pointer', fontSize:13, justifyContent:'center' }}>
                    <Upload size={15}/>
                    {dosyaYukleniyor ? 'Yükleniyor...' : 'Dosya Yükle (PDF, JPG, PNG, DOC)'}
                  </button>
                </div>
              )}
            </div>

            {rol === 'yonetici' && (
              <button onClick={() => tikSil(detayModal.firma.id, detayModal.evrak.id, detayModal.kayit.id, detayModal.kayit.dosya_url)}
                style={{ width:'100%', padding:'10px', borderRadius:9, border:'1px solid var(--red)', background:'var(--red-soft)', color:'var(--red)', cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:600 }}>
                🗑️ Evrak Kaydını Sil
              </button>
            )}
          </div>
        </div>
      )}

      {/* EVRAK YÖNET MODAL */}
      {evrakModal && (
        <div className="modal-overlay" onClick={() => setEvrakModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:420, maxHeight:'80vh', overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:17, fontWeight:600 }}>Evrak Listesi Yönet</h2>
              <button onClick={() => setEvrakModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)' }}><X size={20}/></button>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              <input value={yeniEvrak} onChange={e => setYeniEvrak(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && evrakEkle()}
                placeholder="Yeni evrak adı..." style={{ flex:1 }}/>
              <button onClick={evrakEkle} className="btn" style={{ padding:'8px 14px' }}><Plus size={14}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {evraklar.map(e => (
                <div key={e.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:13 }}>{e.ad}</span>
                  <button onClick={() => evrakSil(e.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', padding:4 }}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
