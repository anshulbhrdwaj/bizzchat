import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';

// Ensure uploads directory exists
const uploadsPath = path.resolve(process.cwd(), UPLOADS_DIR);
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

export async function saveLocalFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  const ext = path.extname(originalName) || '.bin';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = path.join(uploadsPath, name);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${name}`;
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  // For now just use local storage
  return saveLocalFile(buffer, originalName, mimeType);
}

export async function deleteFile(url: string): Promise<void> {
  const fileName = path.basename(url);
  const filePath = path.join(uploadsPath, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
