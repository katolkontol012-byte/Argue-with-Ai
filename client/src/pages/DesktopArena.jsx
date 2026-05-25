import { useState, useRef, useEffect } from 'react'
import useDebateStore from '../store/debateStore'
import useMediaQuery from '../hooks/useMediaQuery'

const TOTAL_ROUNDS = 5
const ACCENT = '#5b50d6'
const ACCENT_LIGHT = '#7c6fe8'
const BG = '#080b18'
const SURFACE = '#0f1220'
const CARD = '#111527'
const BORDER = '#1e2540'
const TEXT = '#e2e8f0'
const MUTED = '#6b7280'

const errorPatterns = ['error: ', 'cannot read', 'inform the user', 'image.png', 'does not support', 'rate limit', 'api key', 'internal server error', 'model not found', '403', '402', '429']

function sanitize(text) {
  const lower = text.toLowerCase()
  for (const p of errorPatterns) {
    if (lower.includes(p)) return ''
  }
  return text
}

const modeMeta = {
  friendly: { name: 'Friendly', icon: '😊', color: '#4ade80' },
  academic: { name: 'Academic', icon: '🎓', color: '#60a5fa' },
  aggressive: { name: 'Aggressive', icon: '🔥', color: '#f97316' },
  socratic: { name: 'Socratic', icon: '🔄', color: '#a78bfa' },
  devilsAdvocate: { name: "Devil's Adv.", icon: '😈', color: '#f43f5e' },
}

function ScoreBar({ label, value }) {
  const color = value >= 65 ? '#4ade80' : value >= 45 ? '#fbbf24' : '#f87171'
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: MUTED }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{value}%</span>
      </div>
      <div style={{ height: 4, background: BORDER, borderRadius: 2 }}>
        <div style={{ height: 4, width: `${value}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export default function DesktopArena({ onBack }) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState(null)
  const [hint, setHint] = useState(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const messagesEndRef = useRef(null)
  const hasOpened = useRef(false)

  const {
    topic, mode, language, conversationHistory, systemPrompt,
    isLoading, analysis, userStats,
    addUserMessage, addAiMessage, setAnalysis, setRound, round,
    setGameOver, isGameOver, setSummary, summary, addXp, setLoading, reset
  } = useDebateStore()

  const meta = modeMeta[mode] || modeMeta.friendly

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  useEffect(() => {
    if (!hasOpened.current && conversationHistory.length === 0) {
      hasOpened.current = true
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
      const res = await fetch('/api/debate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mode, language })
      })
      const data = await res.json()
      const streamRes = await fetch('/api/debate/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mode, language, conversationHistory: [], userMessage: `Start the debate on the topic: "${topic}". Open with a provocative argument.`, systemPrompt: data.systemPrompt })
      })
      const reader = streamRes.body.getReader()
      const decoder = new TextDecoder()
      let aiResponse = ''
      addAiMessage('')
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ') || line.includes('[DONE]')) continue
          try {
            const parsed = JSON.parse(line.replace('data: ', ''))
            const content = sanitize(parsed.choices[0]?.delta?.content || '')
            if (!content) continue
            aiResponse += content
            useDebateStore.getState().setConversationHistory([{ role: 'assistant', content: aiResponse }])
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
        body: JSON.stringify({ topic, mode, language, conversationHistory, userMessage, systemPrompt })
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
        for (const line of chunk.split('\n')) {
          const t = line.trim()
          if (!t || t === 'data: [DONE]') continue
          if (t.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(t.replace('data: ', ''))
              const content = sanitize(parsed.choices[0]?.delta?.content || '')
              if (!content) continue
              aiResponse += content
              useDebateStore.getState().setConversationHistory([...conversationHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: aiResponse }])
            } catch (e) { console.error('SSE parse error:', e) }
          }
        }
      }
      if (round + 1 >= TOTAL_ROUNDS) {
        setGameOver(true)
        try {
          const sumRes = await fetch('/api/debate/summarize', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationHistory: [...conversationHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: aiResponse }], topic, language })
          })
          if (sumRes.body) {
            const sr = sumRes.body.getReader()
            const sd = new TextDecoder()
            let st = ''
            while (true) {
              const { value, done } = await sr.read()
              if (done) break
              for (const line of sd.decode(value, { stream: true }).split('\n')) {
                if (!line.startsWith('data: ') || line.includes('[DONE]')) continue
                try {
                  const p = JSON.parse(line.replace('data: ', ''))
                  const sc = sanitize(p.choices[0]?.delta?.content || '')
                  st += sc
                  setSummary(st)
                } catch (e) {}
              }
            }
          }
        } catch (e) { console.error(e) }
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mode: 'friendly', language, conversationHistory, userMessage: `Give me a 1-sentence hint on how to strengthen my next argument.`, systemPrompt: 'You are a debate coach. Give a brief tip.' })
      })
      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let hintText = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ') || line.includes('[DONE]')) continue
          try {
            const parsed = JSON.parse(line.replace('data: ', ''))
            hintText += sanitize(parsed.choices[0]?.delta?.content || '')
          } catch (e) {}
        }
      }
      setHint(hintText)
    } catch (e) { console.error(e) }
    finally { setHintLoading(false) }
  }

  const handleNewDebate = () => {
    hasOpened.current = false
    reset()
    onBack()
  }

  const avgScore = Math.round((analysis.logic + analysis.evidence + analysis.persuasion) / 3)

  if (isGameOver) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(8,11,24,0.92)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 50,
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <div style={{
          background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: isMobile ? 14 : 18, padding: isMobile ? 20 : 36,
          width: '100%', maxWidth: isMobile ? '92%' : 520, textAlign: 'center'
        }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{avgScore >= 70 ? '🏆' : avgScore >= 50 ? '⚔️' : '📚'}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Debate Over</div>
          <div style={{ fontSize: 12, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{topic}</div>
          <div style={{ fontSize: 11, color: ACCENT_LIGHT, marginBottom: 16 }}>{meta.icon} {meta.name} · {userStats.rank}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '20px 0' }}>
            {[['Logic', analysis.logic], ['Evidence', analysis.evidence], ['Persuasion', analysis.persuasion], ['Bias Control', 100 - analysis.bias]].map(([label, val]) => (
              <div key={label} style={{ background: CARD, borderRadius: 10, padding: '14px 10px' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: val >= 65 ? '#4ade80' : val >= 45 ? '#fbbf24' : '#f87171', marginBottom: 2 }}>{val}%</div>
                <div style={{ fontSize: 11, color: MUTED }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: CARD, borderRadius: 10, padding: 14, marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Judge's Verdict</div>
            <div style={{ fontSize: 13, color: '#c4cde0', lineHeight: 1.7 }}>{summary || 'Great job completing the debate!'}</div>
          </div>
          <button onClick={handleNewDebate} style={{
            width: '100%', background: ACCENT, border: 'none', borderRadius: 10, padding: 12,
            fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'background 0.2s'
          }}
            onMouseEnter={e => e.target.style.background = '#4a3fc7'}
            onMouseLeave={e => e.target.style.background = ACCENT}
          >Debate Again →</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif",
      background: BG, color: TEXT
    }}>
      <div style={{
        flex: 1, display: isMobile ? 'flex' : 'grid',
        gridTemplateColumns: isMobile ? undefined : '280px 1fr',
        flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* SIDEBAR - desktop only */}
        {!isMobile && (
          <div style={{
            background: SURFACE, borderRight: `0.5px solid ${BORDER}`, display: 'flex',
            flexDirection: 'column', gap: 12, padding: 16, overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <button onClick={handleNewDebate} style={{
                background: 'none', border: 'none', color: MUTED, fontSize: 18, padding: 0, cursor: 'pointer', lineHeight: 1
              }}>←</button>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, lineHeight: 1.3 }}>{topic}</div>
                <div style={{ fontSize: 10, color: meta.color }}>{meta.icon} {meta.name}</div>
              </div>
            </div>

            <div style={{
              background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center'
            }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: '#a89cf7', lineHeight: 1 }}>
                {round}<span style={{ fontSize: 18, color: '#3d4560' }}>/{TOTAL_ROUNDS}</span>
              </div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>rounds completed</div>
            </div>

            <div style={{ background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontWeight: 500 }}>Your argument scores</div>
              <ScoreBar label="Logic" value={analysis.logic} />
              <ScoreBar label="Evidence" value={analysis.evidence} />
              <ScoreBar label="Persuasion" value={analysis.persuasion} />
              <ScoreBar label="Bias" value={analysis.bias} />
            </div>

            {toast && (
              <div style={{
                background: '#0d1a2d', border: '0.5px solid #1e3a5f', borderRadius: 10, padding: '12px 14px', animation: 'slideIn 0.25s ease'
              }}>
                <div style={{ fontSize: 9, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontWeight: 500 }}>Fallacy detected</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa', marginBottom: 4 }}>{toast}</div>
                <div style={{ fontSize: 11, color: '#3d6090', lineHeight: 1.5 }}>Try backing your claim with evidence instead of this reasoning pattern.</div>
              </div>
            )}
          </div>
        )}

        {/* CHAT */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          {/* HEADER */}
          {isMobile ? (
            <div style={{
              padding: '10px 12px', borderBottom: `0.5px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', gap: 8,
              background: SURFACE, flexShrink: 0
            }}>
              <button onClick={handleNewDebate} style={{
                background: 'none', border: 'none', color: MUTED, fontSize: 18, padding: '0 4px', cursor: 'pointer', lineHeight: 1, flexShrink: 0
              }}>←</button>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic}</div>
                <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.3 }}>Round {round}/{TOTAL_ROUNDS}</div>
              </div>
              <div style={{
                background: '#0d1a2d', border: `0.5px solid ${meta.color}33`, borderRadius: 16,
                padding: '2px 10px', fontSize: 11, color: meta.color, whiteSpace: 'nowrap', flexShrink: 0
              }}>{meta.icon} {meta.name}</div>
              <div style={{
                background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 10,
                padding: '4px 10px', fontSize: 13, fontWeight: 700, color: '#a89cf7', lineHeight: 1, flexShrink: 0
              }}>{round}<span style={{ fontSize: 11, color: '#3d4560' }}>/{TOTAL_ROUNDS}</span></div>
            </div>
          ) : (
            <div style={{
              padding: '14px 20px', borderBottom: `0.5px solid ${BORDER}`, display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', background: SURFACE, flexShrink: 0
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{topic}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>Present your argument to continue the debate</div>
              </div>
              <div style={{
                background: '#0d1a2d', border: `0.5px solid ${meta.color}33`, borderRadius: 20,
                padding: '4px 12px', fontSize: 11, color: meta.color
              }}>
                {meta.icon} {meta.name} Mode
              </div>
            </div>
          )}

          {/* MESSAGES */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 12 : 20, display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10 }}>
            {conversationHistory.length === 0 && !isLoading && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED, fontSize: 13 }}>
                Ready to spar? AI is preparing...
              </div>
            )}
            {conversationHistory.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', gap: isMobile ? 6 : 8, animation: 'fadeUp 0.25s ease',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  width: isMobile ? 26 : 30, height: isMobile ? 26 : 30, borderRadius: 8,
                  background: msg.role === 'user' ? '#1e1a3d' : CARD,
                  border: `0.5px solid ${msg.role === 'user' ? '#3d3480' : BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 13 : 15, flexShrink: 0, alignSelf: 'flex-end'
                }}>{msg.role === 'user' ? '👤' : meta.icon}</div>
                <div style={{
                  maxWidth: isMobile ? '85%' : '68%',
                  padding: isMobile ? '8px 12px' : '10px 14px',
                  fontSize: isMobile ? 13 : 13, lineHeight: 1.65, color: TEXT,
                  background: msg.role === 'user' ? '#1e1a3d' : CARD,
                  border: `0.5px solid ${msg.role === 'user' ? '#3d3480' : BORDER}`,
                  borderRadius: msg.role === 'user' ? '12px 3px 12px 12px' : '3px 12px 12px 12px'
                }}>{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: isMobile ? 6 : 8 }}>
                <div style={{
                  width: isMobile ? 26 : 30, height: isMobile ? 26 : 30, borderRadius: 8, background: CARD,
                  border: `0.5px solid ${BORDER}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: isMobile ? 13 : 15, flexShrink: 0
                }}>{meta.icon}</div>
                <div style={{
                  padding: '10px 14px', fontSize: 14, color: MUTED,
                  background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: '3px 12px 12px 12px'
                }}>•••</div>
              </div>
            )}
            {hint && (
              <div style={{
                background: '#0d1a2d', border: '0.5px solid #1e3a5f', borderRadius: 10, padding: '10px 14px',
                fontSize: 12, color: '#60a5fa', lineHeight: 1.6, animation: 'fadeUp 0.2s ease'
              }}>
                💡 {hint}
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={{
            padding: isMobile ? '10px 12px' : '14px 20px',
            borderTop: `0.5px solid ${BORDER}`, display: 'flex', gap: isMobile ? 6 : 8,
            alignItems: 'flex-end', background: SURFACE, flexShrink: 0
          }}>
            <button onClick={getHint} disabled={hintLoading || conversationHistory.length === 0} style={{
              background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 9, padding: '0 12px',
              height: isMobile ? 44 : 42, fontSize: 12, color: hintLoading || conversationHistory.length === 0 ? '#3d4560' : MUTED,
              cursor: hintLoading || conversationHistory.length === 0 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
              onMouseEnter={e => { if (!hintLoading && conversationHistory.length > 0) { e.target.style.borderColor = '#1e3a5f'; e.target.style.color = '#60a5fa' }}}
              onMouseLeave={e => { if (!hintLoading && conversationHistory.length > 0) { e.target.style.borderColor = BORDER; e.target.style.color = MUTED }}}
            >{hintLoading ? '...' : '💡 Hint'}</button>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }}}
              placeholder="Present your argument... (Enter to send)"
              rows={isMobile ? 1 : 2}
              disabled={isLoading}
              style={{
                flex: 1, background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: isMobile ? '10px 12px' : '10px 14px',
                fontSize: 13, color: TEXT, lineHeight: 1.5, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
            <button onClick={handleSend} disabled={!message.trim() || isLoading} style={{
              background: !message.trim() || isLoading ? CARD : ACCENT, border: 'none', borderRadius: 10,
              width: isMobile ? 44 : 42, height: isMobile ? 44 : 42, fontSize: 16, color: !message.trim() || isLoading ? '#3d4560' : '#fff',
              cursor: !message.trim() || isLoading ? 'not-allowed' : 'pointer', flexShrink: 0,
              transition: 'background 0.2s'
            }}
              onMouseEnter={e => { if (message.trim() && !isLoading) e.target.style.background = '#4a3fc7' }}
              onMouseLeave={e => { if (message.trim() && !isLoading) e.target.style.background = ACCENT }}
            >→</button>
          </div>

          {/* Mobile fallacy toast - inline in chat */}
          {isMobile && toast && (
            <div style={{
              position: 'fixed', bottom: 80, left: 12, right: 12,
              background: '#0d1a2d', border: '0.5px solid #1e3a5f', borderRadius: 10, padding: '10px 12px',
              zIndex: 100, animation: 'fadeUp 0.25s ease'
            }}>
              <div style={{ fontSize: 9, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontWeight: 500 }}>Fallacy detected</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa', marginBottom: 2 }}>{toast}</div>
              <div style={{ fontSize: 10, color: '#3d6090', lineHeight: 1.5 }}>Try backing your claim with evidence instead of this reasoning pattern.</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        textarea { resize: none; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 4px; }
      `}</style>
    </div>
  )
}
