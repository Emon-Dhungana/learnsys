export const fetchPdfAsBlob = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
      mode: 'cors',
      credentials: 'omit',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()
    
    // Verify it's actually a PDF
    if (!blob.type.includes('pdf') && !blob.type.includes('octet-stream')) {
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
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName || 'document.pdf'
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the object URL after download
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
