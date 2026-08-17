import { useEffect, useState } from 'react'
import { fetchPdfAsBlob, downloadPdf, getPdfObjectUrl } from '../utils/pdfUtils'

function PdfViewer({ pdfUrl, fileName, isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [blobUrl, setBlobUrl] = useState(null)
  const [pdfBlob, setPdfBlob] = useState(null)

  useEffect(() => {
    if (!isOpen || !pdfUrl) {
      return
    }

    const loadPdf = async () => {
      setIsLoading(true)
      setError(null)
      setBlobUrl(null)

      try {
        const blob = await fetchPdfAsBlob(pdfUrl)
        setPdfBlob(blob)
        const objectUrl = getPdfObjectUrl(blob)
        setBlobUrl(objectUrl)
      } catch (err) {
        setError(err?.message || 'Failed to load PDF')
        setPdfBlob(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadPdf()

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [isOpen, pdfUrl])

  if (!isOpen || !pdfUrl) {
    return null
  }

  const handleDownload = async () => {
    if (pdfBlob) {
      try {
        downloadPdf(pdfBlob, fileName)
      } catch (err) {
        setError(err?.message || 'Failed to download PDF')
      }
      return
    }

    try {
      const blob = await fetchPdfAsBlob(pdfUrl)
      downloadPdf(blob, fileName)
    } catch (err) {
      setError(err?.message || 'Failed to download PDF')
    }
  }

  return (
    <div className="pdf-viewer-overlay" role="presentation" onClick={onClose}>
      <div className="pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-viewer-header">
          <h2>{fileName || 'PDF Document'}</h2>
          <button 
            type="button" 
            className="pdf-viewer-close" 
            onClick={onClose}
            aria-label="Close PDF viewer"
          >
            ✕
          </button>
        </div>

        <div className="pdf-viewer-content">
          {isLoading && (
            <div className="pdf-viewer-loading">
              <p>Loading PDF...</p>
            </div>
          )}

          {error ? (
            <div className="pdf-viewer-error">
              <p>{error}</p>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={handleDownload}
              >
                Download PDF Instead
              </button>
            </div>
          ) : blobUrl ? (
            <iframe
              src={blobUrl}
              title={fileName || 'PDF Viewer'}
              className="pdf-viewer-iframe"
            />
          ) : null}
        </div>

        <div className="pdf-viewer-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={isLoading}
          >
            Download PDF
          </button>
          <button
            type="button"
            className="btn btn-light"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PdfViewer
