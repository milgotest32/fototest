import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Runtime'da oluştur — build sırasında env yoksa hata vermesin
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { email, password, ad_soyad, rol, secret } = await req.json()

  const validSecret = process.env.ADMIN_SECRET || 'osgb-admin-2026'
  if (secret !== validSecret) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'E-posta ve en az 6 karakterli şifre gerekli' }, { status: 400 })
  }

  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email, password, email_confirm: true
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

  const { error: pErr } = await adminClient.from('personeller').upsert({
    id: authData.user.id, ad_soyad, rol, aktif: true
  })
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 })

  return NextResponse.json({ ok: true, id: authData.user.id, email })
}
