'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { UserCog, LogOut, LayoutDashboard, Building2, HeartPulse, FileText, Wallet, ClipboardList, CalendarDays, MapPin, Stethoscope, Package, Truck, Activity, BarChart2, AlertTriangle, SearchIcon } from 'lucide-react'

const ROL_AD: any = { yonetici:'Yönetici', operasyon:'Operasyon', hekim:'Hekim', satis:'Satış', muhasebe:'Muhasebe', saha:'Saha Uzmanı' }

const ERISIM: any = {
  yonetici:  ['/','/ara','/firmalar','/saglik','/teklifler','/tahsilat','/koordinasyon','/idari','/ziyaretler','/hekim','/malzemeler','/tedarikciler','/taramalar','/personeller','/raporlar','/fatura','/eksik-veriler'],
  operasyon: ['/','/firmalar','/koordinasyon','/idari','/ziyaretler','/taramalar','/eksik-veriler'],
  hekim:     ['/','/saglik','/hekim','/koordinasyon'],
  satis:     ['/','/firmalar','/teklifler','/malzemeler','/tedarikciler'],
  muhasebe:  ['/','/tahsilat','/saglik','/fatura'],
  saha:      ['/','/koordinasyon','/firmalar','/ziyaretler'],
}

const GRUPLAR = [
  { baslik:'Genel', linkler:[
    { href:'/', label:'Dashboard', icon:LayoutDashboard },
    { href:'/ara', label:'Global Arama', icon:SearchIcon },
  ]},
  { baslik:'ISG & Firmalar', linkler:[
    { href:'/firmalar', label:'Firmalar', icon:Building2 },
    { href:'/ziyaretler', label:'ISG Ziyaretleri', icon:MapPin },
    { href:'/koordinasyon', label:'Koordinasyon', icon:CalendarDays },
  ]},
  { baslik:'Sağlık', linkler:[
    { href:'/saglik', label:'Sağlık Raporu', icon:HeartPulse },
    { href:'/hekim', label:'Hekim Ekranı', icon:Stethoscope },
    { href:'/taramalar', label:'Sağlık Raporu (Operasyon)', icon:Activity },
  ]},
  { baslik:'Satış', linkler:[
    { href:'/teklifler', label:'Teklifler', icon:FileText },
    { href:'/malzemeler', label:'Malzemeler', icon:Package },
    { href:'/tedarikciler', label:'Tedarikçiler', icon:Truck },
  ]},
  { baslik:'Finans & İdari', linkler:[
    { href:'/tahsilat', label:'Tahsilat', icon:Wallet },
    { href:'/idari', label:'İdari İşler', icon:ClipboardList },
  ]},
  { baslik:'Yönetim', linkler:[
    { href:'/fatura', label:'Fatura Takibi', icon:FileText },
    { href:'/raporlar', label:'Raporlar', icon:BarChart2 },
    { href:'/personeller', label:'Personel & Yetkiler', icon:UserCog },
    { href:'/eksik-veriler', label:'Eksik Veriler', icon:AlertTriangle },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
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

  async function cikis() {
    await createClient().auth.signOut()
    router.push('/giris'); router.refresh()
  }

  const rol = personel?.rol || 'operasyon'
  const izinli = ERISIM[rol] || ERISIM.operasyon

  return (
    <>
      <style>{`
        .desktop-sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none; }
        }
      `}</style>

      <aside className="desktop-sidebar">
        <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:19, letterSpacing:-0.5 }}>
            OSGB<span style={{ color:'var(--accent)' }}>.</span>
          </div>
          <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:3 }}>Operasyon Sistemi</div>
        </div>

        <nav style={{ flex:1, padding:'8px 8px', overflowY:'auto' }}>
          {GRUPLAR.map(grup => {
            const gorunenler = grup.linkler.filter(l => izinli.includes(l.href))
            if (!gorunenler.length) return null
            return (
              <div key={grup.baslik} style={{ marginBottom:4 }}>
                <div style={{ fontSize:10, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:0.8, padding:'8px 10px 4px', fontWeight:600 }}>
                  {grup.baslik}
                </div>
                {gorunenler.map(l => {
                  const isAktif = pathname === l.href
                  const Icon = l.icon
                  return (
                    <Link key={l.href} href={l.href}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8,
                        textDecoration:'none', marginBottom:1,
                        background: isAktif ? 'var(--accent-soft)' : 'transparent',
                        color: isAktif ? 'var(--accent)' : 'var(--text-dim)',
                        fontSize:13, fontWeight: isAktif ? 600 : 400, transition:'background .1s' }}>
                      <Icon size={16} /> {l.label}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        <div style={{ padding:'12px 12px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>
              {(personel?.ad_soyad || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{personel?.ad_soyad || '...'}</div>
              <div style={{ fontSize:10, color:'var(--text-faint)' }}>{ROL_AD[rol]}</div>
            </div>
          </div>
          <button onClick={cikis}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-dim)',
              borderRadius:7, padding:'8px', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            <LogOut size={13} /> Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  )
}
