import express from 'express';
import { 
  createChat, 
  getUserChats, 
  getChatMessages, 
  addMessage 
} from '../controllers/chat.controller.js';
import { verifyToken } from '../../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET / - Get all chats for the authenticated user
router.get('/', asyncHandler(getUserChats));

// POST / - Create a new chat
router.post('/', asyncHandler(createChat));

// GET /:chatId/messages - Get all messages for a specific chat
router.get('/:chatId/messages', asyncHandler(getChatMessages));

// POST /:chatId/messages - Add a new message to a chat
router.post('/:chatId/messages', asyncHandler(addMessage));

export default router;
