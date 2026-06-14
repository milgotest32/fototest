'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { AlertTriangle, Building2, Users, FileWarning, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface EksikFirma {
  id: string
  unvan: string
  sgk_sicil: string | null
  telefon: string | null
  yetkili: string | null
  tehlike_sinifi: string | null
}

interface EksikHasta {
  id: string
  ad_soyad: string
  firma: string | null
  tarih: string
  pr_no: number
}

interface EksikKatip {
  id: string
  sozlesme_id: number | null
  gorevlendirilen_ad: string | null
  sozlesme_turu: string | null
  baslangic_tarihi: string | null
}

interface Ozet {
  kategori: string
  adet: number
}

type Tab = 'ozet' | 'firmalar-sicil' | 'firmalar-telefon' | 'firmalar-yetkili' | 'katip'

export default function EksikVerilerPage() {
  const supabase = createClient()

  const [aktifTab, setAktifTab] = useState<Tab>('ozet')
  const [ozet, setOzet] = useState<Ozet[]>([])
  const [eksikSicilFirmalar, setEksikSicilFirmalar] = useState<EksikFirma[]>([])
  const [eksikTelefonFirmalar, setEksikTelefonFirmalar] = useState<EksikFirma[]>([])
  const [eksikYetkililiFirmalar, setEksikYetkililiFirmalar] = useState<EksikFirma[]>([])
  const [eksikKatip, setEksikKatip] = useState<EksikKatip[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [sonGuncelleme, setSonGuncelleme] = useState<Date>(new Date())

  async function veriYukle() {
    setYukleniyor(true)

    // Özet
    const { data: firmalarData } = await supabase
      .from('firmalar')
      .select('id, unvan, sgk_sicil, telefon, yetkili, tehlike_sinifi')
      .eq('aktif', true)

    const firmalar = firmalarData || []
    const sicilBos = firmalar.filter(f => !f.sgk_sicil || f.sgk_sicil === '')
    const telefonBos = firmalar.filter(f => !f.telefon || f.telefon === '')
    const yetkiliBos = firmalar.filter(f => !f.yetkili || f.yetkili === '')

    setEksikSicilFirmalar(sicilBos)
    setEksikTelefonFirmalar(telefonBos)
    setEksikYetkililiFirmalar(yetkiliBos)

    // Katip sözleşmeleri - firma_id boş olanlar
    const { data: katipData } = await supabase
      .from('katip_sozlesmeleri')
      .select('id, sozlesme_id, gorevlendirilen_ad, sozlesme_turu, baslangic_tarihi')
      .is('firma_id', null)
      .order('gorevlendirilen_ad')
      .limit(200)

    setEksikKatip(katipData || [])

    setOzet([
      { kategori: 'SGK Sicil Numarası Eksik Firmalar', adet: sicilBos.length },
      { kategori: 'Telefon Eksik Firmalar', adet: telefonBos.length },
      { kategori: 'Yetkili Kişi Eksik Firmalar', adet: yetkiliBos.length },
      { kategori: 'Firma Bağlantısı Olmayan Katip Sözleşmeleri', adet: (katipData || []).length },
    ])

    setSonGuncelleme(new Date())
    setYukleniyor(false)
  }

  useEffect(() => {
    veriYukle()
  }, [])

  const toplamEksik = ozet.reduce((a, b) => a + b.adet, 0)

  const tablar: { key: Tab; label: string; icon: React.ReactNode; adet: number; renk: string }[] = [
    { key: 'ozet', label: 'Genel Özet', icon: <AlertTriangle size={16} />, adet: toplamEksik, renk: 'orange' },
    { key: 'firmalar-sicil', label: 'SGK Sicil Eksik', icon: <Building2 size={16} />, adet: eksikSicilFirmalar.length, renk: 'red' },
    { key: 'firmalar-telefon', label: 'Telefon Eksik', icon: <Building2 size={16} />, adet: eksikTelefonFirmalar.length, renk: 'yellow' },
    { key: 'firmalar-yetkili', label: 'Yetkili Eksik', icon: <Users size={16} />, adet: eksikYetkililiFirmalar.length, renk: 'yellow' },
    { key: 'katip', label: 'Katip Bağlantısız', icon: <FileWarning size={16} />, adet: eksikKatip.length, renk: 'blue' },
  ]

  const renkHarita: Record<string, string> = {
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  }

  const badgeRenk: Record<string, string> = {
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
  }

  function TehlikeBadge({ sinif }: { sinif: string | null }) {
    if (!sinif) return <span className="text-gray-400 text-xs">—</span>
    const renkler: Record<string, string> = {
      'AZ TEHLİKELİ': 'bg-green-100 text-green-700',
      'TEHLİKELİ': 'bg-yellow-100 text-yellow-700',
      'ÇOK TEHLİKELİ': 'bg-red-100 text-red-700',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${renkler[sinif] || 'bg-gray-100 text-gray-600'}`}>
        {sinif}
      </span>
    )
  }

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw size={20} className="animate-spin" />
          <span>Eksik veriler analiz ediliyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={24} />
            Eksik Veriler
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Son güncelleme: {sonGuncelleme.toLocaleTimeString('tr-TR')}
          </p>
        </div>
        <button
          onClick={veriYukle}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          Yenile
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {tablar.slice(1).map(tab => (
          <button
            key={tab.key}
            onClick={() => setAktifTab(tab.key)}
            className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${
              aktifTab === tab.key
                ? renkHarita[tab.renk] + ' shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl font-bold mb-1">{tab.adet}</div>
            <div className="text-sm font-medium">{tab.label}</div>
          </button>
        ))}
      </div>

      {/* Kritik uyarı banner */}
      {eksikSicilFirmalar.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {eksikSicilFirmalar.length} aktif firmanın SGK sicil numarası eksik
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              SGK sicil numarası olmadan KATİP sözleşme eşleştirmesi ve resmi raporlama yapılamaz.
            </p>
          </div>
        </div>
      )}

      {/* Tab navigasyon */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {tablar.map(tab => (
          <button
            key={tab.key}
            onClick={() => setAktifTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              aktifTab === tab.key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.adet > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                aktifTab === tab.key ? badgeRenk[tab.renk] : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.adet}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* İçerik */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* GENEL ÖZET */}
        {aktifTab === 'ozet' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Eksik Veri Özeti</h2>
            <div className="space-y-3">
              {[
                { key: 'firmalar-sicil' as Tab, label: 'SGK Sicil Numarası Eksik Firmalar', adet: eksikSicilFirmalar.length, aciklama: 'KATİP eşleştirmesi yapılamıyor. Firmadan veya SGK e-bildirge sisteminden alınabilir.', oncelik: 'Kritik', renk: 'red' },
                { key: 'katip' as Tab, label: 'Firma Bağlantısı Olmayan Katip Sözleşmeleri', adet: eksikKatip.length, aciklama: 'Sözleşmelerin hangi firmaya ait olduğu bilinmiyor. Sözleşme unvanına göre eşleştirilmeli.', oncelik: 'Yüksek', renk: 'orange' },
                { key: 'firmalar-telefon' as Tab, label: 'Telefon Eksik Firmalar', adet: eksikTelefonFirmalar.length, aciklama: 'Acil iletişim kurulamaması riski. Firmadan güncel telefon alınmalı.', oncelik: 'Orta', renk: 'yellow' },
                { key: 'firmalar-yetkili' as Tab, label: 'Yetkili Kişi Eksik Firmalar', adet: eksikYetkililiFirmalar.length, aciklama: 'Firma yetkili kişisi girilmemiş. Sözleşme süreçleri için gerekli.', oncelik: 'Orta', renk: 'yellow' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setAktifTab(item.key)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                >
                  <div className={`w-2 h-12 rounded-full ${
                    item.renk === 'red' ? 'bg-red-500' :
                    item.renk === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-900">{item.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.renk === 'red' ? 'bg-red-100 text-red-700' :
                        item.renk === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{item.oncelik}</span>
                    </div>
                    <p className="text-sm text-gray-500">{item.aciklama}</p>
                  </div>
                  <div className="text-2xl font-bold text-gray-700">{item.adet}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Not:</span> Hasta kayıtlarındaki doğum tarihi ve telefon eksiklikleri Excel kaynaklı olup tarihsel veridir. Bu eksiklikler hasta geldiğinde tamamlanabilir.
              </p>
            </div>
          </div>
        )}

        {/* SGK SİCİL EKSİK */}
        {aktifTab === 'firmalar-sicil' && (
          <>
            <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
              <p className="text-sm text-red-700">
                <span className="font-semibold">{eksikSicilFirmalar.length} aktif firmanın</span> SGK sicil numarası sisteme girilmemiş.
                Bu bilgi KATİP sözleşme eşleştirmesi için zorunludur.
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Firma Ünvanı</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tehlike Sınıfı</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Telefon</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Yetkili</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {eksikSicilFirmalar.map((firma, i) => (
                  <tr key={firma.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-3 font-medium text-gray-900">{firma.unvan}</td>
                    <td className="px-4 py-3"><TehlikeBadge sinif={firma.tehlike_sinifi} /></td>
                    <td className="px-4 py-3 text-gray-500">{firma.telefon || <span className="text-red-400">Boş</span>}</td>
                    <td className="px-4 py-3 text-gray-500">{firma.yetkili || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3">
                      <Link href={`/firmalar/${firma.id}`} className="text-blue-600 hover:text-blue-800">
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* TELEFON EKSİK */}
        {aktifTab === 'firmalar-telefon' && (
          <>
            <div className="px-6 py-4 border-b border-gray-100 bg-yellow-50">
              <p className="text-sm text-yellow-700">
                <span className="font-semibold">{eksikTelefonFirmalar.length} aktif firmanın</span> telefon numarası girilmemiş.
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Firma Ünvanı</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tehlike Sınıfı</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">SGK Sicil</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Yetkili</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {eksikTelefonFirmalar.map((firma, i) => (
                  <tr key={firma.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-3 font-medium text-gray-900">{firma.unvan}</td>
                    <td className="px-4 py-3"><TehlikeBadge sinif={firma.tehlike_sinifi} /></td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{firma.sgk_sicil || <span className="text-red-400">Boş</span>}</td>
                    <td className="px-4 py-3 text-gray-500">{firma.yetkili || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3">
                      <Link href={`/firmalar/${firma.id}`} className="text-blue-600 hover:text-blue-800">
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* YETKİLİ EKSİK */}
        {aktifTab === 'firmalar-yetkili' && (
          <>
            <div className="px-6 py-4 border-b border-gray-100 bg-yellow-50">
              <p className="text-sm text-yellow-700">
                <span className="font-semibold">{eksikYetkililiFirmalar.length} aktif firmanın</span> yetkili kişi bilgisi girilmemiş.
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Firma Ünvanı</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tehlike Sınıfı</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Telefon</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">SGK Sicil</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {eksikYetkililiFirmalar.map((firma, i) => (
                  <tr key={firma.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-3 font-medium text-gray-900">{firma.unvan}</td>
                    <td className="px-4 py-3"><TehlikeBadge sinif={firma.tehlike_sinifi} /></td>
                    <td className="px-4 py-3 text-gray-500">{firma.telefon || <span className="text-red-400">Boş</span>}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{firma.sgk_sicil || <span className="text-red-400">Boş</span>}</td>
                    <td className="px-4 py-3">
                      <Link href={`/firmalar/${firma.id}`} className="text-blue-600 hover:text-blue-800">
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* KATİP BAĞLANTISIZ */}
        {aktifTab === 'katip' && (
          <>
            <div className="px-6 py-4 border-b border-gray-100 bg-blue-50">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">{eksikKatip.length} KATİP sözleşmesinin</span> firma kaydıyla bağlantısı yok.
                Sözleşme unvanına bakarak firmalarla eşleştirin.
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">İşyeri Ünvanı</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sözleşme No</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sözleşme Türü</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Başlangıç</th>
                </tr>
              </thead>
              <tbody>
                {eksikKatip.map((k, i) => (
                  <tr key={k.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-3 font-medium text-gray-900">{k.gorevlendirilen_ad || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{k.sozlesme_id || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {k.sozlesme_turu || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {k.baslangic_tarihi ? new Date(k.baslangic_tarihi).toLocaleDateString('tr-TR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Alt bilgi */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Bu sayfa sadece aktif firmalar ve bağlantısız kayıtları göstermektedir. Çıkan firmalar dahil değildir.
      </p>
    </div>
  )
}
