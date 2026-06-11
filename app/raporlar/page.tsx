'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line, CartesianGrid
} from 'recharts'
import { TrendingUp, Target, MapPin, Activity, Wallet, Package, Users, ChevronLeft, ChevronRight, Phone, HeartPulse, AlertTriangle } from 'lucide-react'

const RENKLER = ['#6366f1','#34d399','#fbbf24','#f87171','#60a5fa','#a78bfa','#f472b6','#fb923c']
const AYLAR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
const tl = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits:0 }).format(n) + ' ₺'

const TT_STYLE = { background:'#1a1a24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:12 }

export default function Raporlar() {
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yil, setYil] = useState(new Date().getFullYear())
  const [aktifSekme, setAktifSekme] = useState<'genel'|'saglik'|'tahsilat'|'satis'|'isg'>('genel')

  // Hedefler (yönetici ayarlar)
  const [hedefler, setHedefler] = useState({ gunlukTahsilat: 2000, aylikArama: 50, aylikTahsilat: 50000, aylikHasta: 30 })
  const [hedefDuzenle, setHedefDuzenle] = useState(false)

  // Veri
  const [hastalar, setHastalar] = useState<any[]>([])
  const [hastalarGecen, setHastalarGecen] = useState<any[]>([])
  const [tahsilatlar, setTahsilatlar] = useState<any[]>([])
  const [tahsilatlarGecen, setTahsilatlarGecen] = useState<any[]>([])
  const [teklifler, setTeklifler] = useState<any[]>([])
  const [ziyaretler, setZiyaretler] = useState<any[]>([])
  const [gorevler, setGorevler] = useState<any[]>([])
  const [taramalar, setTaramalar] = useState<any[]>([])
  const [malzemeler, setMalzemeler] = useState<any[]>([])
  const [cariler, setCariler] = useState<any[]>([])

  const sb = createClient()
  useEffect(() => { yukle() }, [yil])

  async function yukle() {
    setYukleniyor(true)
    const yilBas = `${yil}-01-01`
    const yilBit = `${yil}-12-31`
    const gecenYilBas = `${yil-1}-01-01`
    const gecenYilBit = `${yil-1}-12-31`

    const [hRes, hGRes, tRes, tGRes, tekRes, zRes, gRes, taRes, mRes, cRes] = await Promise.all([
      sb.from('hasta_kayitlari').select('ucret, tarih, firma, odeme_sekli').gte('tarih', yilBas).lte('tarih', yilBit),
      sb.from('hasta_kayitlari').select('ucret, tarih').gte('tarih', gecenYilBas).lte('tarih', gecenYilBit),
      sb.from('tahsilatlar').select('tutar, tarih, odeme_turu').gte('tarih', yilBas).lte('tarih', yilBit),
      sb.from('tahsilatlar').select('tutar, tarih').gte('tarih', gecenYilBas).lte('tarih', gecenYilBit),
      sb.from('teklifler').select('surec_durumu, tur, created_at, iletim_turu'),
      sb.from('ziyaretler').select('tarih, tur').gte('tarih', yilBas).lte('tarih', yilBit),
      sb.from('gorevler').select('uzman, durum, tarih').gte('tarih', yilBas).lte('tarih', yilBit),
      sb.from('tarama_operasyonlari').select('asama, tutar'),
      sb.from('malzemeler').select('ad, stok, kritik_stok, kategori'),
      sb.from('cariler').select('acik_bakiye, vadesi_gecen_tutar, unvan'),
    ])

    setHastalar(hRes.data || [])
    setHastalarGecen(hGRes.data || [])
    setTahsilatlar(tRes.data || [])
    setTahsilatlarGecen(tGRes.data || [])
    setTeklifler(tekRes.data || [])
    setZiyaretler(zRes.data || [])
    setGorevler(gRes.data || [])
    setTaramalar(taRes.data || [])
    setMalzemeler(mRes.data || [])
    setCariler(cRes.data || [])
    setYukleniyor(false)
  }

  // --- HESAPLAMALAR ---
  const buAy = new Date().getMonth()
  const bugun = new Date().toISOString().slice(0,10)

  // Genel
  const toplamCiro = hastalar.reduce((s,h)=>s+(Number(h.ucret)||0),0)
  const toplamCiroGecen = hastalarGecen.reduce((s,h)=>s+(Number(h.ucret)||0),0)
  const toplamTahsilat = tahsilatlar.reduce((s,t)=>s+(Number(t.tutar)||0),0)
  const toplamTahsilatGecen = tahsilatlarGecen.reduce((s,t)=>s+(Number(t.tutar)||0),0)
  const acikBakiye = cariler.reduce((s,c)=>s+(Number(c.acik_bakiye)||0),0)
  const vadeGecen = cariler.reduce((s,c)=>s+(Number(c.vadesi_gecen_tutar)||0),0)
  const donusum = teklifler.length > 0 ? Math.round(teklifler.filter(t=>t.surec_durumu==='Olumlu').length/teklifler.length*100) : 0

  // Sağlık
  const buAyHasta = hastalar.filter(h => new Date(h.tarih).getMonth() === buAy)
  const bugunHasta = hastalar.filter(h => h.tarih === bugun)
  const gecenAyHasta = hastalar.filter(h => new Date(h.tarih).getMonth() === buAy - 1)
  const aylikHastaDegisim = gecenAyHasta.length > 0 ? Math.round((buAyHasta.length - gecenAyHasta.length) / gecenAyHasta.length * 100) : 0

  // Tahsilat
  const buAyTahsilat = tahsilatlar.filter(t => new Date(t.tarih).getMonth() === buAy)
  const buAyTahsilatTutar = buAyTahsilat.reduce((s,t)=>s+(Number(t.tutar)||0),0)
  const bugunTahsilat = tahsilatlar.filter(t=>t.tarih===bugun).reduce((s,t)=>s+(Number(t.tutar)||0),0)
  const gunlukHedefOran = hedefler.gunlukTahsilat > 0 ? Math.min(100, Math.round(bugunTahsilat/hedefler.gunlukTahsilat*100)) : 0
  const aylikHedefOran = hedefler.aylikTahsilat > 0 ? Math.min(100, Math.round(buAyTahsilatTutar/hedefler.aylikTahsilat*100)) : 0

  // Arama (Whatsapp/Telefon teklifleri)
  const buAyArama = teklifler.filter(t => {
    if (!t.created_at) return false
    const d = new Date(t.created_at)
    return d.getFullYear() === yil && d.getMonth() === buAy && ['Whatsapp','Telefon'].includes(t.iletim_turu)
  }).length
  const aramaHedefOran = hedefler.aylikArama > 0 ? Math.min(100, Math.round(buAyArama/hedefler.aylikArama*100)) : 0

  // Aylık seriler (yıl + geçen yıl karşılaştırma)
  const aylikCiroSeri = AYLAR.map((ay, i) => {
    const ciro = hastalar.filter(h=>new Date(h.tarih).getMonth()===i).reduce((s,h)=>s+(Number(h.ucret)||0),0)
    const gecen = hastalarGecen.filter(h=>new Date(h.tarih).getMonth()===i).reduce((s,h)=>s+(Number(h.ucret)||0),0)
    const tahsilat = tahsilatlar.filter(t=>new Date(t.tarih).getMonth()===i).reduce((s,t)=>s+(Number(t.tutar)||0),0)
    return { ay, ciro, gecen, tahsilat }
  })

  const aylikHastaSeri = AYLAR.map((ay, i) => {
    const sayi = hastalar.filter(h=>new Date(h.tarih).getMonth()===i).length
    const gecen = hastalarGecen.filter(h=>new Date(h.tarih).getMonth()===i).length
    return { ay, sayi, gecen }
  })

  // Günlük hasta (son 30 gün)
  const gunlukHasta: any[] = []
  for (let i=29; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i)
    const tarih = d.toISOString().slice(0,10)
    const sayi = hastalar.filter(h=>h.tarih===tarih).length
    const ciro = hastalar.filter(h=>h.tarih===tarih).reduce((s,h)=>s+(Number(h.ucret)||0),0)
    gunlukHasta.push({ gun: d.getDate()+'/'+(d.getMonth()+1), sayi, ciro })
  }

  // Tahsilat günlük (son 30 gün)
  const gunlukTahsilat: any[] = []
  for (let i=29; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i)
    const tarih = d.toISOString().slice(0,10)
    const tutar = tahsilatlar.filter(t=>t.tarih===tarih).reduce((s,t)=>s+(Number(t.tutar)||0),0)
    gunlukTahsilat.push({ gun: d.getDate()+'/'+(d.getMonth()+1), tutar, hedef: hedefler.gunlukTahsilat })
  }

  // Teklif durum / tür
  const teklifDurum = ['Beklemede','Görüşülüyor','Olumlu','Olumsuz'].map(d => ({
    name: d, value: teklifler.filter(t=>t.surec_durumu===d).length
  })).filter(d=>d.value>0)

  const teklifTur = ['ISG','Malzeme','Ölçüm','Tarama'].map(t => ({
    name: t, value: teklifler.filter(x=>(x.tur||'ISG')===t).length
  })).filter(t=>t.value>0)

  // Firma ciro top 8
  const firmaCiroMap: Record<string,number> = {}
  hastalar.forEach(h => { if (h.firma) firmaCiroMap[h.firma] = (firmaCiroMap[h.firma]||0)+(Number(h.ucret)||0) })
  const firmaCiro = Object.entries(firmaCiroMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([firma,tutar])=>({ firma:firma.slice(0,18), tutar }))

  // Personel görev
  const personelMap: Record<string,{toplam:number,tamamlandi:number}> = {}
  gorevler.forEach(g => {
    const ad = g.uzman||'Bilinmiyor'
    if (!personelMap[ad]) personelMap[ad] = { toplam:0, tamamlandi:0 }
    personelMap[ad].toplam++
    if (g.durum==='Tamamlandı') personelMap[ad].tamamlandi++
  })
  const personelGorev = Object.entries(personelMap).sort((a,b)=>b[1].toplam-a[1].toplam).slice(0,8).map(([ad,v])=>({ ad:ad.slice(0,12), ...v }))

  const kritikStok = malzemeler.filter(m=>m.kritik_stok>0&&m.stok<=m.kritik_stok)
  const taramaAsama = Object.entries(taramalar.reduce((acc:any,t)=>{ acc[t.asama]=(acc[t.asama]||0)+1; return acc },{})).map(([name,value])=>({ name, value }))

  const pct = (val:number,total:number) => total>0?Math.round(val/total*100):0
  const degisim = (yeni:number, eski:number) => {
    if (!eski) return null
    const d = Math.round((yeni-eski)/eski*100)
    return d
  }

  const SEKMELER = [
    { key:'genel', label:'Genel' },
    { key:'saglik', label:'Sağlık' },
    { key:'tahsilat', label:'Tahsilat' },
    { key:'satis', label:'Satış' },
    { key:'isg', label:'ISG' },
  ] as const

  if (yukleniyor) return (
    <div className="page-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <div style={{ textAlign:'center', color:'var(--text-faint)' }}>
        <Activity size={32} style={{ margin:'0 auto 12px', opacity:0.4 }}/>
        <div>Raporlar yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <div className="page-wrap">
      {/* BAŞLIK */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
        <div>
          <h1 className="page-title">Yönetim Raporları</h1>
          <p className="page-sub">Operasyonel analitik & hedef takibi</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={()=>setHedefDuzenle(!hedefDuzenle)}
            style={{ padding:'8px 14px', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit',
              background:hedefDuzenle?'var(--accent-soft)':'var(--surface-2)',
              border:`1px solid ${hedefDuzenle?'var(--accent)':'var(--border)'}`,
              color:hedefDuzenle?'var(--accent)':'var(--text-dim)' }}>
            {hedefDuzenle ? '✓ Kaydet' : '⚙ Hedefler'}
          </button>
          <button onClick={()=>setYil(y=>y-1)} style={navBtn}><ChevronLeft size={16}/></button>
          <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:17, minWidth:50, textAlign:'center' }}>{yil}</span>
          <button onClick={()=>setYil(y=>y+1)} style={navBtn}><ChevronRight size={16}/></button>
        </div>
      </div>

      {/* HEDEF DÜZENLEME */}
      {hedefDuzenle && (
        <div className="card" style={{ padding:20, marginBottom:20, borderColor:'var(--accent)' }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14, color:'var(--accent)' }}>Hedef Ayarları</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
            {[
              { key:'gunlukTahsilat', label:'Günlük Tahsilat Hedefi (₺)' },
              { key:'aylikTahsilat', label:'Aylık Tahsilat Hedefi (₺)' },
              { key:'aylikArama', label:'Aylık Arama Hedefi (adet)' },
              { key:'aylikHasta', label:'Aylık Hasta Hedefi (adet)' },
            ].map(h => (
              <div key={h.key}>
                <label style={{ display:'block', fontSize:11, color:'var(--text-dim)', marginBottom:6 }}>{h.label}</label>
                <input type="number" value={(hedefler as any)[h.key]}
                  onChange={e=>setHedefler(prev=>({...prev,[h.key]:Number(e.target.value)}))}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEKME NAVİGASYON */}
      <div style={{ display:'flex', gap:4, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
        {SEKMELER.map(s => (
          <button key={s.key} onClick={()=>setAktifSekme(s.key)}
            style={{ padding:'9px 18px', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
              background: aktifSekme===s.key?'var(--accent)':'var(--surface-2)',
              border:`1px solid ${aktifSekme===s.key?'var(--accent)':'var(--border)'}`,
              color: aktifSekme===s.key?'#fff':'var(--text-dim)', fontWeight:aktifSekme===s.key?600:400 }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── GENEL SEKMESİ ── */}
      {aktifSekme === 'genel' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* ÖZET KARTLAR */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            {[
              { label:'Toplam Ciro', val:tl(toplamCiro), alt:`Geçen yıl: ${tl(toplamCiroGecen)}`, deg:degisim(toplamCiro,toplamCiroGecen), renk:'var(--green)' },
              { label:'Toplam Tahsilat', val:tl(toplamTahsilat), alt:`Geçen yıl: ${tl(toplamTahsilatGecen)}`, deg:degisim(toplamTahsilat,toplamTahsilatGecen), renk:'var(--accent)' },
              { label:'Açık Bakiye', val:tl(acikBakiye), alt:`Vadesi geçen: ${tl(vadeGecen)}`, deg:null, renk:'var(--amber)' },
              { label:'Teklif Dönüşümü', val:`%${donusum}`, alt:`${teklifler.filter(t=>t.surec_durumu==='Olumlu').length}/${teklifler.length} teklif`, deg:null, renk:'var(--blue)' },
            ].map((k,i) => (
              <div key={i} className="card" style={{ padding:'16px 14px' }}>
                <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>{k.label}</div>
                <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:k.renk }}>{k.val}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                  <span style={{ fontSize:11, color:'var(--text-faint)' }}>{k.alt}</span>
                  {k.deg !== null && (
                    <span style={{ fontSize:11, fontWeight:600, color:k.deg!>=0?'var(--green)':'var(--red)' }}>
                      {k.deg!>=0?'▲':'▼'}{Math.abs(k.deg!)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* AYLIK CİRO vs TAHSİLAT */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <TrendingUp size={16} color="var(--green)"/> Aylık Ciro & Tahsilat — {yil} vs {yil-1}
            </div>
            <div style={{ height:220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aylikCiroSeri}>
                  <defs>
                    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.35}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity={0.35}/><stop offset="100%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9b9ba8" stopOpacity={0.2}/><stop offset="100%" stopColor="#9b9ba8" stopOpacity={0}/></linearGradient>
                  </defs>
                  <XAxis dataKey="ay" stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#5d5d6b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?`${v/1000}k`:v} width={40}/>
                  <Tooltip contentStyle={TT_STYLE} formatter={(v:any,n:any)=>[tl(v), n==='ciro'?`${yil} Ciro`:n==='tahsilat'?`${yil} Tahsilat`:`${yil-1} Ciro`]}/>
                  <Legend formatter={v=>v==='ciro'?`${yil} Ciro`:v==='tahsilat'?`${yil} Tahsilat`:`${yil-1} Ciro`} wrapperStyle={{ fontSize:11 }}/>
                  <Area type="monotone" dataKey="gecen" stroke="#9b9ba8" strokeWidth={1.5} fill="url(#gG)" strokeDasharray="4 2"/>
                  <Area type="monotone" dataKey="ciro" stroke="#6366f1" strokeWidth={2} fill="url(#gC)"/>
                  <Area type="monotone" dataKey="tahsilat" stroke="#34d399" strokeWidth={2} fill="url(#gT)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KRİTİK STOK */}
          {kritikStok.length > 0 && (
            <div className="card" style={{ padding:20, borderColor:'rgba(251,191,36,0.3)' }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <AlertTriangle size={16} color="var(--amber)"/> Kritik Stok ({kritikStok.length} kalem)
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {kritikStok.map((m:any) => (
                  <div key={m.ad} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'var(--amber-soft)', borderRadius:9 }}>
                    <div>
                      <div style={{ fontWeight:500, fontSize:13 }}>{m.ad}</div>
                      <div style={{ fontSize:11, color:'var(--text-faint)' }}>{m.kategori}</div>
                    </div>
                    <div style={{ textAlign:'right', fontSize:13 }}>
                      <div style={{ color:'var(--red)', fontWeight:700 }}>Stok: {m.stok}</div>
                      <div style={{ color:'var(--text-faint)' }}>Min: {m.kritik_stok}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SAĞLIK SEKMESİ ── */}
      {aktifSekme === 'saglik' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* SAĞLIK ÖZET */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            {[
              { label:'Bu Ay Hasta', val:buAyHasta.length, alt:`Hedef: ${hedefler.aylikHasta}`, oran:pct(buAyHasta.length,hedefler.aylikHasta), renk:'var(--green)' },
              { label:'Bugün Hasta', val:bugunHasta.length, alt:`Bu ay: ${buAyHasta.length}`, oran:null, renk:'var(--accent)' },
              { label:'Bu Ay Ciro', val:tl(buAyHasta.reduce((s,h)=>s+(Number(h.ucret)||0),0)), alt:`Geçen ay: ${tl(gecenAyHasta.reduce((s,h)=>s+(Number(h.ucret)||0),0))}`, oran:null, renk:'var(--amber)' },
              { label:'Yıl Değişimi', val:`${aylikHastaDegisim>=0?'+':''}${aylikHastaDegisim}%`, alt:`${yil} vs ${yil-1}`, oran:null, renk:aylikHastaDegisim>=0?'var(--green)':'var(--red)' },
            ].map((k,i) => (
              <div key={i} className="card" style={{ padding:'16px 14px' }}>
                <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>{k.label}</div>
                <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:k.renk }}>{k.val}</div>
                <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:6 }}>{k.alt}</div>
                {k.oran !== null && (
                  <div style={{ marginTop:8, height:4, background:'var(--surface-2)', borderRadius:4 }}>
                    <div style={{ height:4, background:k.renk, borderRadius:4, width:`${Math.min(100,k.oran)}%`, transition:'width .3s' }}/>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* GÜNLÜK HASTA (Son 30 gün) */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <HeartPulse size={16} color="var(--green)"/> Günlük Hasta & Ciro (Son 30 Gün)
            </div>
            <div style={{ height:200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gunlukHasta}>
                  <XAxis dataKey="gun" stroke="#5d5d6b" fontSize={10} tickLine={false} axisLine={false} interval={4}/>
                  <YAxis stroke="#5d5d6b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} width={25}/>
                  <Tooltip contentStyle={TT_STYLE} formatter={(v:any,n:any)=>[n==='ciro'?tl(v):v, n==='sayi'?'Hasta':'Ciro']} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="sayi" name="sayi" radius={[4,4,0,0]} barSize={14} fill="#6366f1"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AYLIK HASTA — YIL KARŞILAŞTIRMA */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <HeartPulse size={16} color="var(--accent)"/> Aylık Hasta — {yil} vs {yil-1}
            </div>
            <div style={{ height:200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aylikHastaSeri}>
                  <XAxis dataKey="ay" stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#5d5d6b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} width={25}/>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <Tooltip contentStyle={TT_STYLE} formatter={(v:any,n:any)=>[v, n==='sayi'?`${yil}`:`${yil-1}`]}/>
                  <Legend formatter={v=>v==='sayi'?`${yil}`:`${yil-1}`} wrapperStyle={{ fontSize:11 }}/>
                  <Line type="monotone" dataKey="sayi" stroke="#6366f1" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="gecen" stroke="#9b9ba8" strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FİRMA CİRO */}
          {firmaCiro.length > 0 && (
            <div className="card" style={{ padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Firma Bazlı Ciro (Top 8)</div>
              <div style={{ height:220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={firmaCiro} layout="vertical" margin={{ left:0, right:10 }}>
                    <XAxis type="number" hide/>
                    <YAxis type="category" dataKey="firma" width={110} stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false}/>
                    <Tooltip contentStyle={TT_STYLE} formatter={(v:any)=>[tl(v),'Ciro']} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                    <Bar dataKey="tutar" radius={[0,6,6,0]} barSize={16} fill="#6366f1"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAHSİLAT SEKMESİ ── */}
      {aktifSekme === 'tahsilat' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* HEDEF KARTLARI */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            <div className="card" style={{ padding:'16px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>Bugün Tahsilat</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:'var(--green)' }}>{tl(bugunTahsilat)}</div>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>Hedef: {tl(hedefler.gunlukTahsilat)}</div>
              <div style={{ marginTop:10, height:6, background:'var(--surface-2)', borderRadius:4 }}>
                <div style={{ height:6, background:'var(--green)', borderRadius:4, width:`${gunlukHedefOran}%`, transition:'width .3s' }}/>
              </div>
              <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>%{gunlukHedefOran} tamamlandı</div>
            </div>
            <div className="card" style={{ padding:'16px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>Bu Ay Tahsilat</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:'var(--accent)' }}>{tl(buAyTahsilatTutar)}</div>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>Hedef: {tl(hedefler.aylikTahsilat)}</div>
              <div style={{ marginTop:10, height:6, background:'var(--surface-2)', borderRadius:4 }}>
                <div style={{ height:6, background:'var(--accent)', borderRadius:4, width:`${aylikHedefOran}%`, transition:'width .3s' }}/>
              </div>
              <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>%{aylikHedefOran} tamamlandı</div>
            </div>
            <div className="card" style={{ padding:'16px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>Açık Bakiye</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:'var(--amber)' }}>{tl(acikBakiye)}</div>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>Yıllık tahsilat: {tl(toplamTahsilat)}</div>
            </div>
            <div className="card" style={{ padding:'16px 14px', borderColor:'rgba(248,113,113,0.25)' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>Vadesi Geçen</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:'var(--red)' }}>{tl(vadeGecen)}</div>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>{cariler.filter(c=>Number(c.vadesi_gecen_tutar)>0).length} cari</div>
            </div>
          </div>

          {/* GÜNLÜK TAHSİLAT vs HEDEF */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <Wallet size={16} color="var(--accent)"/> Günlük Tahsilat vs Hedef (Son 30 Gün)
            </div>
            <div style={{ height:200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gunlukTahsilat}>
                  <XAxis dataKey="gun" stroke="#5d5d6b" fontSize={10} tickLine={false} axisLine={false} interval={4}/>
                  <YAxis stroke="#5d5d6b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?`${v/1000}k`:v} width={35}/>
                  <Tooltip contentStyle={TT_STYLE} formatter={(v:any,n:any)=>[tl(v), n==='tutar'?'Tahsilat':'Hedef']} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                  <Legend formatter={v=>v==='tutar'?'Tahsilat':'Günlük Hedef'} wrapperStyle={{ fontSize:11 }}/>
                  <Bar dataKey="tutar" name="tutar" radius={[4,4,0,0]} barSize={10} fill="#6366f1"/>
                  <Line type="monotone" dataKey="hedef" name="hedef" stroke="#fbbf24" strokeWidth={1.5} dot={false} strokeDasharray="3 3"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AYLIK TAHSİLAT */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Aylık Tahsilat — {yil} vs {yil-1}</div>
            <div style={{ height:200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aylikCiroSeri}>
                  <XAxis dataKey="ay" stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#5d5d6b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?`${v/1000}k`:v} width={35}/>
                  <Tooltip contentStyle={TT_STYLE} formatter={(v:any)=>[tl(v),'Tahsilat']} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="tahsilat" radius={[4,4,0,0]} barSize={20} fill="#34d399"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── SATIŞ SEKMESİ ── */}
      {aktifSekme === 'satis' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* ARAMA HEDEFİ */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            <div className="card" style={{ padding:'16px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                <Phone size={12}/> Bu Ay Arama
              </div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:'var(--blue)' }}>{buAyArama}</div>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>Hedef: {hedefler.aylikArama}</div>
              <div style={{ marginTop:10, height:6, background:'var(--surface-2)', borderRadius:4 }}>
                <div style={{ height:6, background:'var(--blue)', borderRadius:4, width:`${aramaHedefOran}%`, transition:'width .3s' }}/>
              </div>
              <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>%{aramaHedefOran} tamamlandı</div>
            </div>
            <div className="card" style={{ padding:'16px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>Teklif Dönüşümü</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:'var(--green)' }}>%{donusum}</div>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:4 }}>
                {teklifler.filter(t=>t.surec_durumu==='Olumlu').length} / {teklifler.length} teklif
              </div>
            </div>
          </div>

          {/* TEKLİF DURUM */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <Target size={16} color="var(--amber)"/> Teklif Durumu
            </div>
            {teklifDurum.length === 0
              ? <div style={{ textAlign:'center', color:'var(--text-faint)', padding:32 }}>Teklif yok</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {teklifDurum.map((d,i) => (
                    <div key={d.name} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:10, height:10, borderRadius:3, background:RENKLER[i%RENKLER.length], flexShrink:0 }}/>
                      <span style={{ flex:1, fontSize:14, color:'var(--text-dim)' }}>{d.name}</span>
                      <div style={{ flex:2, height:8, background:'var(--surface-2)', borderRadius:4 }}>
                        <div style={{ height:8, background:RENKLER[i%RENKLER.length], borderRadius:4, width:`${pct(d.value,teklifler.length)}%` }}/>
                      </div>
                      <span style={{ fontWeight:700, fontSize:14, minWidth:30, textAlign:'right' }}>{d.value}</span>
                      <span style={{ fontSize:11, color:'var(--text-faint)', minWidth:35 }}>%{pct(d.value,teklifler.length)}</span>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* TEKLİF TÜR */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Teklif Türü Dağılımı</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {teklifTur.map((t,i) => (
                <div key={t.name} style={{ background:'var(--surface-2)', borderRadius:12, padding:'14px 16px', border:`1px solid ${RENKLER[i%RENKLER.length]}33`, textAlign:'center' }}>
                  <div style={{ fontSize:24, fontWeight:700, fontFamily:'Sora,sans-serif', color:RENKLER[i%RENKLER.length] }}>{t.value}</div>
                  <div style={{ fontSize:13, color:'var(--text-dim)', marginTop:4 }}>{t.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>%{pct(t.value,teklifler.length)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ISG SEKMESİ ── */}
      {aktifSekme === 'isg' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            <div className="card" style={{ padding:'16px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>Yıllık Ziyaret</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:24, fontWeight:700, color:'var(--blue)' }}>{ziyaretler.length}</div>
              <div style={{ display:'flex', gap:12, marginTop:8, fontSize:12 }}>
                {['İGU','İH','DSP'].map(t => (
                  <span key={t} style={{ color:'var(--text-dim)' }}>{t}: <strong>{ziyaretler.filter(z=>z.tur===t).length}</strong></span>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding:'16px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text-faint)', marginBottom:8 }}>Yıllık Görev</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:24, fontWeight:700, color:'var(--accent)' }}>{gorevler.length}</div>
              <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:8 }}>
                Tamamlanan: <strong>{gorevler.filter(g=>g.durum==='Tamamlandı').length}</strong>
                {' · '}%{pct(gorevler.filter(g=>g.durum==='Tamamlandı').length, gorevler.length)}
              </div>
            </div>
          </div>

          {/* AYLIK ZİYARET */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <MapPin size={16} color="var(--blue)"/> Aylık Ziyaret Sayısı ({yil})
            </div>
            <div style={{ height:180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={AYLAR.map((ay,i)=>({ ay, ziyaret: ziyaretler.filter(z=>new Date(z.tarih).getMonth()===i).length }))}>
                  <XAxis dataKey="ay" stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#5d5d6b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} width={25}/>
                  <Tooltip contentStyle={TT_STYLE} formatter={(v:any)=>[v,'Ziyaret']} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="ziyaret" radius={[5,5,0,0]} barSize={22} fill="#60a5fa"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PERSONEL GÖREV DAĞILIMI */}
          {personelGorev.length > 0 && (
            <div className="card" style={{ padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <Users size={16} color="var(--accent)"/> Personel Görev Dağılımı
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {personelGorev.map(p => (
                  <div key={p.ad} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
                      {p.ad.charAt(0)}
                    </div>
                    <span style={{ flex:1, fontSize:13 }}>{p.ad}</span>
                    <div style={{ flex:2, height:6, background:'var(--surface-2)', borderRadius:4 }}>
                      <div style={{ height:6, background:'var(--accent)', borderRadius:4, width:`${pct(p.tamamlandi,p.toplam)}%` }}/>
                    </div>
                    <span style={{ fontSize:12, color:'var(--text-dim)', minWidth:60, textAlign:'right' }}>{p.tamamlandi}/{p.toplam}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TARAMA AŞAMA */}
          {taramaAsama.length > 0 && (
            <div className="card" style={{ padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <Activity size={16} color="var(--green)"/> Tarama Operasyon Aşamaları
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {taramaAsama.map((t:any,i) => (
                  <div key={t.name} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:RENKLER[i%RENKLER.length], flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, color:'var(--text-dim)' }}>{t.name}</span>
                    <span style={{ fontWeight:700, fontSize:14 }}>{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const navBtn: any = { background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'7px', cursor:'pointer', display:'flex', alignItems:'center' }
