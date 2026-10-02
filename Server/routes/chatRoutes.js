import { Router } from 'express';
import { chat } from '../controllers/chatController.js';

const router = Router();

// Chat requests are handled by the RAG controller.
router.post('/', chat);

export default router;
