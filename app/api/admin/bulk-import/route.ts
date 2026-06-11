import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { table, rows } = await req.json()
  
  const results = { inserted: 0, errors: [] as any[] }
  
  // 50'şer batch
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50)
    const { error, count } = await sb.from(table).insert(chunk, { count: 'exact' })
    if (error) {
      results.errors.push({ batch: i, error: error.message })
    } else {
      results.inserted += count || chunk.length
    }
  }

  return NextResponse.json(results)
}
