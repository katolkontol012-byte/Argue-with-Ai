import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Trophy, Lightbulb } from 'lucide-react'
import useDebateStore from '../store/debateStore'
import ReactMarkdown from 'react-markdown'

const TOTAL_ROUNDS = 5

function ScorePill({ label, value, color }) {
  return (
    <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-full px-2 py-1 text-center">
      <div className="text-[8px] uppercase text-slate-500 font-bold">{label}</div>
      <div className="text-[11px] font-bold" style={{ color }}>{value}%</div>
    </div>
  )
}

export default function Debate({ onBack }) {
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState(null)
  const [hint, setHint] = useState(null)
  const [hintLoading, setHintLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const {
    topic,
    mode,
    language,
    conversationHistory,
    systemPrompt,
    isLoading,
    analysis,
    userStats,
    addUserMessage,
    addAiMessage,
    setAnalysis,
    setAnalyzing,
    setRound,
    round,
    setGameOver,
    isGameOver,
    setSummary,
    summary,
    addXp,
    setLoading,
    reset
  } = useDebateStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  useEffect(() => {
    if (conversationHistory.length === 0) {
      startOpening()
    }
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  const startOpening = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mode, language })
      })
      const data = await response.json()
      
      // Now fetch the AI's opening argument via streaming
      const streamRes = await fetch('/api/debate/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          mode,
          language,
          conversationHistory: [],
          userMessage: `Start the debate on the topic: "${topic}". Open with a provocative argument.`,
          systemPrompt: data.systemPrompt
        })
      })

      const reader = streamRes.body.getReader()
      const decoder = new TextDecoder()
      let aiResponse = ''
      addAiMessage('')

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ') || line.includes('[DONE]')) continue
          try {
            const parsed = JSON.parse(line.replace('data: ', ''))
            const content = parsed.choices[0]?.delta?.content || ''
            aiResponse += content
            const history = [{ role: 'assistant', content: aiResponse }]
            useDebateStore.getState().setConversationHistory(history)
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!message.trim() || isLoading) return
    const userMessage = message
    setMessage('')
    addUserMessage(userMessage)
    setAnalyzing(true)
    setRound(prev => prev + 1)

    // Fire analysis in background (don't await)
    fetch('/api/debate/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ argument: userMessage, topic })
    })
    .then(res => res.json())
    .then(data => {
      setAnalysis(data)
      setAnalyzing(false)
      if (data.fallacies?.length > 0) setToast(data.fallacies[0])
    })
    .catch(e => console.error(e))

    addXp(15)

    try {
      const response = await fetch('/api/debate/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          mode,
          language,
          conversationHistory,
          userMessage,
          systemPrompt
        })
      })

      if (!response.body) throw new Error('No response body')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let aiResponse = ''
      addAiMessage('')

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        
        const lines = chunk.split('\n')
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.replace('data: ', '')
              const data = JSON.parse(jsonStr)
              const content = data.choices[0]?.delta?.content || ''
              aiResponse += content
              
              const history = [...conversationHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: aiResponse }]
              useDebateStore.getState().setConversationHistory(history)
            } catch (e) {
              console.error('Error parsing SSE chunk:', e)
            }
          }
        }
      }

      if (round + 1 >= TOTAL_ROUNDS) {
        setGameOver(true)
        try {
          const sumRes = await fetch('/api/debate/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationHistory: [...conversationHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: aiResponse }], topic, language })
          })
          if (sumRes.body) {
            const reader = sumRes.body.getReader()
            const decoder = new TextDecoder()
            let summaryText = ''
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n')
              for (const line of lines) {
                if (!line.startsWith('data: ') || line.includes('[DONE]')) continue
                try {
                  const parsed = JSON.parse(line.replace('data: ', ''))
                  const content = parsed.choices[0]?.delta?.content || ''
                  summaryText += content
                  setSummary(summaryText)
                } catch (e) {}
              }
            }
          }
        } catch (e) {
          console.error(e)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      addAiMessage('Sorry, I encountered an error. Please try again.')
    }
  }

  const getHint = async () => {
    setHintLoading(true)
    try {
      const res = await fetch('/api/debate/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          mode: 'friendly',
          language,
          conversationHistory: conversationHistory,
          userMessage: `Give me a 1-sentence hint on how to strengthen my next argument.`,
          systemPrompt: 'You are a debate coach. Give a brief tip.'
        })
      })

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let hintText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ') || line.includes('[DONE]')) continue
          try {
            const parsed = JSON.parse(line.replace('data: ', ''))
            const content = parsed.choices[0]?.delta?.content || ''
            hintText += content
          } catch (e) {}
        }
      }
      setHint(hintText)
    } catch (e) {
      console.error(e)
    } finally {
      setHintLoading(false)
    }
  }

  const handleNewDebate = () => {
    reset()
    onBack()
  }

  if (isGameOver) {
    return (
      <div className="mobile-container p-6 flex flex-col items-center justify-center text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-4">🏆</motion.div>
        <h2 className="text-2xl font-bold text-white">Debate Concluded</h2>
        <div className="glass-card p-6 rounded-3xl w-full text-left space-y-4 border-white/10">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Final Verdict</div>
          <div className="text-sm text-slate-300 leading-relaxed">{summary || 'Great job completing the debate!'}</div>
        </div>
        <button onClick={handleNewDebate} className="w-full py-4 bg-primary rounded-2xl font-bold text-white shadow-lg">
          Debate Again
        </button>
      </div>
    )
  }

  return (
    <div className="mobile-container">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
        <button onClick={handleNewDebate} className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-xs font-bold uppercase tracking-tighter text-slate-400 line-clamp-1 max-w-[150px]">{topic}</h2>
          <div className="flex items-center gap-1 text-[10px] font-medium text-primary">
            <span className="text-white/50">Round {round}/{TOTAL_ROUNDS}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-full border border-white/10">
            <Trophy className="w-3 h-3 text-yellow-500" />
            <span className="text-[10px] font-bold text-white">{userStats.rank}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 relative">
        {toast && (
          <motion.div 
            key="toast"
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-red-500/20 border border-red-500/30 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-red-200 text-xs font-medium shadow-xl"
          >
            <span className="text-sm">⚠</span> {toast}
          </motion.div>
        )}
        <div className="flex flex-col gap-4 pb-32">
            {conversationHistory.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-3xl ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20'
                      : 'glass-card text-slate-200 rounded-tl-none border-white/10'
                  }`}
                >
                  <div className={`text-[9px] font-black uppercase tracking-widest mb-1 opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.role === 'user' ? 'User' : 'AI Coach'}
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none leading-snug text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] p-4 space-y-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <div className="flex gap-2 mb-2">
          <ScorePill label="Logic" value={analysis?.logic ?? 50} color="#6366f1" />
          <ScorePill label="Evidence" value={analysis?.evidence ?? 50} color="#10b981" />
          <ScorePill label="Persuasion" value={analysis?.persuasion ?? 50} color="#a855f7" />
          <ScorePill label="Bias" value={analysis?.bias ?? 50} color="#f59e0b" />
        </div>

        <div className="glass-card rounded-full p-1.5 flex gap-2 border-white/10 shadow-2xl">
          <button 
            onClick={getHint}
            disabled={hintLoading}
            className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-primary transition-colors"
            title="Get a hint"
          >
            <Lightbulb className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Present your argument..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="p-3 bg-primary rounded-full text-white hover:bg-primary/80 disabled:opacity-50 transition-all active:scale-90"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {hint && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-[10px] text-primary font-medium italic"
          >
            {hint}
          </motion.div>
        )}
      </div>
    </div>
  )
}