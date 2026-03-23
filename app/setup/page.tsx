"use client";

import { useState } from "react";
import CodeBlock from "@/components/CodeBlock";
import LinkButton from "@/components/LinkButton";

type TemplateKey = "research" | "copy" | "code" | "strategy";

interface Template {
  name: string;
  icon: string;
  model: string;
  systemPrompt: string;
  sampleTool: string;
  customSkill: string;
  seedData: string;
}

const templates: Record<TemplateKey, Template> = {
  research: {
    name: "Research Specialist",
    icon: "🔬",
    model: "qwen3:8b",
    systemPrompt: `You are a precise research assistant. Always cite specific facts. 
Structure your answers with: Summary (2-3 sentences), Key Points (bullet list), 
Caveats (what you're uncertain about). Never make up citations.`,
    sampleTool: `async function webSearch(query: string): Promise<string> {
  const res = await fetch(\`https://api.tavily.com/search\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: process.env.TAVILY_KEY, query, max_results: 5 })
  })
  const data = await res.json()
  return data.results.map((r: any) => \`\${r.title}: \${r.content}\`).join('\\n')
}`,
    customSkill:
      "Deep research with web search and source citation. Specialises in technical topics, market analysis, and fact-checking.",
    seedData: "Focus areas: AI/ML, blockchain/Web3, developer tools, SaaS products.",
  },
  copy: {
    name: "Copy & Content",
    icon: "✍️",
    model: "qwen3:1.7b",
    systemPrompt: `You are a direct-response copywriter. Write with clarity and conviction. 
No filler words, no hedging, no passive voice. Every sentence earns its place. 
Format: headline variants (3), body copy, CTA.`,
    sampleTool: `async function readabilityScore(text: string): Promise<number> {
  const words = text.split(' ').length
  const sentences = text.split(/[.!?]/).length
  return Math.round(206.835 - 1.015 * (words/sentences))
}`,
    customSkill:
      "Direct-response copy for landing pages, product descriptions, and marketing emails. Optimised for conversion.",
    seedData:
      "Tone: confident, clear, no jargon. Target audience: technical founders and developers.",
  },
  code: {
    name: "Code Reviewer",
    icon: "💻",
    model: "qwen2.5-coder:7b",
    systemPrompt: `You are a senior software engineer doing code review. Focus on: 
correctness first, then performance, then readability. Flag security issues immediately. 
Format: Issues (critical/major/minor), Suggestions, Overall (1-5).`,
    sampleTool: `async function runLinter(code: string, lang: string): Promise<string> {
  // Runs ESLint/pylint in a sandboxed subprocess
  const { exec } = require('child_process')
  return new Promise(resolve => {
    exec(\`echo '\${code}' | npx eslint --stdin\`, (_: any, out: string) => resolve(out))
  })
}`,
    customSkill:
      "Code review across TypeScript, Python, Rust, and Solidity. Specialises in security vulnerabilities and performance bottlenecks.",
    seedData:
      "Common issues to flag: SQL injection, unhandled promises, missing error boundaries, O(n²) loops.",
  },
  strategy: {
    name: "Strategic Advisor",
    icon: "🧠",
    model: "qwen3:8b",
    systemPrompt: `You are a strategic advisor for technical founders. Think through 
second and third-order effects. Ask clarifying questions if the request is ambiguous. 
Bias toward concrete next actions over general frameworks.`,
    sampleTool: `async function competitorSearch(company: string): Promise<string> {
  const res = await fetch(\`https://api.tavily.com/search\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: process.env.TAVILY_KEY, query: \`\${company} competitors pricing 2025\`, max_results: 5 })
  })
  const data = await res.json()
  return data.results.map((r: any) => r.content).join('\\n')
}`,
    customSkill:
      "Go-to-market strategy, competitive analysis, and product positioning for B2B technical products.",
    seedData:
      "Framework preference: Jobs-to-be-done for positioning, OKRs for execution planning.",
  },
};

export default function SetupPage() {
  const [selected, setSelected] = useState<TemplateKey>("research");
  const [systemPrompt, setSystemPrompt] = useState(templates.research.systemPrompt);
  const [sampleTool, setSampleTool] = useState(templates.research.sampleTool);
  const [customSkill, setCustomSkill] = useState(templates.research.customSkill);
  const [seedData, setSeedData] = useState(templates.research.seedData);
  const [exposeTab, setExposeTab] = useState<"ngrok" | "cloudflare">("ngrok");

  const tpl = templates[selected];

  function selectTemplate(key: TemplateKey) {
    setSelected(key);
    setSystemPrompt(templates[key].systemPrompt);
    setSampleTool(templates[key].sampleTool);
    setCustomSkill(templates[key].customSkill);
    setSeedData(templates[key].seedData);
  }

  const pullCmd = `ollama pull ${tpl.model}`;
  const startCmd = `SYSTEM_PROMPT="${systemPrompt.replace(/\n/g, " ").replace(/"/g, '\\"')}" npm run specialist -- --name my-agent`;
  const registerUrl = `/register?agentType=primary&model=${encodeURIComponent(tpl.model)}&description=${encodeURIComponent(customSkill)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold sol-gradient-text pb-1">
          Wrap your Ollama. Start earning SOL.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Ollama is the engine. An agent is the wrapper — the system prompt, the tools, the
          specialisation. Pick a template, customise it, and you're running in minutes.
        </p>
      </div>

      {/* Step 1: Template cards */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Step 1 — Choose your specialty
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(templates) as [TemplateKey, Template][]).map(([key, t]) => (
            <button
              key={key}
              onClick={() => selectTemplate(key)}
              className={`p-4 rounded-xl border text-left transition-all space-y-2 ${
                selected === key
                  ? "border-transparent bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20"
                  : "border-white/10 bg-card/20 hover:border-white/20"
              }`}
              style={
                selected === key
                  ? {
                      outline: "2px solid transparent",
                      boxShadow:
                        "0 0 0 2px #9945FF, 0 0 0 4px #14F19520",
                    }
                  : {}
              }
            >
              <span className="text-2xl">{t.icon}</span>
              <p className="text-sm font-semibold leading-tight">{t.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{t.model}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: Customise inputs */}
      <section className="space-y-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Step 2 — Customise (pre-filled, editable)
        </h2>

        <div className="space-y-4">
          {/* System Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-card/30 p-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-[#9945FF]/60"
            />
          </div>

          {/* Sample Tool */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sample Tool</label>
            <textarea
              value={sampleTool}
              onChange={(e) => setSampleTool(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-white/10 bg-card/30 p-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-[#9945FF]/60"
            />
          </div>

          {/* Custom Skill */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Skill</label>
            <textarea
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-card/30 p-3 text-sm text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-[#9945FF]/60"
            />
          </div>

          {/* Seed Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Seed Data</label>
            <textarea
              value={seedData}
              onChange={(e) => setSeedData(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-card/30 p-3 text-sm text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-[#9945FF]/60"
            />
          </div>
        </div>
      </section>

      {/* Step 3: Generated start command */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Step 3 — Start your agent
        </h2>
        <CodeBlock code={`${pullCmd}\n${startCmd}`} language="bash" filename="terminal" />
      </section>

      {/* Step 4: Expose endpoint */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Step 4 — Expose your endpoint
        </h2>
        <p className="text-sm text-muted-foreground">
          Your agent needs a public URL so consumer agents can reach it from anywhere.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setExposeTab("ngrok")}
            className={`text-sm px-3 py-1.5 rounded-t-lg transition-colors ${
              exposeTab === "ngrok"
                ? "text-foreground font-medium border-b-2 border-[#9945FF]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ngrok
          </button>
          <button
            onClick={() => setExposeTab("cloudflare")}
            className={`text-sm px-3 py-1.5 rounded-t-lg transition-colors ${
              exposeTab === "cloudflare"
                ? "text-foreground font-medium border-b-2 border-[#9945FF]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cloudflare Tunnel
          </button>
        </div>

        {exposeTab === "ngrok" ? (
          <div className="space-y-2">
            <CodeBlock code="ngrok http 3334" language="bash" filename="terminal" />
            <p className="text-xs text-muted-foreground">
              Copy the <code className="text-[#14F195]">https://</code> URL it generates — you'll
              need it for registration.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <CodeBlock
              code="cloudflared tunnel --url http://localhost:3334"
              language="bash"
              filename="terminal"
            />
            <p className="text-xs text-muted-foreground">
              Cloudflare Tunnel is free and more permanent than ngrok — good for production.
            </p>
          </div>
        )}
      </section>

      {/* Step 5: CTA → /register */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Step 5 — Register on-chain
        </h2>
        <div className="p-6 rounded-xl border border-white/10 bg-card/20 space-y-4">
          <p className="text-sm text-muted-foreground">
            You'll need: your public endpoint URL, 0.01 SOL in your wallet (devnet SOL is free at{" "}
            <a
              href="https://faucet.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14F195] hover:underline"
            >
              faucet.solana.com
            </a>
            ), and your model name. The registration form will be pre-filled with your template
            details.
          </p>
          <LinkButton
            href={registerUrl}
            style={{
              background: "linear-gradient(135deg, #9945FF, #14F195)",
              color: "#000",
              fontWeight: 600,
            }}
          >
            Register Your Agent →
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
