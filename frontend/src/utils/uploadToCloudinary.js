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
    formData.append("access_control", JSON.stringify([{ access_type: "public" }]));

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

    // Construct public URL for PDFs - format: https://res.cloudinary.com/{cloud}/raw/upload/{public_id}
    let publicUrl = data.secure_url;
    
    if (data.public_id) {
      const resourceType = data.resource_type || 'raw';
      // Clean public_id - remove file extension if present
      const cleanPublicId = data.public_id.replace(/\.(pdf|PDF)$/, '');
      publicUrl = `https://res.cloudinary.com/dm6wsncor/${resourceType}/upload/${cleanPublicId}.pdf`;
    }

    return {
      secure_url: data.secure_url,
      public_url: publicUrl,
      public_id: data.public_id,
      resource_type: data.resource_type,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};