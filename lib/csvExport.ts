export function csvIndir(veriler: Record<string,any>[], dosyaAdi: string) {
  if (!veriler.length) return
  const basliklar = Object.keys(veriler[0])
  const satirlar = veriler.map(r =>
    basliklar.map(b => {
      const v = r[b] ?? ''
      const s = String(v).replace(/"/g, '""')
      return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s
    }).join(',')
  )
  const icerik = '\uFEFF' + [basliklar.join(','), ...satirlar].join('\n')
  const blob = new Blob([icerik], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${dosyaAdi}_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
