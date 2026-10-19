
import express from "express";

const app = express();
app.use(express.json({ limit: "4kb" }));

app.get("/", (req, res) => {
    res.send("Owner AI is running!");
});

app.post("/chat", async (req, res) => {
    // Check that the game's private token is correct
    if (req.get("x-game-token") !== process.env.GAME_TOKEN) {
        return res.status(401).json({ error: "Not allowed" });
    }

    const message = req.body.message;

    if (typeof message !== "string" || message.length > 300) {
        return res.status(400).json({ error: "Invalid message" });
    }

    try {
        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gpt-4.1-mini",
                    instructions:
                        "You are Owner, a friendly Roblox garden shopkeeper. " +
                        "Respond naturally to the player's message. " +
                        "Be friendly, helpful, and concise. " +
                        "Keep replies under 80 words.",
                    input: message,
                    max_output_tokens: 120
                })
            }
        );

        if (!response.ok) {
            return res.status(502).json({ error: "AI unavailable" });
        }

        const data = await response.json();
        const reply = (data.output || [])
            .flatMap(item => item.content || [])
            .filter(item => item.type === "output_text")
            .map(item => item.text)
            .join("");

        res.json({ reply: reply || "Hello! How can I help you?" });
    } catch {
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("Owner AI is running!");
});
