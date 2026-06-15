'use client'
import { useState, useMemo } from 'react'

// Resmi İşyeri Tehlike Sınıfları Tebliği - Seçili NACE kodları
const NACE_VERITABANI = [
  // A - TARIM
  { kod: '01.11.01', tanim: 'Buğday yetiştiriciliği', sinif: 'Az Tehlikeli' },
  { kod: '01.11.02', tanim: 'Mısır yetiştiriciliği', sinif: 'Az Tehlikeli' },
  { kod: '01.13.01', tanim: 'Sebze yetiştiriciliği (açık alan)', sinif: 'Az Tehlikeli' },
  { kod: '01.21.01', tanim: 'Üzüm bağcılığı', sinif: 'Az Tehlikeli' },
  { kod: '01.41.01', tanim: 'Süt sığırcılığı', sinif: 'Tehlikeli' },
  { kod: '01.46.01', tanim: 'Domuz yetiştiriciliği', sinif: 'Tehlikeli' },
  { kod: '01.47.01', tanim: 'Tavukçuluk (et)', sinif: 'Tehlikeli' },
  { kod: '01.61.01', tanim: 'Tarımsal hizmet faaliyetleri', sinif: 'Tehlikeli' },
  { kod: '02.10.01', tanim: 'Ormancılık faaliyetleri', sinif: 'Çok Tehlikeli' },
  { kod: '03.11.01', tanim: 'Deniz balıkçılığı', sinif: 'Tehlikeli' },
  { kod: '03.22.01', tanim: 'Tatlı su balıkçılığı', sinif: 'Az Tehlikeli' },
  // B - MADENCİLİK
  { kod: '05.10.01', tanim: 'Taş kömürü çıkarma', sinif: 'Çok Tehlikeli' },
  { kod: '06.10.01', tanim: 'Ham petrol çıkarma', sinif: 'Çok Tehlikeli' },
  { kod: '06.20.01', tanim: 'Doğal gaz çıkarma', sinif: 'Çok Tehlikeli' },
  { kod: '07.10.01', tanim: 'Demir cevheri çıkarma', sinif: 'Çok Tehlikeli' },
  { kod: '07.21.01', tanim: 'Uranyum ve toryum madenciliği', sinif: 'Çok Tehlikeli' },
  { kod: '08.11.01', tanim: 'Mermer ve kireçtaşı ocakçılığı', sinif: 'Çok Tehlikeli' },
  { kod: '08.12.01', tanim: 'Çakıl ve kum çıkarma', sinif: 'Çok Tehlikeli' },
  { kod: '09.10.01', tanim: 'Petrol ve doğal gaz çıkarma hizmetleri', sinif: 'Çok Tehlikeli' },
  // C - İMALAT
  { kod: '10.11.01', tanim: 'Et işleme ve muhafazası', sinif: 'Tehlikeli' },
  { kod: '10.12.01', tanim: 'Kümes hayvanları eti işleme', sinif: 'Tehlikeli' },
  { kod: '10.13.01', tanim: 'Et ve kümes hayvanı ürünleri imalatı', sinif: 'Tehlikeli' },
  { kod: '10.20.01', tanim: 'Balık işleme ve muhafazası', sinif: 'Tehlikeli' },
  { kod: '10.31.01', tanim: 'Patates işleme ve muhafazası', sinif: 'Az Tehlikeli' },
  { kod: '10.32.01', tanim: 'Meyve ve sebze suyu imalatı', sinif: 'Az Tehlikeli' },
  { kod: '10.39.01', tanim: 'Meyve ve sebze işleme', sinif: 'Az Tehlikeli' },
  { kod: '10.41.01', tanim: 'Yağ ve katı yağ imalatı', sinif: 'Tehlikeli' },
  { kod: '10.51.01', tanim: 'Süt işleme ve peynir imalatı', sinif: 'Tehlikeli' },
  { kod: '10.61.01', tanim: 'Hububat öğütme ürünleri imalatı', sinif: 'Tehlikeli' },
  { kod: '10.71.01', tanim: 'Ekmek ve taze pastane ürünleri imalatı', sinif: 'Tehlikeli' },
  { kod: '10.71.02', tanim: 'Endüstriyel ekmek ve pastane ürünleri', sinif: 'Tehlikeli' },
  { kod: '10.72.01', tanim: 'Peksimet, bisküvi, çikolata kaplı gofret', sinif: 'Tehlikeli' },
  { kod: '10.81.01', tanim: 'Şeker imalatı', sinif: 'Tehlikeli' },
  { kod: '10.82.01', tanim: 'Kakao, çikolata ve şekerleme imalatı', sinif: 'Tehlikeli' },
  { kod: '10.83.01', tanim: 'Çay ve kahve işleme', sinif: 'Az Tehlikeli' },
  { kod: '10.84.01', tanim: 'Baharat, sos ve çeşni imalatı', sinif: 'Az Tehlikeli' },
  { kod: '10.85.01', tanim: 'Hazır yemek imalatı', sinif: 'Tehlikeli' },
  { kod: '10.86.01', tanim: 'Homojenize ve diyet gıda imalatı', sinif: 'Tehlikeli' },
  { kod: '10.89.01', tanim: 'Başka yerde sınıflandırılmamış gıda imalatı', sinif: 'Tehlikeli' },
  { kod: '10.91.01', tanim: 'Çiftlik hayvanları için hazır yem imalatı', sinif: 'Tehlikeli' },
  { kod: '11.01.01', tanim: 'Damıtılmış alkollü içki imalatı', sinif: 'Tehlikeli' },
  { kod: '11.02.01', tanim: 'Şarap imalatı', sinif: 'Tehlikeli' },
  { kod: '11.05.01', tanim: 'Bira imalatı', sinif: 'Tehlikeli' },
  { kod: '11.07.01', tanim: 'Alkolsüz içecek imalatı', sinif: 'Az Tehlikeli' },
  { kod: '12.00.01', tanim: 'Tütün ürünleri imalatı', sinif: 'Tehlikeli' },
  { kod: '13.10.01', tanim: 'Tekstil elyafı hazırlama ve iplik eğirme', sinif: 'Tehlikeli' },
  { kod: '13.20.01', tanim: 'Dokuma kumaş imalatı', sinif: 'Tehlikeli' },
  { kod: '13.30.01', tanim: 'Tekstil ürünleri terbiyesi', sinif: 'Tehlikeli' },
  { kod: '13.91.01', tanim: 'Örme kumaş imalatı', sinif: 'Tehlikeli' },
  { kod: '13.92.01', tanim: 'Hazır tekstil ürünleri imalatı', sinif: 'Tehlikeli' },
  { kod: '13.93.01', tanim: 'Halı ve kilim imalatı', sinif: 'Tehlikeli' },
  { kod: '14.11.01', tanim: 'Deri giyim eşyası imalatı', sinif: 'Tehlikeli' },
  { kod: '14.12.01', tanim: 'İş elbiseleri imalatı', sinif: 'Az Tehlikeli' },
  { kod: '14.13.01', tanim: 'Diğer dış giyim eşyası imalatı', sinif: 'Az Tehlikeli' },
  { kod: '15.11.01', tanim: 'Deri ve kürk tabaklanması ve işlenmesi', sinif: 'Tehlikeli' },
  { kod: '15.20.01', tanim: 'Ayakkabı imalatı', sinif: 'Tehlikeli' },
  { kod: '16.10.01', tanim: 'Ağaç ve mantar işleme (mobilya hariç)', sinif: 'Çok Tehlikeli' },
  { kod: '16.21.01', tanim: 'Kaplama levhası ve kontrplak imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '16.22.01', tanim: 'Parke yer döşemesi imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '16.23.01', tanim: 'Doğrama ve bağlantı elemanları imalatı (ahşap)', sinif: 'Çok Tehlikeli' },
  { kod: '17.11.01', tanim: 'Kağıt hamuru imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '17.12.01', tanim: 'Kağıt ve karton imalatı', sinif: 'Tehlikeli' },
  { kod: '17.21.01', tanim: 'Oluklu mukavva ve kartondan ambalaj imalatı', sinif: 'Tehlikeli' },
  { kod: '18.11.01', tanim: 'Gazete baskısı', sinif: 'Az Tehlikeli' },
  { kod: '18.12.01', tanim: 'Diğer matbaacılık', sinif: 'Az Tehlikeli' },
  { kod: '19.10.01', tanim: 'Kok fırını ürünleri imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '19.20.01', tanim: 'Rafine edilmiş petrol ürünleri imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '20.11.01', tanim: 'Sanayi gazları imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '20.12.01', tanim: 'Boya maddeleri ve pigment imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '20.13.01', tanim: 'Diğer anorganik temel kimyasallar imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '20.14.01', tanim: 'Organik temel kimyasallar imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '20.15.01', tanim: 'Gübre ve azot bileşikleri imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '20.16.01', tanim: 'Plastik ham madde imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '20.17.01', tanim: 'Sentetik kauçuk imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '20.20.01', tanim: 'Tarımsal ilaç ve diğer zirai kimyasallar imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '20.30.01', tanim: 'Boya, vernik, mürekkep imalatı', sinif: 'Tehlikeli' },
  { kod: '20.41.01', tanim: 'Sabun, deterjan, temizleme maddesi imalatı', sinif: 'Tehlikeli' },
  { kod: '20.42.01', tanim: 'Parfüm ve kozmetik imalatı', sinif: 'Tehlikeli' },
  { kod: '20.51.01', tanim: 'Patlayıcı madde imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '20.52.01', tanim: 'Tutkal ve jelatin imalatı', sinif: 'Tehlikeli' },
  { kod: '20.59.01', tanim: 'Başka yerde sınıflandırılmamış kimyasal imalatı', sinif: 'Tehlikeli' },
  { kod: '20.60.01', tanim: 'Yapay ve sentetik elyaf imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '21.10.01', tanim: 'İlaç hammaddesi imalatı', sinif: 'Tehlikeli' },
  { kod: '21.20.01', tanim: 'İlaç ürünleri imalatı', sinif: 'Tehlikeli' },
  { kod: '22.11.01', tanim: 'Kauçuk dış lastik imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '22.19.01', tanim: 'Diğer kauçuk ürünleri imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '22.21.01', tanim: 'Plastik levha, boru, profil imalatı', sinif: 'Tehlikeli' },
  { kod: '22.22.01', tanim: 'Plastik ambalaj imalatı', sinif: 'Tehlikeli' },
  { kod: '22.23.01', tanim: 'İnşaat amaçlı plastik ürünler imalatı', sinif: 'Tehlikeli' },
  { kod: '23.11.01', tanim: 'Cam ve cam ürünleri imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '23.20.01', tanim: 'Refrakter ürünlerin imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '23.31.01', tanim: 'Seramik yer ve duvar karosu imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '23.41.01', tanim: 'Seramik ev ve süs eşyası imalatı', sinif: 'Tehlikeli' },
  { kod: '23.51.01', tanim: 'Çimento imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '23.52.01', tanim: 'Kireç ve alçı imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '23.61.01', tanim: 'Beton ürünleri imalatı (inşaat için)', sinif: 'Tehlikeli' },
  { kod: '23.70.01', tanim: 'Taş kesme, biçme ve tamamlama', sinif: 'Çok Tehlikeli' },
  { kod: '24.10.01', tanim: 'Demir çelik imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '24.20.01', tanim: 'Çelik boru, profil ve fitting imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '24.31.01', tanim: 'Soğuk çekme (çubuk)', sinif: 'Çok Tehlikeli' },
  { kod: '24.41.01', tanim: 'Değerli metal üretimi', sinif: 'Çok Tehlikeli' },
  { kod: '24.42.01', tanim: 'Alüminyum üretimi', sinif: 'Çok Tehlikeli' },
  { kod: '24.43.01', tanim: 'Kurşun, çinko ve kalay üretimi', sinif: 'Çok Tehlikeli' },
  { kod: '24.44.01', tanim: 'Bakır üretimi', sinif: 'Çok Tehlikeli' },
  { kod: '25.11.01', tanim: 'Metal yapı elemanları imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '25.12.01', tanim: 'Metal kapı, pencere ve benzeri imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '25.21.01', tanim: 'Merkezi ısıtma radyatörü imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '25.30.01', tanim: 'Buhar kazanı imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '25.50.01', tanim: 'Metal dövme, presleme, soğuk şekillendirme', sinif: 'Çok Tehlikeli' },
  { kod: '25.61.01', tanim: 'Metal yüzey işleme ve kaplama', sinif: 'Çok Tehlikeli' },
  { kod: '25.62.01', tanim: 'Genel amaçlı talaşlı imalat (makine işleme)', sinif: 'Çok Tehlikeli' },
  { kod: '25.71.01', tanim: 'Çatal bıçak takımı imalatı', sinif: 'Tehlikeli' },
  { kod: '25.72.01', tanim: 'Kilit ve menteşe imalatı', sinif: 'Tehlikeli' },
  { kod: '25.73.01', tanim: 'El aletleri imalatı', sinif: 'Tehlikeli' },
  { kod: '25.91.01', tanim: 'Çelik varil ve benzeri kap imalatı', sinif: 'Tehlikeli' },
  { kod: '25.92.01', tanim: 'Hafif metal ambalaj imalatı', sinif: 'Tehlikeli' },
  { kod: '25.93.01', tanim: 'Tel ürünleri imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '25.94.01', tanim: 'Bağlantı elemanları imalatı', sinif: 'Tehlikeli' },
  { kod: '26.11.01', tanim: 'Elektronik komponent imalatı', sinif: 'Tehlikeli' },
  { kod: '26.20.01', tanim: 'Bilgisayar ve çevre birimi imalatı', sinif: 'Tehlikeli' },
  { kod: '26.30.01', tanim: 'İletişim ekipmanı imalatı', sinif: 'Tehlikeli' },
  { kod: '26.40.01', tanim: 'Tüketici elektroniği imalatı', sinif: 'Tehlikeli' },
  { kod: '26.51.01', tanim: 'Ölçüm aleti imalatı', sinif: 'Tehlikeli' },
  { kod: '26.60.01', tanim: 'Radyasyon ve elektroterapi cihazı imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '26.70.01', tanim: 'Optik alet ve teçhizat imalatı', sinif: 'Tehlikeli' },
  { kod: '26.80.01', tanim: 'Manyetik ve optik ortam imalatı', sinif: 'Tehlikeli' },
  { kod: '27.11.01', tanim: 'Elektrik motoru ve jeneratör imalatı', sinif: 'Tehlikeli' },
  { kod: '27.12.01', tanim: 'Elektrik dağıtım ve kontrol cihazı imalatı', sinif: 'Tehlikeli' },
  { kod: '27.20.01', tanim: 'Akü ve pil imalatı', sinif: 'Tehlikeli' },
  { kod: '27.31.01', tanim: 'Fiber optik kablo imalatı', sinif: 'Tehlikeli' },
  { kod: '27.32.01', tanim: 'Diğer elektronik ve elektrik kablosu imalatı', sinif: 'Tehlikeli' },
  { kod: '27.40.01', tanim: 'Elektrikli aydınlatma ekipmanı imalatı', sinif: 'Tehlikeli' },
  { kod: '27.51.01', tanim: 'Elektrikli ev aleti imalatı', sinif: 'Tehlikeli' },
  { kod: '28.11.01', tanim: 'Endüstriyel motor ve türbin imalatı', sinif: 'Tehlikeli' },
  { kod: '28.14.01', tanim: 'Bağlantı parçası ve vana imalatı', sinif: 'Tehlikeli' },
  { kod: '28.15.01', tanim: 'Rulman, dişli ve aktarma imalatı', sinif: 'Tehlikeli' },
  { kod: '28.22.01', tanim: 'Kaldırma ve taşıma ekipmanı imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '28.30.01', tanim: 'Tarım ve ormancılık makinesi imalatı', sinif: 'Tehlikeli' },
  { kod: '28.41.01', tanim: 'Metal şekillendirme makinesi imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '28.49.01', tanim: 'Diğer takım tezgahı imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '29.10.01', tanim: 'Motorlu kara taşıtı imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '29.20.01', tanim: 'Motorlu araç gövdesi imalatı', sinif: 'Tehlikeli' },
  { kod: '29.31.01', tanim: 'Araç elektrik ve elektronik ekipmanı imalatı', sinif: 'Tehlikeli' },
  { kod: '29.32.01', tanim: 'Diğer motorlu araç parçaları imalatı', sinif: 'Tehlikeli' },
  { kod: '30.11.01', tanim: 'Gemi ve tekne inşaatı', sinif: 'Çok Tehlikeli' },
  { kod: '30.12.01', tanim: 'Eğlence ve spor teknesi inşaatı', sinif: 'Tehlikeli' },
  { kod: '30.30.01', tanim: 'Hava ve uzay taşıtı imalatı', sinif: 'Çok Tehlikeli' },
  { kod: '31.01.01', tanim: 'Ofis ve büro mobilyası imalatı', sinif: 'Tehlikeli' },
  { kod: '31.02.01', tanim: 'Mutfak mobilyası imalatı', sinif: 'Tehlikeli' },
  { kod: '31.09.01', tanim: 'Diğer mobilya imalatı', sinif: 'Tehlikeli' },
  { kod: '32.11.01', tanim: 'Madeni para imalatı', sinif: 'Tehlikeli' },
  { kod: '32.12.01', tanim: 'Mücevher ve ilgili ürünler imalatı', sinif: 'Tehlikeli' },
  { kod: '32.20.01', tanim: 'Müzik aleti imalatı', sinif: 'Tehlikeli' },
  { kod: '32.30.01', tanim: 'Spor malzemesi imalatı', sinif: 'Tehlikeli' },
  { kod: '32.40.01', tanim: 'Oyun ve oyuncak imalatı', sinif: 'Az Tehlikeli' },
  { kod: '32.50.01', tanim: 'Tıbbi ve diş hekim aletleri imalatı', sinif: 'Tehlikeli' },
  { kod: '33.11.01', tanim: 'Metal ürün bakım ve onarımı', sinif: 'Tehlikeli' },
  { kod: '33.12.01', tanim: 'Makine ve ekipman bakım-onarımı', sinif: 'Tehlikeli' },
  { kod: '33.13.01', tanim: 'Elektronik ve optik ekipman onarımı', sinif: 'Tehlikeli' },
  { kod: '33.14.01', tanim: 'Elektrikli ekipman onarımı', sinif: 'Tehlikeli' },
  { kod: '33.15.01', tanim: 'Gemi onarımı', sinif: 'Çok Tehlikeli' },
  { kod: '33.16.01', tanim: 'Hava ve uzay taşıtı onarımı', sinif: 'Çok Tehlikeli' },
  { kod: '33.17.01', tanim: 'Diğer ulaşım araçları onarımı', sinif: 'Çok Tehlikeli' },
  { kod: '33.20.01', tanim: 'Sanayi makine ve ekipman kurulumu', sinif: 'Tehlikeli' },
  // D - ELEKTRİK, GAZ
  { kod: '35.11.01', tanim: 'Elektrik üretimi', sinif: 'Çok Tehlikeli' },
  { kod: '35.12.01', tanim: 'Elektrik iletimi', sinif: 'Çok Tehlikeli' },
  { kod: '35.13.01', tanim: 'Elektrik dağıtımı', sinif: 'Çok Tehlikeli' },
  { kod: '35.14.01', tanim: 'Elektrik ticareti', sinif: 'Az Tehlikeli' },
  { kod: '35.21.01', tanim: 'Gaz üretimi', sinif: 'Çok Tehlikeli' },
  { kod: '35.22.01', tanim: 'Gaz dağıtımı (boru hattı ile)', sinif: 'Çok Tehlikeli' },
  { kod: '35.30.01', tanim: 'Buhar ve iklimlendirme temin', sinif: 'Çok Tehlikeli' },
  // E - SU, ATIK
  { kod: '36.00.01', tanim: 'Su toplama, arıtma ve dağıtımı', sinif: 'Tehlikeli' },
  { kod: '37.00.01', tanim: 'Kanalizasyon hizmetleri', sinif: 'Çok Tehlikeli' },
  { kod: '38.11.01', tanim: 'Tehlikeli olmayan atık toplama', sinif: 'Tehlikeli' },
  { kod: '38.12.01', tanim: 'Tehlikeli atık toplama', sinif: 'Çok Tehlikeli' },
  { kod: '38.21.01', tanim: 'Tehlikeli olmayan atık işleme', sinif: 'Tehlikeli' },
  { kod: '38.22.01', tanim: 'Tehlikeli atık işleme', sinif: 'Çok Tehlikeli' },
  { kod: '38.31.01', tanim: 'Metal hurda sökümü', sinif: 'Çok Tehlikeli' },
  { kod: '38.32.01', tanim: 'Ayıklanmış atık madde iyileştirilmesi', sinif: 'Tehlikeli' },
  { kod: '39.00.01', tanim: 'Çevre iyileştirme ve temizleme faaliyetleri', sinif: 'Çok Tehlikeli' },
  // F - İNŞAAT
  { kod: '41.10.01', tanim: 'Bina geliştirme projeleri', sinif: 'Çok Tehlikeli' },
  { kod: '41.20.01', tanim: 'Konut ve konut dışı bina inşaatı', sinif: 'Çok Tehlikeli' },
  { kod: '42.11.01', tanim: 'Yol ve otoyol inşaatı', sinif: 'Çok Tehlikeli' },
  { kod: '42.12.01', tanim: 'Demiryolu ve yeraltı demiryolu inşaatı', sinif: 'Çok Tehlikeli' },
  { kod: '42.13.01', tanim: 'Köprü ve tünel inşaatı', sinif: 'Çok Tehlikeli' },
  { kod: '42.21.01', tanim: 'Su ürünleri projelerinin inşaatı', sinif: 'Çok Tehlikeli' },
  { kod: '42.22.01', tanim: 'Elektrik ve telekomünikasyon şebekeleri inşaatı', sinif: 'Çok Tehlikeli' },
  { kod: '42.91.01', tanim: 'Su yolları, liman ve baraj inşaatı', sinif: 'Çok Tehlikeli' },
  { kod: '42.99.01', tanim: 'Başka yerde sınıflandırılmamış diğer inşaat', sinif: 'Çok Tehlikeli' },
  { kod: '43.11.01', tanim: 'Yıkım (bina yıkma)', sinif: 'Çok Tehlikeli' },
  { kod: '43.12.01', tanim: 'Şantiye hazırlama faaliyetleri', sinif: 'Çok Tehlikeli' },
  { kod: '43.13.01', tanim: 'Sondaj ve araştırma sondajı', sinif: 'Çok Tehlikeli' },
  { kod: '43.21.01', tanim: 'Elektrik tesisat işleri', sinif: 'Çok Tehlikeli' },
  { kod: '43.22.01', tanim: 'Sıhhi tesisat, ısıtma ve havalandırma', sinif: 'Çok Tehlikeli' },
  { kod: '43.29.01', tanim: 'Diğer inşaat tesisat işleri', sinif: 'Çok Tehlikeli' },
  { kod: '43.31.01', tanim: 'Sıva işleri', sinif: 'Çok Tehlikeli' },
  { kod: '43.32.01', tanim: 'Doğrama işleri', sinif: 'Çok Tehlikeli' },
  { kod: '43.33.01', tanim: 'Yer döşemesi ve duvar kaplama', sinif: 'Çok Tehlikeli' },
  { kod: '43.34.01', tanim: 'Boya ve cam işleri', sinif: 'Çok Tehlikeli' },
  { kod: '43.91.01', tanim: 'Çatı işleri', sinif: 'Çok Tehlikeli' },
  { kod: '43.99.01', tanim: 'Başka yerde sınıflandırılmamış diğer özel inşaat', sinif: 'Çok Tehlikeli' },
  // G - TİCARET, ONARIM
  { kod: '45.11.01', tanim: 'Otomobil ve hafif motorlu araç ticareti', sinif: 'Az Tehlikeli' },
  { kod: '45.19.01', tanim: 'Diğer motorlu araç ticareti', sinif: 'Az Tehlikeli' },
  { kod: '45.20.01', tanim: 'Motorlu araçların bakım ve onarımı', sinif: 'Tehlikeli' },
  { kod: '45.31.01', tanim: 'Motorlu araç parçaları toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '45.32.01', tanim: 'Motorlu araç parçaları perakende ticareti', sinif: 'Az Tehlikeli' },
  { kod: '45.40.01', tanim: 'Motosiklet satışı, bakım ve onarımı', sinif: 'Tehlikeli' },
  { kod: '46.11.01', tanim: 'Tarımsal ürünler aracılık faaliyeti', sinif: 'Az Tehlikeli' },
  { kod: '46.21.01', tanim: 'Hububat, ham tütün toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.31.01', tanim: 'Meyve ve sebze toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.32.01', tanim: 'Et ve et ürünleri toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.33.01', tanim: 'Süt, peynir ve yumurta toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.39.01', tanim: 'Diğer gıda toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.41.01', tanim: 'Tekstil ürünleri toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.51.01', tanim: 'Bilgisayar ve çevre birimi toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.61.01', tanim: 'Tarım makineleri toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.71.01', tanim: 'Yakıt ve ilgili ürünler toptan ticareti', sinif: 'Tehlikeli' },
  { kod: '46.72.01', tanim: 'Metal ve metal cevherleri toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.73.01', tanim: 'Odun, yapı malzemeleri toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.74.01', tanim: 'Hırdavat ve tesisat malzemeleri toptan ticareti', sinif: 'Az Tehlikeli' },
  { kod: '46.75.01', tanim: 'Kimyasal ürünler toptan ticareti', sinif: 'Tehlikeli' },
  { kod: '47.11.01', tanim: 'Gıda, içecek, tütün satışı perakende (büyük mağaza)', sinif: 'Az Tehlikeli' },
  { kod: '47.11.02', tanim: 'Market ve bakkal', sinif: 'Az Tehlikeli' },
  { kod: '47.19.01', tanim: 'Büyük perakende mağazacılık', sinif: 'Az Tehlikeli' },
  { kod: '47.25.01', tanim: 'İçecek perakende ticareti', sinif: 'Az Tehlikeli' },
  { kod: '47.29.01', tanim: 'Diğer gıda perakende ticareti', sinif: 'Az Tehlikeli' },
  { kod: '47.30.01', tanim: 'Akaryakıt istasyonu perakende ticareti', sinif: 'Çok Tehlikeli' },
  { kod: '47.61.01', tanim: 'Kitap perakende ticareti', sinif: 'Az Tehlikeli' },
  { kod: '47.71.01', tanim: 'Giyim eşyası perakende ticareti', sinif: 'Az Tehlikeli' },
  { kod: '47.72.01', tanim: 'Ayakkabı ve deri ürünleri perakende ticareti', sinif: 'Az Tehlikeli' },
  { kod: '47.73.01', tanim: 'Eczane', sinif: 'Az Tehlikeli' },
  { kod: '47.78.01', tanim: 'Diğer sağlık ürünleri perakende ticareti', sinif: 'Az Tehlikeli' },
  { kod: '47.91.01', tanim: 'Posta siparişi ve internet perakende ticareti', sinif: 'Az Tehlikeli' },
  // H - ULAŞTIRMA
  { kod: '49.10.01', tanim: 'Demiryolu yolcu taşımacılığı', sinif: 'Tehlikeli' },
  { kod: '49.20.01', tanim: 'Demiryolu yük taşımacılığı', sinif: 'Tehlikeli' },
  { kod: '49.31.01', tanim: 'Kentsel ve banliyö kara yolcu taşımacılığı', sinif: 'Tehlikeli' },
  { kod: '49.32.01', tanim: 'Taksi işletmeciliği', sinif: 'Az Tehlikeli' },
  { kod: '49.39.01', tanim: 'Diğer kara yolcu taşımacılığı', sinif: 'Tehlikeli' },
  { kod: '49.41.01', tanim: 'Kara yolu yük taşımacılığı', sinif: 'Tehlikeli' },
  { kod: '49.42.01', tanim: 'Taşıma hizmetleri', sinif: 'Tehlikeli' },
  { kod: '49.50.01', tanim: 'Boru hattıyla taşımacılık', sinif: 'Çok Tehlikeli' },
  { kod: '50.10.01', tanim: 'Denizde yolcu taşımacılığı', sinif: 'Tehlikeli' },
  { kod: '50.20.01', tanim: 'Denizde yük taşımacılığı', sinif: 'Tehlikeli' },
  { kod: '51.10.01', tanim: 'Havayolu yolcu taşımacılığı', sinif: 'Tehlikeli' },
  { kod: '51.21.01', tanim: 'Havayolu yük taşımacılığı', sinif: 'Tehlikeli' },
  { kod: '52.10.01', tanim: 'Depolama ve antrepo faaliyetleri', sinif: 'Tehlikeli' },
  { kod: '52.21.01', tanim: 'Kara yolu taşımacılığına yardımcı faaliyetler', sinif: 'Tehlikeli' },
  { kod: '52.22.01', tanim: 'Su yolu taşımacılığına yardımcı faaliyetler', sinif: 'Tehlikeli' },
  { kod: '52.23.01', tanim: 'Hava yolu taşımacılığına yardımcı faaliyetler', sinif: 'Tehlikeli' },
  { kod: '52.24.01', tanim: 'Yük elleçleme', sinif: 'Tehlikeli' },
  { kod: '52.29.01', tanim: 'Diğer taşımacılığa yardımcı faaliyetler', sinif: 'Az Tehlikeli' },
  { kod: '53.10.01', tanim: 'Ulusal posta faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '53.20.01', tanim: 'Kurye faaliyetleri (ulusal posta hariç)', sinif: 'Az Tehlikeli' },
  // I - KONAKLAMA, YİYECEK
  { kod: '55.10.01', tanim: 'Oteller ve benzeri konaklama yerleri', sinif: 'Az Tehlikeli' },
  { kod: '55.20.01', tanim: 'Tatil ve kısa süreli konaklama yerleri', sinif: 'Az Tehlikeli' },
  { kod: '55.30.01', tanim: 'Kamp alanları, araç kampları ve karavan parkları', sinif: 'Az Tehlikeli' },
  { kod: '56.10.01', tanim: 'Restoranlar ve hareketli yiyecek hizmeti', sinif: 'Az Tehlikeli' },
  { kod: '56.10.02', tanim: 'Hazır yemek (catering) hizmetleri', sinif: 'Az Tehlikeli' },
  { kod: '56.21.01', tanim: 'Yiyecek organizasyonu hizmetleri', sinif: 'Az Tehlikeli' },
  { kod: '56.29.01', tanim: 'Diğer yiyecek hizmeti faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '56.30.01', tanim: 'Bara ve içecek hizmetleri', sinif: 'Az Tehlikeli' },
  // J - BİLGİ, İLETİŞİM
  { kod: '58.11.01', tanim: 'Kitap yayıncılığı', sinif: 'Az Tehlikeli' },
  { kod: '58.13.01', tanim: 'Gazete yayıncılığı', sinif: 'Az Tehlikeli' },
  { kod: '58.14.01', tanim: 'Dergi ve süreli yayıncılık', sinif: 'Az Tehlikeli' },
  { kod: '59.11.01', tanim: 'Film ve video üretim faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '59.12.01', tanim: 'Film ve video post-prodüksiyon', sinif: 'Az Tehlikeli' },
  { kod: '60.10.01', tanim: 'Radyo yayıncılığı', sinif: 'Az Tehlikeli' },
  { kod: '60.20.01', tanim: 'Televizyon programcılığı ve yayıncılığı', sinif: 'Az Tehlikeli' },
  { kod: '61.10.01', tanim: 'Kablolu telekomünikasyon faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '61.20.01', tanim: 'Kablosuz telekomünikasyon faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '62.01.01', tanim: 'Bilgisayar programlama faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '62.02.01', tanim: 'Bilgisayar danışmanlığı faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '62.03.01', tanim: 'Bilgisayar tesisi yönetimi', sinif: 'Az Tehlikeli' },
  { kod: '63.11.01', tanim: 'Veri işleme ve barındırma faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '63.12.01', tanim: 'Web portalı faaliyetleri', sinif: 'Az Tehlikeli' },
  // K - FİNANS
  { kod: '64.11.01', tanim: 'Merkez bankacılığı', sinif: 'Az Tehlikeli' },
  { kod: '64.19.01', tanim: 'Diğer parasal aracılık', sinif: 'Az Tehlikeli' },
  { kod: '64.30.01', tanim: 'Yatırım fonları faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '64.91.01', tanim: 'Finansal kiralama (leasing)', sinif: 'Az Tehlikeli' },
  { kod: '64.99.01', tanim: 'Diğer finansal hizmet faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '65.11.01', tanim: 'Hayat sigortası', sinif: 'Az Tehlikeli' },
  { kod: '65.12.01', tanim: 'Hayat dışı sigorta', sinif: 'Az Tehlikeli' },
  { kod: '65.20.01', tanim: 'Reasürans', sinif: 'Az Tehlikeli' },
  { kod: '66.11.01', tanim: 'Finansal piyasa yönetimi', sinif: 'Az Tehlikeli' },
  { kod: '66.19.01', tanim: 'Finansal hizmetlere yardımcı faaliyetler', sinif: 'Az Tehlikeli' },
  { kod: '66.21.01', tanim: 'Risk ve hasar değerlendirme', sinif: 'Az Tehlikeli' },
  { kod: '66.22.01', tanim: 'Sigorta acentesi ve brokerleri', sinif: 'Az Tehlikeli' },
  // L - GAYRİMENKUL
  { kod: '68.10.01', tanim: 'Kendi mülkünü satma ve kiralama', sinif: 'Az Tehlikeli' },
  { kod: '68.20.01', tanim: 'Kendi veya kiralanan gayrimenkul kiralama', sinif: 'Az Tehlikeli' },
  { kod: '68.31.01', tanim: 'Gayrimenkul acenteleri', sinif: 'Az Tehlikeli' },
  { kod: '68.32.01', tanim: 'Gayrimenkul yönetimi', sinif: 'Az Tehlikeli' },
  // M - MESLEKİ
  { kod: '69.10.01', tanim: 'Hukuki faaliyetler', sinif: 'Az Tehlikeli' },
  { kod: '69.20.01', tanim: 'Muhasebe, defterdarlık ve denetim faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '70.10.01', tanim: 'Merkez ofis faaliyetleri (holding)', sinif: 'Az Tehlikeli' },
  { kod: '70.21.01', tanim: 'Halkla ilişkiler ve iletişim faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '70.22.01', tanim: 'İş ve diğer yönetim danışmanlığı', sinif: 'Az Tehlikeli' },
  { kod: '71.11.01', tanim: 'Mimarlık faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '71.12.01', tanim: 'Mühendislik faaliyetleri ve ilgili teknik danışmanlık', sinif: 'Az Tehlikeli' },
  { kod: '71.20.01', tanim: 'Teknik test ve analiz', sinif: 'Tehlikeli' },
  { kod: '72.11.01', tanim: 'Biyoteknoloji araştırması', sinif: 'Tehlikeli' },
  { kod: '72.19.01', tanim: 'Diğer araştırma ve deneysel geliştirme', sinif: 'Az Tehlikeli' },
  { kod: '72.20.01', tanim: 'Sosyal bilimler araştırması', sinif: 'Az Tehlikeli' },
  { kod: '73.11.01', tanim: 'Reklam ajansları faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '73.12.01', tanim: 'Medya temsil hizmetleri', sinif: 'Az Tehlikeli' },
  { kod: '73.20.01', tanim: 'Pazar araştırması ve kamuoyu yoklaması', sinif: 'Az Tehlikeli' },
  { kod: '74.10.01', tanim: 'Uzmanlaşmış tasarım faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '74.20.01', tanim: 'Fotoğrafçılık faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '74.30.01', tanim: 'Çeviri ve sözlü tercüme faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '74.90.01', tanim: 'Diğer mesleki, bilimsel ve teknik faaliyetler', sinif: 'Az Tehlikeli' },
  { kod: '75.00.01', tanim: 'Veterinerlik faaliyetleri', sinif: 'Tehlikeli' },
  // N - İDARİ HİZMETLER
  { kod: '77.11.01', tanim: 'Otomobil kiralama', sinif: 'Az Tehlikeli' },
  { kod: '77.32.01', tanim: 'İnşaat makinesi kiralama', sinif: 'Az Tehlikeli' },
  { kod: '77.33.01', tanim: 'Ofis makinesi kiralama', sinif: 'Az Tehlikeli' },
  { kod: '78.10.01', tanim: 'İstihdam acenteleri faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '78.20.01', tanim: 'Geçici istihdam acenteleri', sinif: 'Az Tehlikeli' },
  { kod: '79.11.01', tanim: 'Seyahat acentesi faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '79.12.01', tanim: 'Tur operatörleri faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '80.10.01', tanim: 'Özel güvenlik faaliyetleri', sinif: 'Tehlikeli' },
  { kod: '80.20.01', tanim: 'Güvenlik sistemi hizmetleri', sinif: 'Az Tehlikeli' },
  { kod: '81.10.01', tanim: 'Bütünleşik bina yönetimi hizmetleri', sinif: 'Az Tehlikeli' },
  { kod: '81.21.01', tanim: 'Genel bina temizleme faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '81.22.01', tanim: 'Diğer bina ve endüstriyel temizleme faaliyetleri', sinif: 'Tehlikeli' },
  { kod: '81.29.01', tanim: 'Diğer temizleme faaliyetleri', sinif: 'Tehlikeli' },
  { kod: '81.30.01', tanim: 'Peyzaj düzenleme faaliyetleri', sinif: 'Tehlikeli' },
  { kod: '82.11.01', tanim: 'Büro hizmetleri (karma)', sinif: 'Az Tehlikeli' },
  { kod: '82.19.01', tanim: 'Fotokopi ve benzeri ofis destek faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '82.20.01', tanim: 'Çağrı merkezi faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '82.30.01', tanim: 'Kongre ve ticari fuarlar', sinif: 'Az Tehlikeli' },
  // O - KAMU YÖNETİMİ
  { kod: '84.11.01', tanim: 'Genel kamu hizmetleri yönetimi', sinif: 'Az Tehlikeli' },
  { kod: '84.12.01', tanim: 'Eğitim sağlık kamu hizmetleri yönetimi', sinif: 'Az Tehlikeli' },
  { kod: '84.13.01', tanim: 'Ekonomik alanlara katkı sağlayan devlet faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '84.21.01', tanim: 'Dış ilişkiler', sinif: 'Az Tehlikeli' },
  { kod: '84.22.01', tanim: 'Savunma faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '84.23.01', tanim: 'Yargı ve adalet faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '84.24.01', tanim: 'Kamu düzeni ve güvenlik faaliyetleri', sinif: 'Tehlikeli' },
  { kod: '84.25.01', tanim: 'İtfaiye hizmetleri', sinif: 'Çok Tehlikeli' },
  // P - EĞİTİM
  { kod: '85.10.01', tanim: 'Okul öncesi eğitim', sinif: 'Az Tehlikeli' },
  { kod: '85.20.01', tanim: 'İlköğretim', sinif: 'Az Tehlikeli' },
  { kod: '85.31.01', tanim: 'Genel ortaöğretim', sinif: 'Az Tehlikeli' },
  { kod: '85.32.01', tanim: 'Teknik ve mesleki ortaöğretim', sinif: 'Az Tehlikeli' },
  { kod: '85.41.01', tanim: 'Yükseköğretim (ön lisans)', sinif: 'Az Tehlikeli' },
  { kod: '85.42.01', tanim: 'Yükseköğretim (lisans ve üstü)', sinif: 'Az Tehlikeli' },
  { kod: '85.51.01', tanim: 'Spor ve eğlence eğitimi', sinif: 'Az Tehlikeli' },
  { kod: '85.52.01', tanim: 'Kültürel eğitim faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '85.53.01', tanim: 'Sürücü okulu faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '85.59.01', tanim: 'Diğer eğitim faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '85.60.01', tanim: 'Eğitimi destekleyici faaliyetler', sinif: 'Az Tehlikeli' },
  // Q - SAĞLIK
  { kod: '86.10.01', tanim: 'Hastane faaliyetleri', sinif: 'Çok Tehlikeli' },
  { kod: '86.21.01', tanim: 'Genel tıbbi uygulama faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '86.22.01', tanim: 'Uzman tıbbi uygulama faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '86.23.01', tanim: 'Diş hekimliği faaliyetleri', sinif: 'Tehlikeli' },
  { kod: '86.90.01', tanim: 'Diğer insan sağlığı faaliyetleri', sinif: 'Tehlikeli' },
  { kod: '86.90.14', tanim: 'İşyeri hekimliği ve OSGB hizmetleri', sinif: 'Az Tehlikeli' },
  { kod: '87.10.01', tanim: 'Yaşlı ve özürlü bakımı', sinif: 'Tehlikeli' },
  { kod: '87.20.01', tanim: 'Zihinsel bozuklukları olan kişilerin bakım faaliyetleri', sinif: 'Tehlikeli' },
  { kod: '87.30.01', tanim: 'Yaşlı ve engelli kişiler için sosyal hizmet', sinif: 'Az Tehlikeli' },
  { kod: '88.10.01', tanim: 'Barınma içermeyen yaşlı bakım sosyal hizmetleri', sinif: 'Az Tehlikeli' },
  { kod: '88.91.01', tanim: 'Gündüz çocuk bakım faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '88.99.01', tanim: 'Diğer barınmasız sosyal hizmetler', sinif: 'Az Tehlikeli' },
  // R - SANAT, EĞLENCE
  { kod: '90.01.01', tanim: 'Gösteri sanatları faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '90.02.01', tanim: 'Gösteri sanatlarını destekleyici faaliyetler', sinif: 'Az Tehlikeli' },
  { kod: '90.03.01', tanim: 'Sanatsal yaratıcılık faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '91.01.01', tanim: 'Kütüphane ve arşiv faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '91.02.01', tanim: 'Müze faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '91.03.01', tanim: 'Tarihi alanlar ve yapılar faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '91.04.01', tanim: 'Botanik ve hayvanat bahçeleri', sinif: 'Az Tehlikeli' },
  { kod: '92.00.01', tanim: 'Kumar ve bahis faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '93.11.01', tanim: 'Spor tesisi işletimi', sinif: 'Az Tehlikeli' },
  { kod: '93.12.01', tanim: 'Spor kulübü faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '93.13.01', tanim: 'Spor salonu faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '93.19.01', tanim: 'Diğer spor faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '93.21.01', tanim: 'Eğlence parkı ve lunapark faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '93.29.01', tanim: 'Diğer eğlence ve dinlence faaliyetleri', sinif: 'Az Tehlikeli' },
  // S - DİĞER HİZMETLER
  { kod: '94.11.01', tanim: 'İşletme ve işveren kuruluşları faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '94.12.01', tanim: 'Mesleki kuruluş faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '94.20.01', tanim: 'Sendika faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '94.91.01', tanim: 'Dini kuruluş faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '94.92.01', tanim: 'Siyasi kuruluş faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '94.99.01', tanim: 'Diğer üyelik örgütü faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '95.11.01', tanim: 'Bilgisayar ve çevre birimi onarımı', sinif: 'Tehlikeli' },
  { kod: '95.12.01', tanim: 'İletişim ekipmanı onarımı', sinif: 'Tehlikeli' },
  { kod: '95.21.01', tanim: 'Tüketici elektroniği onarımı', sinif: 'Tehlikeli' },
  { kod: '95.22.01', tanim: 'Ev aleti onarımı', sinif: 'Tehlikeli' },
  { kod: '95.23.01', tanim: 'Ayakkabı ve deri ürünleri tamiri', sinif: 'Az Tehlikeli' },
  { kod: '95.24.01', tanim: 'Mobilya ve ev eşyası tamiri', sinif: 'Az Tehlikeli' },
  { kod: '95.25.01', tanim: 'Saat ve mücevher tamiri', sinif: 'Az Tehlikeli' },
  { kod: '95.29.01', tanim: 'Diğer kişisel ve ev eşyası tamiri', sinif: 'Az Tehlikeli' },
  { kod: '96.01.01', tanim: 'Çamaşır yıkama ve kuru temizleme faaliyetleri', sinif: 'Az Tehlikeli' },
  { kod: '96.02.01', tanim: 'Kuaför ve güzellik salonları', sinif: 'Az Tehlikeli' },
  { kod: '96.03.01', tanim: 'Cenaze törenine ilişkin faaliyetler', sinif: 'Az Tehlikeli' },
  { kod: '96.04.01', tanim: 'Hamam, sauna ve benzeri faaliyetler', sinif: 'Az Tehlikeli' },
  { kod: '96.09.01', tanim: 'Başka yerde sınıflandırılmamış diğer hizmetler', sinif: 'Az Tehlikeli' },
]

const RENK = {
  'Az Tehlikeli': { bg: 'rgba(34,197,94,.1)', border: 'rgba(34,197,94,.25)', text: '#22c55e', badge: '#166534' },
  'Tehlikeli': { bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)', text: '#f59e0b', badge: '#92400e' },
  'Çok Tehlikeli': { bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.25)', text: '#ef4444', badge: '#991b1b' },
}

export default function NaceSorgulama() {
  const [arama, setArama] = useState('')
  const [filtre, setFiltre] = useState<string>('Tümü')

  const sonuclar = useMemo(() => {
    if (!arama && filtre === 'Tümü') return []
    return NACE_VERITABANI.filter(n => {
      const eslesme = arama
        ? n.kod.includes(arama) || n.tanim.toLowerCase().includes(arama.toLowerCase())
        : true
      const sinifFiltre = filtre === 'Tümü' ? true : n.sinif === filtre
      return eslesme && sinifFiltre
    }).slice(0, 50)
  }, [arama, filtre])

  return (
    <div style={{ background: '#0e0e1c', border: '1px solid rgba(245,194,0,.15)', borderRadius: 20, overflow: 'hidden' }}>
      {/* Arama alanı */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            value={arama}
            onChange={e => setArama(e.target.value)}
            placeholder="NACE kodu (örn: 47.30) veya faaliyet adı (örn: akaryakıt, inşaat, hastane...)"
            style={{
              width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(245,194,0,.2)',
              borderRadius: 12, padding: '14px 16px 14px 48px', color: '#e0e0f0',
              fontSize: 15, fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {/* Filtre butonları */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Tümü', 'Az Tehlikeli', 'Tehlikeli', 'Çok Tehlikeli'].map(s => (
            <button key={s} onClick={() => setFiltre(s)} style={{
              padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700,
              border: `1px solid ${filtre === s ? (s === 'Az Tehlikeli' ? '#22c55e' : s === 'Tehlikeli' ? '#f59e0b' : s === 'Çok Tehlikeli' ? '#ef4444' : '#f5c200') : 'rgba(255,255,255,.1)'}`,
              background: filtre === s ? (s === 'Az Tehlikeli' ? 'rgba(34,197,94,.15)' : s === 'Tehlikeli' ? 'rgba(245,158,11,.15)' : s === 'Çok Tehlikeli' ? 'rgba(239,68,68,.15)' : 'rgba(245,194,0,.15)') : 'transparent',
              color: filtre === s ? (s === 'Az Tehlikeli' ? '#22c55e' : s === 'Tehlikeli' ? '#f59e0b' : s === 'Çok Tehlikeli' ? '#ef4444' : '#f5c200') : '#7070a0',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Sonuçlar */}
      <div style={{ padding: '0 24px 24px', maxHeight: 480, overflowY: 'auto' }}>
        {arama === '' && filtre === 'Tümü' ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#4a4a68' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏭</div>
            <p style={{ fontSize: 14 }}>NACE kodu veya faaliyet adı yazarak sorgulayın</p>
            <p style={{ fontSize: 12, marginTop: 8, color: '#3a3a58' }}>Örn: "bakkal", "inşaat", "hastane", "47.30"</p>
          </div>
        ) : sonuclar.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#4a4a68' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔎</div>
            <p style={{ fontSize: 14 }}>"{arama}" için sonuç bulunamadı</p>
            <p style={{ fontSize: 12, marginTop: 8, color: '#3a3a58' }}>Farklı bir kelime veya NACE kodu deneyin</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: '#5d5d7a', padding: '16px 0 8px', fontWeight: 600 }}>
              {sonuclar.length} sonuç {sonuclar.length === 50 ? '(ilk 50 gösteriliyor)' : ''}
            </div>
            {sonuclar.map((n, i) => {
              const r = RENK[n.sinif as keyof typeof RENK]
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  padding: '12px 16px', marginBottom: 6, borderRadius: 10,
                  background: r.bg, border: `1px solid ${r.border}`,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: '#f5c200',
                      background: 'rgba(245,194,0,.1)', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
                    }}>{n.kod}</span>
                    <span style={{ fontSize: 14, color: '#d0d0e8' }}>{n.tanim}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: r.text, whiteSpace: 'nowrap',
                    padding: '4px 12px', borderRadius: 100, border: `1px solid ${r.border}`,
                    background: r.bg,
                  }}>{n.sinif}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
