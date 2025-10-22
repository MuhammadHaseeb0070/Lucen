import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { 
  DB_createChat, 
  DB_findChatsByUserId, 
  DB_findMessagesByChatId, 
  DB_createMessage 
} from '../../../model/chat.model.js';

// Create a new chat
export const createChat = async (req, res, next) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;

    // Validate title
    if (!title) {
      throw new ApiError(400, 'Chat title is required');
    }

    // Create the chat
    const chat = await DB_createChat(userId, title);

    return res.status(201).json(
      new ApiResponse(201, chat, 'Chat created successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Get all chats for a user
export const getUserChats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all chats for the user
    const chats = await DB_findChatsByUserId(userId);

    return res.status(200).json(
      new ApiResponse(200, chats, 'Chats retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Get all messages for a specific chat
export const getChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    // Get all messages for the chat
    const messages = await DB_findMessagesByChatId(chatId);

    return res.status(200).json(
      new ApiResponse(200, messages, 'Messages retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Add a new message to a chat
export const addMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content) {
      throw new ApiError(400, 'Message content is required');
    }

    // Create the user message
    const message = await DB_createMessage(chatId, 'user', content);

    return res.status(201).json(
      new ApiResponse(201, message, 'Message added successfully')
    );
  } catch (error) {
    next(error);
  }
};
