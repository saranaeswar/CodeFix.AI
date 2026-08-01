import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy check for Groq API key (OpenAI-compatible endpoint, no SDK needed)
function getGroqApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is missing.");
  }
  return apiKey;
  return apiKey;
}

// CodeFix AI System Prompt definition
const CODEFIX_SYSTEM_PROMPT = `You are CodeFix AI, an expert software debugging assistant embedded inside an AI-Powered Bug Detection and Auto-Fix System.

ROLE:
You receive source code written or pasted by a user. Your job is to analyze it, detect any bugs, errors, or logical issues, and return a corrected version of the code — automatically, without the user needing to ask a specific question.

WHAT COUNTS AS A BUG:
- Syntax errors (missing colons, brackets, indentation issues, etc.)
- Runtime errors (undefined variables, type mismatches, wrong function calls)
- Logical errors (incorrect conditions, off-by-one errors, wrong operators, infinite loops)
- Bad practices that directly cause incorrect behavior (not just style preferences)

WHAT IS NOT A BUG:
- Personal coding style, variable naming choices, or formatting preferences
- Missing comments or documentation
- Performance optimizations that don't affect correctness
Do not flag or change these unless the user explicitly asks for a style review.

ANALYSIS PROCESS (internal, do not show your reasoning steps):
1. Read the code carefully, line by line.
2. Determine the language automatically from syntax (Python, Java, C++, JavaScript, etc.) if not stated.
3. Identify whether the code has any bug(s).
4. If bugs exist, determine the minimal correct fix — do not rewrite unrelated parts of the code.
5. If the code is already correct, confirm that clearly instead of inventing a problem.

OUTPUT FORMAT (follow exactly, every time, no exceptions):
LANGUAGE: <detected programming language>
STATUS: <"BUG_FOUND" or "NO_BUG">
EXPLANATION: <1-3 concise, technical sentences. If BUG_FOUND, state exactly what was wrong and why it causes incorrect behavior. If NO_BUG, say "No issues detected — the code is logically and syntactically correct.">
CODE:
<the complete code — corrected if BUG_FOUND, unchanged if NO_BUG. Do NOT wrap this in markdown triple backticks. Return raw code only.>

STRICT RULES:
- Always return the FULL code, not just the changed lines, so it can be directly copied and run.
- Never add new features, comments, or refactor code beyond what's needed to fix the identified bug.
- Never invent a bug if none exists — false positives are worse than saying "no issues."
- Never ask the user clarifying questions — always give your best analysis from what's provided.
- If the code is incomplete or a snippet (not runnable on its own), still analyze it for correctness within its own logic, and note in EXPLANATION that it's a partial snippet if relevant.
- Do not use hedging language ("might", "could", "possibly") — state findings directly.
- Do not include any text outside the four specified fields (LANGUAGE, STATUS, EXPLANATION, CODE).
- Keep EXPLANATION under 60 words.
- Preserve the original code's language/syntax conventions in your corrected version — do not translate it to a different language.`;

interface ParsedCodeFixOutput {
  language: string;
  status: "BUG_FOUND" | "NO_BUG";
  explanation: string;
  code: string;
  rawOutput: string;
}

function parseCodeFixOutput(text: string): ParsedCodeFixOutput {
  const rawOutput = text.trim();
  
  // Extract LANGUAGE
  const langMatch = rawOutput.match(/^LANGUAGE:\s*(.+)$/m);
  const language = langMatch ? langMatch[1].trim() : "Unknown";

  // Extract STATUS
  const statusMatch = rawOutput.match(/^STATUS:\s*(BUG_FOUND|NO_BUG)$/m);
  const status: "BUG_FOUND" | "NO_BUG" = (statusMatch ? statusMatch[1].trim() : "NO_BUG") as any;

  // Extract EXPLANATION
  const explanationMatch = rawOutput.match(/^EXPLANATION:\s*([\s\S]*?)(?=^CODE:|\nCODE:|$)/m);
  const explanation = explanationMatch ? explanationMatch[1].trim() : "Analysis completed.";

  // Extract CODE
  const codeIndex = rawOutput.indexOf("CODE:");
  let code = "";
  if (codeIndex !== -1) {
    code = rawOutput.substring(codeIndex + 5).trim();
    // Strip markdown triple backticks if model accidentally wrapped code
    if (code.startsWith("```")) {
      const firstLineEnd = code.indexOf("\n");
      if (firstLineEnd !== -1) {
        code = code.substring(firstLineEnd + 1);
      }
      if (code.endsWith("```")) {
        code = code.substring(0, code.length - 3).trim();
      }
    }
  }

  return {
    language,
    status,
    explanation,
    code,
    rawOutput
  };
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CodeFix AI Engine" });
});

async function callGroqWithFallback(apiKey: string, prompt: string, systemInstruction: string): Promise<string> {
  const models = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[CodeFix AI] Querying Groq model: ${model} (attempt ${attempt + 1})`);
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          const err: any = new Error(`Groq API error ${res.status}: ${errBody}`);
          err.status = res.status;
          throw err;
        }

        const data: any = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        console.warn(`[CodeFix AI] Call failed for ${model} (attempt ${attempt + 1}):`, msg);

        // If 503 (high demand) or 429, wait briefly before retrying or switching models
        if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand") || err?.status === 503 || err?.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          // Break attempt loop to move to the next fallback model immediately if it's another type of error
          break;
        }
      }
    }
  }

  throw lastError || new Error("All AI model endpoints are currently experiencing high demand.");
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { code, languageHint } = req.body;
    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ error: "Source code is required for analysis." });
    }

    const apiKey = getGroqApiKey();
    const prompt = languageHint
      ? `Declared Language Hint: ${languageHint}\n\nSource Code to Analyze:\n${code}`
      : `Source Code to Analyze:\n${code}`;

    const outputText = await callGroqWithFallback(apiKey, prompt, CODEFIX_SYSTEM_PROMPT);
    const parsed = parseCodeFixOutput(outputText);

    return res.json({
      success: true,
      originalCode: code,
      ...parsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CodeFix AI] Error analyzing code:", error);
    const errMsg = error?.message || String(error);
    let userFriendlyMsg = "An error occurred while analyzing the code. Please try again.";

    if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand")) {
      userFriendlyMsg = "The AI service is currently experiencing high demand. Please try again in a few moments.";
    } else if (errMsg.includes("GROQ_API_KEY")) {
      userFriendlyMsg = "Groq API key is missing or invalid. Please check your environment configuration.";
    } else if (errMsg.includes("401") || errMsg.includes("invalid_api_key")) {
      userFriendlyMsg = "Groq API key was rejected. Please verify it is correct and active.";
    }

    return res.status(503).json({
      error: userFriendlyMsg,
    });
  }
});

// Setup Vite development server or static production files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CodeFix AI Server running on http://localhost:${PORT}`);
  });
}

startServer();