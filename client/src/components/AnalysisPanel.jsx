import { motion } from 'framer-motion'
import { Target, Lightbulb, AlertTriangle, Zap, ShieldAlert, Heart } from 'lucide-react'

const MetricBar = ({ label, value, icon: Icon, color }) => (
  <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/5 border border-white/5">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <span className="text-[10px] font-bold text-white">{value}%</span>
    </div>
    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  </div>
)

export default function AnalysisPanel({ analysis }) {
  if (!analysis) return null

  const metrics = [
    { label: 'Logic', value: analysis.logic || 50, icon: Target, color: '#6366f1' },
    { label: 'Persuasion', value: analysis.persuasion || 50, icon: Zap, color: '#a855f7' },
    { label: 'Emotion', value: analysis.emotion || 50, icon: Heart, color: '#ec4899' },
    { label: 'Evidence', value: analysis.evidence || 50, icon: ShieldAlert, color: '#10b981' },
    { label: 'Bias', value: analysis.bias || 50, icon: AlertTriangle, color: '#f59e0b' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-4 mb-4 border-white/10 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Analysis</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">AI-Powered</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {metrics.slice(0, 4).map((m, i) => <MetricBar key={i} {...m} />)}
        <div className="col-span-2">
          <MetricBar {...metrics[4]} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-[10px] font-bold text-red-300 uppercase block">Fallacies</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {analysis.fallacies?.length > 0 ? (
                analysis.fallacies.map((f, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-200 text-[9px] border border-red-500/30">
                    {f}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-slate-500 italic">None detected</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <Lightbulb className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-indigo-300 uppercase block">Insight</span>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">{analysis.feedback}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}