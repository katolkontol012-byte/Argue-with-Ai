import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, ArrowRight, Zap, Target, Trophy } from 'lucide-react'
import useDebateStore from '../store/debateStore'

const modes = [
  { id: 'friendly', name: 'Friendly', icon: '😊', desc: 'Supportive', color: 'from-blue-500 to-indigo-600' },
  { id: 'academic', name: 'Academic', icon: '🎓', desc: 'Evidence', color: 'from-emerald-500 to-teal-600' },
  { id: 'aggressive', name: 'Aggressive', icon: '🔥', desc: 'Intense', color: 'from-orange-500 to-red-600' },
  { id: 'socratic', name: 'Socratic', icon: '🔄', desc: 'Probing', color: 'from-purple-500 to-pink-600' },
  { id: 'devilsAdvocate', name: "Devil's Adv.", icon: '😈', desc: 'Extreme', color: 'from-slate-700 to-slate-900' },
]

const SUGGESTED_TOPICS = ["AI will take all jobs", "Social media is harmful", "School is outdated", "Meat eating is unethical"]
const DIFFICULTIES = ["Easy", "Medium", "Hard"]

export default function Landing({ onStart }) {
  const [topic, setTopic] = useState('')
  const [selectedMode, setSelectedMode] = useState('friendly')
  const [difficulty, setDifficulty] = useState('Medium')
  const [language, setLanguage] = useState('tagalog')
  const { setTopic: storeSetTopic, setMode, setDifficulty: storeSetDiff, setLanguage: storeSetLang, setSystemPrompt, setLoading } = useDebateStore()

  const handleStart = async () => {
    if (!topic.trim()) return
    storeSetTopic(topic)
    setMode(selectedMode)
    storeSetDiff(difficulty)
    storeSetLang(language)
    setLoading(true)
    try {
      const res = await fetch('/api/debate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mode: selectedMode, difficulty, language })
      })
      const data = await res.json()
      setSystemPrompt(data.systemPrompt)
      onStart()
    } catch (error) {
      console.error('Failed to start debate:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mobile-container px-6 py-12 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center space-y-10"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg mb-2">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Argue <span className="text-primary">With Me</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium">Pick a topic. Choose your opponent. Win.</p>
        </div>

        <div className="glass-card rounded-3xl p-6 space-y-8 border-white/10">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Debate Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic..."
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all text-sm"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTED_TOPICS.map(t => (
                <button 
                  key={t} 
                  onClick={() => setTopic(t)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] text-slate-400 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Choose Opponent</label>
            <div className="grid grid-cols-3 gap-2">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                    selectedMode === mode.id
                      ? `bg-gradient-to-br ${mode.color} border-transparent text-white shadow-lg scale-105`
                      : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{mode.icon}</span>
                  <div className="text-center">
                    <div className="font-bold text-[10px] leading-tight">{mode.name}</div>
                    <div className="text-[8px] opacity-70">{mode.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl border transition-all text-[11px] font-bold ${
                    difficulty === d
                      ? 'bg-primary border-transparent text-white shadow-md'
                      : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Language</label>
            <div className="flex gap-2">
              {['english', 'tagalog'].map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`flex-1 py-2 rounded-xl border transition-all text-[11px] font-bold capitalize ${
                    language === l
                      ? 'bg-primary border-transparent text-white shadow-md'
                      : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={!topic.trim()}
            className="w-full py-4 bg-primary rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 transition-all"
          >
            Enter Arena
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 glass-card rounded-2xl border-white/5">
            <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
            <div className="text-[10px] font-bold text-slate-300">Fast</div>
          </div>
          <div className="p-3 glass-card rounded-2xl border-white/5">
            <Target className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-[10px] font-bold text-slate-300">Precise</div>
          </div>
          <div className="p-3 glass-card rounded-2xl border-white/5">
            <Trophy className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <div className="text-[10px] font-bold text-slate-300">Elite</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}