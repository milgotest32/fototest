'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, Building2, HeartPulse, FileText, Wallet, ClipboardList, CalendarDays, Menu, X, LogOut, MapPin, Stethoscope, Package, Truck, Activity, ChevronRight } from 'lucide-react'

const ROL_AD: any = { yonetici:'Yönetici', operasyon:'Operasyon', hekim:'Hekim', satis:'Satış', muhasebe:'Muhasebe', saha:'Saha Uzmanı' }

const ERISIM: any = {
  yonetici:  ['/','/firmalar','/saglik','/teklifler','/tahsilat','/koordinasyon','/idari','/ziyaretler','/hekim','/malzemeler','/tedarikciler','/taramalar'],
  operasyon: ['/','/firmalar','/koordinasyon','/idari','/ziyaretler','/taramalar'],
  hekim:     ['/','/saglik','/hekim','/koordinasyon'],
  satis:     ['/','/firmalar','/teklifler','/malzemeler','/tedarikciler'],
  muhasebe:  ['/','/tahsilat','/saglik'],
  saha:      ['/','/koordinasyon','/firmalar','/ziyaretler'],
}

const GRUPLAR = [
  { baslik: 'Genel', linkler: [
    { href:'/', label:'Dashboard', icon:LayoutDashboard },
  ]},
  { baslik: 'ISG & Firmalar', linkler: [
    { href:'/firmalar', label:'Firmalar', icon:Building2 },
    { href:'/ziyaretler', label:'ISG Ziyaretleri', icon:MapPin },
    { href:'/koordinasyon', label:'Koordinasyon', icon:CalendarDays },
  ]},
  { baslik: 'Sağlık', linkler: [
    { href:'/saglik', label:'Sağlık Tarama', icon:HeartPulse },
    { href:'/hekim', label:'Hekim Ekranı', icon:Stethoscope },
    { href:'/taramalar', label:'Tarama Ops.', icon:Activity },
  ]},
  { baslik: 'Satış', linkler: [
    { href:'/teklifler', label:'Teklifler', icon:FileText },
    { href:'/malzemeler', label:'Malzemeler', icon:Package },
    { href:'/tedarikciler', label:'Tedarikçiler', icon:Truck },
  ]},
  { baslik: 'Finans & İdari', linkler: [
    { href:'/tahsilat', label:'Tahsilat', icon:Wallet },
    { href:'/idari', label:'İdari İşler', icon:ClipboardList },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [acik, setAcik] = useState(false)
  const [personel, setPersonel] = useState<any>(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await sb.from('personeller').select('*').eq('id', data.user.id).single()
        setPersonel(p || { ad_soyad: data.user.email, rol: 'operasyon' })
      }
    })
  }, [])

  useEffect(() => { setAcik(false) }, [pathname])

  async function cikis() {
    await createClient().auth.signOut()
    router.push('/giris'); router.refresh()
  }

  const rol = personel?.rol || 'operasyon'
  const izinli = ERISIM[rol] || ERISIM.operasyon

  function NavIcerik() {
    return (
      <nav style={{ flex:1, padding:'8px 8px', overflowY:'auto' }}>
        {GRUPLAR.map(grup => {
          const gorunenler = grup.linkler.filter(l => izinli.includes(l.href))
          if (!gorunenler.length) return null
          return (
            <div key={grup.baslik} style={{ marginBottom:4 }}>
              <div style={{ fontSize:10, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:0.8, padding:'8px 10px 4px', fontWeight:600 }}>{grup.baslik}</div>
              {gorunenler.map(l => {
                const aktif = pathname === l.href
                const Icon = l.icon
                return (
                  <Link key={l.href} href={l.href}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, textDecoration:'none',
                      background:aktif?'var(--accent-soft)':'transparent',
                      color:aktif?'var(--accent)':'var(--text-dim)',
                      fontSize:13, fontWeight:aktif?600:500, transition:'all .12s' }}>
                    <Icon size={16}/> {l.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
    )
  }

  function KullaniciBolumu() {
    return (
      <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:12, flexShrink:0 }}>
            {(personel?.ad_soyad||'?').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{personel?.ad_soyad||'...'}</div>
            <div style={{ fontSize:10, color:'var(--text-faint)' }}>{ROL_AD[rol]}</div>
          </div>
        </div>
        <button onClick={cikis} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:7, padding:'7px', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
          <LogOut size={12}/> Çıkış Yap
        </button>
      </div>
    )
  }

  const aktifSayfa = GRUPLAR.flatMap(g=>g.linkler).find(l=>l.href===pathname)

  return (
    <>
      <style>{`
        .sidebar-desktop { width:216px; flex-shrink:0; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; position:sticky; top:0; height:100vh; }
        .mobile-topbar { display:none; }
        .sidebar-overlay { display:none; }
        .sidebar-drawer { display:none; }
        @media (max-width:768px) {
          .sidebar-desktop { display:none; }
          .mobile-topbar { display:flex; align-items:center; justify-content:space-between; padding:0 16px; height:52px; background:var(--surface); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
          .sidebar-overlay { display:block; position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); z-index:200; }
          .sidebar-drawer { display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0; width:272px; background:var(--surface); border-right:1px solid var(--border); z-index:201; transform:translateX(-100%); transition:transform .25s ease; }
          .sidebar-drawer.acik { transform:translateX(0); }
        }
      `}</style>

      {/* DESKTOP */}
      <aside className="sidebar-desktop">
        <div style={{ padding:'18px 14px 12px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, letterSpacing:-0.5 }}>OSGB<span style={{ color:'var(--accent)' }}>.</span></span>
          <div style={{ fontSize:10, color:'var(--text-faint)', marginTop:2 }}>Operasyon Sistemi</div>
        </div>
        <NavIcerik />
        <KullaniciBolumu />
      </aside>

      {/* MOBİL TOP BAR */}
      <div className="mobile-topbar">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>setAcik(true)} style={{ background:'none', border:'none', color:'var(--text)', cursor:'pointer', display:'flex', padding:4 }}><Menu size={22}/></button>
          <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:17 }}>OSGB<span style={{ color:'var(--accent)' }}>.</span></span>
        </div>
        {aktifSayfa && <span style={{ fontSize:13, color:'var(--text-dim)', fontWeight:500 }}>{aktifSayfa.label}</span>}
        <div style={{ width:32 }}/>
      </div>

      {acik && <div className="sidebar-overlay" onClick={()=>setAcik(false)}/>}
      <div className={`sidebar-drawer ${acik?'acik':''}`}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 14px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:17 }}>OSGB<span style={{ color:'var(--accent)' }}>.</span></span>
          <button onClick={()=>setAcik(false)} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', display:'flex' }}><X size={20}/></button>
        </div>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:14, flexShrink:0 }}>
            {(personel?.ad_soyad||'?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600 }}>{personel?.ad_soyad||'...'}</div>
            <div style={{ fontSize:11, color:'var(--text-faint)' }}>{ROL_AD[rol]}</div>
          </div>
        </div>
        <NavIcerik />
        <div style={{ padding:'12px 14px', borderTop:'1px solid var(--border)' }}>
          <button onClick={cikis} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:9, padding:'10px', fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            <LogOut size={15}/> Çıkış Yap
          </button>
        </div>
      </div>
    </>
  )
}
