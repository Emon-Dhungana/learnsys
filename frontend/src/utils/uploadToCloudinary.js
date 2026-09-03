export const uploadToCloudinary = async (file, onProgress = () => {}) => {
  try {
    if (!file) {
      throw new Error('No file provided.')
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dm6wsncor'
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'learnsys_upload'
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    onProgress(10)

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => ({}))

    onProgress(70)

    if (!response.ok) {
      throw new Error(data?.error?.message || `Cloudinary upload failed (${response.status}).`)
    }

    const accessUrl = data.secure_url || data.url
    if (!accessUrl) {
      throw new Error('Cloudinary did not return a file URL.')
    }

    onProgress(100)

    return {
      secure_url: accessUrl,
      public_url: accessUrl,
      public_id: data.public_id,
      resource_type: data.resource_type,
    }
  } catch (error) {
    console.error('Cloudinary Upload Error:', error)
    throw error
  }
}