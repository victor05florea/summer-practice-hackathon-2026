const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'llama3.2';

export async function askOllama(prompt: string): Promise<string> {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
      }),
    });

    const data = await response.json();
    return data.response || 'No response from AI.';
  } catch (error) {
    console.error('Ollama error:', error);
    return 'AI is unavailable. Make sure Ollama is running locally.';
  }
}

export async function getEventSuggestions(sport: string, city: string): Promise<string> {
  const prompt = `You are a local sports coach in ${city}, Romania. Suggest 3 specific outdoor locations or facilities in ${city} where people can play ${sport}. For each location, give: name, why it's good (1 short sentence), and approximate cost (free/paid). Be concise. Format as a short bulleted list. Maximum 100 words total.`;
  return askOllama(prompt);
}

export async function getWelcomeMessage(sport: string, memberCount: number): Promise<string> {
  const prompt = `Write a short, energetic welcome message (max 2 sentences) for a group of ${memberCount} people who just joined to play ${sport} together today. Be friendly and motivating. No emojis.`;
  return askOllama(prompt);
}

export async function getDailyMotivation(username: string, sports: string[]): Promise<string> {
  const prompt = `Write a short, energetic motivational message (max 2 sentences) for ${username} who loves ${sports.join(", ")}. Make it personal and inspiring. No emojis, no quotes around the response.`;
  return askOllama(prompt);
}

export async function getCompatibility(mySports: string[], mySkill: string, theirUsername: string, theirSports: string[], theirSkill: string): Promise<string> {
  const shared = mySports.filter(s => theirSports.includes(s));
  const prompt = `I play ${mySports.join(", ")} at ${mySkill} level. ${theirUsername} plays ${theirSports.join(", ")} at ${theirSkill} level. Shared sports: ${shared.join(", ") || "none"}. In 2-3 short sentences, explain why we'd be a good match for playing sports together. Be warm and specific.`;
  return askOllama(prompt);
}

export async function getIcebreaker(sport: string): Promise<string> {
  const prompt = `Generate one fun, casual icebreaker question to ask a group of strangers about to play ${sport} together for the first time. Just the question, max 15 words, no preamble.`;
  return askOllama(prompt);
}