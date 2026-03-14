export async function getUploadSignature(params: Record<string, any>) {
  const res = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ params }),
  });
  if (!res.ok) throw new Error("Failed to get upload signature");
  return res.json();
}

export async function uploadToCloudinary(
  file: File,
  folder: string,
  metadata?: Record<string, string>
): Promise<string> {
  const params: Record<string, any> = { folder };

  if (metadata) {
    const context = Object.entries(metadata)
      .map(([k, v]) => `${k}=${v}`)
      .join("|");
    params.context = context;
  }

  const { timestamp, signature, apiKey, cloudName } = await getUploadSignature(params);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);

  if (params.context) {
    formData.append("context", params.context);
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("[Cloudinary] Upload failed:", {
      status: res.status,
      statusText: res.statusText,
      error: errorData.error?.message || "Unknown error",
    });
    throw new Error(`Upload failed: ${errorData.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.secure_url;
}

export async function uploadMultipleImages(
  files: File[],
  folder: string,
  metadata?: Record<string, string>
): Promise<string[]> {
  const uploads = files.map((file) => uploadToCloudinary(file, folder, metadata));
  return Promise.all(uploads);
}
