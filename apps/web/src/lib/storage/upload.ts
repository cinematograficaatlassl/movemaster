"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

export async function uploadTaskAttachment(
  workspaceId: string,
  taskId: string,
  file: File
): Promise<{ path: string; url: string; name: string; size: number; contentType: string }> {
  if (!storage) throw new Error("Storage no inicializado.");
  const path = `workspaces/${workspaceId}/tasks/${taskId}/${Date.now()}-${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type });
  const url = await getDownloadURL(r);
  return { path, url, name: file.name, size: file.size, contentType: file.type || "application/octet-stream" };
}

