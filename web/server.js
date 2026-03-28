require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
const { TOOL_DEFINITIONS } = require("./tools.js");

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are Archie, a friendly AI building assistant inside Roblox Studio. You help kids build Roblox games using your tools.

Your personality:
- Super friendly, casual, encouraging
- Keep spoken responses SHORT (1-5 words): "On it!", "Got it!", "Done!", "Let me build that!"
- Never explain code or teach — just build what they ask for

You have tools to interact with Roblox Studio. Use them to:
- Read the current game state before making changes
- Build what the kid asks for
- Verify your work after making changes
- Fix errors if something goes wrong

When you're done with a task, respond with text that Archie will say out loud. Keep it short and casual.

Important:
- Always check what's in the scene before building (use get_children or get_scene_summary)
- Use specific tools (create_instance, set_properties) for simple operations
- Use run_code for complex operations that need loops or logic
- Use search_toolbox + insert_asset to use existing models instead of building from scratch when appropriate
- All changes are automatically undoable via Ctrl+Z`;

let conversationHistory = [];

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));

// --- Tool Queue ---
// Server pushes tool requests here, plugin polls and picks them up
const toolQueue = []; // { id, tool, params }
const toolResults = new Map(); // id -> { result } or { error }
const toolResultWaiters = new Map(); // id -> { resolve, timer }
let toolIdCounter = 0;
let lastPluginPoll = 0; // timestamp of last plugin poll

function generateToolId() {
  toolIdCounter++;
  return `tool_${toolIdCounter}`;
}

function executeToolViaPlugin(toolName, params) {
  const id = generateToolId();
  toolQueue.push({ id, tool: toolName, params });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      toolResultWaiters.delete(id);
      resolve({ error: `Tool '${toolName}' timed out after 15 seconds. The plugin may be disconnected.` });
    }, 15000);

    toolResultWaiters.set(id, { resolve, timer });
  });
}

// Plugin polls for next tool request
app.get("/tool-queue/poll", (req, res) => {
  lastPluginPoll = Date.now();
  if (toolQueue.length > 0) {
    const request = toolQueue.shift();
    res.json({ hasRequest: true, request });
  } else {
    res.json({ hasRequest: false });
  }
});

// Plugin returns tool result
app.post("/tool-queue/result", (req, res) => {
  const { id, result, error } = req.body;
  const waiter = toolResultWaiters.get(id);
  if (waiter) {
    clearTimeout(waiter.timer);
    toolResultWaiters.delete(id);
    if (error) {
      waiter.resolve({ error });
    } else {
      waiter.resolve({ result });
    }
  }
  res.json({ success: true });
});

// Health check
app.get("/status", (req, res) => {
  const pluginConnected = Date.now() - lastPluginPoll < 5000;
  res.json({ status: "ok", pluginConnected });
});

// --- Agent Loop ---
async function agentLoop(userMessage) {
  conversationHistory.push({ role: "user", content: userMessage });

  const MAX_ITERATIONS = 25;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      messages: conversationHistory,
    });

    // Append assistant response to history
    conversationHistory.push({ role: "assistant", content: response.content });

    // If Claude is done talking, extract speech and return
    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      const speech = textBlock ? textBlock.text : "Done!";
      return { speech };
    }

    // If Claude wants to use tools, execute them
    if (response.stop_reason === "tool_use") {
      const toolResults = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeToolViaPlugin(block.name, block.input);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }
      conversationHistory.push({ role: "user", content: toolResults });
    }
  }

  return { speech: "Whew, that was a lot! Let me know what's next." };
}

// Chat endpoint — now runs the agent loop
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const result = await agentLoop(message);
    res.json(result);
  } catch (err) {
    console.error("Agent loop error:", err);
    res.status(500).json({
      speech: "Oops, my brain glitched!",
    });
  }
});

// Proxy Deepgram key to client
app.get("/deepgram-key", (req, res) => {
  res.json({ key: process.env.DEEPGRAM_API_KEY });
});

// TTS proxy — client sends text, server calls Deepgram Aura, returns audio
app.post("/tts", async (req, res) => {
  const { text } = req.body;

  try {
    const ttsRes = await fetch(
      "https://api.deepgram.com/v1/speak?model=aura-asteria-en",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!ttsRes.ok) {
      throw new Error(`Deepgram TTS error: ${ttsRes.status}`);
    }

    const arrayBuffer = await ttsRes.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Archie server running at http://localhost:${PORT}`);
});
