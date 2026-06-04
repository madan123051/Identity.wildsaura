import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a profile/avatar photo and returns the download URL.
 */
export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storageRef = ref(storage, `profiles/${uid}/avatar.${ext}`);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });
  return getDownloadURL(snapshot.ref);
}

/**
 * Uploads a verification document photo (front or back) and returns the download URL.
 */
export async function uploadDocumentPhoto(
  uid: string,
  side: "front" | "back",
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storageRef = ref(
    storage,
    `verifications/${uid}/document_${side}_${Date.now()}.${ext}`
  );
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });
  return getDownloadURL(snapshot.ref);
}
