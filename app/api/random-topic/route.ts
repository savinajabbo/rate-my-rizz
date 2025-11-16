import { NextResponse } from 'next/server';
import { generateRandomDateTopic } from '@/lib/openai';

// Fallback topics list
const fallbackTopics = [
  'the ethics of time-travel tourism',
  'why humans love spicy food',
  'the psychology of fandoms',
  'how black holes evaporate',
  'the rise of ai-generated music',
  'the color "blue" in ancient languages',
  'why cats loaf',
  'the future of space mining',
  'the mandela effect',
  'the science of déjà vu',
  'how memes spread like viruses',
  'deep-sea gigantism',
  'the trolley problem but with self-driving cars',
  'quantum entanglement explained simply',
  'the history of swear words',
  'dreams vs. memory consolidation',
  'parallel universes theories',
  'why pastries taste better in europe',
  'how planes actually stay in the air',
  'the psychology of procrastination',
  'whether aliens would understand human music',
  'the future of brain–computer interfaces',
  'why some people crave horror',
  'how coral reefs communicate',
  'the mystery of dark matter',
  'the philosophy of consciousness',
  'cultural impacts of superhero films',
  'why we yawn',
  'micro-habits that change productivity',
  'origins of common idioms',
  'the future of renewable energy',
  'how languages evolve',
  'the science of attraction',
  'whether robots can be morally responsible',
  'the history of the calendar',
  'why we find certain sounds satisfying (asmr)',
  'how rockets land themselves (spacex!)',
  'genetic engineering ethics',
  'the allure of dystopian fiction',
  'why cities develop unique "vibes"',
  'the placebo effect',
  'how music tempo affects mood',
  'the physics of rainbows',
  'why toddlers ask "why" nonstop',
  'internet culture cycles',
  'the origins of conspiracy theories',
  'how coffee became a global obsession',
  'the limits of human memory',
  'why board games are making a comeback',
  'the psychology of collecting things'
];

function getRandomTopic(): string {
  const randomIndex = Math.floor(Math.random() * fallbackTopics.length);
  return fallbackTopics[randomIndex];
}

export async function GET() {
  console.log('Random topic API called');
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback topic');
      const topic = getRandomTopic();
      return NextResponse.json({ topic }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    console.log('Calling OpenAI to generate topic...');
    const topic = await generateRandomDateTopic();
    console.log('Generated topic:', topic);
    
    // Return with no-cache headers to prevent caching
    return NextResponse.json({ topic }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error generating random topic:', error);
    // Fall back to random topic from list
    const topic = getRandomTopic();
    return NextResponse.json({ topic }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
}
