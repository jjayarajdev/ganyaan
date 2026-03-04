export function getStorylineBlock(chapterId: string, unlockedCount: number, totalInsights: number): string | null {
  const act = getAct(unlockedCount, totalInsights);
  const storyline = STORYLINES[chapterId];
  if (!storyline) return null;

  const actInfo = storyline.acts[act - 1];
  if (!actInfo) return null;

  return `## CHAPTER STORYLINE:
You are weaving a story throughout this chapter to keep learning engaging and relatable.

**Story:** ${storyline.premise}
**Current Act (${act} of 3):** ${actInfo.title} — ${actInfo.description}

Weave the story naturally into your questions and examples. Reference the character by name. Don't force the story — use it when it fits the concept being taught. The student should feel like they're helping the character solve a real problem.`;
}

function getAct(unlockedCount: number, totalInsights: number): number {
  const ratio = unlockedCount / totalInsights;
  if (ratio < 0.33) return 1;
  if (ratio < 0.66) return 2;
  return 3;
}

interface StorylineAct {
  title: string;
  description: string;
}

interface Storyline {
  premise: string;
  acts: StorylineAct[];
}

const STORYLINES: Record<string, Storyline> = {
  'ch7-fractions': {
    premise: 'Riya is planning her birthday party and needs help with all the food and sharing!',
    acts: [
      {
        title: 'Cutting the Pizza',
        description: 'Riya ordered pizzas for her party. She needs to cut them into equal pieces and figure out how much each friend gets. Use pizza slicing, cake cutting, and juice pouring examples.',
      },
      {
        title: 'Comparing Portions',
        description: 'Riya wants to make sure everyone gets a fair share. Some friends want more pizza, some want cake. Help her compare different portions and figure out who got more. Use comparing slices, adding up leftover pieces.',
      },
      {
        title: 'The Leftovers',
        description: 'The party is over! Riya has leftover pizza and cake in mixed amounts (whole pieces plus parts). Help her figure out how much is left using mixed numbers and improper fractions.',
      },
    ],
  },
  'ch1-patterns': {
    premise: 'Arjun is building a beautiful tile mosaic for a school art competition and needs to understand patterns!',
    acts: [
      {
        title: 'Counting Tiles',
        description: 'Arjun is laying out tiles in rows and columns. He needs to figure out number patterns to know how many tiles he needs for each row. Use counting, sequences, and skip-counting examples.',
      },
      {
        title: 'Arranging the Mosaic',
        description: 'Arjun wants special shapes in his mosaic — squares and triangles. He needs to understand square numbers and triangular numbers to create perfect shapes. Use dot arrangements and stacking examples.',
      },
      {
        title: 'Designing the Border',
        description: 'Arjun is designing the border with repeating shape patterns and discovering how different number sequences relate to each other. Use shape repetition and sequence relationship examples.',
      },
    ],
  },
  'ch5-prime-time': {
    premise: 'Meera is organizing the school annual fair and needs to group things perfectly!',
    acts: [
      {
        title: 'Grouping the Stalls',
        description: 'Meera has items to arrange in equal groups for fair stalls. She needs to understand factors and multiples to divide things evenly. Use grouping, sharing equally, and arrangement examples.',
      },
      {
        title: 'Special Numbers',
        description: 'Meera discovers that some numbers of items can only be arranged in one way (prime numbers!). Help her find these special numbers and understand co-primes for pairing stalls.',
      },
      {
        title: 'Planning the Schedule',
        description: 'Meera needs to plan event timing using factorisation and divisibility rules. Help her find common schedules and check which time slots work for different events.',
      },
    ],
  },
};
