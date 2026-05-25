const axios = require('axios');

const API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

const errorPatterns = ['error: ', 'cannot read', 'inform the user', 'image.png', 'does not support', 'rate limit', 'api key', 'internal server error', 'model not found', '403', '402', '429']

function hasErrorContent(chunk) {
  const str = chunk.toString()
  if (!str.startsWith('data: ') || str.includes('[DONE]')) return false
  try {
    const parsed = JSON.parse(str.replace('data: ', ''))
    const content = parsed.choices?.[0]?.delta?.content
    if (content) {
      const lower = content.toLowerCase()
      for (const p of errorPatterns) {
        if (lower.includes(p)) return true
      }
    }
  } catch (e) {}
  return false
}

async function generateResponseStream(topic, systemPrompt, history, res) {
  const conversationContext = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationContext
  ];

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: MODEL,
        messages: messages,
        max_tokens: 300,
        temperature: 0.8,
        stream: true
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 30000,
        validateStatus: status => status < 500
      }
    );

    if (response.status !== 200) {
      let errorBody = ''
      response.data.on('data', chunk => { errorBody += chunk.toString() })
      response.data.on('end', () => {
        const clean = errorBody.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').substring(0, 200)
        console.error('Groq non-200:', response.status, clean)
        res.write('data: {"choices":[{"delta":{"content":"Server error (' + response.status + '). Please check your API key."}}]}\n\n')
        res.write('data: [DONE]\n\n')
        res.end()
      })
      return
    }

    response.data.on('data', (chunk) => {
      if (hasErrorContent(chunk)) return
      const raw = chunk.toString()
      if (raw.startsWith('data: ') || raw.startsWith('{')) {
        res.write(chunk)
      }
    });

    response.data.on('end', () => {
      res.write('data: [DONE]\n\n')
      res.end()
    });

    response.data.on('error', (err) => {
      console.error('Stream error:', err.message)
      res.write('data: {"choices":[{"delta":{"content":"Connection interrupted. Please try again."}}]}\n\n')
      res.write('data: [DONE]\n\n')
      res.end()
    })
  } catch (error) {
    const msg = (error.message || '').replace(/<[^>]*>/g, '').substring(0, 200)
    console.error('Streaming error:', msg)
    if (error.response?.data) {
      try {
        const chunks = []
        error.response.data.on('data', c => chunks.push(c))
        error.response.data.on('end', () => {
          const errBody = Buffer.concat(chunks).toString().replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').substring(0, 200)
          console.error('Groq error body:', errBody)
        })
      } catch (e) {}
    }
    res.write('data: {"choices":[{"delta":{"content":"I encountered an error connecting to the AI. Your API key may be invalid or the model is unavailable. Please try again."}}]}\n\n')
    res.write('data: [DONE]\n\n')
    res.end()
  }
}

async function analyzeArgument(argument, topic) {
  const analysisPrompt = `Analyze the following argument for a debate on "${topic}":

Argument: ${argument}

Respond ONLY with a JSON object. Do not include any markdown formatting, no \`\`\`json blocks, and no conversational text.

JSON Structure:
{
  "logic": (0-100),
  "persuasion": (0-100),
  "emotion": (0-100),
  "evidence": (0-100),
  "bias": (0-100),
  "fallacies": ["fallacy 1", "fallacy 2"],
  "feedback": "A sharp, 1-sentence critical insight",
  "suggestions": ["tip 1", "tip 2"]
}`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are an expert debate analyst. Always respond with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000,
        validateStatus: status => status < 500
      }
    );

    if (response.status !== 200) {
      console.error('Analyze non-200:', response.status)
      return { logic: 50, persuasion: 50, emotion: 50, evidence: 50, bias: 50, fallacies: [], feedback: 'Analysis unavailable', suggestions: [] }
    }

    const text = response.data.choices[0].message.content;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      return {
        logic: 50,
        persuasion: 50,
        emotion: 50,
        evidence: 50,
        bias: 50,
        fallacies: [],
        feedback: 'Analysis unavailable',
        suggestions: ['Provide more evidence', 'Clarify your main point']
      };
    }
  } catch (error) {
    console.error('Error analyzing argument:', error.message);
    if (error.response?.data) console.error('Response:', typeof error.response.data === 'object' ? JSON.stringify(error.response.data).substring(0, 500) : String(error.response.data).substring(0, 500));
    return {
      logic: 50,
      persuasion: 50,
      emotion: 50,
      evidence: 50,
      bias: 50,
      fallacies: [],
      feedback: 'Analysis unavailable',
      suggestions: []
    };
  }
}

module.exports = { generateResponseStream, analyzeArgument };