function pdfEscape(value) {
  return String(value ?? '')
    .replace(/[–—·]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function line(text, size, x, y, font = 'F1') {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`
}

function ascii(value) {
  return new TextEncoder().encode(value)
}

function concat(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function readU32(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset)
}

async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function deflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const upLeftDistance = Math.abs(estimate - upLeft)
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left
  if (upDistance <= upLeftDistance) return up
  return upLeft
}

async function decodeLogo(bytes) {
  let offset = 8
  const idatParts = []
  let width = 0
  let height = 0
  while (offset + 8 < bytes.length) {
    const length = readU32(bytes, offset)
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7])
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = readU32(data, 0)
      height = readU32(data, 4)
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error('Unsupported logo image')
    } else if (type === 'IDAT') {
      idatParts.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }

  const raw = await inflate(concat(idatParts))
  const stride = width * 4
  const pixels = new Uint8Array(height * stride)
  let source = 0
  for (let y = 0; y < height; y += 1) {
    const filter = raw[source]
    source += 1
    const row = y * stride
    for (let x = 0; x < stride; x += 1) {
      const left = x >= 4 ? pixels[row + x - 4] : 0
      const up = y > 0 ? pixels[row - stride + x] : 0
      const upLeft = y > 0 && x >= 4 ? pixels[row - stride + x - 4] : 0
      const value = raw[source]
      source += 1
      if (filter === 0) pixels[row + x] = value
      else if (filter === 1) pixels[row + x] = (value + left) & 255
      else if (filter === 2) pixels[row + x] = (value + up) & 255
      else if (filter === 3) pixels[row + x] = (value + Math.floor((left + up) / 2)) & 255
      else if (filter === 4) pixels[row + x] = (value + paeth(left, up, upLeft)) & 255
      else throw new Error('Unsupported logo image')
    }
  }

  const rgb = new Uint8Array(width * height * 3)
  const alpha = new Uint8Array(width * height)
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const red = pixels[pixel * 4]
    const green = pixels[pixel * 4 + 1]
    const blue = pixels[pixel * 4 + 2]
    rgb[pixel * 3] = red
    rgb[pixel * 3 + 1] = green
    rgb[pixel * 3 + 2] = blue
    const blank = red >= 248 && green >= 248 && blue >= 248
    alpha[pixel] = blank ? 0 : pixels[pixel * 4 + 3]
  }

  return {
    width,
    height,
    rgb: await deflate(rgb),
    alpha: await deflate(alpha),
  }
}

async function loadWatermark(logoBytes) {
  const bytes = logoBytes ? new Uint8Array(logoBytes) : new Uint8Array(await (await fetch('/logo.png')).arrayBuffer())
  return decodeLogo(bytes)
}

function streamObject(data) {
  return concat([ascii(`<< /Length ${data.length} >>\nstream\n`), data, ascii('\nendstream')])
}

function pdfBytes(objects) {
  const parts = [ascii('%PDF-1.4\n')]
  const offsets = [0]
  let position = parts[0].length
  objects.forEach((body, index) => {
    const head = ascii(`${index + 1} 0 obj\n`)
    const tail = ascii('\nendobj\n')
    offsets.push(position)
    parts.push(head, body, tail)
    position += head.length + body.length + tail.length
  })
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  xref += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF`
  parts.push(ascii(xref))
  return concat(parts)
}

async function watermarkCommands(logoBytes) {
  let watermark = null
  try {
    watermark = await loadWatermark(logoBytes)
  } catch {
    watermark = null
  }
  if (!watermark) return { watermark, commands: [] }
  const drawW = 400
  const drawH = drawW * (watermark.height / watermark.width)
  const x = (595 - drawW) / 2
  const y = (842 - drawH) / 2
  return {
    watermark,
    commands: [`q /GS1 gs ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im1 Do Q`],
  }
}

function companyHeader(company, title, number, details) {
  return [
    line(company.name, 20, 48, 780),
    line(company.tagline, 11, 48, 758, 'F2'),
    line(company.phone, 11, 48, 738, 'F2'),
    line(company.email, 11, 48, 722, 'F2'),
    line(company.serviceArea, 11, 48, 706, 'F2'),
    line(title, 12, 430, 780),
    line(number, 14, 430, 758),
    ...details.map(([text, font], index) => line(text, font === 'F1' ? 12 : 11, 430, 738 - index * 20, font)),
    '0.75 w 48 690 m 547 690 l S',
  ]
}

function pageBlob(commands, watermark) {
  const resources = watermark
    ? '/Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R >> /ExtGState << /GS1 9 0 R >>'
    : '/Font << /F1 5 0 R /F2 6 0 R >>'
  const objects = [
    ascii('<< /Type /Catalog /Pages 2 0 R >>'),
    ascii('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    ascii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Group << /Type /Group /S /Transparency /CS /DeviceRGB >> /Contents 4 0 R /Resources << ${resources} >> >>`,
    ),
    streamObject(ascii(commands.join('\n'))),
    ascii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'),
    ascii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),
  ]

  if (watermark) {
    objects.push(
      concat([
        ascii(
          `<< /Type /XObject /Subtype /Image /Width ${watermark.width} /Height ${watermark.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask 8 0 R /Length ${watermark.rgb.length} >>\nstream\n`,
        ),
        watermark.rgb,
        ascii('\nendstream'),
      ]),
      concat([
        ascii(
          `<< /Type /XObject /Subtype /Image /Width ${watermark.width} /Height ${watermark.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${watermark.alpha.length} >>\nstream\n`,
        ),
        watermark.alpha,
        ascii('\nendstream'),
      ]),
      ascii('<< /Type /ExtGState /ca 0.22 /CA 0.22 >>'),
    )
  }

  return new Blob([pdfBytes(objects)], { type: 'application/pdf' })
}

function clip(value, max) {
  const text = String(value ?? '')
  return text.length > max ? `${text.slice(0, max - 3)}...` : text
}

function wrap(value, width) {
  const words = String(value ?? '').split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    if (current && (current + ' ' + word).length > width) {
      lines.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) lines.push(current)
  return lines
}

export async function buildReceiptPdf({ number, date, paid, rows, amount, company, logoBytes }) {
  const { watermark, commands } = await watermarkCommands(logoBytes)
  commands.push(...companyHeader(company, 'RECEIPT', number, [[date, 'F2'], [paid ? 'PAID' : 'UNPAID', 'F1']]))

  let textY = 660
  for (const [label, value] of rows) {
    commands.push(line(label, 11, 48, textY, 'F2'))
    commands.push(line(value, 12, 220, textY))
    textY -= 24
  }

  textY -= 12
  commands.push(`0.75 w 48 ${textY} m 547 ${textY} l S`)
  textY -= 28
  commands.push(line('Amount', 12, 48, textY, 'F2'))
  commands.push(line(amount, 18, 220, textY))
  textY -= 40
  commands.push(line('Prices may vary due to location and tank position.', 10, 48, textY, 'F2'))
  commands.push(line('This receipt covers every tank booked for this customer.', 10, 48, textY - 16, 'F2'))

  return pageBlob(commands, watermark)
}

const MAX_INVOICE_LINES = 16

export async function buildInvoicePdf({ number, issued, status, billTo, items, subtotal, discount, total, notes, company, logoBytes }) {
  const { watermark, commands } = await watermarkCommands(logoBytes)
  commands.push(...companyHeader(company, 'INVOICE', number, [[`Issued ${issued}`, 'F2'], [status.toUpperCase(), 'F1']]))

  let textY = 662
  commands.push(line('BILL TO', 10, 48, textY, 'F2'))
  textY -= 18
  commands.push(line(billTo.name, 13, 48, textY))
  for (const detail of billTo.details.filter(Boolean)) {
    textY -= 16
    commands.push(line(detail, 11, 48, textY, 'F2'))
  }

  textY -= 32
  commands.push(
    line('Description', 10, 48, textY, 'F2'),
    line('Qty', 10, 350, textY, 'F2'),
    line('Unit price', 10, 395, textY, 'F2'),
    line('Amount', 10, 480, textY, 'F2'),
  )
  textY -= 8
  commands.push(`0.5 w 48 ${textY} m 547 ${textY} l S`)

  const shown = items.slice(0, MAX_INVOICE_LINES)
  for (const item of shown) {
    textY -= 20
    const [first = '-', ...rest] = wrap(item.description, 48)
    commands.push(
      line(first, 11, 48, textY),
      line(item.quantity, 11, 350, textY, 'F2'),
      line(item.unitPrice, 11, 395, textY, 'F2'),
      line(item.amount, 11, 480, textY),
    )
    if (rest.length) {
      textY -= 14
      commands.push(line(clip(rest.join(' '), 52), 10, 48, textY, 'F2'))
    }
  }
  if (items.length > shown.length) {
    textY -= 18
    commands.push(line(`+ ${items.length - shown.length} more line(s) - total below includes them`, 10, 48, textY, 'F2'))
  }

  textY -= 14
  commands.push(`0.75 w 48 ${textY} m 547 ${textY} l S`)
  if (discount) {
    textY -= 20
    commands.push(line('Subtotal', 11, 350, textY, 'F2'), line(subtotal, 11, 480, textY))
    textY -= 18
    commands.push(line('Discount', 11, 350, textY, 'F2'), line(`- ${discount}`, 11, 480, textY))
  }
  textY -= 30
  commands.push(line('Total due', 12, 350, textY, 'F2'), line(total, 16, 480, textY))

  textY -= 40
  for (const noteLine of wrap(notes, 95).slice(0, 5)) {
    commands.push(line(noteLine, 10, 48, textY, 'F2'))
    textY -= 14
  }
  commands.push(line('Prices may vary due to location and tank position.', 10, 48, Math.min(textY - 6, 80), 'F2'))

  return pageBlob(commands, watermark)
}
