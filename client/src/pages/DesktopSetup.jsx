import { useState } from 'react'
import useDebateStore from '../store/debateStore'
import useMediaQuery from '../hooks/useMediaQuery'

const modes = [
  { id: 'friendly', name: 'Friendly', icon: '😊', desc: 'Supportive & casual', color: '#4ade80' },
  { id: 'academic', name: 'Academic', icon: '🎓', desc: 'Evidence-based', color: '#60a5fa' },
  { id: 'aggressive', name: 'Aggressive', icon: '🔥', desc: 'Intense & critical', color: '#f97316' },
  { id: 'socratic', name: 'Socratic', icon: '🔄', desc: 'Probing questions', color: '#a78bfa' },
  { id: 'devilsAdvocate', name: "Devil's Adv.", icon: '😈', desc: 'Extreme opposite', color: '#f43f5e' },
]

const SUGGESTED_TOPICS = ["AI will take all jobs", "Social media is harmful", "School is outdated", "Meat eating is unethical"]
const DIFFICULTIES = ["Easy", "Medium", "Hard"]
const LANGUAGES = ["english", "tagalog"]

const BG = '#080b18'
const SURFACE = '#0f1220'
const BORDER = '#1e2540'
const ACCENT = '#5b50d6'
const ACCENT_LIGHT = '#7c6fe8'
const TEXT = '#e2e8f0'
const MUTED = '#6b7280'

export default function DesktopSetup({ onStart }) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [topic, setTopic] = useState('')
  const [selectedMode, setSelectedMode] = useState('friendly')
  const [difficulty, setDifficulty] = useState('Medium')
  const [language, setLanguage] = useState('tagalog')
  const [error, setError] = useState('')
  const { setTopic: storeTopic, setMode, setDifficulty: storeDiff, setLanguage: storeLang, setSystemPrompt, isLoading, setLoading } = useDebateStore()
  const selected = modes.find(m => m.id === selectedMode)

  const handleStart = async () => {
    if (!topic.trim()) return
    setError('')
    storeTopic(topic)
    setMode(selectedMode)
    storeDiff(difficulty)
    storeLang(language)
    setLoading(true)
    try {
      const res = await fetch('/api/debate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), mode: selectedMode, language, difficulty })
      })
      if (!res.ok) {
        setError('Server error ' + res.status + '. Check API key in Vercel dashboard.')
        setLoading(false)
        return
      }
      const data = await res.json()
      setSystemPrompt(data.systemPrompt)
      onStart()
    } catch (e) {
      console.error(e)
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const p = isMobile ? 16 : 32
  const cP = isMobile ? 16 : 36
  const lS = isMobile ? 32 : 38
  const lF = isMobile ? 16 : 18
  const tS = isMobile ? 17 : 20
  const sF = isMobile ? 10 : 11
  const lSF = isMobile ? 9 : 10
  const iF = isMobile ? 14 : 13
  const bP = isMobile ? 10 : 13
  const bF = isMobile ? 13 : 14
  const mG = isMobile ? 16 : 28
  const cG = isMobile ? 6 : 8
  const mB = isMobile ? 14 : 20
  const pG = isMobile ? 16 : 28

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center',
      background: BG, padding: p,
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{
        width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column',
        background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: isMobile ? 14 : 18, overflow: 'hidden'
      }}>
        <div style={{ padding: `${cP}px ${isMobile ? 16 : 32}px`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: mG }}>
            <div style={{
              width: lS, height: lS, background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})`,
              borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: lF
            }}>🧠</div>
            <div>
              <div style={{ fontSize: tS, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                Argue <span style={{ color: ACCENT_LIGHT }}>With Me</span>
              </div>
              <div style={{ fontSize: sF, color: MUTED }}>Pick a topic. Choose your opponent. Win.</div>
            </div>
          </div>

          <div style={{ fontSize: lSF, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 6 }}>Debate topic</div>
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter any topic to debate..."
            style={{
              width: '100%', background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 9, padding: `${isMobile ? 12 : 11}px 14px`,
              fontSize: iF, color: TEXT, outline: 'none', transition: 'border-color 0.2s', marginBottom: 8
            }}
            onFocus={e => e.target.style.borderColor = ACCENT}
            onBlur={e => e.target.style.borderColor = BORDER}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: mB }}>
            {SUGGESTED_TOPICS.map(t => (
              <button key={t} onClick={() => setTopic(t)}
                style={{
                  background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 20, padding: isMobile ? '6px 12px' : '4px 11px',
                  fontSize: sF, color: MUTED, cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.target.style.borderColor = ACCENT; e.target.style.color = ACCENT_LIGHT }}
                onMouseLeave={e => { e.target.style.borderColor = BORDER; e.target.style.color = MUTED }}
              >{t}</button>
            ))}
          </div>

          <div style={{ fontSize: lSF, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 6 }}>Difficulty</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: mB }}>
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                style={{
                  flex: 1, background: difficulty === d ? '#1e1a3d' : BG, border: `0.5px solid ${difficulty === d ? ACCENT : BORDER}`,
                  borderRadius: 8, padding: isMobile ? '10px 0' : '8px 0', fontSize: sF, fontWeight: 500,
                  color: difficulty === d ? '#a89cf7' : MUTED, cursor: 'pointer', transition: 'all 0.15s'
                }}
              >{d}</button>
            ))}
          </div>

          <div style={{ fontSize: lSF, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 6 }}>Language</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: pG }}>
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => setLanguage(l)}
                style={{
                  flex: 1, background: language === l ? '#1e1a3d' : BG, border: `0.5px solid ${language === l ? ACCENT : BORDER}`,
                  borderRadius: 8, padding: isMobile ? '10px 0' : '8px 0', fontSize: sF, fontWeight: 500,
                  color: language === l ? '#a89cf7' : MUTED, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s'
                }}
              >{l === 'tagalog' ? 'Tagalog' : 'English'}</button>
            ))}
          </div>

          <button onClick={handleStart} disabled={!topic.trim() || isLoading}
            style={{
              width: '100%', background: !topic.trim() ? '#1a1f35' : ACCENT, border: 'none', borderRadius: 10,
              padding: bP, fontSize: bF, fontWeight: 600, color: !topic.trim() ? '#3d4560' : '#fff',
              cursor: !topic.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              opacity: isLoading ? 0.6 : 1, marginBottom: isMobile ? 0 : 0
            }}
            onMouseEnter={e => { if (topic.trim()) { e.target.style.background = '#4a3fc7'; e.target.style.transform = 'translateY(-1px)' }}}
            onMouseLeave={e => { if (topic.trim()) { e.target.style.background = ACCENT; e.target.style.transform = 'none' }}}
          >
            Enter Arena →
          </button>
          {error && (
            <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{error}</div>
          )}
        </div>

        <div style={{
          padding: isMobile ? '0 16px 20px' : `${cP}px ${isMobile ? 16 : 32}px`,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: TEXT, marginBottom: isMobile ? 10 : 14 }}>Choose your opponent</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: cG, marginBottom: isMobile ? 12 : 16 }}>
            {modes.map(m => (
              <button key={m.id} onClick={() => setSelectedMode(m.id)}
                style={{
                  background: selectedMode === m.id ? '#1e1a3d' : BG, border: `0.5px solid ${selectedMode === m.id ? ACCENT : BORDER}`,
                  borderRadius: 10, padding: isMobile ? '8px 4px' : '12px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (selectedMode !== m.id) e.target.style.borderColor = '#2d3550' }}
                onMouseLeave={e => { if (selectedMode !== m.id) e.target.style.borderColor = BORDER }}
              >
                <div style={{ fontSize: isMobile ? 16 : 20, marginBottom: isMobile ? 2 : 4 }}>{m.icon}</div>
                <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: selectedMode === m.id ? '#a89cf7' : MUTED }}>{m.name}</div>
                <div style={{ fontSize: isMobile ? 9 : 10, color: '#3d4560', marginTop: 1 }}>{m.desc}</div>
              </button>
            ))}
          </div>

          <div style={{
            background: BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: isMobile ? '10px 12px' : '12px 14px'
          }}>
            <div style={{ fontSize: lSF, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Selected config</div>
            <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: '#a89cf7' }}>
              {selected?.icon} {selected?.name} · {difficulty} · {language === 'tagalog' ? 'Tagalog' : 'English'}
            </div>
            <div style={{ fontSize: isMobile ? 10 : 11, color: MUTED, marginTop: 3 }}>{selected?.desc}</div>
            {topic && <div style={{ fontSize: isMobile ? 10 : 11, color: '#3d4560', marginTop: 6, fontStyle: 'italic' }}>Topic: "{topic}"</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
