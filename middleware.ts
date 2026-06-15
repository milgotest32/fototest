import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ⚙️ BAKIM MODU — true = bakımda, false = açık
const BAKIM_MODU = true

const ROL_ERISIM: Record<string, string[]> = {
  yonetici:  ['/firmalar','/ara','/saglik','/teklifler','/tahsilat','/koordinasyon','/idari','/ziyaretler','/hekim','/malzemeler','/tedarikciler','/taramalar','/personeller','/raporlar','/fatura','/eksik-veriler','/arsiv','/site'],
  operasyon: ['/firmalar','/ara','/koordinasyon','/idari','/ziyaretler','/taramalar','/eksik-veriler','/arsiv'],
  hekim:     ['/saglik','/hekim','/koordinasyon','/arsiv'],
  satis:     ['/teklifler','/malzemeler','/tedarikciler'],
  muhasebe:  ['/tahsilat','/saglik','/fatura'],
  saha:      ['/koordinasyon','/ziyaretler','/arsiv'],
}

const PANEL_SAYFALAR = ['/firmalar','/ara','/saglik','/teklifler','/tahsilat','/koordinasyon','/idari','/ziyaretler','/hekim','/malzemeler','/tedarikciler','/taramalar','/personeller','/raporlar','/fatura','/eksik-veriler','/arsiv','/site']

const PUBLIC_SAYFALAR = ['/kurumsal','/ekibimiz','/hizmetlerimiz','/egitimler','/referanslar','/yazilarimiz','/iletisim']

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

  const path = req.nextUrl.pathname

  // Static dosyalar — dokunma
  if (path.startsWith('/_next') || path.startsWith('/api') || path === '/favicon.ico') return res

  // BAKIM MODU — /giris ve /firmalar/* hariç herkesi bakım sayfasına yönlendir
  if (BAKIM_MODU) {
    if (path === '/bakim') return res
    if (!path.startsWith('/giris') && !path.startsWith('/firmalar') && !path.startsWith('/saglik') && !path.startsWith('/koordinasyon') && !path.startsWith('/teklifler') && !path.startsWith('/tahsilat') && !path.startsWith('/ziyaretler') && !path.startsWith('/hekim') && !path.startsWith('/malzemeler') && !path.startsWith('/tedarikciler') && !path.startsWith('/taramalar') && !path.startsWith('/personeller') && !path.startsWith('/raporlar') && !path.startsWith('/fatura') && !path.startsWith('/eksik-veriler') && !path.startsWith('/arsiv') && !path.startsWith('/site') && !path.startsWith('/ara') && !path.startsWith('/idari')) {
      return NextResponse.redirect(new URL('/bakim', req.url))
    }
  }

  // Public sayfalar — herkes görebilir, auth kontrolü yok
  if (PUBLIC_SAYFALAR.some(p => path === p || path.startsWith(p + '/'))) return res

  // Supabase auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cs) {
          cs.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
          cs.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Ana sayfa (landing): login varsa panele gönder, yoksa landing göster
  if (path === '/') {
    if (user) return NextResponse.redirect(new URL('/firmalar', req.url))
    return res
  }

  // Giriş sayfası: login varsa panele gönder, yoksa göster
  if (path === '/giris') {
    if (user) return NextResponse.redirect(new URL('/firmalar', req.url))
    return res
  }

  // Panel sayfaları: login zorunlu
  const isPanelSayfasi = PANEL_SAYFALAR.some(p => path === p || path.startsWith(p + '/'))
  if (isPanelSayfasi) {
    if (!user) return NextResponse.redirect(new URL('/giris', req.url))
    // Rol kontrolü
    const { data: personel } = await supabase.from('personeller').select('rol').eq('id', user.id).single()
    const rol = personel?.rol || 'operasyon'
    const izinli = ROL_ERISIM[rol] || ROL_ERISIM.operasyon
    const yetkili = izinli.some(r => path === r || path.startsWith(r + '/'))
    if (!yetkili) return NextResponse.redirect(new URL('/firmalar', req.url))
  }

  return res
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
