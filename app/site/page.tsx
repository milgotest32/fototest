'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Globe, Settings, Layers, Users, Award, FileText, MessageSquare, ExternalLink, Plus, Trash2, Pencil, X, Check, ArrowRight, RefreshCw } from 'lucide-react'

const SEKMELER = [
  { id: 'ayarlar', label: 'Genel Ayarlar', icon: Settings },
  { id: 'hizmetler', label: 'Hizmetler', icon: Layers },
  { id: 'egitimler', label: 'Eğitimler', icon: Award },
  { id: 'ekip', label: 'Ekip', icon: Users },
  { id: 'referanslar', label: 'Referanslar', icon: Globe },
  { id: 'yazilar', label: 'Yazılar', icon: FileText },
  { id: 'talepler', label: 'Teklif Talepleri', icon: MessageSquare },
  { id: 'seo', label: 'SEO Ayarları', icon: Globe },
  { id: 'yonlendirmeler', label: '301 Yönlendirmeler', icon: ArrowRight },
]

// vercel.json'daki mevcut redirectler (statik liste)
const VERCEL_REDIRECTLER = [{"source": "/kurumsal/", "destination": "/kurumsal", "permanent": true}, {"source": "/hakkimizda", "destination": "/kurumsal", "permanent": true}, {"source": "/hakkimizda/", "destination": "/kurumsal", "permanent": true}, {"source": "/hakkimizda-2", "destination": "/kurumsal", "permanent": true}, {"source": "/hakkimizda-2/", "destination": "/kurumsal", "permanent": true}, {"source": "/ekibimiz/", "destination": "/ekibimiz", "permanent": true}, {"source": "/hizmetlerimiz/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/is-sagligi-hizmetleri", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/is-sagligi-hizmetleri/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/ise-giris-raporu", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/ise-giris-raporu/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/is-guvenligi-hizmetleri", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/is-guvenligi-hizmetleri/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/risk-degerlendirme-raporu-hazirlama", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/risk-degerlendirme-raporu-hazirlama/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/acil-durum-plani-hazirlama", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/acil-durum-plani-hazirlama/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/cevreye-yonelik-hizmetler", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/cevreye-yonelik-hizmetler/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/buyuk-kaza-onleme-raporu", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/buyuk-kaza-onleme-raporu/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/tehlikeli-madde-guvenlik-danismanlik-hizmetleri", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/tehlikeli-madde-guvenlik-danismanlik-hizmetleri/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/lpg-sorumlu-mudurluk-hizmetleri", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/lpg-sorumlu-mudurluk-hizmetleri/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/olcum-hizmetleri", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/olcum-hizmetleri/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/patlamadan-korunma-dokumani-hazirlama", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/patlamadan-korunma-dokumani-hazirlama/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/mobil-saglik-tarama", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/mobil-saglik-tarama/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/isyeri-hekimligi", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/isyeri-hekimligi/", "destination": "/hizmetlerimiz", "permanent": true}, {"source": "/egitimler/", "destination": "/egitimler", "permanent": true}, {"source": "/portfolio-items/ilk-yardim-egitimi", "destination": "/egitimler", "permanent": true}, {"source": "/portfolio-items/ilk-yardim-egitimi/", "destination": "/egitimler", "permanent": true}, {"source": "/portfolio-items/yangin-egitimi-ve-senaryo-hizmetleri", "destination": "/egitimler", "permanent": true}, {"source": "/portfolio-items/yangin-egitimi-ve-senaryo-hizmetleri/", "destination": "/egitimler", "permanent": true}, {"source": "/portfolio-items/hijyen-egitimi", "destination": "/egitimler", "permanent": true}, {"source": "/portfolio-items/hijyen-egitimi/", "destination": "/egitimler", "permanent": true}, {"source": "/portfolio-items/mesleki-egitim-hizmeti", "destination": "/egitimler", "permanent": true}, {"source": "/portfolio-items/mesleki-egitim-hizmeti/", "destination": "/egitimler", "permanent": true}, {"source": "/portfolio-items/:slug*", "destination": "/egitimler", "permanent": true}, {"source": "/yangin-egitimi-ve-senaryo-uygulama-hizmetleri", "destination": "/egitimler", "permanent": true}, {"source": "/yangin-egitimi-ve-senaryo-uygulama-hizmetleri/", "destination": "/egitimler", "permanent": true}, {"source": "/hijyen-egitim-hizmetimi", "destination": "/egitimler", "permanent": true}, {"source": "/hijyen-egitim-hizmetimi/", "destination": "/egitimler", "permanent": true}, {"source": "/mesleki-egitim-hizmeti", "destination": "/egitimler", "permanent": true}, {"source": "/mesleki-egitim-hizmeti/", "destination": "/egitimler", "permanent": true}, {"source": "/ilk-yardim-egitimi", "destination": "/egitimler", "permanent": true}, {"source": "/ilk-yardim-egitimi/", "destination": "/egitimler", "permanent": true}, {"source": "/yangin-egitimi", "destination": "/egitimler", "permanent": true}, {"source": "/yangin-egitimi/", "destination": "/egitimler", "permanent": true}, {"source": "/hijyen-egitimi", "destination": "/egitimler", "permanent": true}, {"source": "/hijyen-egitimi/", "destination": "/egitimler", "permanent": true}, {"source": "/referanslar/", "destination": "/referanslar", "permanent": true}, {"source": "/yazilarimiz/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/afyonkarahisarda-cam-silerken-dusen-kadin-hayatini-kaybetti", "destination": "/yazilarimiz", "permanent": true}, {"source": "/afyonkarahisarda-cam-silerken-dusen-kadin-hayatini-kaybetti/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/kartalkaya-otel-yangini", "destination": "/yazilarimiz", "permanent": true}, {"source": "/kartalkaya-otel-yangini/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/nobel-ekonomi-odullu-daron-acemogluna-verildi", "destination": "/yazilarimiz", "permanent": true}, {"source": "/nobel-ekonomi-odullu-daron-acemogluna-verildi/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/diyarbakirda-narin-olayi-ve-cocuklarimizin-guvenligi", "destination": "/yazilarimiz", "permanent": true}, {"source": "/diyarbakirda-narin-olayi-ve-cocuklarimizin-guvenligi/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/sakarya-makarna-fabrikasi-patlamasi-is-guvenligi", "destination": "/yazilarimiz", "permanent": true}, {"source": "/sakarya-makarna-fabrikasi-patlamasi-is-guvenligi/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/asiri-sicak-hava-durumu-ve-is-sagligi", "destination": "/yazilarimiz", "permanent": true}, {"source": "/asiri-sicak-hava-durumu-ve-is-sagligi/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/klima-ve-is-sagligi-iliskisi-konfor-mu-tehlike-mi", "destination": "/yazilarimiz", "permanent": true}, {"source": "/klima-ve-is-sagligi-iliskisi-konfor-mu-tehlike-mi/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/tehlike-sinifi-sorgulama-nace-kodu-sorgulama", "destination": "/tehlike-sinifi", "permanent": true}, {"source": "/tehlike-sinifi-sorgulama-nace-kodu-sorgulama/", "destination": "/tehlike-sinifi", "permanent": true}, {"source": "/nace", "destination": "/tehlike-sinifi", "permanent": true}, {"source": "/nace/", "destination": "/tehlike-sinifi", "permanent": true}, {"source": "/tehlike-sinifi/", "destination": "/tehlike-sinifi", "permanent": true}, {"source": "/ramak-kala/", "destination": "/ramak-kala", "permanent": true}, {"source": "/iletisim/", "destination": "/iletisim", "permanent": true}, {"source": "/category/genel", "destination": "/yazilarimiz", "permanent": true}, {"source": "/category/genel/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/category/:slug*", "destination": "/yazilarimiz", "permanent": true}, {"source": "/tag/:slug*", "destination": "/yazilarimiz", "permanent": true}, {"source": "/author/scaloft", "destination": "/kurumsal", "permanent": true}, {"source": "/author/scaloft/", "destination": "/kurumsal", "permanent": true}, {"source": "/author/taner", "destination": "/kurumsal", "permanent": true}, {"source": "/author/taner/", "destination": "/kurumsal", "permanent": true}, {"source": "/author/:slug*", "destination": "/kurumsal", "permanent": true}, {"source": "/page/:num", "destination": "/", "permanent": true}, {"source": "/page/:num/", "destination": "/", "permanent": true}, {"source": "/yazilarimiz/page/:num", "destination": "/yazilarimiz", "permanent": true}, {"source": "/yazilarimiz/page/:num/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/wp-admin", "destination": "/giris", "permanent": true}, {"source": "/wp-admin/", "destination": "/giris", "permanent": true}, {"source": "/wp-login.php", "destination": "/giris", "permanent": true}, {"source": "/wp-content/:path*", "destination": "/", "permanent": false}, {"source": "/wp-includes/:path*", "destination": "/", "permanent": false}, {"source": "/wp-json/:path*", "destination": "/", "permanent": false}, {"source": "/feed", "destination": "/yazilarimiz", "permanent": true}, {"source": "/feed/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/comments/feed", "destination": "/yazilarimiz", "permanent": true}, {"source": "/comments/feed/", "destination": "/yazilarimiz", "permanent": true}, {"source": "/xmlrpc.php", "destination": "/", "permanent": true}, {"source": "/sitemap_index.xml", "destination": "/sitemap.xml", "permanent": true}, {"source": "/post-sitemap.xml", "destination": "/sitemap.xml", "permanent": true}, {"source": "/page-sitemap.xml", "destination": "/sitemap.xml", "permanent": true}]

export default function SiteYonetim() {
  const [sekme, setSekme] = useState('ayarlar')
  const [ayarlar, setAyarlar] = useState<Record<string,string>>({})
  const [hizmetler, setHizmetler] = useState<any[]>([])
  const [egitimler, setEgitimler] = useState<any[]>([])
  const [ekip, setEkip] = useState<any[]>([])
  const [referanslar, setReferanslar] = useState<any[]>([])
  const [yazilar, setYazilar] = useState<any[]>([])
  const [talepler, setTalepler] = useState<any[]>([])
  const [seoData, setSeoData] = useState<any[]>([])
  const [seciliSeo, setSeciliSeo] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [modal, setModal] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  // Yönlendirme state
  const [yonlendirmeler, setYonlendirmeler] = useState<any[]>([])
  const [yonArama, setYonArama] = useState('')
  const [yonForm, setYonForm] = useState({ source: '', destination: '', permanent: true })
  const [yonKaydediliyor, setYonKaydediliyor] = useState(false)
  const [yonBasari, setYonBasari] = useState('')
  const [yonHata, setYonHata] = useState('')

  const sb = createClient()

  useEffect(() => { yukle() }, [sekme])
  useEffect(() => {
    if (sekme === 'yonlendirmeler') setYonlendirmeler(VERCEL_REDIRECTLER)
  }, [sekme])

  async function yukle() {
    setYukleniyor(true)
    if (sekme === 'ayarlar') {
      const { data } = await sb.from('site_ayarlar').select('*')
      const a: Record<string,string> = {}
      ;(data||[]).forEach((r:any) => { a[r.anahtar]=r.deger })
      setAyarlar(a)
    } else if (sekme === 'hizmetler') {
      const { data } = await sb.from('site_hizmetler').select('*').order('sira')
      setHizmetler(data||[])
    } else if (sekme === 'egitimler') {
      const { data } = await sb.from('site_egitimler').select('*').order('sira')
      setEgitimler(data||[])
    } else if (sekme === 'ekip') {
      const { data } = await sb.from('site_ekip').select('*').order('sira')
      setEkip(data||[])
    } else if (sekme === 'referanslar') {
      const { data } = await sb.from('site_referanslar').select('*').order('sira')
      setReferanslar(data||[])
    } else if (sekme === 'yazilar') {
      const { data } = await sb.from('site_yazilar').select('*').order('olusturuldu_at', { ascending: false })
      setYazilar(data||[])
    } else if (sekme === 'talepler') {
      const { data } = await sb.from('site_teklif_talepleri').select('*').order('olusturuldu_at', { ascending: false })
      setTalepler(data||[])
    } else if (sekme === 'seo') {
      const { data } = await sb.from('site_seo').select('*').order('sayfa')
      setSeoData(data||[])
    }
    setYukleniyor(false)
  }

  async function ayarKaydet() {
    setKaydediliyor(true)
    const updates = Object.entries(ayarlar).map(([anahtar, deger]) => ({ anahtar, deger }))
    for (const u of updates) {
      await sb.from('site_ayarlar').upsert(u, { onConflict: 'anahtar' })
    }
    setKaydediliyor(false)
  }

  async function sil(tablo: string, id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await sb.from(tablo).delete().eq('id', id)
    yukle()
  }

  async function kaydet(tablo: string) {
    if (form.id) {
      await sb.from(tablo).update(form).eq('id', form.id)
    } else {
      await sb.from(tablo).insert(form)
    }
    setModal(null); setForm({})
    yukle()
  }

  async function talepDurumGuncelle(id: string, durum: string) {
    await sb.from('site_teklif_talepleri').update({ durum }).eq('id', id)
    yukle()
  }

  // Yönlendirme: GitHub API üzerinden vercel.json güncelle
  async function yonlendirmeKaydet(yeniListe: any[]) {
    setYonKaydediliyor(true)
    setYonBasari(''); setYonHata('')
    try {
      // vercel.json içeriğini al
      const getRes = await fetch('https://api.github.com/repos/milgotest32/fototest/contents/vercel.json', {
        headers: { 'Authorization': `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
      })
      const getJson = await getRes.json()
      const mevcut = JSON.parse(atob(getJson.content.replace(/\n/g,'')))
      mevcut.redirects = yeniListe

      const putRes = await fetch('https://api.github.com/repos/milgotest32/fototest/contents/vercel.json', {
        method: 'PUT',
        headers: { 'Authorization': `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `redirect: vercel.json guncellendi (${yeniListe.length} kural)`,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(mevcut, null, 2)))),
          sha: getJson.sha,
          branch: 'main'
        })
      })
      if (putRes.ok) {
        setYonlendirmeler(yeniListe)
        setYonBasari('✓ Kaydedildi! Deploy ~1 dakika içinde yayınlanır.')
      } else {
        const err = await putRes.json()
        setYonHata('Hata: ' + (err.message || 'Bilinmeyen hata'))
      }
    } catch (e: any) {
      setYonHata('Hata: ' + e.message)
    }
    setYonKaydediliyor(false)
  }

  function yonEkle() {
    if (!yonForm.source || !yonForm.destination) return
    const s = yonForm.source.startsWith('/') ? yonForm.source : '/' + yonForm.source
    const d = yonForm.destination.startsWith('/') || yonForm.destination.startsWith('http') ? yonForm.destination : '/' + yonForm.destination
    const yeniListe = [...yonlendirmeler, { source: s, destination: d, permanent: yonForm.permanent }]
    setYonForm({ source: '', destination: '', permanent: true })
    yonlendirmeKaydet(yeniListe)
  }

  function yonSil(idx: number) {
    if (!confirm('Bu yönlendirmeyi silmek istediğinize emin misiniz?')) return
    const yeniListe = yonlendirmeler.filter((_, i) => i !== idx)
    yonlendirmeKaydet(yeniListe)
  }

  const filtreliYon = yonlendirmeler.filter(r =>
    r.source.toLowerCase().includes(yonArama.toLowerCase()) ||
    r.destination.toLowerCase().includes(yonArama.toLowerCase())
  )

  const card: any = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }
  const inp: any = { width:'100%', marginBottom:14 }
  const lbl = (t: string) => <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{t}</label>

  return (
    <div className="page-wrap fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 className="page-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Globe size={24} color="var(--accent)" /> Web Sitesi Yönetimi
          </h1>
          <p className="page-sub">Tanıtım sitesinin içeriklerini buradan düzenleyebilirsiniz.</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'var(--accent)', textDecoration:'none' }}>
          <ExternalLink size={14} /> Siteyi Görüntüle
        </a>
      </div>

      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:24, background:'var(--surface)', padding:6, borderRadius:12, border:'1px solid var(--border)' }}>
        {SEKMELER.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSekme(id)} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer',
            background: sekme===id ? 'var(--accent)' : 'transparent',
            color: sekme===id ? '#fff' : 'var(--text-dim)',
            fontSize:13, fontWeight:500, fontFamily:'inherit',
          }}>
            <Icon size={14} />{label}
            {id==='talepler' && talepler.filter(t=>t.durum==='Yeni').length > 0 && (
              <span style={{ background:'var(--red)', color:'#fff', borderRadius:100, padding:'1px 6px', fontSize:10, fontWeight:700 }}>
                {talepler.filter(t=>t.durum==='Yeni').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {sekme !== 'yonlendirmeler' && yukleniyor ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-faint)' }}>Yükleniyor...</div>
      ) : (
        <>
        {sekme === 'ayarlar' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div className="card" style={{ padding:24 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20, color:'var(--text)' }}>Genel Bilgiler</h3>
              {[['sirket_adi','Şirket Adı'],['slogan','Slogan'],['aciklama','Açıklama']].map(([k,l]) => (
                <div key={k} style={{ marginBottom:14 }}>
                  {lbl(l)}
                  <input value={ayarlar[k]||''} onChange={e=>setAyarlar({...ayarlar,[k]:e.target.value})} />
                </div>
              ))}
              <h3 style={{ fontSize:15, fontWeight:700, margin:'20px 0 14px', color:'var(--text)' }}>İstatistikler</h3>
              {[['stat_kurum','Kurum Sayısı'],['stat_yil','Yıllık Deneyim'],['stat_egitim','Eğitim Sayısı']].map(([k,l]) => (
                <div key={k} style={{ marginBottom:14 }}>
                  {lbl(l)}
                  <input value={ayarlar[k]||''} onChange={e=>setAyarlar({...ayarlar,[k]:e.target.value})} />
                </div>
              ))}
            </div>
            <div className="card" style={{ padding:24 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20, color:'var(--text)' }}>İletişim Bilgileri</h3>
              {[['telefon_1','Telefon 1'],['telefon_2','Telefon 2'],['email','E-Posta'],['adres','Adres'],['calisma_saatleri','Çalışma Saatleri']].map(([k,l]) => (
                <div key={k} style={{ marginBottom:14 }}>
                  {lbl(l)}
                  <input value={ayarlar[k]||''} onChange={e=>setAyarlar({...ayarlar,[k]:e.target.value})} />
                </div>
              ))}
              <h3 style={{ fontSize:15, fontWeight:700, margin:'20px 0 14px', color:'var(--text)' }}>Sosyal Medya</h3>
              {[['facebook','Facebook URL'],['instagram','Instagram URL'],['whatsapp','WhatsApp Link']].map(([k,l]) => (
                <div key={k} style={{ marginBottom:14 }}>
                  {lbl(l)}
                  <input value={ayarlar[k]||''} onChange={e=>setAyarlar({...ayarlar,[k]:e.target.value})} />
                </div>
              ))}
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <button className="btn" onClick={ayarKaydet} disabled={kaydediliyor}>
                <Check size={16} />{kaydediliyor ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </button>
            </div>
          </div>
        )}

        {sekme === 'hizmetler' && (
          <div>
            <button className="btn" style={{ marginBottom:20 }} onClick={() => { setForm({ ikon:'🛡️', sira: hizmetler.length+1, aktif:true }); setModal('hizmet') }}>
              <Plus size={16} /> Yeni Hizmet
            </button>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {hizmetler.map(h => (
                <div key={h.id} style={card}>
                  <div style={{ display:'flex', alignItems:'center', gap:14, flex:1 }}>
                    <span style={{ fontSize:24 }}>{h.ikon}</span>
                    <div>
                      <div style={{ fontWeight:600, color:'var(--text)', fontSize:14 }}>{h.baslik}</div>
                      <div style={{ fontSize:12, color:'var(--text-faint)', marginTop:2 }}>{h.aciklama?.slice(0,60)}...</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-ghost" style={{ padding:'6px 12px' }} onClick={() => { setForm(h); setModal('hizmet') }}><Pencil size={14}/></button>
                    <button className="btn btn-ghost" style={{ padding:'6px 12px', color:'var(--red)' }} onClick={() => sil('site_hizmetler', h.id)}><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sekme === 'egitimler' && (
          <div>
            <button className="btn" style={{ marginBottom:20 }} onClick={() => { setForm({ sertifika:true, sira: egitimler.length+1, aktif:true }); setModal('egitim') }}>
              <Plus size={16} /> Yeni Eğitim
            </button>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {egitimler.map(e => (
                <div key={e.id} style={card}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, color:'var(--text)', fontSize:14 }}>{e.baslik}</div>
                    <div style={{ fontSize:12, color:'var(--text-faint)', marginTop:2 }}>{e.sure} {e.sertifika ? '· Sertifikalı' : ''}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-ghost" style={{ padding:'6px 12px' }} onClick={() => { setForm(e); setModal('egitim') }}><Pencil size={14}/></button>
                    <button className="btn btn-ghost" style={{ padding:'6px 12px', color:'var(--red)' }} onClick={() => sil('site_egitimler', e.id)}><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sekme === 'ekip' && (
          <div>
            <button className="btn" style={{ marginBottom:20 }} onClick={() => { setForm({ aktif:true, sira: ekip.length+1 }); setModal('ekip') }}>
              <Plus size={16} /> Yeni Üye
            </button>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
              {ekip.map(u => (
                <div key={u.id} className="card" style={{ padding:20, textAlign:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(99,102,241,.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:20, fontWeight:800, color:'var(--accent)' }}>
                    {u.ad_soyad?.charAt(0)}
                  </div>
                  <div style={{ fontWeight:700, color:'var(--text)', marginBottom:4 }}>{u.ad_soyad}</div>
                  <div style={{ fontSize:12, color:'var(--accent)', marginBottom:12 }}>{u.unvan}</div>
                  <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                    <button className="btn btn-ghost" style={{ padding:'6px 12px' }} onClick={() => { setForm(u); setModal('ekip') }}><Pencil size={14}/></button>
                    <button className="btn btn-ghost" style={{ padding:'6px 12px', color:'var(--red)' }} onClick={() => sil('site_ekip', u.id)}><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sekme === 'referanslar' && (
          <div>
            <button className="btn" style={{ marginBottom:20 }} onClick={() => { setForm({ aktif:true, sira: referanslar.length+1 }); setModal('referans') }}>
              <Plus size={16} /> Yeni Referans
            </button>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
              {referanslar.map(r => (
                <div key={r.id} className="card" style={{ padding:'16px 20px' }}>
                  <div style={{ fontWeight:600, color:'var(--text)', marginBottom:4 }}>{r.firma_adi}</div>
                  <div style={{ fontSize:12, color:'var(--text-faint)' }}>{r.sektor}</div>
                  <div style={{ display:'flex', gap:6, marginTop:12 }}>
                    <button className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => { setForm(r); setModal('referans') }}><Pencil size={12}/></button>
                    <button className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:12, color:'var(--red)' }} onClick={() => sil('site_referanslar', r.id)}><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sekme === 'yazilar' && (
          <div>
            <button className="btn" style={{ marginBottom:20 }} onClick={() => { setForm({ yayinda:false, yazar:'Admin' }); setModal('yazi') }}>
              <Plus size={16} /> Yeni Yazı
            </button>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {yazilar.map(y => (
                <div key={y.id} style={card}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, color:'var(--text)', fontSize:14 }}>{y.baslik}</div>
                    <div style={{ fontSize:12, color:'var(--text-faint)', marginTop:2 }}>{y.yazar} · {y.yayinda ? '🟢 Yayında' : '⚪ Taslak'}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-ghost" style={{ padding:'6px 12px' }} onClick={() => { setForm(y); setModal('yazi') }}><Pencil size={14}/></button>
                    <button className="btn btn-ghost" style={{ padding:'6px 12px', color:'var(--red)' }} onClick={() => sil('site_yazilar', y.id)}><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sekme === 'talepler' && (
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Ad Soyad</th><th>Telefon</th><th>Firma</th><th>Hizmet</th><th>Tehlike Sınıfı</th><th>Tarih</th><th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {talepler.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight:600 }}>{t.ad_soyad}</td>
                    <td>{t.telefon}</td>
                    <td>{t.firma_adi}</td>
                    <td>{t.hizmet_turu}</td>
                    <td>{t.tehlike_sinifi}</td>
                    <td style={{ fontSize:12, color:'var(--text-faint)' }}>{new Date(t.olusturuldu_at).toLocaleDateString('tr-TR')}</td>
                    <td>
                      <select value={t.durum} onChange={e=>talepDurumGuncelle(t.id,e.target.value)} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', color:'var(--text)', fontSize:12 }}>
                        <option>Yeni</option><option>İnceleniyor</option><option>Teklif Gönderildi</option><option>Kapatıldı</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sekme === 'seo' && (
          <div style={{ display:'grid', gridTemplateColumns: seciliSeo ? '280px 1fr' : '1fr', gap:20 }}>
            <div className="card" style={{ padding:0, height:'fit-content' }}>
              {seoData.map(s => (
                <div key={s.id} onClick={() => setSeciliSeo(s)} style={{
                  padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid var(--border)',
                  background: seciliSeo?.id === s.id ? 'rgba(245,194,0,.06)' : 'transparent',
                  borderLeft: seciliSeo?.id === s.id ? '3px solid #f5c200' : '3px solid transparent',
                }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{s.sayfa}</div>
                  <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{s.title}</div>
                </div>
              ))}
            </div>
            {seciliSeo && (
              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontWeight:700, color:'var(--text)', marginBottom:20 }}>SEO: {seciliSeo.sayfa}</h3>
                {[['title','Sayfa Başlığı (Title)'],['description','Meta Description'],['keywords','Keywords'],['og_title','OG Title (Sosyal Medya)'],['og_description','OG Description'],['og_image','OG Image URL'],['canonical','Canonical URL']].map(([k,l]) => (
                  <div key={k} style={{ marginBottom:14 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>{l}</label>
                    {k === 'description' || k === 'og_description' ? (
                      <textarea value={seciliSeo[k]||''} onChange={e => setSeciliSeo({...seciliSeo,[k]:e.target.value})} style={{ minHeight:70, resize:'vertical' }} />
                    ) : (
                      <input value={seciliSeo[k]||''} onChange={e => setSeciliSeo({...seciliSeo,[k]:e.target.value})} />
                    )}
                    {k === 'title' && <div style={{ fontSize:11, color: (seciliSeo[k]||'').length > 60 ? 'var(--red)' : 'var(--text-faint)', marginTop:4 }}>{(seciliSeo[k]||'').length}/60 karakter</div>}
                    {k === 'description' && <div style={{ fontSize:11, color: (seciliSeo[k]||'').length > 160 ? 'var(--red)' : 'var(--text-faint)', marginTop:4 }}>{(seciliSeo[k]||'').length}/160 karakter</div>}
                  </div>
                ))}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Robots</label>
                  <select value={seciliSeo.robots||'index, follow'} onChange={e => setSeciliSeo({...seciliSeo, robots:e.target.value})}>
                    <option value="index, follow">index, follow</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="index, nofollow">index, nofollow</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                  </select>
                </div>
                <button className="btn" onClick={async () => {
                  await sb.from('site_seo').update({ ...seciliSeo, guncellendi_at: new Date().toISOString() }).eq('id', seciliSeo.id)
                  yukle()
                }}><Check size={16} /> SEO Kaydet</button>
              </div>
            )}
          </div>
        )}

        {/* 301 YÖNLENDİRMELER */}
        {sekme === 'yonlendirmeler' && (
          <div>
            {/* Yeni ekle formu */}
            <div className="card" style={{ padding:20, marginBottom:20 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <Plus size={16} color="var(--accent)" /> Yeni Yönlendirme Ekle
              </h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto auto', gap:12, alignItems:'end' }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Kaynak URL</label>
                  <input
                    value={yonForm.source}
                    onChange={e => setYonForm({...yonForm, source: e.target.value})}
                    placeholder="/eski-sayfa"
                    onKeyDown={e => e.key === 'Enter' && yonEkle()}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Hedef URL</label>
                  <input
                    value={yonForm.destination}
                    onChange={e => setYonForm({...yonForm, destination: e.target.value})}
                    placeholder="/yeni-sayfa"
                    onKeyDown={e => e.key === 'Enter' && yonEkle()}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Tür</label>
                  <select value={yonForm.permanent ? '301' : '302'} onChange={e => setYonForm({...yonForm, permanent: e.target.value === '301'})}
                    style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', color:'var(--text)', fontSize:13, fontFamily:'inherit' }}>
                    <option value="301">301 Kalıcı</option>
                    <option value="302">302 Geçici</option>
                  </select>
                </div>
                <button className="btn" onClick={yonEkle} disabled={yonKaydediliyor || !yonForm.source || !yonForm.destination}>
                  {yonKaydediliyor ? <RefreshCw size={14} /> : <Plus size={14} />} Ekle
                </button>
              </div>
              {yonBasari && <div style={{ marginTop:12, padding:'8px 14px', background:'rgba(52,211,153,.1)', border:'1px solid rgba(52,211,153,.2)', borderRadius:8, fontSize:13, color:'var(--green)' }}>{yonBasari}</div>}
              {yonHata && <div style={{ marginTop:12, padding:'8px 14px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, fontSize:13, color:'var(--red)' }}>{yonHata}</div>}
            </div>

            {/* Arama + tablo */}
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <ArrowRight size={16} color="var(--accent)" />
                  <span style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>Mevcut Yönlendirmeler</span>
                  <span style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:100, padding:'2px 10px', fontSize:12, color:'var(--text-faint)' }}>{yonlendirmeler.length} kural</span>
                </div>
                <input
                  value={yonArama}
                  onChange={e => setYonArama(e.target.value)}
                  placeholder="URL ara..."
                  style={{ width:220 }}
                />
              </div>
              <div style={{ overflowX:'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width:40 }}>#</th>
                      <th>Kaynak URL</th>
                      <th style={{ width:40, textAlign:'center' }}></th>
                      <th>Hedef URL</th>
                      <th style={{ width:80 }}>Tür</th>
                      <th style={{ width:60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtreliYon.map((r, i) => {
                      const gercekIdx = yonlendirmeler.indexOf(r)
                      return (
                        <tr key={i}>
                          <td style={{ color:'var(--text-faint)', fontSize:12 }}>{gercekIdx + 1}</td>
                          <td style={{ fontFamily:'monospace', fontSize:12, color:'var(--blue)' }}>{r.source}</td>
                          <td style={{ textAlign:'center', color:'var(--text-faint)' }}>→</td>
                          <td style={{ fontFamily:'monospace', fontSize:12, color:'var(--green)' }}>{r.destination}</td>
                          <td>
                            <span style={{
                              display:'inline-block', padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:700,
                              background: r.permanent ? 'rgba(99,102,241,.15)' : 'rgba(251,191,36,.15)',
                              color: r.permanent ? 'var(--accent)' : 'var(--amber)'
                            }}>
                              {r.permanent ? '301' : '302'}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-ghost" style={{ padding:'4px 8px', color:'var(--red)' }} onClick={() => yonSil(gercekIdx)}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {/* MODALLER */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget) { setModal(null); setForm({}) } }}>
          <div className="modal-content">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontWeight:700, color:'var(--text)' }}>
                {modal==='hizmet' ? 'Hizmet' : modal==='egitim' ? 'Eğitim' : modal==='ekip' ? 'Ekip Üyesi' : modal==='referans' ? 'Referans' : 'Yazı'} {form.id ? 'Düzenle' : 'Ekle'}
              </h3>
              <button style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }} onClick={() => { setModal(null); setForm({}) }}><X size={20}/></button>
            </div>

            {modal === 'hizmet' && (
              <div className="modal-grid">
                <div style={{ gridColumn:'1/-1' }}>{lbl('İkon (emoji)')}<input style={inp} value={form.ikon||''} onChange={e=>setForm({...form,ikon:e.target.value})} /></div>
                <div style={{ gridColumn:'1/-1' }}>{lbl('Başlık')}<input style={inp} value={form.baslik||''} onChange={e=>setForm({...form,baslik:e.target.value})} /></div>
                <div style={{ gridColumn:'1/-1' }}>{lbl('Açıklama')}<textarea value={form.aciklama||''} onChange={e=>setForm({...form,aciklama:e.target.value})} /></div>
                <div style={{ gridColumn:'1/-1' }}>{lbl('Etiketler (· ile ayırın)')}<input style={inp} value={form.etiketler||''} onChange={e=>setForm({...form,etiketler:e.target.value})} /></div>
                <div>{lbl('Sıra')}<input type="number" style={inp} value={form.sira||0} onChange={e=>setForm({...form,sira:+e.target.value})} /></div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:20 }}>
                  <input type="checkbox" checked={!!form.aktif} onChange={e=>setForm({...form,aktif:e.target.checked})} />
                  <label style={{ color:'var(--text-dim)', fontSize:13 }}>Aktif</label>
                </div>
              </div>
            )}
            {modal === 'egitim' && (
              <div className="modal-grid">
                <div style={{ gridColumn:'1/-1' }}>{lbl('Başlık')}<input style={inp} value={form.baslik||''} onChange={e=>setForm({...form,baslik:e.target.value})} /></div>
                <div style={{ gridColumn:'1/-1' }}>{lbl('Açıklama')}<textarea value={form.aciklama||''} onChange={e=>setForm({...form,aciklama:e.target.value})} /></div>
                <div>{lbl('Süre')}<input style={inp} value={form.sure||''} onChange={e=>setForm({...form,sure:e.target.value})} /></div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:20 }}>
                  <input type="checkbox" checked={!!form.sertifika} onChange={e=>setForm({...form,sertifika:e.target.checked})} />
                  <label style={{ color:'var(--text-dim)', fontSize:13 }}>Sertifikalı</label>
                </div>
              </div>
            )}
            {modal === 'ekip' && (
              <div className="modal-grid">
                <div style={{ gridColumn:'1/-1' }}>{lbl('Ad Soyad')}<input style={inp} value={form.ad_soyad||''} onChange={e=>setForm({...form,ad_soyad:e.target.value})} /></div>
                <div>{lbl('Ünvan')}<input style={inp} value={form.unvan||''} onChange={e=>setForm({...form,unvan:e.target.value})} /></div>
                <div>{lbl('Uzmanlık')}<input style={inp} value={form.uzmanlik||''} onChange={e=>setForm({...form,uzmanlik:e.target.value})} /></div>
              </div>
            )}
            {modal === 'referans' && (
              <div className="modal-grid">
                <div style={{ gridColumn:'1/-1' }}>{lbl('Firma Adı')}<input style={inp} value={form.firma_adi||''} onChange={e=>setForm({...form,firma_adi:e.target.value})} /></div>
                <div style={{ gridColumn:'1/-1' }}>{lbl('Sektör')}<input style={inp} value={form.sektor||''} onChange={e=>setForm({...form,sektor:e.target.value})} /></div>
              </div>
            )}
            {modal === 'yazi' && (
              <div className="modal-grid">
                <div style={{ gridColumn:'1/-1' }}>{lbl('Başlık')}<input style={inp} value={form.baslik||''} onChange={e=>setForm({...form,baslik:e.target.value})} /></div>
                <div style={{ gridColumn:'1/-1' }}>{lbl('Özet')}<textarea value={form.ozet||''} onChange={e=>setForm({...form,ozet:e.target.value})} /></div>
                <div>{lbl('Yazar')}<input style={inp} value={form.yazar||'Admin'} onChange={e=>setForm({...form,yazar:e.target.value})} /></div>
                <div>{lbl('Yayın Tarihi')}<input type="date" style={inp} value={form.yayinlandi_at?.slice(0,10)||''} onChange={e=>setForm({...form,yayinlandi_at:e.target.value})} /></div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={!!form.yayinda} onChange={e=>setForm({...form,yayinda:e.target.checked})} />
                  <label style={{ color:'var(--text-dim)', fontSize:13 }}>Yayında</label>
                </div>
              </div>
            )}

            <div style={{ marginTop:24, display:'flex', gap:10 }}>
              <button className="btn" onClick={() => kaydet(
                modal==='hizmet' ? 'site_hizmetler' :
                modal==='egitim' ? 'site_egitimler' :
                modal==='ekip' ? 'site_ekip' :
                modal==='referans' ? 'site_referanslar' : 'site_yazilar'
              )}>
                <Check size={16} /> Kaydet
              </button>
              <button className="btn btn-ghost" onClick={() => { setModal(null); setForm({}) }}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
