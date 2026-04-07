import { createClient } from '@/lib/supabase/client';

/**
 * Upload an avatar image to the avatars storage bucket.
 * Files are stored under the authenticated user's folder: {user_id}/{uuid}.{ext}
 * Returns the public URL of the uploaded image.
 */
export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to upload an avatar');
  }

  const ext = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${user.id}/${fileName}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path);

  return publicUrl;
}

/**
 * Upload a program cover image to the program-covers storage bucket.
 * Files are stored under the program's folder: {program_id}/{uuid}.{ext}
 * Returns the public URL of the uploaded image.
 */
export async function uploadProgramCover(
  programId: string,
  file: File
): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${programId}/${fileName}`;

  const { error } = await supabase.storage
    .from('program-covers')
    .upload(path, file, { upsert: true });

  if (error) {
    throw new Error(`Program cover upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('program-covers').getPublicUrl(path);

  return publicUrl;
}
