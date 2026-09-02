const isPdfLikeUrl = (url = '') => {
  const normalizedUrl = url.toLowerCase()

  return (
    normalizedUrl.endsWith('.pdf') ||
    normalizedUrl.includes('.pdf?') ||
    normalizedUrl.includes('%2epdf') ||
    normalizedUrl.includes('/pdf')
  )
}

export const fetchPdfAsBlob = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf, application/octet-stream, */*',
      },
      mode: 'cors',
      credentials: 'omit',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()
    const mimeType = (response.headers.get('Content-Type') || blob.type || '').toLowerCase()

    const isPdfBlob =
      mimeType.includes('pdf') ||
      mimeType.includes('octet-stream') ||
      mimeType === '' ||
      isPdfLikeUrl(url)

    if (!isPdfBlob) {
      throw new Error('Downloaded file is not a PDF')
    }

    return blob
  } catch (error) {
    console.error('Error fetching PDF:', error)
    throw error
  }
}

export const downloadPdf = (blob, fileName) => {
  const objectUrl = URL.createObjectURL(blob)

  try {
    const safeFileName = fileName?.trim() ? fileName : 'document.pdf'
    const normalizedName = safeFileName.toLowerCase().endsWith('.pdf')
      ? safeFileName
      : `${safeFileName}.pdf`

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = normalizedName
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 100)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

export const getPdfObjectUrl = (blob) => {
  return URL.createObjectURL(blob)
}
