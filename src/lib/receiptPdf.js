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

export async function buildReceiptPdf({ number, date, paid, rows, amount, company, logoBytes }) {
  let watermark = null
  try {
    watermark = await loadWatermark(logoBytes)
  } catch {
    watermark = null
  }

  const commands = []
  if (watermark) {
    const drawW = 400
    const drawH = drawW * (watermark.height / watermark.width)
    const x = (595 - drawW) / 2
    const y = (842 - drawH) / 2
    commands.push(
      `q /GS1 gs ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im1 Do Q`,
    )
  }
  commands.push(
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
  )

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
