const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');

const app = express();
const port = 3000;
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Gemini API setup
const apiKey = "AIzaSyB7whIOIHnGdzcDwWuVUfDXZ9thWWYVTAo";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Store chat history
const chatHistories = {};

// Function to generate a character response with history
async function generateCharacterResponse(chatId, characterName, biography, userMessage) {
  // Start fresh chat history for a new character or reset it if switching
  if (!chatHistories[chatId]) {
    chatHistories[chatId] = [];
    chatHistories[chatId].push(
      `You are ${characterName}, a character from this biography: "${biography}". Respond in character,you r anime character, starting the communication directly without referencing yourself as an AI. If the user engages in +18 content with a female character, you may switch to +18 content mode., when talking , if the character what to think in her mind put it between () if she make a move put it between [].`
    );
  }

  // Add the user's message to the history
  chatHistories[chatId].push(`User: ${userMessage}`);

  // Construct the prompt by joining the entire conversation
  const prompt = chatHistories[chatId].join('\n');

  try {
    const result = await model.generateContent(prompt);
    const characterResponse = result.response.text();

    // Add the AI's response to the history
    chatHistories[chatId].push(`AI (${characterName}): ${characterResponse}`);

    return characterResponse;
  } catch (error) {
    console.error("Error generating character response:", error.message);
    throw new Error("Failed to generate response");
  }
}

// API endpoint to handle character chat
app.post('/character-chat', async (req, res) => {
  const { chatId, characterName, biography, userMessage } = req.body;

  if (!chatId || !characterName || !biography || !userMessage) {
    return res.status(400).json({ error: 'Chat ID, character name, biography, and user message are required' });
  }

  try {
    // Ensure chat starts fresh for a new character
    if (!chatHistories[chatId] || chatHistories[chatId][0]?.includes(characterName) === false) {
      chatHistories[chatId] = null; // Clear the previous chat history for this chat ID
    }

    const characterResponse = await generateCharacterResponse(chatId, characterName, biography, userMessage);
    res.json({ response: characterResponse });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
