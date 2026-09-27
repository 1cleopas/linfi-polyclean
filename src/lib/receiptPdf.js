function pdfEscape(value) {
  return String(value ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function line(text, size, x, y, font = 'F1') {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`
}

export function buildReceiptPdf({ number, date, paid, rows, amount, company }) {
  const commands = [
    line(company.name, 20, 48, 780),
    line(company.tagline, 11, 48, 758, 'F2'),
    line(company.phone, 11, 48, 738, 'F2'),
    line(company.email, 11, 48, 722, 'F2'),
    line(company.serviceArea, 11, 48, 706, 'F2'),
    line('RECEIPT', 12, 430, 780),
    line(number, 14, 430, 758),
    line(date, 11, 430, 738, 'F2'),
    line(paid ? 'PAID' : 'UNPAID', 12, 430, 716),
    '0.75 w 48 690 m 547 690 l S',
  ]

  let y = 660
  for (const [label, value] of rows) {
    commands.push(line(label, 11, 48, y, 'F2'))
    commands.push(line(value, 12, 220, y))
    y -= 24
  }

  y -= 12
  commands.push('0.75 w 48 ' + y + ' m 547 ' + y + ' l S')
  y -= 28
  commands.push(line('Amount', 12, 48, y, 'F2'))
  commands.push(line(amount, 18, 220, y))
  y -= 40
  commands.push(
    line('Prices may vary due to location and tank position.', 10, 48, y, 'F2'),
  )
  commands.push(line('This receipt confirms the amount recorded for this job.', 10, 48, y - 16, 'F2'))

  const stream = commands.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}
