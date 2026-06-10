'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, X, CalendarDays, Check, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

const DURUM_RENK: any = { 'Planlandı':'var(--blue)', 'Tamamlandı':'var(--green)', 'İptal':'var(--red)' }
const GOREV_TURLERI = ['Saha ziyareti','Risk değerlendirme','Eğitim','Ölçüm','Sağlık taraması','Diğer']

export default function Koordinasyon() {
  const [gorevler, setGorevler] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [seciliTarih, setSeciliTarih] = useState(new Date().toISOString().slice(0,10))
  const [haftalikMi, setHaftalikMi] = useState(false)
  const [form, setForm] = useState<any>(bosForm())

  function bosForm() {
    return { tarih: seciliTarih, uzman:'', firma_adi:'', gorev_turu:'Saha ziyareti', aciklama:'' }
  }

  const sb = createClient()
  useEffect(() => { yukle() }, [])

  async function yukle() {
    const { data, error } = await sb.from('gorevler').select('*').order('tarih', { ascending:false }).limit(500)
    if (error) { setHata('Veriler yüklenemedi.'); return }
    setGorevler(data || [])
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!form.uzman) return
    setHata('')
    const { error } = await sb.from('gorevler').insert(form)
    if (error) { setHata('Kayıt hatası: ' + error.message); return }
    setModal(false)
    setForm(bosForm())
    yukle()
  }

  async function durumGuncelle(id:string, durum:string) {
    await sb.from('gorevler').update({ durum }).eq('id', id)
    yukle()
  }

  async function sil(id: string) {
    if (!confirm('Bu görevi silmek istiyor musunuz?')) return
    await sb.from('gorevler').delete().eq('id', id)
    yukle()
  }

  function gunDegistir(fark: number) {
    const d = new Date(seciliTarih)
    d.setDate(d.getDate() + fark)
    setSeciliTarih(d.toISOString().slice(0,10))
  }

  // Haftalık görünüm: seçili günün haftasını bul
  function haftaGunleri() {
    const d = new Date(seciliTarih)
    const gun = d.getDay() // 0=Pazar
    const pazartesi = new Date(d)
    pazartesi.setDate(d.getDate() - (gun === 0 ? 6 : gun - 1))
    return Array.from({length:7}, (_,i) => {
      const g = new Date(pazartesi)
      g.setDate(pazartesi.getDate() + i)
      return g.toISOString().slice(0,10)
    })
  }

  const gunlukGorevler = gorevler.filter(g => g.tarih === seciliTarih)
  const uzmanlar = [...new Set(gorevler.map(g=>g.uzman).filter(Boolean))]
  const hafta = haftaGunleri()

  const TR_GUN = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

  return (
    <div className="page-wrap fade-in" style={{ padding:'32px 28px', maxWidth:1400, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Sora, sans-serif', fontSize:28, fontWeight:700, letterSpacing:-0.5 }}>İSG Koordinasyon</h1>
          <p style={{ color:'var(--text-dim)', fontSize:14, marginTop:4 }}>Uzman görev takvimi · {gorevler.length} toplam görev</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setHaftalikMi(!haftalikMi)}
            style={{ padding:'9px 16px', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:'inherit',
              background: haftalikMi?'var(--accent-soft)':'var(--surface)',
              border:`1px solid ${haftalikMi?'var(--accent)':'var(--border)'}`,
              color: haftalikMi?'var(--accent)':'var(--text-dim)' }}>
            Haftalık
          </button>
          <button className="btn" onClick={()=>{ setForm({...bosForm(), tarih:seciliTarih}); setModal(true) }}><Plus size={18} /> Görev Ekle</button>
        </div>
      </div>

      {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{hata}</div>}

      {/* TARİH NAVİGASYON */}
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:24, flexWrap:'wrap' }}>
        <button onClick={()=>gunDegistir(-1)} style={navBtn}><ChevronLeft size={18} /></button>
        <input type="date" value={seciliTarih} onChange={e=>setSeciliTarih(e.target.value)} style={{ maxWidth:180 }} />
        <button onClick={()=>gunDegistir(1)} style={navBtn}><ChevronRight size={18} /></button>
        <span style={{ color:'var(--text-dim)', fontSize:14 }}>
          {new Date(seciliTarih+'T00:00:00').toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' })}
        </span>
        <button onClick={()=>setSeciliTarih(new Date().toISOString().slice(0,10))}
          style={{ padding:'6px 12px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit', background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-dim)' }}>
          Bugün
        </button>
      </div>

      {/* HAFTALIK GÖRÜNÜM */}
      {haftalikMi && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, marginBottom:24 }}>
          {hafta.map((gun,i) => {
            const gunGorevleri = gorevler.filter(g=>g.tarih===gun)
            const bugun = gun === new Date().toISOString().slice(0,10)
            const secili = gun === seciliTarih
            return (
              <div key={gun} onClick={()=>setSeciliTarih(gun)}
                className="card" style={{ padding:'10px 8px', cursor:'pointer', textAlign:'center',
                  borderColor: secili ? 'var(--accent)' : bugun ? 'var(--border-strong)' : undefined,
                  background: secili ? 'var(--accent-soft)' : undefined }}>
                <div style={{ fontSize:11, color: secili?'var(--accent)':'var(--text-faint)', marginBottom:4 }}>{TR_GUN[i]}</div>
                <div style={{ fontSize:15, fontWeight:600, color: bugun?'var(--accent)':'var(--text)', marginBottom:6 }}>
                  {new Date(gun+'T00:00:00').getDate()}
                </div>
                {gunGorevleri.length > 0 && (
                  <div style={{ fontSize:11, background:'var(--blue-soft)', color:'var(--blue)', borderRadius:6, padding:'2px 4px' }}>
                    {gunGorevleri.length} görev
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* GÜNLÜK GÖREVLER */}
      <div style={{ marginBottom:8, color:'var(--text-dim)', fontSize:13, fontWeight:500 }}>
        {gunlukGorevler.length === 0 ? 'Bu tarihte görev yok' : `${gunlukGorevler.length} görev`}
      </div>

      {gunlukGorevler.length === 0 ? (
        <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-faint)' }}>
          <CalendarDays size={40} style={{ margin:'0 auto 16px', opacity:0.4 }} />
          <div style={{ marginBottom:16 }}>Bu tarihte görev yok</div>
          <button className="btn" onClick={()=>{ setForm({...bosForm(), tarih:seciliTarih}); setModal(true) }}><Plus size={16} /> Görev Ekle</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {gunlukGorevler.map(g => (
            <div key={g.id} className="card" style={{ padding:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:600 }}>{g.uzman}</div>
                  <div style={{ fontSize:13, color:'var(--text-dim)' }}>{g.gorev_turu}</div>
                </div>
                <span className="badge" style={{ background:`${DURUM_RENK[g.durum]}22`, color:DURUM_RENK[g.durum] }}>{g.durum}</span>
              </div>
              {g.firma_adi && <div style={{ fontSize:14, marginBottom:4, fontWeight:500 }}>{g.firma_adi}</div>}
              {g.aciklama && <div style={{ fontSize:13, color:'var(--text-dim)' }}>{g.aciklama}</div>}
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                {g.durum === 'Planlandı' && (
                  <button onClick={()=>durumGuncelle(g.id,'Tamamlandı')}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'var(--green-soft)', color:'var(--green)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:8, padding:'7px', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    <Check size={15} /> Tamamlandı
                  </button>
                )}
                {g.durum === 'Planlandı' && (
                  <button onClick={()=>durumGuncelle(g.id,'İptal')}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'7px 12px', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    İptal
                  </button>
                )}
                <button onClick={()=>sil(g.id)} style={{ background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', padding:4, marginLeft:'auto' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={modalHead}><h2 style={modalTitle}><CalendarDays size={20} color="var(--blue)" /> Görev Ekle</h2><button onClick={()=>setModal(false)} style={xBtn}><X size={22} /></button></div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={lbl}>Tarih</label><input type="date" value={form.tarih} onChange={e=>setForm({...form, tarih:e.target.value})} /></div>
              <div>
                <label style={lbl}>Uzman *</label>
                <input value={form.uzman} onChange={e=>setForm({...form, uzman:e.target.value})} placeholder="Uzman adı" list="uzmanlar-list" />
                <datalist id="uzmanlar-list">{uzmanlar.map(u=><option key={u} value={u} />)}</datalist>
              </div>
              <div><label style={lbl}>Firma</label><input value={form.firma_adi} onChange={e=>setForm({...form, firma_adi:e.target.value})} /></div>
              <div><label style={lbl}>Görev Türü</label>
                <select value={form.gorev_turu} onChange={e=>setForm({...form, gorev_turu:e.target.value})}>
                  {GOREV_TURLERI.map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Açıklama</label><textarea rows={2} value={form.aciklama} onChange={e=>setForm({...form, aciklama:e.target.value})} /></div>
            </div>
            {hata && <div style={{ background:'var(--red-soft)', color:'var(--red)', padding:'10px 14px', borderRadius:8, fontSize:13, marginTop:12 }}>{hata}</div>}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn-ghost btn" style={{ flex:1, justifyContent:'center' }} onClick={()=>setModal(false)}>İptal</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={kaydet}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl: any = { display:'block', fontSize:12, color:'var(--text-dim)', marginBottom:6, fontWeight:500 }
const ovl: any = { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
const modalBox: any = { width:'100%', maxWidth:460, padding:28, maxHeight:'90vh', overflowY:'auto' }
const modalHead: any = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }
const modalTitle: any = { fontFamily:'Sora, sans-serif', fontSize:20, fontWeight:600, display:'flex', alignItems:'center', gap:10 }
const xBtn: any = { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }
const navBtn: any = { background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-dim)', borderRadius:8, padding:'8px', cursor:'pointer', display:'flex', alignItems:'center' }
