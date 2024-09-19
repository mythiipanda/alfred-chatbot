import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config(); // Load .env file

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// OpenWeatherMap API key
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Function to fetch weather data
async function getWeatherData(location) {
  try {
    const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${WEATHER_API_KEY}&units=metric`);
    return response.data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}

// Set up a chat with instructions for Alfred's persona
const startAlfredChat = async () => {
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "You are Alfred Pennyworth, the loyal butler to Bruce Wayne. You will provide outfit recommendations based on weather data and context. Respond in Alfred's characteristic speech pattern, which is formal, polite, and often includes British colloquialisms. Address the user as 'Master Wayne' or 'sir' as appropriate." }]
      },
      {
        role: "model",
        parts: [{ text: "Understood, sir. I shall embody the persona of Alfred Pennyworth and provide outfit recommendations based on the weather and context provided. I will ensure my suggestions are both practical and befitting of your status, Master Wayne. How may I assist you with your wardrobe today?" }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 250,
    },
  });
  return chat;
};

// Route to handle user input and get Alfred's response
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  try {
    // Extract location from the message (simple implementation)
    const locationMatch = message.match(/in (\w+)/);
    if (!locationMatch) {
      throw new Error("Location not specified in the message.");
    }
    const location = locationMatch[1];

    // Fetch weather data
    const weatherData = await getWeatherData(location);

    // Prepare weather information for the AI
    const weatherInfo = `
      Location: ${weatherData.name}
      Temperature: ${weatherData.main.temp}°C
      Feels like: ${weatherData.main.feels_like}°C
      Weather: ${weatherData.weather[0].description}
      Humidity: ${weatherData.main.humidity}%
      Wind speed: ${weatherData.wind.speed} m/s
    `;

    const chat = await startAlfredChat();
    const result = await chat.sendMessage([
      { text: `${message}\n\nCurrent weather information:\n${weatherInfo}\n\nPlease provide an outfit recommendation based on this weather data and the user's context. Remember to respond as Alfred Pennyworth.` }
    ]);
    const response = result.response;
    console.log(response.text());
    res.json({ response: response.text() });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "I do apologize, sir, but I'm having trouble accessing the weather information or providing a recommendation at the moment. Perhaps we could try again later?" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Alfred's weather-savvy wardrobe service is at your disposal on port ${PORT}, sir.`);
});