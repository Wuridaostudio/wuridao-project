// src/types/express.d.ts
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
      } | null;
    }

    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}
