import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

export default function FallacyAlert({ fallacies = [] }) {
  if (!fallacies.length) return null

  const fallacyColors = {
    strawman: '#ef4444',
    adHominem: '#f97316',
    falseDilemma: '#eab308',
    circularReasoning: '#8b5cf6',
    appealToAuthority: '#06b6d4',
    hastyGeneralization: '#ec4899',
    redHerring: '#14b8a6'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mt-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-sm font-medium text-red-300">Logical Fallacies Detected</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {fallacies.map((fallacy, i) => (
          <span
            key={i}
            className="px-2 py-1 rounded-md text-xs font-medium text-white"
            style={{ backgroundColor: fallacyColors[fallacy.toLowerCase().replace(' ', '')] || '#6b7280' }}
          >
            {fallacy}
          </span>
        ))}
      </div>
    </motion.div>
  )
}