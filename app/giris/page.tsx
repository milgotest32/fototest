'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lock, Mail, ShieldCheck } from 'lucide-react'

export default function Giris() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  async function girisYap(e: React.FormEvent) {
    e.preventDefault()
    setHata(''); setYukleniyor(true)
    const sb = createClient()
    const { error } = await sb.auth.signInWithPassword({ email, password: sifre })
    if (error) { setHata('E-posta veya şifre hatalı.'); setYukleniyor(false); return }
    router.push('/firmalar'); router.refresh()
  }

  return (
    <div style={{ minHeight:'100vh', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', top:-200, right:-100, filter:'blur(60px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(96,165,250,0.08), transparent 70%)', bottom:-150, left:-100, filter:'blur(60px)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:400, position:'relative', zIndex:1 }} className="fade-in">
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:'var(--accent)' }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontFamily:'Sora, sans-serif', fontSize:26, fontWeight:700, letterSpacing:-0.5 }}>OSGB<span style={{ color:'var(--accent)' }}>.</span></h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>Operasyon sistemine giriş</p>
        </div>

        <div className="card" style={{ padding:28 }}>
          <form onSubmit={girisYap} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ fontSize:12, color:'var(--text-dim)', marginBottom:6, display:'block', fontWeight:500 }}>E-posta</label>
              <div style={{ position:'relative' }}>
                <Mail size={17} style={{ position:'absolute', left:14, top:12, color:'var(--text-faint)' }} />
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ornek@osgb.com" required style={{ paddingLeft:40 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text-dim)', marginBottom:6, display:'block', fontWeight:500 }}>Şifre</label>
              <div style={{ position:'relative' }}>
                <Lock size={17} style={{ position:'absolute', left:14, top:12, color:'var(--text-faint)' }} />
                <input type="password" value={sifre} onChange={e=>setSifre(e.target.value)} placeholder="••••••••" required style={{ paddingLeft:40 }} />
              </div>
            </div>
            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13 }}>{hata}</div>}
            <button type="submit" className="btn" disabled={yukleniyor} style={{ justifyContent:'center', marginTop:4 }}>
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'var(--text-faint)' }}>
          Hesabın yoksa yöneticinden talep et
        </p>
      </div>
    </div>
  )
}
