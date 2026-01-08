import { type NextRequest, NextResponse } from "next/server"

const API_TOKEN = process.env.API_TOKEN

export async function POST(request: NextRequest) {
  // Verify authorization token
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!API_TOKEN) {
    return NextResponse.json({ error: "Server configuration error: API_TOKEN not set" }, { status: 500 })
  }

  if (!token || token !== API_TOKEN) {
    return NextResponse.json({ error: "Unauthorized: Invalid or missing token" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { svg } = body

    if (!svg || typeof svg !== "string") {
      return NextResponse.json({ error: "Bad Request: SVG content is required" }, { status: 400 })
    }

    // Validate that it's actually SVG content
    if (!svg.trim().startsWith("<svg") && !svg.trim().startsWith("<?xml")) {
      return NextResponse.json({ error: "Bad Request: Invalid SVG content" }, { status: 400 })
    }

    // Convert SVG to PDF using svg2pdf approach
    const pdfBuffer = await convertSvgToPdf(svg)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="converted.pdf"',
      },
    })
  } catch (error) {
    console.error("Conversion error:", error)
    return NextResponse.json({ error: "Internal Server Error: Failed to convert SVG to PDF" }, { status: 500 })
  }
}

async function convertSvgToPdf(svgContent: string): Promise<Buffer> {
  const { PDFDocument } = await import("pdf-lib")

  // Parse SVG dimensions
  const widthMatch = svgContent.match(/width=["'](\d+)(?:px)?["']/)
  const heightMatch = svgContent.match(/height=["'](\d+)(?:px)?["']/)
  const viewBoxMatch = svgContent.match(/viewBox=["'][\d.]+ [\d.]+ ([\d.]+) ([\d.]+)["']/)

  let width = 595 // A4 width in points
  let height = 842 // A4 height in points

  if (widthMatch && heightMatch) {
    width = Number.parseFloat(widthMatch[1])
    height = Number.parseFloat(heightMatch[1])
  } else if (viewBoxMatch) {
    width = Number.parseFloat(viewBoxMatch[1])
    height = Number.parseFloat(viewBoxMatch[2])
  }

  // Create PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([width, height])

  // Encode SVG as base64 data URI
  const svgBase64 = Buffer.from(svgContent).toString("base64")
  const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`

  // Fetch and embed as PNG using sharp
  const sharp = (await import("sharp")).default
  const pngBuffer = await sharp(Buffer.from(svgContent))
    .resize(Math.round(width * 2), Math.round(height * 2)) // 2x for better quality
    .png()
    .toBuffer()

  const pngImage = await pdfDoc.embedPng(pngBuffer)

  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: width,
    height: height,
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
