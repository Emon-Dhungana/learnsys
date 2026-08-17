import { useState } from 'react'

function PdfViewer({ pdfUrl, fileName, isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  if (!isOpen || !pdfUrl) {
    return null
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setError('Unable to load PDF. Downloading instead...')
    // Fallback to download
    setTimeout(() => {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = fileName || 'document.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      onClose()
    }, 1500)
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
              <a href={pdfUrl} download={fileName} className="btn btn-primary">
                Download PDF
              </a>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              title={fileName || 'PDF Viewer'}
              className="pdf-viewer-iframe"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
        </div>

        <div className="pdf-viewer-footer">
          <a
            href={pdfUrl}
            download={fileName}
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download PDF
          </a>
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
