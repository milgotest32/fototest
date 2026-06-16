import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const VERCEL_JSON = join(process.cwd(), 'vercel.json')

export async function GET() {
  try {
    const raw = readFileSync(VERCEL_JSON, 'utf8')
    const data = JSON.parse(raw)
    return NextResponse.json({ redirects: data.redirects || [] })
  } catch {
    return NextResponse.json({ redirects: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { redirects } = await req.json()
    const raw = readFileSync(VERCEL_JSON, 'utf8')
    const data = JSON.parse(raw)
    data.redirects = redirects
    writeFileSync(VERCEL_JSON, JSON.stringify(data, null, 2))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
