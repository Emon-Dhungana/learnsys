export const uploadToCloudinary = async (file, onProgress = () => {}) => {
  try {
    if (!file) throw new Error("No file provided");

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    const endpointType = isPdf ? "raw" : "auto";
    const url = `https://api.cloudinary.com/v1_1/dm6wsncor/${endpointType}/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "learnsys_upload");
    // Ensure file is publicly accessible
    formData.append("access_control", JSON.stringify([{ access_type: "public" }]));
    formData.append("flags", "immutable_cache");

    // NOTE: fetch does NOT support real progress tracking
    // so we simulate basic progress updates
    onProgress(10);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    onProgress(70);

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();

    onProgress(100);

    // Convert secure_url to public URL for better accessibility
    let publicUrl = data.secure_url;
    if (data.secure_url && data.public_id) {
      // Replace secure_url with a version that's accessible without auth
      publicUrl = data.secure_url.replace(/^https:\/\/res\.cloudinary\.com/, 'https://dl.dropboxusercontent.com');
      // Better approach: use the standard public URL format
      const resourceType = data.resource_type || (isPdf ? 'raw' : 'image');
      publicUrl = `https://res.cloudinary.com/dm6wsncor/${resourceType}/upload/fl_attachment,f_auto/${data.public_id}`;
    }

    return {
      secure_url: data.secure_url,
      url: publicUrl,
      public_id: data.public_id,
      resource_type: data.resource_type,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};