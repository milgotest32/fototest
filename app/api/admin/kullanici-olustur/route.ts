import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { email, password, ad_soyad, rol, secret } = await req.json()
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email, password, email_confirm: true
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })
  const { error: pErr } = await adminClient.from('personeller').insert({
    id: authData.user.id, ad_soyad, rol, aktif: true
  })
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 })
  return NextResponse.json({ ok: true, id: authData.user.id, email })
}
