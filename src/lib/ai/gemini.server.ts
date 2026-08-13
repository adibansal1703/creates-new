import { getGeminiApiKey } from "@/lib/env.server";
import type {
  AIContentIdeasRequest,
  AIContentIdeasResponse,
  AICaptionRequest,
  AICaptionResponse,
} from "@/lib/types/ai";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Rate limiting: simple in-memory tracker
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove timestamps older than the window
  const recentTimestamps = requestTimestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  requestTimestamps.length = 0;
  requestTimestamps.push(...recentTimestamps);

  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  requestTimestamps.push(now);
  return true;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  const retryableStatuses = [429, 500, 502, 503, 504];
  const delays = [2000, 4000, 8000]; // 2s, 4s, 8s exponential backoff

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!retryableStatuses.includes(response.status)) {
        return response;
      }

      if (attempt === maxRetries) {
        throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
      }
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
      }
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    }
  }

  throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
}

export async function generateContentIdeas(
  request: AIContentIdeasRequest,
): Promise<AIContentIdeasResponse> {
  if (!checkRateLimit()) {
    throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
  }

  const apiKey = getGeminiApiKey();
  const prompt = `You are an expert Instagram content strategist. Generate exactly 5 actionable, specific content ideas for a creator in the "${request.niche}" niche targeting "${request.targetAudience}" with the goal of "${request.goal}" and emotion "${request.emotion}".

IMPORTANT: Generate exactly 5 ideas with this specific mix:
- 2 Reels
- 2 Carousels  
- 1 Single Image

Each idea must be ACTIONABLE and SPECIFIC. Do not generate generic ideas like "5 Tips for Success". Instead, generate specific, actionable ideas like "Record yourself fixing a common client mistake and explain why it happens."

For each idea, provide:
- postType: One of: "Reel", "Carousel", "Single Image"
- contentGoal: One of: "Engagement", "Reach", "Leads", "Authority", "Community Building"
- title: A specific, actionable title
- visualConcept: Detailed description of what to create (for Reels: what to show, record, text overlays; for Carousels: slide-by-slide outline; for Images: image concept and text overlay)
- hook: A compelling hook that grabs attention
- talkingPoints: 3-5 specific bullet points the creator should cover
- emotion: The selected emotion

The emotion should strongly influence the tone and style:
- Funny: Humorous hooks, relatable jokes
- Motivational: Action-oriented language, encouraging tone
- Emotional: Personal stories, human connection
- Professional: Authority-building content
- Inspirational: Uplifting and empowering messages
- Urgent: Time-sensitive, action-driven content
- Storytelling: Narrative-driven, engaging stories
- Happy: Cheerful, positive, uplifting
- Sad: Emotional, touching, relatable struggles
- Romantic: Love-focused, relationship content
- Educational: Informative, teaching-focused
- Default: Balanced, general appeal

Return the response in the following JSON format:
{
  "ideas": [
    {
      "postType": "Reel",
      "contentGoal": "Engagement",
      "title": "Show Your Process: How I Fix Common Client Mistakes",
      "visualConcept": "Record yourself working on your laptop, screen recording of you fixing a mistake, add text overlay 'Mistake #1', show before/after results",
      "hook": "Most creators make this mistake that costs them 50% of their engagement",
      "talkingPoints": ["Mistake #1: Ignoring analytics", "Mistake #2: Posting at wrong times", "Mistake #3: Not engaging with comments"],
      "emotion": "Educational"
    }
  ]
}

Ensure you generate exactly 5 unique, high-quality, actionable ideas with the specified mix (2 Reels, 2 Carousels, 1 Single Image). Return ONLY valid JSON, no additional text.`;

  try {
    const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
    }

    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
    }

    const parsedResponse: AIContentIdeasResponse = JSON.parse(jsonMatch[0]);

    if (!parsedResponse.ideas || parsedResponse.ideas.length !== 5) {
      throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
    }

    return parsedResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "AI generation is temporarily busy. Please try again in a few moments."
      ) {
        throw error;
      }
      throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
    }
    throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
  }
}

export async function generateCaption(request: AICaptionRequest): Promise<AICaptionResponse> {
  if (!checkRateLimit()) {
    throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
  }

  const apiKey = getGeminiApiKey();
  const prompt = `Generate an Instagram caption for the following content idea:

Title: ${request.title}
Hook: ${request.hook}
Post Type: ${request.postType}
Content Goal: ${request.contentGoal}
Talking Points: ${request.talkingPoints.join(", ")}
Niche: ${request.niche}
Target Audience: ${request.targetAudience}
Goal: ${request.goal}
Emotion: ${request.emotion}

The caption should strongly reflect the "${request.emotion}" emotion and the "${request.contentGoal}" content goal:
- Funny: Humorous, witty, include jokes
- Motivational: Encouraging, action-oriented, inspiring
- Emotional: Touching, personal, relatable
- Professional: Authoritative, expert tone
- Inspirational: Uplifting, empowering
- Urgent: Time-sensitive, action-driven
- Storytelling: Narrative-driven, engaging
- Happy: Cheerful, positive, uplifting
- Sad: Emotional, touching, relatable
- Romantic: Love-focused, relationship-oriented
- Educational: Informative, teaching-focused
- Default: Balanced, general appeal

Generate:
- caption: An engaging Instagram caption (2-4 sentences) that matches the emotion and goal
- cta: A clear call-to-action that matches the emotion and goal
- hashtags: 10-15 relevant hashtags (comma-separated)

Return the response in the following JSON format:
{
  "caption": "Your engaging caption here...",
  "cta": "Your call-to-action here...",
  "hashtags": ["hashtag1", "hashtag2", ...]
}

Return ONLY valid JSON, no additional text.`;

  try {
    const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
    }

    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
    }

    const parsedResponse: AICaptionResponse = JSON.parse(jsonMatch[0]);

    if (!parsedResponse.caption || !parsedResponse.cta || !parsedResponse.hashtags) {
      throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
    }

    return parsedResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "AI generation is temporarily busy. Please try again in a few moments."
      ) {
        throw error;
      }
      throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
    }
    throw new Error("AI generation is temporarily busy. Please try again in a few moments.");
  }
}
