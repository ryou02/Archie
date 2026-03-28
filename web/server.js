require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
const { TOOL_DEFINITIONS } = require("./tools.js");

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are Archie, a friendly AI game-building assistant inside Roblox Studio. You help kids build FULL Roblox games — not just single objects.

Your personality:
- Super friendly, casual, encouraging
- Keep spoken responses SHORT (1-5 words): "On it!", "Got it!", "Done!", "Let me build that!"
- Never explain code or teach — just build what they ask for

GAME BUILDING PHASES — follow these in order:

PHASE 1: PLAN THE LAYOUT
Before placing anything, decide on a layout. Think of the scene as a grid:
- Center (0,0,0): main focal point (building, arena, track)
- Front: where the player spawns, move SpawnLocation here
- Sides & back: supporting objects (trees, props, decorations)
- Keep a ~200x200 stud play area unless the user asks for something bigger

PHASE 2: ENVIRONMENT FIRST
Set the mood before placing objects:
- set_lighting (time of day, brightness, shadows)
- set_atmosphere (fog, haze, color)
- modify_terrain if needed (grass, water, sand)

PHASE 3: PLACE ASSETS ONE BY ONE
For EVERY object:
1. search_toolbox with a keyword
2. insert_asset with the best result AND a specific position
3. call get_properties on the inserted object to check its actual position and size
4. If it landed in the wrong spot, use set_properties or run_code to reposition it

IMPORTANT: After placing every 3-4 objects, call get_scene_summary to review the scene and make sure things look right. Reposition anything that's overlapping or out of place.

PHASE 4: ADD GAMEPLAY
- create_script for interactivity (vehicle systems, collectibles, combat, scoreboards)
- Audio: search_toolbox for "background music" or ambient sounds

ASSET RULES:
- NEVER use run_code or create_instance to build objects without calling search_toolbox first
- ONLY fall back to run_code if search_toolbox returns 0 results

POSITIONING RULES:
- Place the main structure at center: "0,0,0"
- Place props relative to center in a logical layout:
  - Trees/scenery in a ring: "30,0,30", "-30,0,30", "30,0,-30", "-30,0,-30"
  - Roads/paths connecting structures
  - NPCs/items near buildings, not floating in empty space
- ALWAYS set the Y coordinate appropriately. Ground level objects: y=0. Wall-mounted: match building height. Flying objects: y=20+
- After inserting, use get_properties to check the object's Position and Size — toolbox models have unpredictable sizes. If a model is enormous, scale it down or reposition.

<example>
User: "Make me a racing game"
Phase 1 - Layout plan: oval track at center, cars on starting line, scenery around edges
Phase 2 - Environment: set_lighting bright daytime, set_atmosphere clear sky
Phase 3 - Assets:
  search_toolbox("race track") → insert_asset at "0,0,0" → get_properties to check size
  search_toolbox("sports car") → insert_asset at "0,1,20" → get_properties to verify
  search_toolbox("sports car") → insert_asset at "5,1,20" (next to first car)
  get_scene_summary to review layout
  search_toolbox("tree") → insert_asset at "50,0,0" (off track, scenery)
  search_toolbox("tree") → insert_asset at "-50,0,0"
  search_toolbox("traffic barrier") → insert_asset at "30,0,30" (track edge)
Phase 4 - Gameplay: create_script for vehicle driving, lap counter
</example>

<example>
User: "Build a spooky haunted house game"
Phase 1 - Layout plan: house at center, graveyard to left, forest behind, player spawns in front
Phase 2 - Environment: set_lighting clockTime=0, low brightness, fog. set_atmosphere high density, dark
Phase 3 - Assets:
  search_toolbox("haunted house") → insert_asset at "0,0,0" → get_properties to check size
  Move SpawnLocation to "0,3,40" (in front of house)
  search_toolbox("gravestone") → insert_asset at "-30,0,10"
  search_toolbox("dead tree") → insert_asset at "20,0,-20"
  get_scene_summary to review
  search_toolbox("ghost NPC") → insert_asset at "5,3,0" (near house entrance)
  search_toolbox("fence") → insert_asset at "-20,0,20" (around graveyard)
Phase 4 - Gameplay: create_script for jumpscare triggers, flashlight
</example>`;

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

// Server-side tool handlers (don't need plugin)
async function handleSearchToolbox(params) {
  const query = encodeURIComponent(params.query || "");
  const maxResults = params.maxResults || 5;
  try {
    // Step 1: Search for model IDs via toolbox marketplace API
    const searchRes = await fetch(
      `https://apis.roblox.com/toolbox-service/v1/marketplace/Model?keyword=${query}&num=${maxResults}&sortType=Relevance`,
      { headers: { Accept: "application/json" } }
    );
    if (!searchRes.ok) {
      console.error("Toolbox search failed:", searchRes.status);
      return { result: { results: [], error: "Toolbox search unavailable" } };
    }
    const searchData = await searchRes.json();
    const ids = (searchData.data || []).slice(0, maxResults).map((item) => item.id);

    if (ids.length === 0) {
      return { result: { results: [] } };
    }

    // Step 2: Get names for those IDs via items/details API
    const detailsRes = await fetch(
      `https://apis.roblox.com/toolbox-service/v1/items/details?assetIds=${ids.join(",")}`,
      { headers: { Accept: "application/json" } }
    );
    if (!detailsRes.ok) {
      // If details fail, return IDs without names
      console.error("Details fetch failed:", detailsRes.status);
      return { result: { results: ids.map((id) => ({ assetId: id, name: "Unknown" })) } };
    }
    const detailsData = await detailsRes.json();
    const detailsMap = new Map();
    for (const item of detailsData.data || []) {
      detailsMap.set(item.asset?.id, item.asset?.name || "Unknown");
    }

    const results = ids.map((id) => ({
      assetId: id,
      name: detailsMap.get(id) || "Unknown",
    }));

    console.log(`[search_toolbox] "${params.query}" → ${results.length} results:`, results.map(r => `${r.name} (${r.assetId})`).join(", "));
    return { result: { results } };
  } catch (err) {
    console.error("Toolbox search error:", err);
    return { result: { results: [], error: "Toolbox search failed" } };
  }
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

// Reset conversation history
app.post("/reset", (req, res) => {
  conversationHistory = [];
  res.json({ success: true });
});

// --- Agent Loop ---
async function agentLoop(userMessage) {
  const historyLengthBefore = conversationHistory.length;
  conversationHistory.push({ role: "user", content: userMessage });

  const MAX_ITERATIONS = 15;
  let iterations = 0;
  let hasCalledSearchToolbox = false;

  try {
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      // Mark system prompt and last tool for caching — saves ~90% on repeated input tokens
      const cachedTools = TOOL_DEFINITIONS.map((tool, i) =>
        i === TOOL_DEFINITIONS.length - 1
          ? { ...tool, cache_control: { type: "ephemeral" } }
          : tool
      );

      // Trim old tool results to save tokens — keep only the last 3 iterations full,
      // replace older tool results with short summaries
      const trimmedMessages = conversationHistory.map((msg, idx) => {
        // Only trim tool_result messages that are old (not in the last 6 messages)
        if (idx < conversationHistory.length - 6 && msg.role === "user" && Array.isArray(msg.content)) {
          return {
            ...msg,
            content: msg.content.map((block) => {
              if (block.type === "tool_result" && block.content && block.content.length > 200) {
                return { ...block, content: block.content.slice(0, 200) + "...(trimmed)" };
              }
              return block;
            }),
          };
        }
        return msg;
      });

      const response = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 8192,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        tools: cachedTools,
        messages: trimmedMessages,
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
            // Track if search_toolbox has been called
            if (block.name === "search_toolbox") {
              hasCalledSearchToolbox = true;
            }

            // INTERCEPTION: Block run_code and create_instance until search_toolbox has been called
            if (!hasCalledSearchToolbox && (block.name === "run_code" || block.name === "create_instance")) {
              console.log(`[BLOCKED] ${block.name} called before search_toolbox — rejecting`);
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify({
                  error: "REJECTED: You MUST call search_toolbox first before using " + block.name + ". Call search_toolbox now with a keyword describing what the user wants (e.g. 'car', 'house', 'tree'), then use insert_asset with the best assetId from the results."
                }),
                is_error: true,
              });
              continue;
            }

            // Route all tools to plugin
            const result = await executeToolViaPlugin(block.name, block.input);
            console.log(`[tool] ${block.name}(${JSON.stringify(block.input).slice(0, 100)}) → ${JSON.stringify(result).slice(0, 300)}`);
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
  } catch (err) {
    // Roll back conversation history to prevent corrupted state
    conversationHistory.length = historyLengthBefore;
    throw err;
  }
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
  console.log(`\n🚀 Archie server running at http://localhost:${PORT}`);
  console.log(`🛡️  search_toolbox interception is ACTIVE\n`);
});
