import { motion } from 'framer-motion'
import { Target, Lightbulb, AlertTriangle } from 'lucide-react'

export default function StrengthMeter({ analysis }) {
  const { strength = 50, feedback = '', suggestions = [] } = analysis || {}

  const getColor = (score) => {
    if (score >= 70) return '#22c55e'
    if (score >= 40) return '#eab308'
    return '#ef4444'
  }

  const getLabel = (score) => {
    if (score >= 70) return 'Strong'
    if (score >= 40) return 'Moderate'
    return 'Weak'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">Argument Strength</span>
        </div>
        <span className="text-sm font-bold" style={{ color: getColor(strength) }}>
          {strength}/100 - {getLabel(strength)}
        </span>
      </div>

      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${strength}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ backgroundColor: getColor(strength) }}
        />
      </div>

      {feedback && (
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-300">{feedback}</p>
        </div>
      )}

      {suggestions?.length > 0 && (
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <ul className="text-sm text-slate-400 space-y-1">
            {suggestions.map((suggestion, i) => (
              <li key={i}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}