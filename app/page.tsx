'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Building2, HeartPulse, FileText, Wallet, TrendingUp, AlertTriangle, ArrowUpRight, MapPin, Bell, X, CalendarDays, ClipboardList } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, Cell } from 'recharts'

// Rollere göre hangi kartlar görünür
const ROL_KARTLAR: Record<string, string[]> = {
  yonetici:  ['firma','hasta','teklif','acikBakiye','ziyaret','ciro','grafik','uyari'],
  muhasebe:  ['acikBakiye','ziyaret','uyari'],
  operasyon: ['firma','ziyaret','gorev'],
  hekim:     ['hasta'],
  satis:     ['firma','teklif'],
  saha:      ['firma','ziyaret'],
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>({ firma:0, hasta:0, teklif:0, acikBakiye:0, vadeGecen:0, aylikCiro:0, ziyaret:0, gorev:0 })
  const [ciroData, setCiroData] = useState<any[]>([])
  const [vadeData, setVadeData] = useState<any[]>([])
  const [uyarilar, setUyarilar] = useState<any[]>([])
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
      if (izin.includes('firma')) queries.push(sb.from('firmalar').select('id', { count:'exact', head:true }))
      else queries.push(Promise.resolve({ count: 0 }))

      if (izin.includes('hasta') || izin.includes('ciro')) queries.push(sb.from('hasta_kayitlari').select('ucret, tarih'))
      else queries.push(Promise.resolve({ data: [] }))

      if (izin.includes('teklif')) queries.push(sb.from('teklifler').select('id, surec_durumu'))
      else queries.push(Promise.resolve({ data: [] }))

      if (izin.includes('acikBakiye') || izin.includes('uyari')) queries.push(sb.from('cariler').select('unvan, acik_bakiye, vadesi_gecen_tutar, gecen_gun_sayisi'))
      else queries.push(Promise.resolve({ data: [] }))

      if (izin.includes('ziyaret')) queries.push(sb.from('ziyaretler').select('id', { count:'exact', head:true }).gte('tarih', ayBas).lte('tarih', ayBit))
      else queries.push(Promise.resolve({ count: 0 }))

      if (izin.includes('uyari')) queries.push(sb.from('borcuyarilari').select('*').eq('goruldu', false).order('gecen_gun_sayisi', { ascending:false }).limit(10))
      else queries.push(Promise.resolve({ data: [] }))

      if (izin.includes('gorev')) queries.push(sb.from('gorevler').select('id', { count:'exact', head:true }).eq('durum','Planlandı').gte('tarih', ayBas).lte('tarih', ayBit))
      else queries.push(Promise.resolve({ count: 0 }))

      const [firma, hasta, teklif, cariler, ziyaret, uyari, gorev] = await Promise.all(queries)

      const hastaList = hasta.data || []
      const aylikCiro = hastaList.filter((h:any) => h.tarih >= ayBas && h.tarih <= ayBit).reduce((s:number, h:any) => s + (Number(h.ucret)||0), 0)
      const acikBakiye = (cariler.data||[]).reduce((s:number, c:any) => s + (Number(c.acik_bakiye)||0), 0)
      const vadeGecen = (cariler.data||[]).reduce((s:number, c:any) => s + (Number(c.vadesi_gecen_tutar)||0), 0)

      setStats({ firma: firma.count||0, hasta: hastaList.length, teklif: (teklif.data||[]).filter((t:any) => t.surec_durumu==='Beklemede').length, acikBakiye, vadeGecen, aylikCiro, ziyaret: ziyaret.count||0, gorev: gorev.count||0 })
      setUyarilar(uyari.data || [])

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
    { key:'firma',      label:'Kayıtlı Firma',   val: stats.firma,              icon:Building2,    renk:'var(--blue)',   soft:'var(--blue-soft)',   href:'/firmalar' },
    { key:'hasta',      label:'Hasta Kaydı',     val: stats.hasta,              icon:HeartPulse,   renk:'var(--green)',  soft:'var(--green-soft)',  href:'/saglik' },
    { key:'teklif',     label:'Bekleyen Teklif', val: stats.teklif,             icon:FileText,     renk:'var(--amber)',  soft:'var(--amber-soft)',  href:'/teklifler' },
    { key:'acikBakiye', label:'Açık Bakiye',     val: tl(stats.acikBakiye),     icon:Wallet,       renk:'var(--accent)', soft:'var(--accent-soft)', href:'/tahsilat' },
    { key:'ziyaret',    label:'Bu Ay Ziyaret',   val: stats.ziyaret,            icon:MapPin,       renk:'var(--blue)',   soft:'var(--blue-soft)',   href:'/ziyaretler' },
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

      {/* BORÇ UYARILARI — yönetici + muhasebe */}
      {izin.includes('uyari') && uyarilar.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <Bell size={15} color="var(--red)"/>
            <span style={{ fontWeight:600, fontSize:14, color:'var(--red)' }}>Borç Uyarıları</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {uyarilar.map(u => (
              <div key={u.id} className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'12px 16px', borderColor:'rgba(248,113,113,0.25)', background:'var(--red-soft)', flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <AlertTriangle size={16} color="var(--red)"/>
                  <div>
                    <span style={{ fontWeight:600, fontSize:14 }}>{u.unvan}</span>
                    <span style={{ fontSize:13, color:'var(--red)', marginLeft:8 }}>{tl(Number(u.vadesi_gecen_tutar))} · {u.gecen_gun_sayisi} gün</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, background:'rgba(248,113,113,0.2)', color:'var(--red)', padding:'3px 8px', borderRadius:6, fontWeight:600 }}>{u.esik}+ gün</span>
                  <Link href="/tahsilat" style={{ fontSize:12, color:'var(--red)', textDecoration:'none', fontWeight:500 }}>Tahsilat →</Link>
                  <button onClick={()=>uyariKapat(u.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:2 }}><X size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VADESİ GEÇEN — uyarı yoksa */}
      {izin.includes('uyari') && stats.vadeGecen > 0 && uyarilar.length === 0 && (
        <Link href="/tahsilat" className="card" style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', marginBottom:20, textDecoration:'none', color:'inherit', borderColor:'rgba(248,113,113,0.25)', background:'var(--red-soft)' }}>
          <AlertTriangle size={18} color="var(--red)"/>
          <span style={{ flex:1, fontSize:14 }}><strong style={{ color:'var(--red)' }}>{tl(stats.vadeGecen)}</strong> vadesi geçmiş tahsilat</span>
          <ArrowUpRight size={16} color="var(--red)"/>
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
