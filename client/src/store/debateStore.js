import { create } from 'zustand'

const useDebateStore = create((set, get) => ({
  // Core State
  topic: '',
  mode: 'friendly',
  language: 'tagalog',
  difficulty: 'Medium',
  conversationHistory: [],
  systemPrompt: '',
  isLoading: false,
  isAnalyzing: false,
  round: 0,
  isGameOver: false,
  summary: '',
  
  // Extended Analysis
  analysis: {
    logic: 50,
    persuasion: 50,
    emotion: 50,
    evidence: 50,
    bias: 50,
    fallacies: [],
    feedback: '',
    suggestions: []
  },

  // Gamification
  userStats: {
    xp: 0,
    streak: 0,
    rank: 'Novice Debater',
    badges: [],
    totalDebates: 0
  },

  // Actions
  setTopic: (topic) => set({ topic }),
  setMode: (mode) => set({ mode }),
  setLanguage: (language) => set({ language }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
  setConversationHistory: (history) => set({ conversationHistory: history }),
  setRound: (round) => set({ round }),
  setGameOver: (status) => set({ isGameOver: status }),
  setSummary: (summary) => set({ summary }),

  addUserMessage: (message) => set((state) => ({
    conversationHistory: [...state.conversationHistory, { role: 'user', content: message }]
  })),

  addAiMessage: (message) => set((state) => ({
    conversationHistory: [...state.conversationHistory, { role: 'assistant', content: message }]
  })),

  setLoading: (loading) => set({ isLoading: loading }),
  setAnalysis: (analysis) => set({ analysis }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  addXp: (amount) => set((state) => {
    const newXp = state.userStats.xp + amount;
    let newRank = 'Novice Debater';
    if (newXp > 1000) newRank = 'Logic Apprentice';
    if (newXp > 5000) newRank = 'Rhetoric Master';
    if (newXp > 10000) newRank = 'Grandmaster Orator';
    
    return {
      userStats: {
        ...state.userStats,
        xp: newXp,
        rank: newRank,
        totalDebates: state.userStats.totalDebates + 1
      }
    };
  }),

  reset: () => set({
    topic: '',
    mode: 'friendly',
    language: 'tagalog',
    difficulty: 'Medium',
    conversationHistory: [],
    systemPrompt: '',
    isLoading: false,
    isAnalyzing: false,
    round: 0,
    isGameOver: false,
    summary: '',
    analysis: { logic: 50, persuasion: 50, emotion: 50, evidence: 50, bias: 50, fallacies: [], feedback: '', suggestions: [] },
  })
}))

export default useDebateStore