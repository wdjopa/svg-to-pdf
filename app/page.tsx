"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Download, FileText, Loader2 } from "lucide-react"

export default function Home() {
  const [svg, setSvg] = useState("")
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const handleConvert = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setPdfUrl(null)

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ svg }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Conversion failed")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (pdfUrl) {
      const a = document.createElement("a")
      a.href = pdfUrl
      a.download = "converted.pdf"
      a.click()
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-foreground">SVG to PDF Converter 🗂️ </h1>
        <p className="mb-6 text-muted-foreground">
          Convertissez vos fichiers SVG en PDF avec authentification par token
        </p>

        <Tabs defaultValue="test" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="test">Tester</TabsTrigger>
            <TabsTrigger value="docs">Documentation API</TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Entrée
                  </CardTitle>
                  <CardDescription>Collez votre code SVG et entrez votre token API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="token">Token API</Label>
                    <Input
                      id="token"
                      type="password"
                      placeholder="Entrez votre token API"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="svg">Code SVG</Label>
                    <Textarea
                      id="svg"
                      placeholder='<svg width="100" height="100">...</svg>'
                      className="min-h-[300px] font-mono text-sm"
                      value={svg}
                      onChange={(e) => setSvg(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleConvert} disabled={loading || !svg || !token} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Conversion en cours...
                      </>
                    ) : (
                      "Convertir en PDF"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Résultat
                  </CardTitle>
                  <CardDescription>Prévisualisez et téléchargez votre PDF</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {success && pdfUrl && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 rounded-lg border border-green-500 bg-green-500/10 p-4 text-green-600">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">Conversion réussie</p>
                      </div>

                      <div className="overflow-hidden rounded-lg border border-border">
                        <iframe src={pdfUrl} className="h-[350px] w-full" title="PDF Preview" />
                      </div>

                      <Button onClick={handleDownload} variant="outline" className="w-full bg-transparent">
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger le PDF
                      </Button>
                    </div>
                  )}

                  {!error && !success && (
                    <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">Le résultat apparaîtra ici</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="docs">
            <Card>
              <CardHeader>
                <CardTitle>Documentation API</CardTitle>
                <CardDescription>Comment utiliser l'API de conversion SVG vers PDF</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-2 font-medium text-foreground">Endpoint</h3>
                  <code className="block rounded bg-muted p-3 text-sm text-muted-foreground">POST /api/convert</code>
                </div>

                <div>
                  <h3 className="mb-2 font-medium text-foreground">Headers</h3>
                  <code className="block rounded bg-muted p-3 text-sm text-muted-foreground">
                    Authorization: Bearer YOUR_API_TOKEN
                    <br />
                    Content-Type: application/json
                  </code>
                </div>

                <div>
                  <h3 className="mb-2 font-medium text-foreground">Request Body</h3>
                  <pre className="rounded bg-muted p-3 text-sm text-muted-foreground">
                    {`{
  "svg": "<svg>...</svg>"
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="mb-2 font-medium text-foreground">Exemple (cURL)</h3>
                  <pre className="overflow-x-auto rounded bg-muted p-3 text-sm text-muted-foreground">
                    {`curl -X POST https://your-domain.com/api/convert \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"svg": "<svg width=\\"100\\" height=\\"100\\"><circle cx=\\"50\\" cy=\\"50\\" r=\\"40\\" fill=\\"red\\"/></svg>"}' \\
  --output converted.pdf`}
                  </pre>
                </div>

                <div>
                  <h3 className="mb-2 font-medium text-foreground">Réponse</h3>
                  <p className="text-sm text-muted-foreground">
                    Retourne un fichier PDF (application/pdf) en cas de succès, ou un message d'erreur JSON en cas
                    d'échec.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-medium text-foreground">Codes d'erreur</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>
                      <strong>401</strong> - Token invalide ou manquant
                    </li>
                    <li>
                      <strong>400</strong> - Contenu SVG invalide ou manquant
                    </li>
                    <li>
                      <strong>500</strong> - Erreur serveur lors de la conversion
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
