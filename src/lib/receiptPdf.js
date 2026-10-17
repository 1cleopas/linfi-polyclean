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

function pageBlob(commands, watermark, qr) {
  const objects = [
    ascii('<< /Type /Catalog /Pages 2 0 R >>'),
    ascii('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    null,
    streamObject(ascii(commands.join('\n'))),
    ascii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'),
    ascii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),
  ]
  const xobjects = []
  let extGState = ''

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
    xobjects.push('/Im1 7 0 R')
    extGState = ' /ExtGState << /GS1 9 0 R >>'
  }

  if (qr) {
    // PNG image data goes straight into the PDF: both use zlib with PNG row predictors.
    objects.push(
      concat([
        ascii(
          `<< /Type /XObject /Subtype /Image /Width ${qr.width} /Height ${qr.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors 1 /BitsPerComponent 8 /Columns ${qr.width} >> /Length ${qr.data.length} >>\nstream\n`,
        ),
        qr.data,
        ascii('\nendstream'),
      ]),
    )
    xobjects.push(`/Im2 ${objects.length} 0 R`)
  }

  const xobjectDict = xobjects.length ? ` /XObject << ${xobjects.join(' ')} >>` : ''
  objects[2] = ascii(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Group << /Type /Group /S /Transparency /CS /DeviceRGB >> /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >>${xobjectDict}${extGState} >> >>`,
  )

  return new Blob([pdfBytes(objects)], { type: 'application/pdf' })
}

// Reads an 8-bit greyscale, non-interlaced PNG (the MoMo QR code) without decoding its pixels.
async function loadQr(qrBytes, src) {
  const bytes = qrBytes ? new Uint8Array(qrBytes) : new Uint8Array(await (await fetch(src)).arrayBuffer())
  let offset = 8
  let width = 0
  let height = 0
  const idatParts = []
  while (offset + 8 < bytes.length) {
    const length = readU32(bytes, offset)
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7])
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = readU32(data, 0)
      height = readU32(data, 4)
      if (data[8] !== 8 || data[9] !== 0 || data[12] !== 0) throw new Error('Unsupported QR image')
    } else if (type === 'IDAT') {
      idatParts.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }
  return { width, height, data: concat(idatParts) }
}

async function paymentQr(payment, qrBytes) {
  if (!payment?.qrImage && !qrBytes) return null
  try {
    return await loadQr(qrBytes, payment.qrImage)
  } catch {
    return null
  }
}

// Where the payment section starts; page content must stay above it.
function paymentTop(paid) {
  return paid ? 125 : 212
}

function paymentCommands(payment, { paid, reference, qr }) {
  if (!payment) return []
  if (paid) {
    return [
      '0.75 w 48 118 m 547 118 l S',
      line('PAYMENT', 11, 48, 98),
      line('Payment received by Mobile Money (MoMo). Thank you.', 10, 48, 82, 'F2'),
      line(`Merchant: ${payment.merchantName} - ID ${payment.merchantId}`, 9, 48, 68, 'F2'),
    ]
  }
  const commands = [
    '0.75 w 48 205 m 547 205 l S',
    line('HOW TO PAY', 11, 48, 186),
    line(payment.terms, 10, 48, 170, 'F2'),
    line(`Merchant ID: ${payment.merchantId}`, 12, 48, 150),
    line(`Merchant name: ${payment.merchantName}`, 10, 48, 134, 'F2'),
    reference ? line(`Reference: ${reference}`, 10, 48, 120, 'F2') : '',
    line(`Dial *170# > MoMoPay > Merchant ID ${payment.merchantId} > amount and reference > PIN.`, 9, 48, 100, 'F2'),
    line(qr ? 'Or scan the QR code with the MoMo app (Scan & Pay).' : 'Or use Scan & Pay in the MoMo app.', 9, 48, 86, 'F2'),
  ].filter(Boolean)
  if (qr) {
    commands.push('q 112 0 0 112 435 70 cm /Im2 Do Q', line('Scan to pay with MoMo', 8, 448, 58, 'F2'))
  }
  return commands
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

export async function buildReceiptPdf({ number, date, paid, rows, amount, company, payment, logoBytes, qrBytes }) {
  const { watermark, commands } = await watermarkCommands(logoBytes)
  const qr = paid ? null : await paymentQr(payment, qrBytes)
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
  commands.push(...paymentCommands(payment, { paid, reference: number, qr }))

  return pageBlob(commands, watermark, qr)
}

const MAX_INVOICE_LINES = 16

export async function buildInvoicePdf({ number, issued, status, paid, billTo, items, subtotal, discount, total, notes, company, payment, logoBytes, qrBytes }) {
  const { watermark, commands } = await watermarkCommands(logoBytes)
  const qr = paid ? null : await paymentQr(payment, qrBytes)
  const floor = payment ? paymentTop(paid) : 60
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

  const shown = []
  for (const item of items.slice(0, MAX_INVOICE_LINES)) {
    // Leave room for the totals (about 95pt) above the payment section.
    if (textY - 34 < floor + 95) break
    shown.push(item)
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
  commands.push(line(paid ? 'Total paid' : 'Total due', 12, 350, textY, 'F2'), line(total, 16, 480, textY))

  textY -= 26
  // Notes come first; the "prices may vary" line is dropped when the notes need its space.
  const noteLines = wrap(notes, 95)
  let noteRoom = Math.floor((textY - floor - 20) / 14)
  const showPricesLine = noteLines.length <= noteRoom
  if (!showPricesLine) noteRoom = Math.floor((textY - floor - 6) / 14)
  const shownNotes = noteLines.slice(0, Math.max(0, Math.min(5, noteRoom)))
  if (shownNotes.length < noteLines.length && shownNotes.length) {
    shownNotes[shownNotes.length - 1] = `${clip(shownNotes[shownNotes.length - 1], 92)}...`
  }
  for (const noteLine of shownNotes) {
    commands.push(line(noteLine, 10, 48, textY, 'F2'))
    textY -= 14
  }
  if (showPricesLine) commands.push(line('Prices may vary due to location and tank position.', 10, 48, textY - 4, 'F2'))
  commands.push(...paymentCommands(payment, { paid, reference: number, qr }))

  return pageBlob(commands, watermark, qr)
}
