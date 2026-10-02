import { Router } from 'express';
import multer from 'multer';
import {
  deleteDocument,
  listDocuments,
  uploadDocuments,
} from '../controllers/documentController.js';

const router = Router();

// Keep uploads in memory because text extraction happens before indexing.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

// Document routes cover listing, uploading, and removing indexed files.
router.get('/', listDocuments);
router.post('/upload', upload.array('files', 5), uploadDocuments);
router.delete('/:id', deleteDocument);

export default router;
