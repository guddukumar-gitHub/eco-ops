import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import { configDotenv } from "dotenv";
configDotenv()

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🍃 MongoDB Connected successfully to ecoops database'))
    .catch((err) => console.error('❌ MongoDB Connection Failure:', err));

const ChatLogSchema = new mongoose.Schema({
    query: String,
    answer: String,
    sourceFile: String,
    timestamp: { type: Date, default: Date.now }
});
const ChatLog = mongoose.model('ChatLog', ChatLogSchema);

app.post('/api/chat', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: "Question payload is missing." });
        }

        console.log(`\n📬 Express incoming query received: "${question}"`);
        console.log(`🔄 Forwarding request to Python AI service on port 8000...`);

        // Backend-to-backend communication call to FastAPI endpoint
        const aiServerResponse = await fetch(process.env.AI_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: question })
        });

        if (!aiServerResponse.ok) {
            throw new Error(`AI Microservice returned error status: ${aiServerResponse.status}`);
        }

        const aiData = await aiServerResponse.json();
        console.log(`🤖 Python server responded with complete answer text.`);

        const newLog = new ChatLog({
            query: aiData.query,
            answer: aiData.answer,
            sourceFile: aiData.source_file
        });
        await newLog.save();
        console.log(`💾 Log saved cleanly to your MongoDB collections.`);

        // Return the response object to the caller client
        return res.json({
            answer: aiData.answer,
            source_file: aiData.source_file
        });

    } catch (error) {
        console.error('❌ Proxy Server Route Failure:', error.message);
        return res.status(500).json({ error: "Failed to process request through the AI pipeline." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Express Security Gateway running securely on http://localhost:${PORT}`);
});
