'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { UserCog, Menu, X, LogOut, LayoutDashboard, Building2, HeartPulse, FileText, Wallet, ClipboardList, CalendarDays, MapPin, Stethoscope, Package, Truck, Activity, BarChart2 } from 'lucide-react'

const ROL_AD: any = { yonetici:'Yönetici', operasyon:'Operasyon', hekim:'Hekim', satis:'Satış', muhasebe:'Muhasebe', saha:'Saha Uzmanı' }

const ERISIM: any = {
  yonetici:  ['/','/firmalar','/saglik','/teklifler','/tahsilat','/koordinasyon','/idari','/ziyaretler','/hekim','/malzemeler','/tedarikciler','/taramalar','/personeller','/raporlar','/fatura'],
  muhasebe:  ['/','/tahsilat','/saglik','/fatura'],
  operasyon: ['/','/firmalar','/koordinasyon','/idari','/ziyaretler','/taramalar'],
  hekim:     ['/','/saglik','/hekim','/koordinasyon'],
  satis:     ['/','/firmalar','/teklifler','/malzemeler','/tedarikciler'],
  muhasebe:  ['/','/tahsilat','/saglik'],
  saha:      ['/','/koordinasyon','/firmalar','/ziyaretler'],
}

const TUM_LINKLER = [
  { href:'/', label:'Dashboard', icon:LayoutDashboard },
  { href:'/firmalar', label:'Firmalar', icon:Building2 },
  { href:'/saglik', label:'Sağlık Tarama', icon:HeartPulse },
  { href:'/hekim', label:'Hekim Ekranı', icon:Stethoscope },
  { href:'/taramalar', label:'Tarama Ops.', icon:Activity },
  { href:'/teklifler', label:'Teklifler', icon:FileText },
  { href:'/malzemeler', label:'Malzemeler', icon:Package },
  { href:'/tedarikciler', label:'Tedarikçiler', icon:Truck },
  { href:'/tahsilat', label:'Tahsilat', icon:Wallet },
  { href:'/ziyaretler', label:'ISG Ziyaretleri', icon:MapPin },
  { href:'/koordinasyon', label:'Koordinasyon', icon:CalendarDays },
  { href:'/idari', label:'İdari İşler', icon:ClipboardList },
  { href:'/fatura', label:'Fatura Takibi', icon:ReceiptIcon },
  { href:'/raporlar', label:'Raporlar', icon:BarChart2 },
  { href:'/personeller', label:'Personel & Yetkiler', icon:UserCog },
]

export default function MobileTopbar() {
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
  const linkler = TUM_LINKLER.filter(l => izinli.includes(l.href))
  const aktif = TUM_LINKLER.find(l => l.href === pathname)

  return (
    <>
      <style>{`
        .mob-topbar { display: none; }
        @media (max-width: 768px) {
          .mob-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 12px;
            height: 52px;
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 50;
            flex-shrink: 0;
          }
        }
        .mob-drawer-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          z-index: 200;
        }
        .mob-drawer {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 280px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          z-index: 201;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform .24s ease;
        }
        .mob-drawer.open { transform: translateX(0); }
        .mob-drawer-overlay.open { display: block; }
      `}</style>

      {/* TOP BAR */}
      <div className="mob-topbar">
        {/* Sol: hamburger */}
        <button onClick={() => setAcik(true)}
          style={{ background:'none', border:'none', color:'var(--text)', cursor:'pointer', padding:8, display:'flex', alignItems:'center' }}>
          <Menu size={24} />
        </button>

        {/* Orta: sayfa adı */}
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, color:'var(--text)' }}>
          {aktif?.label || 'OSGB'}
        </span>

        {/* Sağ: çıkış butonu */}
        <button onClick={cikis}
          style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:8, display:'flex', alignItems:'center', gap:4 }}>
          <LogOut size={20} />
        </button>
      </div>

      {/* OVERLAY */}
      <div className={`mob-drawer-overlay ${acik ? 'open' : ''}`} onClick={() => setAcik(false)} />

      {/* DRAWER */}
      <div className={`mob-drawer ${acik ? 'open' : ''}`}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, flexShrink:0 }}>
              {(personel?.ad_soyad || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>{personel?.ad_soyad || '...'}</div>
              <div style={{ fontSize:11, color:'var(--text-faint)' }}>{ROL_AD[rol]}</div>
            </div>
          </div>
          <button onClick={() => setAcik(false)}
            style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:4, display:'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 10px' }}>
          {linkler.map(l => {
            const Icon = l.icon
            const isAktif = pathname === l.href
            return (
              <Link key={l.href} href={l.href}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 14px', borderRadius:10,
                  textDecoration:'none', marginBottom:2,
                  background: isAktif ? 'var(--accent-soft)' : 'transparent',
                  color: isAktif ? 'var(--accent)' : 'var(--text-dim)',
                  fontSize:15, fontWeight: isAktif ? 600 : 400 }}>
                <Icon size={20} />
                {l.label}
              </Link>
            )
          })}
        </nav>

        {/* Çıkış — drawer altında da var */}
        <div style={{ padding:'14px 18px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <button onClick={cikis}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-dim)',
              borderRadius:10, padding:'12px', fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      </div>
    </>
  )
}
