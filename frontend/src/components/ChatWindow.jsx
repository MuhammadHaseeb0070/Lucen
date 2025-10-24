import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatWindow = ({ selectedChatId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messageListRef = useRef(null);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      setMessages(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch messages');
    }
  };

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChatId) {
      toast.error('Please enter a message');
      return;
    }

    // Optimistically add the user's message
    const userMessage = { 
      id: Date.now(), 
      role: 'user', 
      content: newMessage 
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear the input
    setNewMessage('');

    try {
      await sendMessageWithRetry(newMessage);
    } catch (error) {
      console.error('Streaming error:', error);
      toast.error('Failed to send message');
    }
  };

  const sendMessageWithRetry = async (messageContent, isRetry = false) => {
    try {
      // Get the access token
      const token = localStorage.getItem('token');
      
      // Make fetch request for streaming response
      const response = await fetch(`http://localhost:4000/api/v1/chats/${selectedChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ content: messageContent })
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && !isRetry) {
        console.log("🔄 Access token expired, attempting refresh...");
        
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          // Attempt to refresh the token
          const refreshResponse = await fetch('http://localhost:4000/api/v1/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken })
          });

          if (!refreshResponse.ok) {
            throw new Error('Token refresh failed');
          }

          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.accessToken;
          
          if (!newAccessToken) {
            throw new Error('No access token in refresh response');
          }

          console.log("✅ Token refreshed successfully, retrying message...");
          
          // Update token in localStorage
          localStorage.setItem('token', newAccessToken);
          
          // Retry the original request with new token
          return await sendMessageWithRetry(messageContent, true);
          
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          // Redirect to login
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.headers.get('Content-Type')?.includes('text/event-stream')) {
        throw new Error('Expected Server-Sent Events stream');
      }

      // Get the reader and decoder
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Add placeholder for assistant message
      const assistantMessageId = Date.now() + 1;
      const assistantMessage = { 
        id: assistantMessageId, 
        role: 'assistant', 
        content: '' 
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Read the stream
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        
        // Process SSE messages
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.substring(6)); // Remove 'data: '
              if (jsonData.content) {
                // Update the assistant message in state
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + jsonData.content } 
                    : msg
                ));
              }
            } catch (e) { 
              console.error('Error parsing SSE data:', line, e); 
            }
          } else if (line.startsWith('event: end')) {
            console.log("Stream ended");
          } else if (line.startsWith('event: error')) {
            // Handle error events
            try {
              const errorLine = lines.find(l => l.startsWith('data: '));
              if (errorLine) {
                const errorData = JSON.parse(errorLine.substring(6));
                toast.error(`AI Error: ${errorData.message}`);
              }
            } catch(e) { 
              toast.error('An unknown AI error occurred.'); 
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      throw error; // Re-throw to be handled by the calling function
    }
  };

  return (
    <div className="chat-window-content">
      <div className="message-list" ref={messageListRef}>
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.role}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              children={message.content}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      children={String(children).replace(/\n$/, '')}
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            />
          </div>
        ))}
      </div>
      
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatWindow;
