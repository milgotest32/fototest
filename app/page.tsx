'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Building2, HeartPulse, FileText, Wallet, TrendingUp, AlertTriangle, ArrowUpRight, MapPin, Bell, X, CalendarDays, ClipboardList, FolderArchive } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, Cell } from 'recharts'

// Rollere göre hangi kartlar görünür
const ROL_KARTLAR: Record<string, string[]> = {
  yonetici:  ['firma','hasta','teklif','ciroKart','ziyaret','ciro','grafik','uyari','gorev','saglikRaporu'],
  muhasebe:  ['ciroKart','ziyaret','uyari','saglikRaporu'],
  operasyon: ['firma','ziyaret','gorev','saglikRaporu'],
  hekim:     ['hasta','saglikRaporu'],
  satis:     ['firma','teklif'],
  saha:      ['firma','ziyaret'],
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>({ firma:0, hasta:0, teklif:0, acikBakiye:0, vadeGecen:0, aylikCiro:0, ziyaret:0, gorev:0 })
  const [ziyaretStat, setZiyaretStat] = useState<any>({ yapilan:0, bekleyen:0 })
  const [acikGorevler, setAcikGorevler] = useState<any[]>([])
  const [saglikStat, setSaglikStat] = useState<any>({ bugun:0, hafta:0, ay:0, yil:0, ciroBugun:0, ciroAy:0 })
  const [bekleyenTeklif, setBekleyenTeklif] = useState<number>(0)
  const [ciroData, setCiroData] = useState<any[]>([])
  const [vadeData, setVadeData] = useState<any[]>([])
  const [uyarilar, setUyarilar] = useState<any[]>([])
  const [aktiviteler, setAktiviteler] = useState<any[]>([])
  const [rol, setRol] = useState<string>('operasyon')
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    const sb = createClient()
    async function yukle() {
      // Önce rolü al
      const { data: { user } } = await sb.auth.getUser()
      let kulRol = 'operasyon'
      if (user) {
        const { data: p } = await sb.from('personeller').select('rol').eq('id', user.id).single()
        kulRol = p?.rol || 'operasyon'
        setRol(kulRol)
      }

      const izin = ROL_KARTLAR[kulRol] || ROL_KARTLAR.operasyon
      const buAy = new Date().toISOString().slice(0,7)
      const ayBas = buAy + '-01'
      const ayBit = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).toISOString().slice(0,10)

      const queries: any[] = []
      if (izin.includes('firma')) queries.push(sb.from('firmalar').select('id', { count:'exact', head:true }).eq('aktif', true))
      else queries.push(Promise.resolve({ count: 0 }))

      if (izin.includes('hasta') || izin.includes('ciro')) queries.push(sb.from('hasta_kayitlari').select('ucret, tarih').gte('tarih', ayBas).lte('tarih', ayBit))
      else queries.push(Promise.resolve({ data: [] }))

      if (izin.includes('teklif')) queries.push(sb.from('teklifler').select('id, surec_durumu'))
      else queries.push(Promise.resolve({ data: [] }))

      if (izin.includes('acikBakiye') || izin.includes('uyari')) queries.push(sb.from('cariler').select('unvan, acik_bakiye, vadesi_gecen_tutar, gecen_gun_sayisi'))
      else queries.push(Promise.resolve({ data: [] }))

      if (izin.includes('ziyaret')) queries.push(sb.from('ziyaretler').select('id', { count:'exact', head:true }).gte('tarih', ayBas).lte('tarih', ayBit))
      else queries.push(Promise.resolve({ count: 0 }))

      if (izin.includes('uyari')) queries.push(sb.from('borcuyarilari').select('*').eq('goruldu', false).order('gecen_gun_sayisi', { ascending:false }).limit(10))
      else queries.push(Promise.resolve({ data: [] }))

      if (izin.includes('gorev')) queries.push(sb.from('gorevler').select('id,konu,firma_adi,durum,son_tarih,uzman,tarih').in('durum',['Planlandı','Bekliyor']).order('son_tarih', { ascending:true }).limit(5))
      else queries.push(Promise.resolve({ data: [] }))

      const [firma, hasta, teklif, cariler, ziyaret, uyari, gorev] = await Promise.all(queries)

      const hastaList = hasta.data || []
      const aylikCiro = hastaList.reduce((s:number, h:any) => s + (Number(h.ucret)||0), 0)
      const acikBakiye = (cariler.data||[]).reduce((s:number, c:any) => s + (Number(c.acik_bakiye)||0), 0)
      const vadeGecen = (cariler.data||[]).reduce((s:number, c:any) => s + (Number(c.vadesi_gecen_tutar)||0), 0)

      // Hasta toplam sayısı ayrı count
      let hastaCount = 0
      if (izin.includes('hasta')) {
        const { count } = await sb.from('hasta_kayitlari').select('id', { count:'exact', head:true })
        hastaCount = count || 0
      }

      setStats({ firma: firma.count||0, hasta: hastaCount, teklif: (teklif.data||[]).filter((t:any) => t.surec_durumu==='Beklemede').length, acikBakiye, vadeGecen, aylikCiro, ziyaret: ziyaret.count||0, gorev: (gorev.data||[]).length })
      setAcikGorevler(gorev.data || [])

      // Ziyaret bekleyen hesaplama
      if (izin.includes('ziyaret')) {
        const simdi = new Date()
        const buAyIdx = simdi.getMonth()
        const buYil = simdi.getFullYear()
        const { data: firmlarZiyaret } = await sb.from('firmalar')
          .select('id, ih_periyot, aylik_ziyaretler')
          .eq('aktif', true)
          .not('ih_periyot', 'is', null)
        const fList = (firmlarZiyaret || []).filter((f:any) => f.ih_periyot !== 'GİDİLMİYOR')
        const ayKey = `${buYil}-${String(buAyIdx+1).padStart(2,'0')}`
        let bekleyen = 0
        fList.forEach((f:any) => {
          const z = (f.aylik_ziyaretler||{})[ayKey]
          const periyot = parseFloat(f.ih_periyot||'0')
          let iguGerekir = periyot <= 0.5 || (periyot <= 1.0 && buAyIdx%2===0) || (periyot <= 2.0 && buAyIdx%4===0)
          const iguGidildi = z?.igu?.gidildi || (z?.tur === 'İGU' && z?.tarih)
          const ihGidildi = z?.ih?.gidildi || (z?.tur === 'İH' && z?.tarih)
          if (iguGerekir && !iguGidildi) bekleyen++
          if (iguGerekir && !ihGidildi) bekleyen++
        })
        setZiyaretStat({ yapilan: ziyaret.count||0, bekleyen })
      }

      // Sağlık Raporu istatistikleri (tarama_operasyonlari)
      if (izin.includes('saglikRaporu')) {
        const bugunStr = new Date().toISOString().slice(0,10)
        const haftaBas = (() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()+1); return d.toISOString().slice(0,10) })()
        const { data: taramalar } = await sb.from('tarama_operasyonlari').select('tarih, planlanan_tarih, tutar')
        const tList = taramalar || []
        setSaglikStat({
          bugun: tList.filter((t:any) => (t.tarih||t.planlanan_tarih) === bugunStr).length,
          hafta: tList.filter((t:any) => (t.tarih||t.planlanan_tarih) >= haftaBas).length,
          ay: tList.filter((t:any) => (t.tarih||t.planlanan_tarih) >= ayBas).length,
          yil: tList.filter((t:any) => (t.tarih||t.planlanan_tarih) >= ayBas.slice(0,4)+'-01-01').length,
          ciroBugun: tList.filter((t:any) => (t.tarih||t.planlanan_tarih) === bugunStr).reduce((s:number,t:any)=>s+(Number(t.tutar)||0),0),
          ciroAy: tList.filter((t:any) => (t.tarih||t.planlanan_tarih) >= ayBas).reduce((s:number,t:any)=>s+(Number(t.tutar)||0),0),
        })
      }
      // Bekleyen teklif sayısı
      if (izin.includes('teklif')) {
        const { count } = await sb.from('teklifler').select('id', { count:'exact', head:true }).eq('surec_durumu','Beklemede')
        setBekleyenTeklif(count||0)
      }
      setUyarilar(uyari.data || [])

      // Aktivite akışı (son 10)
      const { data: aktData } = await sb.from('firma_evrak_durumu')
        .select('*, firmalar(unvan), evrak_tanimlari(ad)')
        .not('tiklama_tarihi', 'is', null)
        .order('tiklama_tarihi', { ascending: false })
        .limit(8)
      setAktiviteler(aktData || [])

      // Grafikler sadece yönetici + muhasebe
      if (izin.includes('ciro') || izin.includes('grafik')) {
        const aylar: Record<string, number> = {}
        hastaList.forEach((h:any) => {
          if (!h.tarih) return
          const ay = new Date(h.tarih).toLocaleDateString('tr-TR', { month:'short' })
          aylar[ay] = (aylar[ay]||0) + (Number(h.ucret)||0)
        })
        setCiroData(Object.entries(aylar).map(([ay,tutar]) => ({ ay, tutar })))

        const riskli = (cariler.data||[]).filter((c:any) => c.vadesi_gecen_tutar > 0)
          .sort((a:any, b:any) => b.vadesi_gecen_tutar - a.vadesi_gecen_tutar).slice(0,5)
          .map((c:any) => ({ isim: c.unvan?.slice(0,16), tutar: Number(c.vadesi_gecen_tutar), gun: c.gecen_gun_sayisi }))
        setVadeData(riskli)
      }

      setYukleniyor(false)
    }
    yukle()
  }, [])

  async function uyariKapat(id: string) {
    const sb = createClient()
    await sb.from('borcuyarilari').update({ goruldu: true }).eq('id', id)
    setUyarilar(u => u.filter(x => x.id !== id))
  }

  const izin = ROL_KARTLAR[rol] || ROL_KARTLAR.operasyon
  const tl = (n:number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits:0 }).format(n) + ' ₺'

  const TUM_KARTLAR = [
    { key:'firma',      label:'Aktif Firma',      val: stats.firma,              icon:Building2,    renk:'var(--blue)',   soft:'var(--blue-soft)',   href:'/firmalar' },
    { key:'hasta',      label:'Hasta Kaydı',     val: stats.hasta,              icon:HeartPulse,   renk:'var(--green)',  soft:'var(--green-soft)',  href:'/saglik' },
    { key:'teklif',     label:'Bekleyen Teklif', val: stats.teklif,             icon:FileText,     renk:'var(--amber)',  soft:'var(--amber-soft)',  href:'/teklifler' },
    { key:'ciroKart',   label:'Bu Ay Ciro',      val: tl(stats.aylikCiro),      icon:TrendingUp,   renk:'var(--green)',  soft:'var(--green-soft)',  href:'/tahsilat' },

    { key:'gorev',      label:'Bu Ay Görev',     val: stats.gorev,              icon:CalendarDays, renk:'var(--accent)', soft:'var(--accent-soft)', href:'/koordinasyon' },
  ]
  const kartlar = TUM_KARTLAR.filter(k => izin.includes(k.key))

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Genel Bakış</h1>
          <p className="page-sub">{new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
      </div>

      {/* METRİK KARTLARI */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
        {kartlar.map((k, i) => {
          const Icon = k.icon
          return (
            <Link key={k.key} href={k.href} className="card" style={{ padding:20, textDecoration:'none', color:'inherit', display:'block', animationDelay:`${i*50}ms` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:k.soft, display:'flex', alignItems:'center', justifyContent:'center', color:k.renk, flexShrink:0 }}>
                  <Icon size={20}/>
                </div>
                <ArrowUpRight size={16} color="var(--text-faint)"/>
              </div>
              <div style={{ fontFamily:'Sora,sans-serif', fontSize:24, fontWeight:700, letterSpacing:-0.5 }}>
                {yukleniyor ? '—' : k.val}
              </div>
              <div style={{ fontSize:13, color:'var(--text-dim)', marginTop:2 }}>{k.label}</div>
            </Link>
          )
        })}
      </div>

      {/* AYLIK CİRO — sadece yönetici + muhasebe */}
      {izin.includes('ciro') && (
        <div className="card" style={{ padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <TrendingUp size={18} color="var(--green)"/>
          <span style={{ fontSize:13, color:'var(--text-dim)' }}>Bu Ay Ciro</span>
          <span style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:'var(--green)' }}>{tl(stats.aylikCiro)}</span>
        </div>
      )}

      {/* ZİYARET ÖZET — 3 mini kart */}
      {izin.includes('ziyaret') && (
        <Link href="/ziyaretler" style={{ textDecoration:'none', color:'inherit', display:'block', marginBottom:16 }}>
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <MapPin size={15} color="var(--blue)"/>
              <span style={{ fontWeight:600, fontSize:14 }}>Bu Ay ISG Ziyaretleri</span>
              <ArrowUpRight size={14} color="var(--text-faint)" style={{ marginLeft:'auto' }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {[
                { label:'Yapılan', val: yukleniyor ? '—' : ziyaretStat.yapilan, renk:'var(--green)' },
                { label:'Bekleyen', val: yukleniyor ? '—' : ziyaretStat.bekleyen, renk:'var(--red)' },
                { label:'Toplam Firma', val: yukleniyor ? '—' : stats.firma, renk:'var(--blue)' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign:'center', padding:'8px 4px', borderRadius:8, background:'var(--surface-2)' }}>
                  <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:item.renk }}>{item.val}</div>
                  <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Link>
      )}

      {/* AÇIK GÖREVLER */}
      {izin.includes('gorev') && acikGorevler.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <CalendarDays size={15} color="var(--accent)"/>
              <span style={{ fontWeight:600, fontSize:14 }}>Açık Görevler</span>
              <span style={{ fontSize:11, background:'var(--accent-soft)', color:'var(--accent)', padding:'2px 7px', borderRadius:10, fontWeight:600 }}>{acikGorevler.length}</span>
            </div>
            <Link href="/koordinasyon" style={{ fontSize:12, color:'var(--accent)', textDecoration:'none' }}>Tümü →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {acikGorevler.map((g:any) => {
              const gecikti = g.son_tarih && g.son_tarih < new Date().toISOString().slice(0,10)
              return (
                <Link key={g.id} href="/koordinasyon" style={{ textDecoration:'none', color:'inherit' }}>
                  <div className="card" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderLeft: gecikti ? '3px solid var(--red)' : '3px solid var(--accent)' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {g.konu || g.firma_adi || 'Görev'}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:2 }}>
                        {g.uzman && <span>{g.uzman} · </span>}
                        {g.firma_adi && g.konu && <span>{g.firma_adi} · </span>}
                        <span style={{ color: gecikti ? 'var(--red)' : 'var(--text-faint)' }}>
                          {g.son_tarih ? new Date(g.son_tarih+'T00:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'short'}) : g.tarih ? new Date(g.tarih+'T00:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'short'}) : '—'}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:6, fontWeight:600, flexShrink:0,
                      background: g.durum==='Bekliyor' ? 'var(--amber-soft)' : 'var(--blue-soft)',
                      color: g.durum==='Bekliyor' ? 'var(--amber)' : 'var(--blue)' }}>
                      {g.durum}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* AKTİVİTE AKIŞI */}
      {aktiviteler.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <FolderArchive size={15} color="var(--accent)"/>
              <span style={{ fontWeight:600, fontSize:14 }}>Son Evrak Hareketleri</span>
            </div>
            <Link href="/arsiv" style={{ fontSize:12, color:'var(--accent)', textDecoration:'none' }}>Tümü →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {aktiviteler.map((a:any) => (
              <div key={a.id} className="card" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px' }}>
                <div style={{ width:28, height:28, borderRadius:7, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, flexShrink:0 }}>
                  {(a.tikleyen||'?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12 }}>
                    <span style={{ fontWeight:600 }}>{a.tikleyen||'—'}</span>
                    <span style={{ color:'var(--text-faint)' }}> · </span>
                    <span style={{ color:'var(--text-dim)' }}>{a.firmalar?.unvan||'—'}</span>
                    <span style={{ color:'var(--text-faint)' }}> · </span>
                    <span style={{ color:'var(--accent)', fontWeight:500 }}>{a.evrak_tanimlari?.ad||'—'}</span>
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--text-faint)', flexShrink:0 }}>
                  {a.tiklama_tarihi ? new Date(a.tiklama_tarihi).toLocaleDateString('tr-TR', { day:'numeric', month:'short' }) : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAĞLIK RAPORU WIDGET */}
      {izin.includes('saglikRaporu') && (
        <Link href="/taramalar" style={{ textDecoration:'none', color:'inherit', display:'block', marginBottom:16 }}>
          <div className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <HeartPulse size={18} color="var(--green)"/>
                <span style={{ fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15 }}>Sağlık Raporu</span>
              </div>
              <ArrowUpRight size={15} color="var(--text-faint)"/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
              {([['Bugün', saglikStat.bugun],['Bu Hafta', saglikStat.hafta],['Bu Ay', saglikStat.ay],['Bu Yıl', saglikStat.yil]] as any[]).map(([k,v]:[string,number]) => (
                <div key={k} style={{ textAlign:'center', padding:'8px 4px', background:'var(--surface-2)', borderRadius:8 }}>
                  <div style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700 }}>{yukleniyor ? '—' : v}</div>
                  <div style={{ fontSize:10, color:'var(--text-faint)', marginTop:2 }}>{k}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-dim)', paddingTop:10, borderTop:'1px solid var(--border)' }}>
              <span>Bugün ciro: <strong style={{ color:'var(--green)' }}>{yukleniyor ? '—' : tl(saglikStat.ciroBugun)}</strong></span>
              <span>Aylık ciro: <strong style={{ color:'var(--green)' }}>{yukleniyor ? '—' : tl(saglikStat.ciroAy)}</strong></span>
            </div>
          </div>
        </Link>
      )}

      {/* BEKLEYEN TEKLİFLER WIDGET */}
      {izin.includes('teklif') && (
        <Link href="/teklifler" style={{ textDecoration:'none', color:'inherit', display:'block', marginBottom:16 }}>
          <div className="card" style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <FileText size={18} color="var(--amber)"/>
            <span style={{ flex:1, fontSize:14 }}>Bekleyen Teklif</span>
            <span style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:700, color:'var(--amber)' }}>{yukleniyor ? '—' : bekleyenTeklif}</span>
            <ArrowUpRight size={15} color="var(--text-faint)"/>
          </div>
        </Link>
      )}

      {/* GRAFİKLER — sadece yönetici */}
      {izin.includes('grafik') && (
        <div className="grafik-grid">
          

          <div className="card" style={{ padding:22 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600 }}>Sağlık Geliri</h3>
              <TrendingUp size={16} color="var(--green)"/>
            </div>
            <div style={{ height:220 }}>
              {ciroData.length === 0
                ? <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-faint)', fontSize:14 }}>Henüz veri yok</div>
                : <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ciroData}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="ay" stroke="#5d5d6b" fontSize={12} tickLine={false} axisLine={false}/>
                      <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:13 }} formatter={(v:any) => [tl(v),'Gelir']}/>
                      <Area type="monotone" dataKey="tutar" stroke="#6366f1" strokeWidth={2} fill="url(#g1)"/>
                    </AreaChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>

          <div className="card" style={{ padding:22 }}>
            <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:15, fontWeight:600, marginBottom:18 }}>En Riskli Cariler</h3>
            <div style={{ height:220 }}>
              {vadeData.length === 0
                ? <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-faint)', fontSize:14 }}>Risk yok</div>
                : <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vadeData} layout="vertical" margin={{ left:0, right:8 }}>
                      <XAxis type="number" hide/>
                      <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, fontSize:13 }} formatter={(v:any) => [tl(v),'Vade Aşımı']} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                      <Bar dataKey="tutar" radius={[0,6,6,0]} barSize={20}>
                        {vadeData.map((d,i) => <Cell key={i} fill={d.gun>90?'#f87171':d.gun>30?'#fbbf24':'#60a5fa'}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>
        </div>
      )}

      {/* Rol bazlı boş durum */}
      {kartlar.length === 0 && !yukleniyor && (
        <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-faint)' }}>
          Hoş geldiniz. Erişim yetkinizde henüz veri yok.
        </div>
      )}
    </div>
  )
}
