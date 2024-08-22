"use client";
import Image from "next/image";
import { useState } from "react";
import { Box, Button, TextField, Stack, ThemeProvider, CssBaseline, Switch, FormControlLabel, Typography } from "@mui/material";
import { styled } from '@mui/material/styles';
import { getTheme } from "./theme";

export default function Home() {
  const [mode, setMode] = useState('light');
  const toggleTheme = () => {
    setMode((mode) => (mode === 'light' ? 'dark' : 'light'));
  };
  const theme = getTheme(mode);


  const [messages, setMessages] = useState([ // All prev messages
    {
      role: "assistant",
      content:
        "Hello! How can I assist you in finding information about professors today?",
    },
  ]);
  const [message, setMessage] = useState(""); // Current message
  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    setMessage("");
    const response = fetch("api/chat", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify([...messages, { role: "user", content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = "";
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), {
          stream: true,
        });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
        return reader.read().then(processText);
      });
    });
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Typography
          variant="h3"
          marginBottom={'30px'}
        >
          Professor Finder Assistant
        </Typography>
        <Stack
          direction="column"
          width="500px"
          height="700px"
          border="1px solid"
          borderColor={(mode === 'light' ? 'black' : 'white')}
          p={2}
          spacing={3}
        >
          <Stack
            direction="column"
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={
                  message.role === "assistant" ? "flex-start" : "flex-end"
                }
              >
                <Box
                  bgcolor={
                    message.role === "assistant"
                      ? "primary.main"
                      : "secondary.main"
                  }
                  color={(mode === 'dark' ? 'black' : 'white')}
                  borderRadius={16}
                  p={3}
                >
                  {message.content}
                </Box>
              </Box>
            ))}
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              lable="Message"
              fullWidth
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
            />
            <Button variant="containted" onClick={sendMessage}>
              Send
            </Button>
          </Stack>
          <FormControlLabel
            control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
            label={(mode === 'light' ? 'Dark Mode' : 'Light Mode')}
          />
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
