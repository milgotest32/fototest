import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROL_ERISIM: Record<string, string[]> = {
  yonetici:  ['/','/ara','/firmalar','/saglik','/teklifler','/tahsilat','/koordinasyon','/idari','/ziyaretler','/hekim','/malzemeler','/tedarikciler','/taramalar','/personeller','/raporlar','/fatura','/eksik-veriler','/arsiv','/site'],
  operasyon: ['/','/ara','/firmalar','/koordinasyon','/idari','/ziyaretler','/taramalar','/eksik-veriler','/arsiv'],
  hekim:     ['/','/saglik','/hekim','/koordinasyon','/arsiv'],
  satis:     ['/','/teklifler','/malzemeler','/tedarikciler'],
  muhasebe:  ['/','/tahsilat','/saglik','/fatura'],
  saha:      ['/','/koordinasyon','/ziyaretler','/arsiv'],
}

// Public sayfalar — auth gerektirmez (/ ve /giris HARİÇ — onlar ayrı ele alınır)
const PUBLIC_PATHS = [
  '/kurumsal',
  '/ekibimiz',
  '/hizmetlerimiz',
  '/egitimler',
  '/referanslar',
  '/yazilarimiz',
  '/iletisim',
]

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.headers.set('x-middleware-cache', 'no-cache')

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
  const path = req.nextUrl.pathname

  const isStatic = path.startsWith('/_next') || path.startsWith('/api') || path.startsWith('/public')
  const isPublicPage = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))

  // Static & API — geç
  if (isStatic) return res

  // Diğer public sayfalar (hizmetler, kurumsal vs.) — herkes görebilir
  if (isPublicPage) return res

  // / — login varsa panele, yoksa landing page
  if (path === '/') {
    if (user) return NextResponse.redirect(new URL('/firmalar', req.url))
    return res
  }

  // /giris — login olan → ana sayfaya, login olmayan → göster
  if (path === '/giris') {
    if (user) return NextResponse.redirect(new URL('/', req.url))
    return res
  }

  // Korumalı sayfalar — login gerekli
  if (!user) return NextResponse.redirect(new URL('/giris', req.url))

  // Rol kontrolü
  const { data: personel } = await supabase.from('personeller').select('rol').eq('id', user.id).single()
  const rol = personel?.rol || 'operasyon'
  const izinli = ROL_ERISIM[rol] || ROL_ERISIM.operasyon
  const yetkili = izinli.some(r => path === r || path.startsWith(r + '/'))
  if (!yetkili) return NextResponse.redirect(new URL('/', req.url))

  return res
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
