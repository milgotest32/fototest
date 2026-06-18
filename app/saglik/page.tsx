'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { csvIndir } from '@/lib/csvExport'
import * as XLSX from 'xlsx'
import { Plus, Search, X, HeartPulse, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useIzin } from '@/lib/useIzin'

const TETKIKLER = ['EK2','AKC','ODİO','SFT','EKG','CBC','AST','ALT','ÜRE','KREATİNİN','GLUKOZ','BURUN','BOĞAZ']
const ODEME = ['Cari','İBAN','Peşin','POS']
const ODEME_RENK: any = { Cari:'var(--amber)', İBAN:'var(--blue)', Peşin:'var(--green)', POS:'var(--accent)' }
const SAYFA_BOYUTU = 50

export default function Saglik() {
  const izin = useIzin('saglik')
  const [kayitlar, setKayitlar] = useState<any[]>([])
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [personeller, setPersoneller] = useState<any[]>([])
  const [arama, setArama] = useState('')
  const [aramaDebounced, setAramaDebounced] = useState('')
  const [hekimFiltre, setHekimFiltre] = useState('Hepsi')
  const [odemeFiltre, setOdemeFiltre] = useState('Hepsi')
  const [mevcutRol, setMevcutRol] = useState<string>('saha')
  const [basTarih, setBasTarih] = useState('')
  const [bitTarih, setBitTarih] = useState('')
  const [modal, setModal] = useState(false)
  const [detay, setDetay] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [nextPrNo, setNextPrNo] = useState<number|null>(null)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(bosForm())
  const [sube, setSube] = useState<'merkez'|'sandikli'>('merkez')
  const [sayfa, setSayfa] = useState(0)
  const [toplamKayit, setToplamKayit] = useState(0)
  const debounceRef = useRef<any>(null)

  function bosForm() {
    return { tarih: new Date().toISOString().slice(0, 10), ad_soyad: '', dogum_tarihi: '', telefon: '', firma: '', firma_id: '', hekim_id: '', ucret: '', odeme_sekli: 'Peşin', tetkikler: {}, pr_no: '' }
  }

  const sb = createClient()

  // Debounce arama
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setAramaDebounced(arama)
      setSayfa(0)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [arama])

  // Filtre değişince sayfayı sıfırla
  useEffect(() => { setSayfa(0) }, [hekimFiltre, odemeFiltre, basTarih, bitTarih, sube])

  // Sayfayı yükle
  useEffect(() => {
    const sb2 = createClient()
    sb2.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await sb2.from('personeller').select('rol').eq('id', data.user.id).single()
        setMevcutRol(p?.rol || 'saha')
      }
    })
  }, [])

  useEffect(() => { yukle() }, [aramaDebounced, hekimFiltre, odemeFiltre, basTarih, bitTarih, sayfa, sube])

  // İlk yüklemede firmalar ve personeller
  useEffect(() => {
    const sb2 = createClient()
    Promise.all([
      sb2.from('firmalar').select('id, unvan').order('unvan'),
      sb2.from('personeller').select('id, ad_soyad, rol').eq('aktif', true).in('rol', ['hekim', 'yonetici']).order('ad_soyad')
    ]).then(([fRes, pRes]) => {
      setFirmalar(fRes.data || [])
      setPersoneller(pRes.data || [])
    })
  }, [])

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    const from = sayfa * SAYFA_BOYUTU
    const to = from + SAYFA_BOYUTU - 1

    let q = sb.from('hasta_kayitlari')
      .select('id, tarih, ad_soyad, dogum_tarihi, telefon, firma, ucret, odeme_sekli, tetkikler, hekim_id, gaita, tit, hbsag, antihbs, hcv, hiv, kan_grubu, goz, isg_egitim, aciklama, pr_no', { count: 'exact' })
      .eq('sube', sube)
      .order('tarih', { ascending: false })
      .range(from, to)

    // Server-side filtreler
    if (aramaDebounced) {
      q = q.or(`ad_soyad.ilike.%${aramaDebounced}%,firma.ilike.%${aramaDebounced}%`)
    }
    if (hekimFiltre !== 'Hepsi') q = q.eq('hekim_id', hekimFiltre)
    if (odemeFiltre !== 'Hepsi') q = q.eq('odeme_sekli', odemeFiltre)
    if (basTarih) q = q.gte('tarih', basTarih)
    if (bitTarih) q = q.lte('tarih', bitTarih)

    const { data, error, count } = await q
    if (error) { setHata('Yüklenemedi'); setYukleniyor(false); return }
    setKayitlar(data || [])
    setToplamKayit(count || 0)
    setYukleniyor(false)
  }, [aramaDebounced, hekimFiltre, odemeFiltre, basTarih, bitTarih, sayfa, sube])

  async function modalAc() {
    const { data } = await sb.rpc('max_pr_no')
    const next = data ? Number(data) + 1 : 1
    setNextPrNo(next)
    setForm({ ...bosForm(), pr_no: String(next) })
    setModal(true)
  }

  async function kaydet() {
    if (!form.ad_soyad) return
    setHata('')
    const { error } = await sb.from('hasta_kayitlari').insert({
      ...form, ucret: Number(form.ucret) || 0,
      dogum_tarihi: form.dogum_tarihi || null,
      firma_id: form.firma_id || null,
      hekim_id: form.hekim_id || null,
      pr_no: form.pr_no ? Number(form.pr_no) : null,
      sube
    })
    if (error) { setHata(error.message); return }
    setModal(false); setForm(bosForm()); setSayfa(0); yukle()
  }

  async function sil(id: string) {
    if (!confirm('Silmek istiyor musunuz?')) return
    await sb.from('hasta_kayitlari').delete().eq('id', id); yukle()
  }

  function toggleTetkik(t: string) {
    setForm((f: any) => ({ ...f, tetkikler: { ...f.tetkikler, [t]: !f.tetkikler[t] } }))
  }

  async function exportCSV() {
    // CSV için tüm filtrelenmiş veriyi çek (limit yok)
    let q = sb.from('hasta_kayitlari')
      .select('tarih, ad_soyad, dogum_tarihi, telefon, firma, ucret, odeme_sekli, tetkikler, gaita, tit, hbsag, antihbs, hcv, hiv, kan_grubu, goz, isg_egitim, aciklama, pr_no')
      .eq('sube', sube)
      .order('tarih', { ascending: false })
    if (aramaDebounced) q = q.or(`ad_soyad.ilike.%${aramaDebounced}%,firma.ilike.%${aramaDebounced}%`)
    if (hekimFiltre !== 'Hepsi') q = q.eq('hekim_id', hekimFiltre)
    if (odemeFiltre !== 'Hepsi') q = q.eq('odeme_sekli', odemeFiltre)
    if (basTarih) q = q.gte('tarih', basTarih)
    if (bitTarih) q = q.lte('tarih', bitTarih)
    const { data } = await q
    csvIndir((data || []).map((k: any) => ({
      'Tarih': k.tarih || '', 'Ad Soyad': k.ad_soyad || '', 'Doğum Tarihi': k.dogum_tarihi || '',
      'Telefon': k.telefon || '', 'Firma': k.firma || '',
      'Ücret': k.ucret || 0, 'Ödeme': k.odeme_sekli || '',
      'Tetkikler': Object.entries(k.tetkikler || {}).filter(([, v]) => v).map(([t]) => t.toUpperCase()).join(', '),
      'EK2': k.tetkikler?.ek2 ? 'Evet' : '', 'AKC': k.tetkikler?.akc ? 'Evet' : '',
      'ODİO': k.tetkikler?.odio ? 'Evet' : '', 'SFT': k.tetkikler?.sft ? 'Evet' : '',
      'EKG': k.tetkikler?.ekg ? 'Evet' : '', 'CBC': k.tetkikler?.cbc ? 'Evet' : '',
      'AST': k.tetkikler?.ast ? 'Evet' : '', 'ALT': k.tetkikler?.alt ? 'Evet' : '',
      'Üre': k.tetkikler?.ure ? 'Evet' : '', 'Kreatinin': k.tetkikler?.kreatinin ? 'Evet' : '',
      'Glukoz': k.tetkikler?.glukoz ? 'Evet' : '', 'Burun': k.tetkikler?.burun ? 'Evet' : '',
      'Boğaz': k.tetkikler?.bogaz ? 'Evet' : '',
      'Gaita': k.gaita ? 'Evet' : '', 'TİT': k.tit ? 'Evet' : '',
      'HBsAg': k.hbsag ? 'Evet' : '', 'Anti-HBs': k.antihbs ? 'Evet' : '',
      'Göz': k.goz ? 'Evet' : '', 'İSG Eğitim': k.isg_egitim ? 'Evet' : '',
      'PR No': k.pr_no || '', 'Açıklama': k.aciklama || '',
    })), 'saglik_tarama')
  }

  async function exportExcel() {
    let q = sb.from('hasta_kayitlari')
      .select('tarih, ad_soyad, dogum_tarihi, telefon, firma, ucret, odeme_sekli, tetkikler, gaita, tit, hbsag, antihbs, hcv, hiv, kan_grubu, goz, isg_egitim, aciklama, pr_no')
      .eq('sube', sube)
      .order('tarih', { ascending: false })
    if (aramaDebounced) q = q.or(`ad_soyad.ilike.%${aramaDebounced}%,firma.ilike.%${aramaDebounced}%`)
    if (hekimFiltre !== 'Hepsi') q = q.eq('hekim_id', hekimFiltre)
    if (odemeFiltre !== 'Hepsi') q = q.eq('odeme_sekli', odemeFiltre)
    if (basTarih) q = q.gte('tarih', basTarih)
    if (bitTarih) q = q.lte('tarih', bitTarih)
    const { data } = await q
    const rows = (data || []).map((k: any) => ({
      'Tarih': k.tarih || '', 'Ad Soyad': k.ad_soyad || '', 'Doğum Tarihi': k.dogum_tarihi || '',
      'Telefon': k.telefon || '', 'Firma': k.firma || '',
      'Ücret': Number(k.ucret) || 0, 'Ödeme': k.odeme_sekli || '',
      'Tetkikler': Object.entries(k.tetkikler || {}).filter(([, v]) => v).map(([t]) => t.toUpperCase()).join(', '),
      'EK2': k.tetkikler?.ek2 ? 'Evet' : '', 'AKC': k.tetkikler?.akc ? 'Evet' : '',
      'ODİO': k.tetkikler?.odio ? 'Evet' : '', 'SFT': k.tetkikler?.sft ? 'Evet' : '',
      'EKG': k.tetkikler?.ekg ? 'Evet' : '', 'CBC': k.tetkikler?.cbc ? 'Evet' : '',
      'AST': k.tetkikler?.ast ? 'Evet' : '', 'ALT': k.tetkikler?.alt ? 'Evet' : '',
      'Üre': k.tetkikler?.ure ? 'Evet' : '', 'Kreatinin': k.tetkikler?.kreatinin ? 'Evet' : '',
      'Glukoz': k.tetkikler?.glukoz ? 'Evet' : '', 'Burun': k.tetkikler?.burun ? 'Evet' : '',
      'Boğaz': k.tetkikler?.bogaz ? 'Evet' : '',
      'Gaita': k.gaita ? 'Evet' : '', 'TİT': k.tit ? 'Evet' : '',
      'HBsAg': k.hbsag ? 'Evet' : '', 'Anti-HBs': k.antihbs ? 'Evet' : '',
      'Göz': k.goz ? 'Evet' : '', 'İSG Eğitim': k.isg_egitim ? 'Evet' : '',
      'PR No': k.pr_no || '', 'Açıklama': k.aciklama || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sağlık Raporu')
    // Kolon genişlikleri
    ws['!cols'] = [
      {wch:12},{wch:22},{wch:14},{wch:14},{wch:28},
      {wch:10},{wch:10},{wch:30},{wch:6},{wch:6},
      {wch:6},{wch:6},{wch:6},{wch:6},{wch:6},{wch:6},
    ]
    XLSX.writeFile(wb, `saglik_raporu_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const hekimler = personeller.filter((p: any) => ['hekim', 'yonetici'].includes(p.rol))
  const paraMi = ['yonetici', 'muhasebe'].includes(mevcutRol)
  const tl = (n: number) => new Intl.NumberFormat('tr-TR').format(n) + ' ₺'
  const toplamSayfa = Math.ceil(toplamKayit / SAYFA_BOYUTU)

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Sağlık Raporu</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 4 }}>
            {toplamKayit.toLocaleString('tr-TR')} kayıt{aramaDebounced ? ` · "${aramaDebounced}" araması` : ''}
          </p>
        </div>
        {izin.duzenle && <button className="btn" onClick={modalAc}><Plus size={18} /> Yeni Kayıt</button>}
      </div>

      {/* ŞUBE SEKMELERİ */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
        {([['merkez','🏥 Merkez'],['sandikli','🏨 Sandıklı']] as ['merkez'|'sandikli', string][]).map(([k,l]) => (
          <button key={k} onClick={() => { setSube(k); setSayfa(0) }}
            style={{ padding:'8px 18px', borderRadius:'8px 8px 0 0', border:'1px solid var(--border)',
              borderBottom: sube===k ? '1px solid var(--surface)' : '1px solid var(--border)',
              background: sube===k ? 'var(--surface)' : 'transparent',
              color: sube===k ? 'var(--accent)' : 'var(--text-dim)',
              cursor:'pointer', fontSize:13, fontWeight: sube===k ? 600 : 400, marginBottom:-1,
              fontFamily:'inherit' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--green-soft)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>Sağlık Raporu — İşe giriş ve periyodik muayene kayıtları. Arama kutusuna yazınca sunucu tarafında filtreleme yapılır. Sayfalama ile hızlı gezin.</p>
      </div>

      {hata && <div style={{ background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{hata}</div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-faint)' }} />
          <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Hasta veya firma ara..." style={{ paddingLeft: 34, width: 200 }} />
        </div>
        <input type="date" value={basTarih} onChange={e => setBasTarih(e.target.value)} style={{ padding: '8px 10px', width: 150, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
        <input type="date" value={bitTarih} onChange={e => setBitTarih(e.target.value)} style={{ padding: '8px 10px', width: 150, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
        <select value={hekimFiltre} onChange={e => setHekimFiltre(e.target.value)} style={{ padding: '8px 12px', width: 150, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="Hepsi">Tüm Hekimler</option>
          {hekimler.map((h: any) => <option key={h.id} value={h.id}>{h.ad_soyad}</option>)}
        </select>
        <select value={odemeFiltre} onChange={e => setOdemeFiltre(e.target.value)} style={{ padding: '8px 12px', width: 120, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}>
          {['Hepsi', 'Peşin', 'Cari', 'İBAN', 'POS'].map(o => <option key={o}>{o}</option>)}
        </select>
        <button onClick={exportCSV} style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-dim)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>↓ CSV</button>
        <button onClick={exportExcel} style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: '#22c55e', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:15 }}>⊞</span> Excel
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>PR No</th><th>Tarih</th><th>Ad Soyad</th><th>Firma</th>{paraMi && <th>Ücret</th>}{paraMi && <th>Ödeme</th>}<th>Tetkikler</th><th></th></tr>
            </thead>
            <tbody>
              {yukleniyor
                ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 40 }}>Yükleniyor...</td></tr>
                : kayitlar.length === 0
                  ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 40 }}>Kayıt bulunamadı</td></tr>
                  : kayitlar.map(k => {
                    const aktifTetkik = Object.entries(k.tetkikler || {}).filter(([, v]) => v).map(([t]) => t)
                    return (
                      <tr key={k.id} style={{ cursor: 'pointer' }} onClick={() => setDetay(k)}>
                        <td style={{ color: 'var(--text-dim)', fontWeight:600 }}>{k.pr_no || '—'}</td>
                        <td style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{new Date(k.tarih + 'T00:00:00').toLocaleDateString('tr-TR')}</td>
                        <td style={{ fontWeight: 500 }}>{k.ad_soyad}</td>
                        <td style={{ color: 'var(--text-dim)' }}>{k.firma || '—'}</td>
                        {paraMi && <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{tl(Number(k.ucret) || 0)}</td>}
                        {paraMi && <td><span className="badge" style={{ background: `${ODEME_RENK[k.odeme_sekli]}22`, color: ODEME_RENK[k.odeme_sekli] }}>{k.odeme_sekli}</span></td>}
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 260 }}>
                            {aktifTetkik.length === 0
                              ? <span style={{ color: 'var(--text-faint)' }}>—</span>
                              : aktifTetkik.map(t => <span key={t} style={{ fontSize: 10, background: 'var(--surface-2)', color: 'var(--text-dim)', padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)' }}>{t}</span>)}
                          </div>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          {izin.duzenle && <button onClick={() => sil(k.id)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>}
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        {toplamSayfa > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              {sayfa * SAYFA_BOYUTU + 1}–{Math.min((sayfa + 1) * SAYFA_BOYUTU, toplamKayit)} / {toplamKayit.toLocaleString('tr-TR')} kayıt
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => setSayfa(0)} disabled={sayfa === 0}
                style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: sayfa === 0 ? 'not-allowed' : 'pointer', color: 'var(--text-dim)', fontSize: 12, opacity: sayfa === 0 ? 0.4 : 1 }}>
                ««
              </button>
              <button onClick={() => setSayfa(s => Math.max(0, s - 1))} disabled={sayfa === 0}
                style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: sayfa === 0 ? 'not-allowed' : 'pointer', color: 'var(--text-dim)', opacity: sayfa === 0 ? 0.4 : 1 }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 13, color: 'var(--text)', padding: '0 8px' }}>{sayfa + 1} / {toplamSayfa}</span>
              <button onClick={() => setSayfa(s => Math.min(toplamSayfa - 1, s + 1))} disabled={sayfa >= toplamSayfa - 1}
                style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: sayfa >= toplamSayfa - 1 ? 'not-allowed' : 'pointer', color: 'var(--text-dim)', opacity: sayfa >= toplamSayfa - 1 ? 0.4 : 1 }}>
                <ChevronRight size={16} />
              </button>
              <button onClick={() => setSayfa(toplamSayfa - 1)} disabled={sayfa >= toplamSayfa - 1}
                style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: sayfa >= toplamSayfa - 1 ? 'not-allowed' : 'pointer', color: 'var(--text-dim)', fontSize: 12, opacity: sayfa >= toplamSayfa - 1 ? 0.4 : 1 }}>
                »»
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detay Modal */}
      {detay && (
        <div className="modal-overlay" onClick={() => setDetay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={mHead}><h2 style={mTitle}><HeartPulse size={20} color="var(--green)" /> Hasta Detayı</h2><button onClick={() => setDetay(null)} style={xBtn}><X size={22} /></button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Ad Soyad', detay.ad_soyad], ['Doğum Tarihi', detay.dogum_tarihi ? new Date(detay.dogum_tarihi + 'T00:00:00').toLocaleDateString('tr-TR') : '—'],
                ['Telefon', detay.telefon || '—'], ['Firma', detay.firma || '—'],
                ['Tarih', new Date(detay.tarih + 'T00:00:00').toLocaleDateString('tr-TR')],
                ...(paraMi ? [['Ücret', tl(Number(detay.ucret) || 0)], ['Ödeme', detay.odeme_sekli]] : [])
              ].map(([k, v]) => (<div key={k} style={{ display: 'flex', gap: 12, fontSize: 14 }}><span style={{ color: 'var(--text-dim)', minWidth: 110 }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>))}
              <div style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                <span style={{ color: 'var(--text-dim)', minWidth: 110 }}>Tetkikler</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {Object.entries(detay.tetkikler || {}).filter(([, v]) => v).map(([t]) => <span key={t} style={{ fontSize: 11, background: 'var(--green-soft)', color: 'var(--green)', padding: '2px 8px', borderRadius: 5 }}>{t}</span>)}
                  {Object.values(detay.tetkikler || {}).every(v => !v) && <span style={{ color: 'var(--text-faint)' }}>—</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Kayıt Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={mHead}><h2 style={mTitle}><HeartPulse size={20} color="var(--green)" /> Yeni Hasta Kaydı</h2><button onClick={() => setModal(false)} style={xBtn}><X size={22} /></button></div>
            <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label style={lbl}>Tarih</label><input type="date" value={form.tarih} onChange={e => setForm({ ...form, tarih: e.target.value })} /></div>
              <div><label style={lbl}>Ad Soyad *</label><input value={form.ad_soyad} onChange={e => setForm({ ...form, ad_soyad: e.target.value })} placeholder="Hasta adı" /></div>
              <div><label style={lbl}>Protokol No</label><input type="number" placeholder="PR No" value={form.pr_no} onChange={e => setForm({ ...form, pr_no: e.target.value })} /></div>
              <div><label style={lbl}>Doğum Tarihi</label><input type="date" value={form.dogum_tarihi} onChange={e => setForm({ ...form, dogum_tarihi: e.target.value })} /></div>
              <div><label style={lbl}>Telefon</label><input value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} placeholder="05..." /></div>
              <div style={{ gridColumn: '1/3' }}>
                <label style={lbl}>Firma</label>
                <select value={form.firma_id} onChange={e => {
                  const f = firmalar.find((x: any) => x.id === e.target.value)
                  setForm({ ...form, firma_id: e.target.value, firma: f?.unvan || '' })
                }}>
                  <option value="">Seçiniz veya yazınız...</option>
                  {firmalar.map((f: any) => <option key={f.id} value={f.id}>{f.unvan}</option>)}
                </select>
                {!form.firma_id && <input style={{ marginTop: 8 }} value={form.firma} onChange={e => setForm({ ...form, firma: e.target.value })} placeholder="Veya firma adını yazın..." />}
              </div>
              <div>
                <label style={lbl}>Muayene Hekimi</label>
                <select value={form.hekim_id} onChange={e => setForm({ ...form, hekim_id: e.target.value })}>
                  <option value="">Seçiniz...</option>
                  {personeller.map((p: any) => <option key={p.id} value={p.id}>{p.ad_soyad}</option>)}
                </select>
              </div>
              {paraMi && <div><label style={lbl}>Ücret (₺)</label><input type="number" value={form.ucret} onChange={e => setForm({ ...form, ucret: e.target.value })} /></div>}
              {paraMi && <div style={{ gridColumn: '1/3' }}>
                <label style={lbl}>Ödeme Şekli</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ODEME.map(o => (
                    <button key={o} type="button" onClick={() => setForm({ ...form, odeme_sekli: o })}
                      style={{ flex: 1, padding: '9px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', background: form.odeme_sekli === o ? `${ODEME_RENK[o]}22` : 'var(--surface-2)', border: `1px solid ${form.odeme_sekli === o ? ODEME_RENK[o] : 'var(--border)'}`, color: form.odeme_sekli === o ? ODEME_RENK[o] : 'var(--text-dim)' }}>{o}</button>
                  ))}
                </div>
              </div>}
            </div>
            <label style={lbl}>Tetkikler</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {TETKIKLER.map(t => {
                const aktif = form.tetkikler[t]
                return <button key={t} type="button" onClick={() => toggleTetkik(t)}
                  style={{ padding: '7px 13px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', background: aktif ? 'var(--green-soft)' : 'var(--surface-2)', border: `1px solid ${aktif ? 'var(--green)' : 'var(--border)'}`, color: aktif ? 'var(--green)' : 'var(--text-dim)' }}>{t}</button>
              })}
            </div>
            {hata && <div style={{ background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{hata}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModal(false)}>İptal</button>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={kaydet}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl: any = { display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 500 }
const mHead: any = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }
const mTitle: any = { fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }
const xBtn: any = { background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }
