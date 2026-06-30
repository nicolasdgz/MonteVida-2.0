type CsvRow = Record<string, string | number | boolean | null | undefined>

export function toCsv(data: CsvRow[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      const str = String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

export function downloadCsv(data: CsvRow[], filename: string): void {
  const csv = toCsv(data)
  const blob = new Blob(['ï»¿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
