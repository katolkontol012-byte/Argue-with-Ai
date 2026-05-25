const express = require('express');
const router = express.Router();
const { generateResponseStream, analyzeArgument } = require('../services/gemini');

const debateModes = {
  friendly: {
    name: 'Friendly',
    description: 'Casual and supportive challenges',
    systemPrompt: 'You MUST disagree with the user and argue the OPPOSITE side. Never agree. Talk like a real person chatting — use slang, say "like", "kinda", "yeah but". Short sentences. No big words. No lists, no markdown.'
  },
  academic: {
    name: 'Academic',
    description: 'Formal and evidence-focused',
    systemPrompt: 'You MUST argue the OPPOSITE of whatever the user says. Talk normal — like someone at a coffee shop debating a friend. Use everyday words. Short sentences. No fancy vocabulary. No lists, no markdown.'
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Highly critical and intense',
    systemPrompt: 'You MUST strongly oppose the user. Sound like a heated argument between friends — "nah that\'s wrong", "c\'mon think about it". Short punchy sentences. Plain language. No markdown, no lists.'
  },
  socratic: {
    name: 'Socratic',
    description: 'Questions that force self-reflection',
    systemPrompt: 'Ask one question that challenges what they said. Sound curious like you\'re genuinely confused — "wait so...", "but doesn\'t that mean..." One sentence. Plain words. No markdown.'
  },
  devilsAdvocate: {
    name: "Devil's Advocate",
    description: 'Extreme opposition to stress-test ideas',
    systemPrompt: 'You MUST argue the COMPLETE OPPOSITE of what the user believes. Talk like you\'re just playing around — "okay but hear me out", "I mean, what if..." Plain casual language. One short paragraph. No markdown.'
  }
};

router.post('/start', async (req, res) => {
  const { topic, mode, language } = req.body;
  const modeConfig = debateModes[mode] || debateModes.friendly;
  const langInstruction = language === 'english'
    ? 'Use simple English. Short sentences.'
    : 'MUST respond in Tagalog ONLY. Simple Tagalog. Short sentences.';

  const systemPrompt = `${modeConfig.systemPrompt} ${langInstruction} Topic: ${topic}`;

  res.json({
    topic,
    mode: modeConfig.name,
    systemPrompt,
    conversationHistory: []
  });
});

router.post('/message', async (req, res) => {
  const { topic, mode, conversationHistory, userMessage, systemPrompt, language } = req.body;
  const langInstruction = language === 'english'
    ? 'Use simple English. Short sentences.'
    : 'MUST respond in Tagalog ONLY. Simple Tagalog. Short sentences.';
  const fullPrompt = systemPrompt
    ? `${systemPrompt} ${langInstruction}`
    : `${langInstruction} Topic: ${topic}`;

  // keep last 4 exchanges to reduce context size
  const history = [...(conversationHistory || []).slice(-8), { role: 'user', content: userMessage }];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  await generateResponseStream(topic, fullPrompt, history, res);
});

router.post('/analyze', async (req, res) => {
  const { argument, topic } = req.body;
  const analysis = await analyzeArgument(argument, topic);
  res.json(analysis);
});

router.post('/switch-side', async (req, res) => {
  const { topic, conversationHistory, originalPrompt } = req.body;

  const history = conversationHistory || [];
  const switchPrompt = `You are now defending the following position: "${topic}". Review the previous conversation and now argue FOR this position, attacking the counterarguments you previously made.`;

  const response = await generateResponseStream(topic, switchPrompt, history, res);
  // Note: Since we switched to streaming, switch-side also needs to handle stream or return a final response.
  // For simplicity in this specific route, we use the stream.
});

router.post('/summarize', async (req, res) => {
  const { conversationHistory, topic, language } = req.body;
  const langInstruction = language === 'english'
    ? 'Respond in English.'
    : 'Respond in Tagalog (Filipino) language naturally.';

  const summaryPrompt = `Create a comprehensive markdown summary of this debate on "${topic}". Include:
- Key arguments presented by both sides
- Main points of contention
- Logical fallacies identified
- Strengths and weaknesses of arguments
- Suggested areas for improvement
- Conclusion

${langInstruction}`;

  // For summary, we might want a non-streaming response. 
  // Since generateResponse was removed, we can implement a simple non-streaming call here or use the stream.
  res.setHeader('Content-Type', 'text/event-stream');
  await generateResponseStream(topic, summaryPrompt, conversationHistory || [], res);
});

module.exports = router;