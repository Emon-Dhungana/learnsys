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

    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
      resource_type: data.resource_type,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};