"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Download, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react"
import { getDocuments } from "@/app/actions"

interface Document {
  id: number
  title: string
  description?: string
  link_type: 'url' | 'file'
  url?: string
  file?: {
    id: string
    filename_download: string
  }
}

export default function LankarPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [expandedPdf, setExpandedPdf] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadDocuments() {
      setIsLoading(true)
      try {
        const result = await getDocuments()

        if (result.success) {
          setDocuments(result.data || [])
        } else {
          setError(result.error || "Kunde inte ladda dokument")
        }
      } catch (err) {
        console.error("Error loading documents:", err)
        setError("Kunde inte ladda dokument")
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const togglePdfExpand = (url: string) => {
    setExpandedPdf(expandedPdf === url ? null : url)
  }

  const getDocumentUrl = (doc: Document): string => {
    if (doc.link_type === 'file' && doc.file) {
      return `https://cms.businessfalkenberg.se/assets/${doc.file.id}`
    }
    return doc.url || ''
  }

  const isPdfUrl = (url: string) => {
    return url.toLowerCase().endsWith('.pdf') ||
           url.includes('/assets/') // Directus assets are often PDFs
  }

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex-1 p-4 md:p-6 overflow-auto w-full">
            <CustomSidebarTrigger />
            <header className="flex justify-between items-center mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <FileText size={24} className="text-primary mr-2" />
                  <h1 className="text-2xl font-bold">Länkar & Dokument</h1>
                </div>
                <p className="text-muted-foreground">Viktiga dokument och resurser för foodtruck-ägare</p>
              </div>
            </header>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                <p>{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Inga dokument tillgängliga</h3>
                  <p className="text-muted-foreground">
                    Det finns inga länkar eller dokument att visa just nu.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {documents.map((doc) => {
                  const docUrl = getDocumentUrl(doc)
                  const isPdf = isPdfUrl(docUrl)

                  return (
                    <Card key={doc.id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              {isPdf ? (
                                <FileText className="h-6 w-6 text-primary" />
                              ) : (
                                <LinkIcon className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{doc.title}</CardTitle>
                              {doc.description && (
                                <CardDescription className="mt-1">
                                  {doc.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(docUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Öppna
                            </Button>
                            {isPdf && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a href={docUrl} download>
                                    <Download className="h-4 w-4 mr-1" />
                                    Ladda ner
                                  </a>
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => togglePdfExpand(docUrl)}
                                >
                                  {expandedPdf === docUrl ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      Dölj
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      Visa här
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {/* Inline PDF viewer */}
                      {isPdf && expandedPdf === docUrl && (
                        <CardContent className="pt-0">
                          <div className="border rounded-lg overflow-hidden bg-gray-100">
                            <iframe
                              src={`${docUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                              className="w-full h-[70vh] min-h-[500px]"
                              title={doc.title}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Om PDF:en inte visas korrekt, klicka på "Öppna" för att öppna i ny flik
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
