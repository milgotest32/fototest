import Link from 'next/link'
import { createClient as sb } from '@supabase/supabase-js'
import SiteNav from '@/components/site/SiteNav'
import SiteFooter from '@/components/site/SiteFooter'
import HeroSlider from '@/components/site/HeroSlider'
import SiteFloating from '@/components/site/SiteFloating'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Aktif OSGB | Afyonkarahisar İş Sağlığı ve Güvenliği',
  description: '2014\'ten bu yana Afyonkarahisar\'da yetkili OSGB hizmetleri. İşyeri hekimliği, iş güvenliği uzmanlığı, mobil sağlık taraması, eğitimler.'
}

async function getData() {
  const client = sb(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [ayarlar, hizmetler, egitimler, yazilar] = await Promise.all([
    client.from('site_ayarlar').select('anahtar,deger').then(r => {
      const a: Record<string,string> = {}
      ;(r.data||[]).forEach((x:any)=>{ a[x.anahtar]=x.deger }); return a
    }),
    client.from('site_hizmetler').select('*').eq('aktif',true).order('sira').then(r=>r.data||[]),
    client.from('site_egitimler').select('*').eq('aktif',true).order('sira').limit(4).then(r=>r.data||[]),
    client.from('site_yazilar').select('*').eq('yayinda',true).order('yayinlandi_at',{ascending:false}).limit(3).then(r=>r.data||[]),
  ])
  return { ayarlar, hizmetler, egitimler, yazilar }
}

const SARI = '#f5c200'
const KOYU = '#0a0a0f'

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(245,194,0,.08)', border:'1px solid rgba(245,194,0,.2)', borderRadius:100, padding:'5px 16px', fontSize:11, fontWeight:800, color:SARI, textTransform:'uppercase', letterSpacing:2, marginBottom:18 }}>
      {text}
    </div>
  )
}

export default async function AnaSayfa() {
  const { ayarlar, hizmetler, egitimler, yazilar } = await getData()

  return (
    <div style={{ background:KOYU, minHeight:'100vh', color:'#e8e8f0', fontFamily:"'Inter',-apple-system,system-ui,sans-serif" }}>
      <SiteNav />
      <HeroSlider />

      {/* STATS BAR */}
      <div style={{ background:'linear-gradient(135deg,#f5c200 0%,#e6a800 100%)', padding:'28px 32px' }}>
        <div className="site-stats-grid" style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {[
            { num:'500+', lbl:'Çalışılan Firma', icon:'🏭' },
            { num:'9+', lbl:'Yıllık Deneyim', icon:'📅' },
            { num:'1200+', lbl:'Verilen Eğitim', icon:'🎓' },
            { num:'6331', lbl:'Sayılı Kanun Kapsamı', icon:'📋' },
          ].map(({ num, lbl, icon }) => (
            <div key={lbl} style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, color:KOYU, letterSpacing:-1 }}>{num}</div>
              <div style={{ fontSize:11, color:'rgba(0,0,0,.55)', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HİZMETLER */}
      <section style={{ padding:'80px 32px', maxWidth:1280, margin:'0 auto' }}>
        <SectionLabel text="Hizmetlerimiz" />
        <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#fff', marginBottom:12, letterSpacing:-1, lineHeight:1.1 }}>
          Kapsamlı OSGB <span style={{ color:SARI }}>Çözümleri</span>
        </h2>
        <p style={{ fontSize:16, color:'#6b6b88', maxWidth:520, lineHeight:1.7, marginBottom:48 }}>
          6331 sayılı Kanun kapsamında ihtiyacınız olan tüm iş sağlığı ve güvenliği hizmetleri tek çatı altında.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
          {hizmetler.map((h:any) => (
            <div key={h.id} style={{
              background:'linear-gradient(135deg,#0e0e1c 0%,#12121f 100%)',
              border:'1px solid rgba(245,194,0,.08)',
              borderRadius:20, padding:28,
              transition:'all .2s',
              position:'relative', overflow:'hidden',
            }}>
              {/* Dekor */}
              <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,194,0,.06),transparent 70%)', pointerEvents:'none' }} />
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(245,194,0,.1)', border:'1px solid rgba(245,194,0,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:18 }}>{h.ikon}</div>
              <h3 style={{ fontSize:16, fontWeight:800, color:'#ececf1', marginBottom:10 }}>{h.baslik}</h3>
              <p style={{ fontSize:13, color:'#5d5d7a', lineHeight:1.7 }}>{h.aciklama?.slice(0,120)}...</p>
              {h.etiketler && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:16 }}>
                  {h.etiketler.split('·').slice(0,2).map((e:string) => (
                    <span key={e} style={{ fontSize:11, color:SARI, background:'rgba(245,194,0,.08)', border:'1px solid rgba(245,194,0,.12)', borderRadius:100, padding:'3px 10px', fontWeight:600 }}>{e.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:40 }}>
          <Link href="/hizmetlerimiz" style={{ padding:'12px 32px', borderRadius:10, border:`1px solid rgba(245,194,0,.3)`, color:SARI, fontSize:14, fontWeight:700, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
            Tüm Hizmetleri Gör →
          </Link>
        </div>
      </section>

      {/* AYIRICI */}
      <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(245,194,0,.15),transparent)', margin:'0 32px' }} />

      {/* TEHLİKE SINIFI SORGULAMA WIDGET */}
      <section style={{ padding:'64px 32px', maxWidth:1280, margin:'0 auto' }}>
        <div className="site-tehlike-grid" style={{ background:'linear-gradient(135deg,rgba(245,194,0,.06) 0%,rgba(245,194,0,.02) 100%)', border:'1px solid rgba(245,194,0,.15)', borderRadius:24, padding:'48px 40px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>
          <div>
            <SectionLabel text="Ücretsiz Araç" />
            <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:900, color:'#fff', marginBottom:16, letterSpacing:-0.5 }}>
              Tehlike Sınıfı & NACE Kodu Sorgulama
            </h2>
            <p style={{ fontSize:15, color:'#6b6b88', lineHeight:1.7, marginBottom:28 }}>
              İşyerinizin NACE kodunu ve tehlike sınıfını öğrenin. 6331 sayılı Kanun gereği işletmenizin hangi sınıfta yer aldığını bilerek yasal yükümlülüklerinizi doğru planlayın.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:32 }}>
              {[['🟢', 'Az Tehlikeli', 'Büro, ticaret, eğitim sektörleri'],['🟡', 'Tehlikeli', 'İmalat, inşaat, taşımacılık'],['🔴', 'Çok Tehlikeli', 'Madencilik, kimya, patlayıcı']].map(([icon,sinif,acik]) => (
                <div key={sinif} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:18 }}>{icon}</span>
                  <div>
                    <span style={{ fontSize:13, fontWeight:700, color:'#e0e0f0' }}>{sinif}: </span>
                    <span style={{ fontSize:13, color:'#6b6b88' }}>{acik}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/tehlike-sinifi" style={{ padding:'13px 28px', borderRadius:10, background:'linear-gradient(135deg,#f5c200,#e6a800)', color:KOYU, fontSize:14, fontWeight:800, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 4px 20px rgba(245,194,0,.3)' }}>
              🔍 Hemen Sorgula →
            </Link>
          </div>
          <div style={{ background:'#0e0e1c', border:'1px solid rgba(245,194,0,.1)', borderRadius:20, overflow:'hidden', aspectRatio:'4/3', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:32 }}>
              <div style={{ fontSize:48 }}>🔍</div>
              <p style={{ fontSize:15, color:'#9b9bb8', textAlign:'center', lineHeight:1.6 }}>Tam NACE kodu sorgulama aracı için aşağıdaki butona tıklayın</p>
              <a href="/tehlike-sinifi" style={{ padding:'12px 28px', borderRadius:10, background:'linear-gradient(135deg,#f5c200,#e6a800)', color:'#0a0a0f', fontSize:14, fontWeight:800, textDecoration:'none' }}>
                Tehlike Sınıfı Sorgula →
              </a>
            </div>
        </div>
      </section>

      {/* AYIRICI */}
      <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(245,194,0,.15),transparent)', margin:'0 32px' }} />

      {/* EĞİTİMLER */}
      <section style={{ padding:'80px 32px', maxWidth:1280, margin:'0 auto' }}>
        <SectionLabel text="Eğitimler" />
        <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#fff', marginBottom:48, letterSpacing:-1 }}>
          Sertifikalı <span style={{ color:SARI }}>Eğitim</span> Programları
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20 }}>
          {egitimler.map((e:any, i:number) => (
            <div key={e.id} style={{ background:'linear-gradient(135deg,#0e0e1c,#12121f)', border:'1px solid rgba(255,255,255,.06)', borderRadius:20, padding:'28px 24px', display:'flex', gap:20, alignItems:'flex-start' }}>
              <div style={{ fontSize:44, fontWeight:900, color:'rgba(245,194,0,.15)', lineHeight:1, letterSpacing:-2, flexShrink:0 }}>
                {String(i+1).padStart(2,'0')}
              </div>
              <div>
                <h3 style={{ fontSize:15, fontWeight:800, color:'#ececf1', marginBottom:8 }}>{e.baslik}</h3>
                <p style={{ fontSize:13, color:'#5d5d7a', lineHeight:1.6, marginBottom:12 }}>{e.aciklama?.slice(0,80)}...</p>
                <div style={{ display:'flex', gap:6 }}>
                  {e.sure && <span style={{ fontSize:11, color:SARI, background:'rgba(245,194,0,.08)', border:'1px solid rgba(245,194,0,.12)', borderRadius:100, padding:'3px 10px', fontWeight:700 }}>⏱ {e.sure}</span>}
                  {e.sertifika && <span style={{ fontSize:11, color:'#34d399', background:'rgba(52,211,153,.08)', border:'1px solid rgba(52,211,153,.12)', borderRadius:100, padding:'3px 10px', fontWeight:700 }}>✓ Sertifikalı</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AYIRICI */}
      <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(245,194,0,.15),transparent)', margin:'0 32px' }} />

      {/* RAMAK KALA CTA */}
      <section style={{ padding:'64px 32px', maxWidth:1280, margin:'0 auto' }}>
        <div className="site-ramak-cta" style={{ background:'linear-gradient(135deg,rgba(248,113,113,.06),rgba(248,113,113,.02))', border:'1px solid rgba(248,113,113,.15)', borderRadius:24, padding:'40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ fontSize:48 }}>⚠️</div>
            <div>
              <h3 style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:8 }}>Ramak Kala Bildirimi</h3>
              <p style={{ fontSize:14, color:'#6b6b88', lineHeight:1.6, maxWidth:480 }}>
                İşyerinde yaşanan tehlikeli durumları bildirin. Kaza olmadan atlatılan olayları raporlayarak iş güvenliğini artırın. QR kodlu kolay erişim.
              </p>
            </div>
          </div>
          <Link href="/ramak-kala" style={{ padding:'14px 32px', borderRadius:12, background:'rgba(248,113,113,.15)', border:'1px solid rgba(248,113,113,.3)', color:'#fca5a5', fontSize:15, fontWeight:800, textDecoration:'none', whiteSpace:'nowrap' }}>
            Bildiri Yap →
          </Link>
        </div>
      </section>

      {/* AYIRICI */}
      <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(245,194,0,.15),transparent)', margin:'0 32px' }} />

      {/* BLOG / SON YAZILAR */}
      {yazilar.length > 0 && (
        <section style={{ padding:'80px 32px', maxWidth:1280, margin:'0 auto' }}>
          <SectionLabel text="ISG Haberleri" />
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:48, flexWrap:'wrap', gap:16 }}>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#fff', letterSpacing:-1 }}>
              Son <span style={{ color:SARI }}>Yazılarımız</span>
            </h2>
            <Link href="/yazilarimiz" style={{ fontSize:13, color:SARI, textDecoration:'none', fontWeight:700 }}>Tümünü Gör →</Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
            {yazilar.map((y:any) => (
              <div key={y.id} style={{ background:'linear-gradient(135deg,#0e0e1c,#12121f)', border:'1px solid rgba(255,255,255,.06)', borderRadius:20, overflow:'hidden', transition:'border-color .2s' }}>
                {y.foto_url && (
                  <div style={{ height:200, overflow:'hidden', position:'relative' }}>
                    <img src={y.foto_url} alt={y.baslik} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(10,10,15,.8),transparent)' }} />
                  </div>
                )}
                <div style={{ padding:24 }}>
                  <div style={{ fontSize:11, color:'#5d5d7a', marginBottom:10, display:'flex', gap:8 }}>
                    <span>{y.yazar}</span>
                    <span>·</span>
                    <span>{y.yayinlandi_at ? new Date(y.yayinlandi_at).toLocaleDateString('tr-TR') : ''}</span>
                  </div>
                  <h3 style={{ fontSize:16, fontWeight:800, color:'#ececf1', marginBottom:10, lineHeight:1.4 }}>{y.baslik}</h3>
                  <p style={{ fontSize:13, color:'#5d5d7a', lineHeight:1.6 }}>{y.ozet?.slice(0,100)}...</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VİZYON MİSYON */}
      <section style={{ padding:'80px 32px', maxWidth:1280, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
          <div style={{ borderRadius:24, padding:40, background:'linear-gradient(135deg,rgba(245,194,0,.08),rgba(245,194,0,.03))', border:'1px solid rgba(245,194,0,.15)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,194,0,.08),transparent 70%)' }} />
            <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase' as const, letterSpacing:2, color:SARI, marginBottom:16 }}>Vizyonumuz</div>
            <h3 style={{ fontSize:24, fontWeight:900, color:'#fff', marginBottom:16, letterSpacing:-0.5 }}>Sektörde Uzman Kuruluş</h3>
            <p style={{ fontSize:14, color:'#7070a0', lineHeight:1.8 }}>{ayarlar.vizyon}</p>
          </div>
          <div style={{ borderRadius:24, padding:40, background:'linear-gradient(135deg,rgba(52,211,153,.06),rgba(52,211,153,.02))', border:'1px solid rgba(52,211,153,.12)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(52,211,153,.08),transparent 70%)' }} />
            <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase' as const, letterSpacing:2, color:'#34d399', marginBottom:16 }}>Misyonumuz</div>
            <h3 style={{ fontSize:24, fontWeight:900, color:'#fff', marginBottom:16, letterSpacing:-0.5 }}>Etik ve Güvenilir Hizmet</h3>
            <p style={{ fontSize:14, color:'#7070a0', lineHeight:1.8 }}>{ayarlar.misyon}</p>
          </div>
        </div>
      </section>

      <SiteFooter />
      <SiteFloating />
    </div>
  )
}
