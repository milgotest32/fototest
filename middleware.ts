import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROL_ERISIM: Record<string, string[]> = {
  yonetici:  ['/','/firmalar','/saglik','/teklifler','/tahsilat','/koordinasyon','/idari','/ziyaretler','/hekim','/malzemeler','/tedarikciler','/taramalar'],
  operasyon: ['/','/firmalar','/koordinasyon','/idari','/ziyaretler','/taramalar'],
  hekim:     ['/','/saglik','/hekim','/koordinasyon'],
  satis:     ['/','/firmalar','/teklifler','/malzemeler','/tedarikciler'],
  muhasebe:  ['/','/tahsilat','/saglik'],
  saha:      ['/','/koordinasyon','/firmalar','/ziyaretler'],
}

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
  const acik = path === '/giris' || path.startsWith('/_next') || path.startsWith('/api')

  if (!user && !acik) return NextResponse.redirect(new URL('/giris', req.url))
  if (user && path === '/giris') return NextResponse.redirect(new URL('/', req.url))

  if (user && !acik) {
    const { data: personel } = await supabase.from('personeller').select('rol').eq('id', user.id).single()
    const rol = personel?.rol || 'operasyon'
    const izinli = ROL_ERISIM[rol] || ROL_ERISIM.operasyon
    const yetkili = izinli.some(r => path === r || path.startsWith(r + '/'))
    if (!yetkili) return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
