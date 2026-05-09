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