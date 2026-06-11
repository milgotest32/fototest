'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Check, AlertTriangle, Info, FileText, Plus, X, Clock } from 'lucide-react'

/*
  FATURA SAYFASI — MUHASEBE MODÜLÜ
  
  Bu sayfa Excel'deki "Haziran 2026" tablosunun dijital karşılığıdır.
  
  Mantık:
  1. Muhasebeci ayı seçer
  2. Tüm aktif firmalar listelenir (firmalar tablosundan)
  3. Her firma için dönem sonu çalışan sayısı girilir
  4. Fatura tutarı anında hesaplanır: çalışan × kişi başı ücret
  5. Dr/Uzman zorunlu süre otomatik hesaplanır: tehlike sınıfı × çalışan
     (Bu süreleri Katip sistemine ayrıca girmek gerekiyor)
  6. "Fatura Kesildi" işaretlenince kayıt tamamlanır
  7. Tüm veriler donem_takip tablosunda saklanır — geçmiş kaybolmaz
*/

const tl = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits:0 }).format(n) + ' ₺'

export default function Fatura() {
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [donemler, setDonemler] = useState<any[]>([])
  const [katipSozlesmeler, setKatipSozlesmeler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [basari, setBasari] = useState('')
  const [katipModal, setKatipModal] = useState<any>(null)
  const [katipForm, setKatipForm] = useState<any>(bosKatipForm())

  // Aktif ay — varsayılan bu ay
  const [ay, setAy] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  })

  function bosKatipForm() {
    return { sozlesme_id:'', sozlesme_turu:'İGU', gorevlendirilen_tc:'', gorevlendirilen_ad:'', sertifika_tipi:'C Sınıfı', sertifika_no:'', calisma_suresi_dk:'', baslangic_tarihi:'', bitis_tarihi:'', sozlesme_durumu:'Devam Ediyor', notlar:'' }
  }

  const sb = createClient()
  useEffect(() => { yukle() }, [ay])

  async function yukle() {
    setYukleniyor(true)
    setHata('')
    const [fRes, dRes, kRes] = await Promise.all([
      // Tüm aktif firmalar — kişi başı ücret ve tehlike bilgisiyle
      sb.from('firmalar').select('id, unvan, isg_katip_unvan, sgk_sicil, tehlike_sinifi, calisan_sayisi, kisi_basi_ucret, kisi_basi_ucret_yeni, fatura, fatura_aciklama, bolge, gorevli_igu, gorevli_ih').order('unvan'),
      // Bu ay için mevcut dönem kayıtları (varsa)
      sb.from('donem_takip').select('*').eq('ay', ay),
      // Tüm Katip sözleşmeleri
      sb.from('katip_sozlesmeleri').select('*').order('sozlesme_turu'),
    ])
    if (fRes.error) { setHata('Veriler yüklenemedi'); setYukleniyor(false); return }
    setFirmalar(fRes.data || [])
    setDonemler(dRes.data || [])
    setKatipSozlesmeler(kRes.data || [])
    setYukleniyor(false)
  }

  // Firma için mevcut dönem kaydını bul
  function donemBul(firma_id: string) {
    return donemler.find(d => d.firma_id === firma_id)
  }

  // Firma için Katip sözleşmelerini bul (SGK sicil veya firma_id ile)
  function katipBul(firma: any) {
    return katipSozlesmeler.filter(k => k.firma_id === firma.id || (firma.sgk_sicil && k.sgk_sicil === firma.sgk_sicil))
  }

  // Süre hesaplama (Excel formülünün aynısı)
  function sureler(tehlike: string, calisan: number) {
    const t = (tehlike || '').toUpperCase()
    if (t.includes('ÇOK')) return { dr: calisan * 15, uzman: calisan * 40 }
    if (t.includes('TEHLİKELİ') && !t.includes('ÇOK')) return { dr: calisan * 10, uzman: calisan * 20 }
    return { dr: calisan * 5, uzman: calisan * 10 }
  }

  // Çalışan sayısı değişince anlık kaydet
  async function calisanGuncelle(firma: any, calisan: number) {
    const mevcut = donemBul(firma.id)
    const kisi_basi = Number(firma.kisi_basi_ucret) || 0
    const onceki = mevcut?.calisan_sayisi || firma.calisan_sayisi || 0

    if (mevcut) {
      await sb.from('donem_takip').update({
        calisan_sayisi: calisan,
        kisi_basi_ucret: kisi_basi,
        onceki_ay_calisan: onceki
      }).eq('id', mevcut.id)
    } else {
      await sb.from('donem_takip').insert({
        firma_id: firma.id,
        ay,
        calisan_sayisi: calisan,
        onceki_ay_calisan: firma.calisan_sayisi || 0,
        kisi_basi_ucret: kisi_basi,
      })
    }
    // Lokal state'i güncelle (sayfa reload etmeden)
    setDonemler(prev => {
      const filtered = prev.filter(d => d.firma_id !== firma.id)
      const sur = sureler(firma.tehlike_sinifi, calisan)
      return [...filtered, {
        ...(mevcut || {}),
        firma_id: firma.id,
        ay,
        calisan_sayisi: calisan,
        kisi_basi_ucret: kisi_basi,
        fatura_tutari: calisan * kisi_basi,
        dr_sure_dk: sur.dr,
        uzman_sure_dk: sur.uzman,
        fatura_kesildi: mevcut?.fatura_kesildi || false,
      }]
    })
  }

  // Fatura kesildi işaretle
  async function faturaKes(firma_id: string, kesildi: boolean) {
    const mevcut = donemBul(firma_id)
    if (!mevcut) { setHata('Önce çalışan sayısını girin'); return }
    setKayitYukleniyor(true)
    await sb.from('donem_takip').update({
      fatura_kesildi: kesildi,
      fatura_tarihi: kesildi ? new Date().toISOString().slice(0,10) : null
    }).eq('id', mevcut.id)
    setDonemler(prev => prev.map(d => d.firma_id === firma_id ? { ...d, fatura_kesildi: kesildi } : d))
    setKayitYukleniyor(false)
  }

  // Katip sözleşmesi ekle
  async function katipKaydet() {
    if (!katipModal || !katipForm.gorevlendirilen_ad || !katipForm.sozlesme_turu) return
    setHata('')
    const { error } = await sb.from('katip_sozlesmeleri').insert({
      firma_id: katipModal.id,
      sgk_sicil: katipModal.sgk_sicil,
      ...katipForm,
      sozlesme_id: katipForm.sozlesme_id ? Number(katipForm.sozlesme_id) : null,
      calisma_suresi_dk: Number(katipForm.calisma_suresi_dk) || null,
      baslangic_tarihi: katipForm.baslangic_tarihi || null,
      bitis_tarihi: katipForm.bitis_tarihi || null,
    })
    if (error) { setHata(error.message); return }
    setKatipModal(null)
    setKatipForm(bosKatipForm())
    yukle()
  }

  function ayDegistir(fark: number) {
    const [y, m] = ay.split('-').map(Number)
    const d = new Date(y, m - 1 + fark, 1)
    setAy(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  }

  const ayLabel = new Date(ay + '-15').toLocaleDateString('tr-TR', { month:'long', year:'numeric' })

  // Özet hesapla
  const kesilenFaturalar = donemler.filter(d => d.fatura_kesildi)
  const toplamFatura = donemler.reduce((s,d) => s + (Number(d.fatura_tutari)||0), 0)
  const kesilenToplam = kesilenFaturalar.reduce((s,d) => s + (Number(d.fatura_tutari)||0), 0)
  const bekleyenSayi = firmalar.filter(f => {
    const d = donemBul(f.id)
    return f.fatura && (!d || !d.fatura_kesildi)
  }).length

  return (
    <div className="page-wrap">
      {/* BAŞLIK */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div>
          <h1 className="page-title">Aylık Fatura Takibi</h1>
          <p className="page-sub">
            {/*
              NOT: Bu sayfa Excel'deki "Haziran 2026" tablosunun dijital versiyonu.
              Her ay çalışan sayısı girilir, fatura tutarı ve Katip süreleri otomatik hesaplanır.
            */}
            Dönem çalışan girişi · Fatura hesaplama · Katip süre takibi
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={()=>ayDegistir(-1)} style={navBtn}><ChevronLeft size={16}/></button>
          <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:16, minWidth:130, textAlign:'center' }}>{ayLabel}</span>
          <button onClick={()=>ayDegistir(1)} style={navBtn}><ChevronRight size={16}/></button>
        </div>
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      {/* ÖZET KARTLAR */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>Toplam Fatura Tutarı</div>
          <div style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700, color:'var(--green)' }}>{tl(toplamFatura)}</div>
          <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>
            {donemler.filter(d=>d.calisan_sayisi>0).length} firma girildi
          </div>
        </div>
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>Kesilen Fatura</div>
          <div style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700, color:'var(--accent)' }}>{tl(kesilenToplam)}</div>
          <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>{kesilenFaturalar.length} firma tamamlandı</div>
        </div>
        <div className="card" style={{ padding:'16px 18px', borderColor: bekleyenSayi>0?'rgba(251,191,36,0.3)':undefined }}>
          <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>Bekleyen</div>
          <div style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700, color:bekleyenSayi>0?'var(--amber)':'var(--green)' }}>
            {bekleyenSayi}
          </div>
          <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>fatura kesilmedi</div>
        </div>
      </div>

      {/* BİLGİ NOTU */}
      <div style={{ background:'var(--blue-soft)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', gap:10, alignItems:'flex-start' }}>
        <Info size={16} color="var(--blue)" style={{ flexShrink:0, marginTop:1 }}/>
        <div style={{ fontSize:12, color:'var(--blue)', lineHeight:1.6 }}>
          <strong>Nasıl kullanılır:</strong> Her firma için dönem sonu çalışan sayısını girin.
          Fatura tutarı <strong>anında hesaplanır</strong> (kişi başı ücret × çalışan).
          Dr/Uzman süreleri Katip sistemine girilmesi gereken <strong>zorunlu dakikalar</strong>dır.
          "Kesildi" butonu faturayı tamamlanmış olarak işaretler.
        </div>
      </div>

      {/* FİRMA LİSTESİ */}
      {yukleniyor ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-faint)' }}>Yükleniyor...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {firmalar.map(firma => {
            const donem = donemBul(firma.id)
            const calisan = donem?.calisan_sayisi ?? firma.calisan_sayisi ?? 0
            const kisiBasiUcret = Number(firma.kisi_basi_ucret) || 0
            const faturaTutar = donem?.fatura_tutari ?? (calisan * kisiBasiUcret)
            const sur = sureler(firma.tehlike_sinifi, calisan)
            const drSure = donem?.dr_sure_dk ?? sur.dr
            const uzmanSure = donem?.uzman_sure_dk ?? sur.uzman
            const oncekiFark = donem?.farak ?? null
            const kesildi = donem?.fatura_kesildi || false
            const katipSoz = katipBul(firma)

            return (
              <div key={firma.id} className="card" style={{ padding:'18px 20px', borderColor:kesildi?'rgba(52,211,153,0.25)':undefined }}>
                {/* FİRMA BAŞLIĞI */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14, flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:15 }}>{firma.isg_katip_unvan || firma.unvan}</div>
                    <div style={{ display:'flex', gap:10, marginTop:4, flexWrap:'wrap' }}>
                      {firma.bolge && <span style={{ fontSize:12, color:'var(--text-faint)' }}>{firma.bolge}</span>}
                      <span style={{ fontSize:12, color: firma.tehlike_sinifi?.includes('Çok')?'var(--red)':firma.tehlike_sinifi?.includes('Tehlikeli')&&!firma.tehlike_sinifi?.includes('Az')?'var(--amber)':'var(--green)' }}>
                        {firma.tehlike_sinifi}
                      </span>
                      {firma.sgk_sicil && <span style={{ fontSize:11, color:'var(--text-faint)', fontFamily:'monospace' }}>{firma.sgk_sicil.slice(-8)}</span>}
                    </div>
                  </div>
                  {kesildi ? (
                    <span style={{ display:'flex', alignItems:'center', gap:6, background:'var(--green-soft)', color:'var(--green)', padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:600 }}>
                      <Check size={15}/> Kesildi
                    </span>
                  ) : (
                    <button
                      onClick={() => faturaKes(firma.id, true)}
                      disabled={!donem || kayitYukleniyor}
                      style={{ display:'flex', alignItems:'center', gap:6, background:donem?'var(--accent)':'var(--surface-2)', color:donem?'#fff':'var(--text-faint)', border:'none', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:donem?'pointer':'not-allowed', fontFamily:'inherit' }}>
                      <FileText size={15}/> Fatura Kes
                    </button>
                  )}
                </div>

                {/* HESAPLAMA ALANI */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:14 }}>

                  {/* Çalışan Sayısı Girişi */}
                  <div style={{ background:'var(--surface-2)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:6 }}>
                      Dönem Sonu Çalışan
                      {/*
                        NOT: Bu Excel'deki G kolonu (MAYIS SONU gibi).
                        Bu sayıya göre fatura kesilir.
                      */}
                    </div>
                    <input
                      type="number"
                      defaultValue={calisan || ''}
                      placeholder="0"
                      onBlur={e => {
                        const val = Number(e.target.value)
                        if (val !== calisan) calisanGuncelle(firma, val)
                      }}
                      style={{ background:'var(--surface)', border:'1px solid var(--border)', padding:'8px 10px', borderRadius:8, fontSize:16, fontWeight:700, width:'100%', color:'var(--text)' }}
                    />
                    {oncekiFark !== null && oncekiFark !== 0 && (
                      <div style={{ fontSize:11, marginTop:4, color:oncekiFark>0?'var(--green)':'var(--red)' }}>
                        {oncekiFark>0?'▲':' ▼'} {Math.abs(oncekiFark)} kişi değişim
                      </div>
                    )}
                  </div>

                  {/* Kişi Başı Ücret */}
                  <div style={{ background:'var(--surface-2)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:6 }}>
                      Kişi Başı Ücret
                      {/* NOT: Excel'deki N kolonu (K.BAŞI 26) */}
                    </div>
                    <div style={{ fontSize:18, fontWeight:700 }}>{tl(kisiBasiUcret)}</div>
                    {firma.kisi_basi_ucret_yeni > 0 && (
                      <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>Yeni: {tl(Number(firma.kisi_basi_ucret_yeni))}</div>
                    )}
                  </div>

                  {/* Fatura Tutarı (Otomatik) */}
                  <div style={{ background: faturaTutar>0?'var(--green-soft)':'var(--surface-2)', borderRadius:10, padding:'12px 14px', border:faturaTutar>0?'1px solid rgba(52,211,153,0.2)':'1px solid transparent' }}>
                    <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:6 }}>
                      Fatura Tutarı (Otomatik)
                      {/* NOT: Excel O = N × G */}
                    </div>
                    <div style={{ fontSize:18, fontWeight:700, color:faturaTutar>0?'var(--green)':'var(--text-faint)' }}>
                      {faturaTutar > 0 ? tl(faturaTutar) : '—'}
                    </div>
                    {calisan > 0 && kisiBasiUcret > 0 && (
                      <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>{calisan} × {tl(kisiBasiUcret)}</div>
                    )}
                  </div>
                </div>

                {/* KATİP ZORUNLU SÜRELER */}
                <div style={{ background:'var(--amber-soft)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--amber)', fontWeight:600, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                    <Clock size={13}/> Katip Sistemine Girilecek Zorunlu Süreler
                    {/*
                      NOT: Bu süreler mevzuat gereği.
                      Az Tehlikeli: Dr 5dk/kişi, Uzman 10dk/kişi
                      Tehlikeli: Dr 10dk/kişi, Uzman 20dk/kişi
                      Çok Tehlikeli: Dr 15dk/kişi, Uzman 40dk/kişi
                    */}
                  </div>
                  <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                    <div>
                      <span style={{ fontSize:11, color:'var(--text-faint)' }}>İşyeri Hekimi (Dr): </span>
                      <strong style={{ color:'var(--amber)' }}>{drSure} dk/ay</strong>
                      {drSure >= 60 && <span style={{ fontSize:11, color:'var(--text-faint)', marginLeft:6 }}>({Math.floor(drSure/60)}sa {drSure%60}dk)</span>}
                    </div>
                    <div>
                      <span style={{ fontSize:11, color:'var(--text-faint)' }}>İSG Uzmanı: </span>
                      <strong style={{ color:'var(--amber)' }}>{uzmanSure} dk/ay</strong>
                      {uzmanSure >= 60 && <span style={{ fontSize:11, color:'var(--text-faint)', marginLeft:6 }}>({Math.floor(uzmanSure/60)}sa {uzmanSure%60}dk)</span>}
                    </div>
                  </div>
                </div>

                {/* KATİP SÖZLEŞMELERİ */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontSize:12, color:'var(--text-faint)', fontWeight:500 }}>Katip Sözleşmeleri</div>
                    <button onClick={()=>{ setKatipModal(firma); setKatipForm(bosKatipForm()) }}
                      style={{ fontSize:12, background:'none', border:'none', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:0 }}>
                      <Plus size={12}/> Sözleşme Ekle
                    </button>
                  </div>
                  {katipSoz.length === 0 ? (
                    <div style={{ fontSize:12, color:'var(--text-faint)', fontStyle:'italic' }}>
                      Katip sözleşmesi eklenmemiş — SGK sicil: {firma.sgk_sicil || 'girilmemiş'}
                    </div>
                  ) : (
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {katipSoz.map(k => (
                        <div key={k.id} style={{ background:'var(--surface-2)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
                          <div style={{ fontWeight:600, color: k.sozlesme_turu==='İGU'?'var(--blue)':k.sozlesme_turu==='İH'?'var(--green)':'var(--amber)' }}>
                            {k.sozlesme_turu} — {k.gorevlendirilen_ad}
                          </div>
                          <div style={{ color:'var(--text-faint)', marginTop:2 }}>
                            {k.sertifika_no} · {k.calisma_suresi_dk}dk
                          </div>
                          <div style={{ color: k.sozlesme_durumu==='Devam Ediyor'?'var(--green)':'var(--red)', marginTop:2, fontSize:11 }}>
                            {k.sozlesme_durumu}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Atama bilgisi */}
                {(firma.gorevli_igu || firma.gorevli_ih) && (
                  <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-faint)', display:'flex', gap:16, flexWrap:'wrap' }}>
                    {firma.gorevli_igu && <span>İGU: <strong style={{ color:'var(--text-dim)' }}>{firma.gorevli_igu}</strong></span>}
                    {firma.gorevli_ih && <span>İH: <strong style={{ color:'var(--text-dim)' }}>{firma.gorevli_ih}</strong></span>}
                    {firma.fatura_aciklama && <span style={{ color:'var(--amber)' }}>{firma.fatura_aciklama}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* KATİP SÖZLEŞME EKLEME MODAL */}
      {katipModal && (
        <div className="modal-overlay" onClick={()=>setKatipModal(null)}>
          <div className="modal-content" style={{ maxWidth:500 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:18, fontWeight:600 }}>Katip Sözleşmesi Ekle</h2>
              <button onClick={()=>setKatipModal(null)} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16, padding:'8px 12px', background:'var(--surface-2)', borderRadius:8 }}>
              <strong>{katipModal.isg_katip_unvan || katipModal.unvan}</strong>
              <br/>SGK Sicil: {katipModal.sgk_sicil || '—'}
            </div>
            <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>Sözleşme Türü</label>
                <select value={katipForm.sozlesme_turu} onChange={e=>setKatipForm({...katipForm, sozlesme_turu:e.target.value})}>
                  {['İGU','İH','DSP','BHL'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Katip Sözleşme ID</label>
                <input value={katipForm.sozlesme_id} onChange={e=>setKatipForm({...katipForm, sozlesme_id:e.target.value})} placeholder="25821971"/>
              </div>
              <div style={{ gridColumn:'1/3' }}>
                <label style={lbl}>Görevlendirilen Kişi Adı *</label>
                <input value={katipForm.gorevlendirilen_ad} onChange={e=>setKatipForm({...katipForm, gorevlendirilen_ad:e.target.value})}/>
              </div>
              <div>
                <label style={lbl}>TC Kimlik No</label>
                <input value={katipForm.gorevlendirilen_tc} onChange={e=>setKatipForm({...katipForm, gorevlendirilen_tc:e.target.value})}/>
              </div>
              <div>
                <label style={lbl}>Sertifika Tipi</label>
                <select value={katipForm.sertifika_tipi} onChange={e=>setKatipForm({...katipForm, sertifika_tipi:e.target.value})}>
                  {['A Sınıfı','B Sınıfı','C Sınıfı','İH Sertifikası','DSP Sertifikası'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Sertifika No</label>
                <input value={katipForm.sertifika_no} onChange={e=>setKatipForm({...katipForm, sertifika_no:e.target.value})} placeholder="İGU-406910"/>
              </div>
              <div>
                <label style={lbl}>Çalışma Süresi (dk/ay)</label>
                <input type="number" value={katipForm.calisma_suresi_dk} onChange={e=>setKatipForm({...katipForm, calisma_suresi_dk:e.target.value})} placeholder="70"/>
              </div>
              <div>
                <label style={lbl}>Durum</label>
                <select value={katipForm.sozlesme_durumu} onChange={e=>setKatipForm({...katipForm, sozlesme_durumu:e.target.value})}>
                  {['Devam Ediyor','Sona Erdi','Askıya Alındı'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Başlangıç Tarihi</label>
                <input type="date" value={katipForm.baslangic_tarihi} onChange={e=>setKatipForm({...katipForm, baslangic_tarihi:e.target.value})}/>
              </div>
              <div>
                <label style={lbl}>Bitiş Tarihi</label>
                <input type="date" value={katipForm.bitis_tarihi} onChange={e=>setKatipForm({...katipForm, bitis_tarihi:e.target.value})}/>
              </div>
              <div style={{ gridColumn:'1/3' }}>
                <label style={lbl}>Notlar</label>
                <textarea rows={2} value={katipForm.notlar} onChange={e=>setKatipForm({...katipForm, notlar:e.target.value})}/>
              </div>
            </div>
            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginTop:12 }}>{hata}</div>}
            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }} onClick={()=>setKatipModal(null)}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={katipKaydet}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl: any = { display:'block', fontSize:12, color:'var(--text-dim)', marginBottom:6, fontWeight:500 }
const navBtn: any = { background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'7px', cursor:'pointer', display:'flex', alignItems:'center' }
