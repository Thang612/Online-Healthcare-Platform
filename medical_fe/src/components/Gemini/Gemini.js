import React, { useState } from "react";
import axios from "axios";
import { Box, TextField, Button, Typography, Avatar, Paper, IconButton, Divider } from "@mui/material";
import { Send as SendIcon, Chat as ChatIcon } from '@mui/icons-material';

const API_KEY = "AIzaSyC1A5E5gVpBmcOvF5ihLFU--hbrGp9BFfk";

function Gemini() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  async function handleSend() {
    const newMessage = question.trim();
    if (!newMessage) return;

    setIsTyping(true);
    setMessages(prevMessages => [
      ...prevMessages,
      { message: newMessage, sender: "user", direction: "outgoing" }
    ]);

    setQuestion(""); // Clear the input field

    try {
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        method: "post",
        data: {
          contents: [{ parts: [{ text: newMessage }] }],
        },
      });

      const answerText = response.data.candidates[0].content.parts[0].text;

      // Add the response from the AI
      setMessages(prevMessages => [
        ...prevMessages,
        { message: answerText, sender: "Gemini", direction: "incoming" }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prevMessages => [
        ...prevMessages,
        { message: "Sorry, something went wrong. Please try again!", sender: "Gemini", direction: "incoming" }
      ]);
    }

    setIsTyping(false);
  }

  function toggleChat() {
    setIsChatOpen(prev => !prev);
  }

  function handleClickOutside(event) {
    if (!event.target.closest('.chat-container') && !event.target.closest('.chat-toggle-button') && isChatOpen) {
      setIsChatOpen(false);
    }
  }

  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isChatOpen]);

  return (
    <div className="App">
      {/* Chat toggle button, fixed at the bottom-right corner */}
      <IconButton
        className="chat-toggle-button"
        onClick={toggleChat}
        color="primary"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          backgroundColor: '#3f51b5',
          color: 'white',
        }}
      >
        <ChatIcon />
      </IconButton>

      {isChatOpen && (
        <div className="chat-container" style={{ position: "fixed", bottom: "80px", right: "20px" }}>
          <Paper elevation={3} sx={{ width: 400, height: 500, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
              {messages.map((message, i) => (
                <Box key={i} sx={{ display: 'flex', mb: 2, justifyContent: message.direction === 'outgoing' ? 'flex-end' : 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {message.direction === 'incoming' && (
                      <Avatar sx={{ mr: 1, bgcolor: "primary.main" }}>G</Avatar>
                    )}
                    <Box sx={{
                      backgroundColor: message.direction === 'outgoing' ? 'primary.main' : 'grey.300',
                      color: message.direction === 'outgoing' ? 'white' : 'black',
                      borderRadius: 1,
                      p: 1,
                      maxWidth: '70%',
                    }}>
                      <Typography variant="body2">
                        {message.message}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            {isTyping && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Gemini is typing...
                </Typography>
              </Box>
            )}

            <Divider />

            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <TextField
                fullWidth
                placeholder="Type a message"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                variant="outlined"
                size="small"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <IconButton color="primary" onClick={handleSend}>
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </div>
      )}
    </div>
  );
}

export default Gemini;
