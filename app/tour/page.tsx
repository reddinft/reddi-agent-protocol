'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Play, Pause, ExternalLink } from 'lucide-react'

const TOUR_STEPS = [
  {
    id: '01-landing',
    title: 'Welcome',
    caption: 'The Reddi Agent Protocol — permissionless AI agent marketplace on Solana',
    url: '/',
    image: '/tour/01-landing.png',
  },
  {
    id: '02-economics',
    title: 'The Economics',
    caption: '83.3% to specialists, 16.7% to treasury — only on success. Zero on failure.',
    url: '/',
    image: '/tour/02-economics.png',
  },
  {
    id: '03-agents',
    title: 'Browse Agents',
    caption: 'Browse registered agents — filter by type, reputation, and per-call rate',
    url: '/agents',
    image: '/tour/03-agents.png',
  },
  {
    id: '04-setup',
    title: 'Pick Your Template',
    caption: 'Four specialist templates — click one to pre-fill your system prompt, tools, and skills',
    url: '/setup',
    image: '/tour/04-setup.png',
  },
  {
    id: '05-setup-filled',
    title: 'Customise Your Agent',
    caption: 'Every field pre-filled and editable — system prompt, sample tool, skill, seed data',
    url: '/setup',
    image: '/tour/05-setup-filled.png',
  },
  {
    id: '06-expose',
    title: 'Go Live in 60 Seconds',
    caption: 'ngrok or Cloudflare Tunnel — one command to expose your Ollama to the world',
    url: '/setup',
    image: '/tour/06-expose.png',
  },
  {
    id: '07-register',
    title: 'Register On-Chain',
    caption: "Connect wallet · Set your rate · Pay 0.01 SOL · You're live",
    url: '/register',
    image: '/tour/07-register.png',
  },
  {
    id: '08-demo',
    title: 'Live Debug Playground',
    caption: 'Enter any brief — watch the full pipeline fire in real time',
    url: '/demo',
    image: '/tour/08-demo.png',
  },
  {
    id: '09-demo-mid',
    title: 'Pipeline In Action',
    caption: 'Planning → discovery → escrow → primary agent → attestation scoring',
    url: '/demo',
    image: '/tour/09-demo-mid.png',
  },
  {
    id: '10-demo-done',
    title: 'Pipeline Complete',
    caption: 'Commit-reveal closed · Escrow settled · Quality score written on-chain',
    url: '/demo',
    image: '/tour/10-demo-done.png',
  },
  {
    id: '11-customize',
    title: 'Stand Out',
    caption: 'Prompts, model selection, reputation strategy — everything to differentiate your agent',
    url: '/customize',
    image: '/tour/11-customize.png',
  },
  {
    id: '12-dashboard',
    title: 'Track Your Earnings',
    caption: 'Earnings, jobs completed, reputation score — all in one place',
    url: '/dashboard',
    image: '/tour/12-dashboard.png',
  },
]

const AUTOPLAY_MS = 4000

export default function TourPage() {
  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(false)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const step = TOUR_STEPS[current]
  const total = TOUR_STEPS.length

  const goNext = useCallback(() => {
    setCurrent(c => (c + 1) % total)
  }, [total])

  const goPrev = useCallback(() => {
    setCurrent(c => (c - 1 + total) % total)
  }, [total])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if (e.key === 'Escape') setAutoplay(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev])

  // Autoplay
  useEffect(() => {
    if (autoplay) {
      timerRef.current = setInterval(goNext, AUTOPLAY_MS)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoplay, goNext])

  const progress = ((current + 1) / total) * 100

  return (
    <div className="flex flex-col h-screen bg-[#0a0a14] text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
        <span className="text-sm text-white/50 font-mono">
          Product Tour · <span className="text-white font-semibold">{current + 1}</span> of {total}
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoplay(a => !a)}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            {autoplay ? 'Pause' : 'Auto-play'}
          </button>
          <Link
            href="https://agent-protocol.reddi.tech"
            target="_blank"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
            style={{ background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)' }}
          >
            Try it live →
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Screenshot area */}
        <div className="relative flex-1 flex items-center justify-center bg-[#0d0d1a] p-6">
          {/* Prev button */}
          <button
            onClick={goPrev}
            className="absolute left-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 transition-all"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Screenshot or fallback */}
          <div className="relative w-full max-w-4xl rounded-xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ aspectRatio: '1280/800' }}>
            {imgErrors.has(step.id) ? (
              <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
                <span className="text-white/30 text-xl">{step.title}</span>
              </div>
            ) : (
              <Image
                key={step.id}
                src={step.image}
                alt={step.title}
                fill
                className="object-cover"
                onError={() => setImgErrors(s => new Set([...s, step.id]))}
                priority
              />
            )}
          </div>

          {/* Next button */}
          <button
            onClick={goNext}
            className="absolute right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 transition-all"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Right sidebar */}
        <div className="w-60 shrink-0 border-l border-white/10 flex flex-col bg-[#0a0a14]">
          {/* Current step info */}
          <div className="p-5 border-b border-white/10">
            <div className="text-xs text-white/30 font-mono mb-1">Step {current + 1}</div>
            <div className="text-base font-semibold text-white mb-2">{step.title}</div>
            <div className="text-xs text-white/50 leading-relaxed">{step.caption}</div>
            <Link
              href={`https://agent-protocol.reddi.tech${step.url}`}
              target="_blank"
              className="mt-3 flex items-center gap-1 text-xs text-[#9945FF] hover:text-[#14F195] transition-colors"
            >
              Open this page <ExternalLink size={11} />
            </Link>
          </div>

          {/* Step list */}
          <div className="flex-1 overflow-y-auto py-2">
            {TOUR_STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrent(i)}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors ${
                  i === current
                    ? 'bg-white/5 border-l-2 border-[#9945FF]'
                    : 'border-l-2 border-transparent hover:bg-white/3'
                }`}
              >
                <span className={`text-xs font-mono shrink-0 mt-0.5 ${i === current ? 'text-[#9945FF]' : 'text-white/25'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={`text-xs leading-tight ${i === current ? 'text-white' : 'text-white/40'}`}>
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 shrink-0">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #9945FF 0%, #14F195 100%)',
          }}
        />
      </div>
    </div>
  )
}
