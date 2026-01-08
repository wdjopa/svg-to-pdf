import { type NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import "svg2pdf.js"
import { parseHTML } from "linkedom"

export const runtime = "nodejs"

const API_TOKEN = process.env.API_TOKEN

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!API_TOKEN) {
    return NextResponse.json(
      { error: "Server configuration error: API_TOKEN not set" },
      { status: 500 }
    )
  }

  if (!token || token !== API_TOKEN) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing token" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { svg } = body

    if (!svg || typeof svg !== "string") {
      return NextResponse.json(
        { error: "Bad Request: SVG content is required" },
        { status: 400 }
      )
    }

    if (!svg.trim().startsWith("<")) {
      return NextResponse.json(
        { error: "Bad Request: Invalid SVG content" },
        { status: 400 }
      )
    }

    const pdfBuffer = await convertSvgToPdf(svg)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="converted.pdf"',
      },
    })
  } catch (error) {
    console.error("SVG to PDF conversion error:", error)
    return NextResponse.json(
      { error: "Internal Server Error: Failed to convert SVG to PDF" },
      { status: 500 }
    )
  }
}

async function convertSvgToPdf(svgContent: string): Promise<Buffer> {
  // Extraire les dimensions du SVG
  const widthMatch = svgContent.match(/width=["'](\d+(?:\.\d+)?)(?:px)?["']/)
  const heightMatch = svgContent.match(/height=["'](\d+(?:\.\d+)?)(?:px)?["']/)
  const viewBoxMatch = svgContent.match(
    /viewBox=["']([\d.-]+)\s+([\d.-]+)\s+([\d.]+)\s+([\d.]+)["']/
  )

  let width = 595
  let height = 842

  if (widthMatch && heightMatch) {
    width = Number.parseFloat(widthMatch[1])
    height = Number.parseFloat(heightMatch[1])
  } else if (viewBoxMatch) {
    width = Number.parseFloat(viewBoxMatch[3])
    height = Number.parseFloat(viewBoxMatch[4])
  }

  // Créer un DOM virtuel avec linkedom
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${svgContent}</body></html>`)
  const svgElement = document.querySelector("svg")

  if (!svgElement) {
    throw new Error("Invalid SVG content")
  }

  // Créer le PDF
  const orientation = width > height ? "landscape" : "portrait"
  const doc = new jsPDF({
    orientation,
    unit: "pt",
    format: [width, height],
  })

  // Convertir SVG en PDF (vectoriel, texte préservé)
  await (doc as any).svg(svgElement, {
    x: 0,
    y: 0,
    width,
    height,
  })

  // Retourner le buffer
  const arrayBuffer = doc.output("arraybuffer")
  return Buffer.from(arrayBuffer)
}
