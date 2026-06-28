import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const USE_S3 = process.env.USE_S3 === 'true';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

let s3Client: S3Client | null = null;
if (USE_S3) {
  s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
}

class StorageService {
  /**
   * Generates a unique file key
   */
  private generateFileKey(fileName: string, vendorId: string): string {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString('hex');
    return `documents/${vendorId}-${timestamp}-${randomHex}-${cleanFileName}`;
  }

  /**
   * Generates a pre-signed upload URL for PUT request
   */
  async generateUploadUrl(fileName: string, mimeType: string, vendorId: string): Promise<UploadUrlResponse> {
    const fileKey = this.generateFileKey(fileName, vendorId);

    if (USE_S3 && s3Client) {
      const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: fileKey,
        ContentType: mimeType,
      });

      // S3 upload URL expires in 15 minutes
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
      // Standard public-facing S3 URL (we'll generate pre-signed GET URLs on retrieval)
      const fileUrl = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`;

      return { uploadUrl, fileKey, fileUrl };
    } else {
      // Local mode fallback
      // Upload URL directs the client to our backend local upload mock endpoint
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5050';
      const uploadUrl = `${backendUrl}/vendors/documents/local-upload-mock?fileKey=${encodeURIComponent(fileKey)}`;
      const fileUrl = `${backendUrl}/uploads/${fileKey}`;

      return { uploadUrl, fileKey, fileUrl };
    }
  }

  /**
   * Generates a download URL (pre-signed URL for S3, direct static path for Local)
   */
  async generateDownloadUrl(fileKey: string): Promise<string> {
    if (USE_S3 && s3Client) {
      const command = new GetObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: fileKey,
      });

      // Pre-signed GET URL expires in 24 hours
      return await getSignedUrl(s3Client, command, { expiresIn: 86400 });
    } else {
      // Local mode fallback
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5050';
      return `${backendUrl}/uploads/${fileKey}`;
    }
  }

  /**
   * Deletes a file from storage
   */
  async deleteFile(fileKey: string): Promise<void> {
    if (USE_S3 && s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: fileKey,
      });
      await s3Client.send(command);
    } else {
      // Local mode fallback
      const localPath = path.join(__dirname, '../../../uploads', fileKey);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
  }

  /**
   * Saves a buffer locally (used by local-upload-mock endpoint)
   */
  async saveLocalFile(fileKey: string, buffer: Buffer): Promise<string> {
    const localPath = path.join(__dirname, '../../../uploads', fileKey);
    const directory = path.dirname(localPath);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    await fs.promises.writeFile(localPath, buffer);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5050';
    return `${backendUrl}/uploads/${fileKey}`;
  }
}

export const storageService = new StorageService();
