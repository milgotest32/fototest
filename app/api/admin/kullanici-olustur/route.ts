import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!key || key.length < 10) throw new Error('SUPABASE_SERVICE_ROLE_KEY tanımlı değil')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// POST — yeni kullanıcı oluştur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, ad_soyad, rol, secret } = body

    if (secret !== (process.env.ADMIN_SECRET || 'osgb-admin-2026')) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }
    if (!email || !password || !ad_soyad || !rol) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 })
    }

    const admin = getAdmin()

    // Auth'a kayıt
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const uid = data.user.id

    // Personeller tablosuna ekle
    const { error: pErr } = await admin.from('personeller').upsert({
      id: uid,
      ad_soyad,
      rol,
      aktif: true,
    })
    if (pErr) {
      // Auth kullanıcısını geri al
      await admin.auth.admin.deleteUser(uid)
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: uid })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE — kullanıcıyı hem auth'tan hem personeller'den sil
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, secret } = body

    if (secret !== (process.env.ADMIN_SECRET || 'osgb-admin-2026')) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }
    if (!id) return NextResponse.json({ error: 'ID zorunludur' }, { status: 400 })

    const admin = getAdmin()

    // Önce personeller tablosundan sil
    await admin.from('personeller').delete().eq('id', id)

    // Auth'tan sil
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
