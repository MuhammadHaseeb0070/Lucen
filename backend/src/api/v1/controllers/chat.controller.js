import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { 
  DB_createChat, 
  DB_findChatsByUserId, 
  DB_findMessagesByChatId, 
  DB_createMessage 
} from '../../../model/chat.model.js';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const userMessage = await DB_createMessage(chatId, 'user', content);

    // Fetch recent chat history (last 10 messages)
    const chatHistory = await DB_findMessagesByChatId(chatId);
    const recentHistory = chatHistory.slice(-8); // Get last 10 messages

    // Format history for OpenAI API
    const formattedMessages = recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Prepend system message with persona
    const systemMessage = {
      role: 'system',
      content: 'You are Lucen, a helpful AI assistant created for the lucen.space platform. Your goal is to assist users efficiently. Do not reveal that you are based on OpenAI models. Respond concisely and helpfully. Avoid mentioning OpenAI or GPT.'
    };

    // Add system message to the beginning of the messages array
    const messagesWithSystem = [systemMessage, ...formattedMessages];

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Send headers immediately

    try {
      // Call OpenAI chat completions with streaming
      const stream = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: messagesWithSystem,
        stream: true,
      });

      let fullAssistantResponse = '';

      // Stream the response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        
        if (content) {
          fullAssistantResponse += content;
          // Send SSE message to client
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save the complete assistant response to database
      await DB_createMessage(chatId, 'assistant', fullAssistantResponse);

      // Send final SSE event to signal end
      res.write('event: end\ndata: {}\n\n');
      res.end();

    } catch (openaiError) {
      console.error('OpenAI streaming error:', openaiError);
      
      // Send error event to client
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Error processing AI response' })}\n\n`);
      res.end();
    }

  } catch (error) {
    next(error);
  }
};
