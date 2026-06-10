'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts'
import { TrendingUp, Target, MapPin, Activity, Wallet, Package, Users, ChevronLeft, ChevronRight } from 'lucide-react'

const RENKLER = ['#6366f1','#34d399','#fbbf24','#f87171','#60a5fa','#a78bfa','#f472b6','#fb923c']
const tl = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits:0 }).format(n) + ' ₺'

export default function Raporlar() {
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yil, setYil] = useState(new Date().getFullYear())

  // Veri state'leri
  const [teklifDurum, setTeklifDurum] = useState<any[]>([])
  const [teklifTur, setTeklifTur] = useState<any[]>([])
  const [aylikCiro, setAylikCiro] = useState<any[]>([])
  const [aylikTahsilat, setAylikTahsilat] = useState<any[]>([])
  const [firmaCiro, setFirmaCiro] = useState<any[]>([])
  const [ziyaretAylik, setZiyaretAylik] = useState<any[]>([])
  const [taramaAsama, setTaramaAsama] = useState<any[]>([])
  const [personelGorev, setPersonelGorev] = useState<any[]>([])
  const [kritikStok, setKritikStok] = useState<any[]>([])
  const [ozet, setOzet] = useState<any>({})

  const sb = createClient()

  useEffect(() => { yukle() }, [yil])

  async function yukle() {
    setYukleniyor(true)
    const yilBas = `${yil}-01-01`
    const yilBit = `${yil}-12-31`

    const [teklifRes, hastaRes, tahsilatRes, ziyaretRes, taramaRes, gorevRes, malzemeRes, cariRes] = await Promise.all([
      sb.from('teklifler').select('surec_durumu, tur, created_at'),
      sb.from('hasta_kayitlari').select('ucret, tarih, firma').gte('tarih', yilBas).lte('tarih', yilBit),
      sb.from('tahsilatlar').select('tutar, tarih').gte('tarih', yilBas).lte('tarih', yilBit),
      sb.from('ziyaretler').select('tarih, tur').gte('tarih', yilBas).lte('tarih', yilBit),
      sb.from('tarama_operasyonlari').select('asama, tutar'),
      sb.from('gorevler').select('uzman, durum, tarih').gte('tarih', yilBas).lte('tarih', yilBit),
      sb.from('malzemeler').select('ad, stok, kritik_stok, kategori'),
      sb.from('cariler').select('acik_bakiye, vadesi_gecen_tutar'),
    ])

    const teklifler = teklifRes.data || []
    const hastalar = hastaRes.data || []
    const tahsilatlar = tahsilatRes.data || []
    const ziyaretler = ziyaretRes.data || []
    const taramalar = taramaRes.data || []
    const gorevler = gorevRes.data || []
    const malzemeler = malzemeRes.data || []
    const cariler = cariRes.data || []

    // 1. Teklif durum dağılımı
    const durumlar: Record<string,number> = {}
    teklifler.forEach(t => { durumlar[t.surec_durumu] = (durumlar[t.surec_durumu]||0) + 1 })
    setTeklifDurum(Object.entries(durumlar).map(([name, value]) => ({ name, value })))

    // 2. Teklif tür dağılımı
    const turler: Record<string,number> = {}
    teklifler.forEach(t => { turler[t.tur||'ISG'] = (turler[t.tur||'ISG']||0) + 1 })
    setTeklifTur(Object.entries(turler).map(([name, value]) => ({ name, value })))

    // 3. Aylık ciro vs tahsilat
    const AYLAR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
    const cirolar = Array(12).fill(0)
    const tahsilatArr = Array(12).fill(0)
    hastalar.forEach((h:any) => { const ay = new Date(h.tarih).getMonth(); cirolar[ay] += Number(h.ucret)||0 })
    tahsilatlar.forEach((t:any) => { const ay = new Date(t.tarih).getMonth(); tahsilatArr[ay] += Number(t.tutar)||0 })
    setAylikCiro(AYLAR.map((ay, i) => ({ ay, ciro: cirolar[i], tahsilat: tahsilatArr[i] })))
    setAylikTahsilat(AYLAR.map((ay, i) => ({ ay, tahsilat: tahsilatArr[i] })))

    // 4. Firma bazlı ciro (top 8)
    const firmaCiroMap: Record<string,number> = {}
    hastalar.forEach((h:any) => { if (h.firma) firmaCiroMap[h.firma] = (firmaCiroMap[h.firma]||0) + (Number(h.ucret)||0) })
    setFirmaCiro(Object.entries(firmaCiroMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([firma, tutar]) => ({ firma: firma.slice(0,20), tutar })))

    // 5. Aylık ziyaret sayısı
    const ziyaretAyArr = Array(12).fill(0)
    ziyaretler.forEach((z:any) => { const ay = new Date(z.tarih).getMonth(); ziyaretAyArr[ay]++ })
    setZiyaretAylik(AYLAR.map((ay, i) => ({ ay, ziyaret: ziyaretAyArr[i] })))

    // 6. Tarama aşama dağılımı
    const asamaMap: Record<string,number> = {}
    taramalar.forEach((t:any) => { asamaMap[t.asama] = (asamaMap[t.asama]||0) + 1 })
    setTaramaAsama(Object.entries(asamaMap).map(([name, value]) => ({ name, value })))

    // 7. Personel görev dağılımı
    const personelMap: Record<string,{toplam:number,tamamlandi:number}> = {}
    gorevler.forEach((g:any) => {
      const ad = g.uzman || 'Bilinmiyor'
      if (!personelMap[ad]) personelMap[ad] = { toplam:0, tamamlandi:0 }
      personelMap[ad].toplam++
      if (g.durum === 'Tamamlandı') personelMap[ad].tamamlandi++
    })
    setPersonelGorev(Object.entries(personelMap).sort((a,b)=>b[1].toplam-a[1].toplam).slice(0,8).map(([ad,v]) => ({ ad: ad.slice(0,14), ...v })))

    // 8. Kritik stok
    setKritikStok(malzemeler.filter((m:any) => m.kritik_stok > 0 && m.stok <= m.kritik_stok))

    // 9. Özet
    const toplamCiro = hastalar.reduce((s:number,h:any)=>s+(Number(h.ucret)||0),0)
    const toplamTahsilat = tahsilatlar.reduce((s:number,t:any)=>s+(Number(t.tutar)||0),0)
    const acikBakiye = cariler.reduce((s:number,c:any)=>s+(Number(c.acik_bakiye)||0),0)
    const vadeGecen = cariler.reduce((s:number,c:any)=>s+(Number(c.vadesi_gecen_tutar)||0),0)
    const donusum = teklifler.length > 0 ? Math.round(teklifler.filter(t=>t.surec_durumu==='Olumlu').length / teklifler.length * 100) : 0
    setOzet({ toplamCiro, toplamTahsilat, acikBakiye, vadeGecen, donusum, toplamTeklif: teklifler.length, toplamZiyaret: ziyaretler.length, toplamHasta: hastalar.length })

    setYukleniyor(false)
  }

  if (yukleniyor) return <div className="page-wrap"><div style={{ textAlign:'center', padding:80, color:'var(--text-faint)' }}>Raporlar yükleniyor...</div></div>

  return (
    <div className="page-wrap">
      {/* BAŞLIK */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:28 }}>
        <div>
          <h1 className="page-title">Yönetim Raporları</h1>
          <p className="page-sub">Tüm operasyonların analitik özeti</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={()=>setYil(y=>y-1)} style={navBtn}><ChevronLeft size={18}/></button>
          <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, minWidth:60, textAlign:'center' }}>{yil}</span>
          <button onClick={()=>setYil(y=>y+1)} style={navBtn}><ChevronRight size={18}/></button>
        </div>
      </div>

      {/* ÖZET KARTLAR */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        {[
          { label:'Toplam Ciro', val:tl(ozet.toplamCiro), icon:TrendingUp, renk:'var(--green)', soft:'var(--green-soft)' },
          { label:'Toplam Tahsilat', val:tl(ozet.toplamTahsilat), icon:Wallet, renk:'var(--accent)', soft:'var(--accent-soft)' },
          { label:'Açık Bakiye', val:tl(ozet.acikBakiye), icon:Wallet, renk:'var(--amber)', soft:'var(--amber-soft)' },
          { label:'Teklif Dönüşümü', val:`%${ozet.donusum}`, icon:Target, renk:'var(--blue)', soft:'var(--blue-soft)' },
          { label:'Toplam Hasta', val:ozet.toplamHasta, icon:Activity, renk:'var(--green)', soft:'var(--green-soft)' },
          { label:'Toplam Ziyaret', val:ozet.toplamZiyaret, icon:MapPin, renk:'var(--blue)', soft:'var(--blue-soft)' },
          { label:'Toplam Teklif', val:ozet.toplamTeklif, icon:Target, renk:'var(--amber)', soft:'var(--amber-soft)' },
          { label:'Vadesi Geçen', val:tl(ozet.vadeGecen), icon:Wallet, renk:'var(--red)', soft:'var(--red-soft)' },
        ].map((k,i) => {
          const Icon = k.icon
          return (
            <div key={i} className="card" style={{ padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:k.soft, display:'flex', alignItems:'center', justifyContent:'center', color:k.renk, flexShrink:0 }}>
                  <Icon size={17}/>
                </div>
                <span style={{ fontSize:12, color:'var(--text-faint)' }}>{k.label}</span>
              </div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700, color:k.renk }}>{k.val}</div>
            </div>
          )
        })}
      </div>

      {/* AYLIK CİRO vs TAHSİLAT */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
          <TrendingUp size={18} color="var(--green)"/> Aylık Ciro & Tahsilat ({yil})
        </h3>
        <div style={{ height:260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={aylikCiro}>
              <defs>
                <linearGradient id="gCiro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gTahsilat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="ay" stroke="#5d5d6b" fontSize={12} tickLine={false} axisLine={false}/>
              <YAxis stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v)=>v>=1000?`${v/1000}k`:v}/>
              <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:13 }} formatter={(v:any,n:any)=>[tl(v), n==='ciro'?'Ciro':'Tahsilat']}/>
              <Legend formatter={(v)=>v==='ciro'?'Ciro':'Tahsilat'}/>
              <Area type="monotone" dataKey="ciro" stroke="#6366f1" strokeWidth={2} fill="url(#gCiro)"/>
              <Area type="monotone" dataKey="tahsilat" stroke="#34d399" strokeWidth={2} fill="url(#gTahsilat)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2 KOLON GRİD */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

        {/* FİRMA BAZLI CİRO */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <TrendingUp size={16} color="var(--accent)"/> Firma Bazlı Ciro (Top 8)
          </h3>
          <div style={{ height:240 }}>
            {firmaCiro.length === 0
              ? <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-faint)', fontSize:14 }}>Veri yok</div>
              : <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={firmaCiro} layout="vertical" margin={{ left:0, right:10 }}>
                    <XAxis type="number" hide/>
                    <YAxis type="category" dataKey="firma" width={120} stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false}/>
                    <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:13 }} formatter={(v:any)=>[tl(v),'Ciro']} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                    <Bar dataKey="tutar" radius={[0,6,6,0]} barSize={18} fill="#6366f1"/>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        {/* TEKLİF DURUM DAĞILIMI */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <Target size={16} color="var(--amber)"/> Teklif Durum Dağılımı
          </h3>
          <div style={{ height:240, display:'flex', alignItems:'center', gap:20 }}>
            {teklifDurum.length === 0
              ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-faint)', fontSize:14 }}>Veri yok</div>
              : <>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={teklifDurum} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {teklifDurum.map((_,i) => <Cell key={i} fill={RENKLER[i % RENKLER.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:13 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                    {teklifDurum.map((d,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                        <div style={{ width:10, height:10, borderRadius:3, background:RENKLER[i%RENKLER.length], flexShrink:0 }}/>
                        <span style={{ color:'var(--text-dim)', flex:1 }}>{d.name}</span>
                        <span style={{ fontWeight:600 }}>{d.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:4, paddingTop:8, borderTop:'1px solid var(--border)', fontSize:13 }}>
                      <span style={{ color:'var(--text-faint)' }}>Dönüşüm: </span>
                      <span style={{ fontWeight:700, color:'var(--green)' }}>%{ozet.donusum}</span>
                    </div>
                  </div>
                </>
            }
          </div>
        </div>

        {/* AYLIK ZİYARET */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <MapPin size={16} color="var(--blue)"/> Aylık Ziyaret Sayısı ({yil})
          </h3>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ziyaretAylik}>
                <XAxis dataKey="ay" stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:13 }} formatter={(v:any)=>[v,'Ziyaret']} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                <Bar dataKey="ziyaret" radius={[6,6,0,0]} barSize={24} fill="#60a5fa"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TARAMA OPERASYON AŞAMA */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <Activity size={16} color="var(--green)"/> Tarama Operasyon Aşamaları
          </h3>
          <div style={{ height:200, display:'flex', alignItems:'center', gap:20 }}>
            {taramaAsama.length === 0
              ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-faint)', fontSize:14 }}>Veri yok</div>
              : <>
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie data={taramaAsama} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {taramaAsama.map((_,i) => <Cell key={i} fill={RENKLER[i%RENKLER.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:13 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    {taramaAsama.map((d,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:RENKLER[i%RENKLER.length], flexShrink:0 }}/>
                        <span style={{ color:'var(--text-dim)', flex:1 }}>{d.name}</span>
                        <span style={{ fontWeight:600 }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
            }
          </div>
        </div>
      </div>

      {/* PERSONEL GÖREV DAĞILIMI */}
      {personelGorev.length > 0 && (
        <div className="card" style={{ padding:24, marginBottom:20 }}>
          <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <Users size={16} color="var(--accent)"/> Personel Görev Dağılımı ({yil})
          </h3>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personelGorev}>
                <XAxis dataKey="ad" stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="#5d5d6b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:13 }} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                <Legend/>
                <Bar dataKey="toplam" name="Toplam Görev" radius={[4,4,0,0]} barSize={20} fill="#6366f1"/>
                <Bar dataKey="tamamlandi" name="Tamamlandı" radius={[4,4,0,0]} barSize={20} fill="#34d399"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* KRİTİK STOK */}
      {kritikStok.length > 0 && (
        <div className="card" style={{ padding:24, marginBottom:20, borderColor:'rgba(251,191,36,0.3)' }}>
          <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <Package size={16} color="var(--amber)"/> Kritik Stok Uyarısı
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
            {kritikStok.map((m:any) => (
              <div key={m.ad} style={{ background:'var(--amber-soft)', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(251,191,36,0.2)' }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{m.ad}</div>
                <div style={{ fontSize:12, color:'var(--text-dim)' }}>{m.kategori}</div>
                <div style={{ marginTop:6, display:'flex', gap:12, fontSize:13 }}>
                  <span style={{ color:'var(--red)', fontWeight:700 }}>Stok: {m.stok}</span>
                  <span style={{ color:'var(--text-faint)' }}>/ Min: {m.kritik_stok}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEKLİF TÜR DAĞILIMI */}
      {teklifTur.length > 0 && (
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <Target size={16} color="var(--accent)"/> Teklif Türü Dağılımı
          </h3>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {teklifTur.map((t,i) => (
              <div key={t.name} style={{ flex:1, minWidth:120, background:'var(--surface-2)', borderRadius:12, padding:'16px 18px', textAlign:'center', border:`1px solid ${RENKLER[i%RENKLER.length]}33` }}>
                <div style={{ fontSize:28, fontWeight:700, fontFamily:'Sora,sans-serif', color:RENKLER[i%RENKLER.length] }}>{t.value}</div>
                <div style={{ fontSize:13, color:'var(--text-dim)', marginTop:4 }}>{t.name}</div>
                <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>
                  %{ozet.toplamTeklif > 0 ? Math.round(t.value/ozet.toplamTeklif*100) : 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn: any = { background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'8px', cursor:'pointer', display:'flex', alignItems:'center' }
