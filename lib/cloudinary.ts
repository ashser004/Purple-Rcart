const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dj4ieq1ig';

export async function uploadImageToCloudinary(
  file: File,
  userId: string,
  subfolder: string = 'products'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', `ASHMITH_RCART/${userId}/${subfolder}`);

  // Use signed upload via our API route
  const signRes = await fetch('/api/cloudinary/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      folder: `ASHMITH_RCART/${userId}/${subfolder}`,
    }),
  });
  const { signature, timestamp, apiKey } = await signRes.json();

  formData.append('signature', signature);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', apiKey);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
}

export function getCloudinaryUrl(publicId: string, transforms: string = 'w_400,h_400,c_fill,q_auto'): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}
