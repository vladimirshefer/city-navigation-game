export interface Card {
  id: number;
  title?: string;
  type?: string;
  effect?: string;
  description?: string;
  backgroundImage?: string;
  points: number | null;
  isBlocking?: boolean;
  timerSeconds?: number;
}

export const SPECIAL_CARDS: Card[] = [
  {
    id: 1,
    title: 'Steal 10 coins',
    type: 'steal',
    description:
      'Steal 10 coins from another team. Ask whether they have at least 10; if not, take what they have.',
    effect:
      'Steal 10 coins from another team. Ask whether they have at least 10; if not, take what they have.',
    points: 10,
  },
  {
    id: 2,
    title: 'Steal 20 coins',
    type: 'steal',
    description:
      'Steal 20 coins from another team. Ask whether they have at least 20; if not, take what they have.',
    effect:
      'Steal 20 coins from another team. Ask whether they have at least 20; if not, take what they have.',
    points: 20,
  },
  {
    id: 3,
    title: 'Steal 30 coins',
    type: 'steal',
    description:
      'Steal 30 coins from another team. Ask whether they have at least 30; if not, take what they have.',
    effect:
      'Steal 30 coins from another team. Ask whether they have at least 30; if not, take what they have.',
    points: 30,
  },
];

const CHALLENGE_CARDS: Card[] = [
  {
    id: 5,
    title: 'Taste test',
    description:
      'Try one gummy bear with eyes closed, then state its flavour. You have 3 attempts to guess correctly.',
    points: 10,
  },
  {
    id: 6,
    title: 'Pfand challenge',
    description: 'Get a bottle of any beverage and get your Pfand back in a different district.',
    points: 15,
  },
  {
    id: 7,
    title: 'Cross the border',
    description:
      'Take any connection and cross the old East-West border. You may use this line for free for the rest of the game.',
    points: 0,
  },
  {
    id: 8,
    title: 'Flag spotter',
    description: 'Find a different country’s flag and name it correctly. You have 2 attempts.',
    points: 15,
  },
  {
    id: 9,
    title: 'Berlin Bears',
    description: 'Find 3 Berlin Bears and hug them all.',
    points: 15,
  },
  {
    id: 10,
    title: 'Ampelmännchen',
    description: 'Get a photo taken of you mimicking the pose of a nearby Ampelmännchen.',
    points: 5,
  },
  { id: 11, title: 'Doppeldecker bus', description: 'Spot a doppeldecker bus.', points: 5 },
  {
    id: 12,
    title: 'Foreign books',
    description:
      'Find a place that sells books that aren’t in German. Tourist guides do not count.',
    points: 5,
  },
  {
    id: 13,
    title: 'Football sticker',
    description: 'Find a sticker by either Hertha BSC or Union Berlin.',
    points: 5,
  },
  {
    id: 14,
    title: 'Berlin poem',
    description: 'Write a poem about your favourite park or building in Berlin.',
    points: 10,
  },
  {
    id: 15,
    title: 'Team logo',
    description: 'Spot a national team or club sports logo.',
    points: 5,
  },
  {
    id: 16,
    title: 'Berlin animal',
    description: 'Draw an animal that exists in Berlin.',
    points: 8,
  },
  {
    id: 17,
    title: 'Berliner eating',
    description: 'Eat a Berliner in less than one minute.',
    points: 5,
  },
  {
    id: 18,
    title: 'Fotoautomat photo',
    description: 'Take a funny photo at a Fotoautomat.',
    points: 10,
  },
  {
    id: 19,
    title: 'Street musician',
    description: 'Find a street musician and listen for one minute.',
    points: 5,
  },
  { id: 20, title: 'Stolperstein', description: 'Find a Stolperstein.', points: 5 },
  {
    id: 21,
    title: 'Berlin Wall',
    description: 'Find a piece or section of the Berlin Wall.',
    points: 5,
  },
  {
    id: 22,
    title: 'Street art',
    description: 'Find a mural or street art piece and record your team’s interpretation.',
    points: 5,
  },
  {
    id: 23,
    title: 'Animal statue',
    description: 'Find and photograph a statue of an animal.',
    points: 5,
  },
  {
    id: 24,
    title: 'Old car',
    description: 'Spot an old car, verifiably built before 1990.',
    points: 5,
  },
  {
    id: 25,
    title: 'Three bridges',
    description: 'Find three different bridges over water.',
    points: 5,
  },
  {
    id: 26,
    title: 'High-five stranger',
    description: 'Get a high-five or fist bump from a stranger.',
    points: 5,
  },
  {
    id: 27,
    title: 'Local recommendation',
    description:
      'Ask a Berliner about their favourite place in the city and find it. If you were there between game start and now, you win immediately. Simply seeing it suffices.',
    points: 10,
  },
  {
    id: 28,
    title: 'Building emblem',
    description: 'Photograph a building with a Berlin bear or eagle emblem on it.',
    points: 10,
  },
  {
    id: 29,
    title: 'Electric transport',
    description: 'Find three parked electric scooters and/or bicycles in one spot.',
    points: 5,
  },
  {
    id: 30,
    title: 'Famous street',
    description: 'Find a street named after a famous artist, scientist, or writer.',
    points: 5,
  },
  { id: 31, title: 'Boat wave', description: 'Wave at a boat and get a wave back.', points: 10 },
  {
    id: 32,
    title: 'Station map',
    description: 'Locate a stations map of Berlin and point to where you currently are.',
    points: 5,
  },
  {
    id: 33,
    title: 'Playground swing',
    description: 'Find a playground and swing on a swing for at least one minute.',
    points: 10,
  },
  {
    id: 34,
    title: 'Berlin postcard',
    description:
      'Write a touristy Berlin postcard with a nice message about the city. It may be posted later.',
    points: 10,
  },
  {
    id: 35,
    title: 'Fahrkarten bitte',
    description: 'When entering the next train, tram, or bus, say out loud “Fahrkarten bitte”.',
    points: 10,
  },
  {
    id: 36,
    title: 'Favourite German word',
    description: 'State your favourite German word and explain why.',
    points: 5,
  },
  {
    id: 37,
    title: 'Analog clock',
    description: 'Find an analog clock that you do not own and tell the time.',
    points: 5,
  },
  {
    id: 38,
    title: 'Coffee options',
    description: 'Locate a café and count the number of different coffee options.',
    points: 5,
  },
  { id: 39, title: 'Pet a dog', description: 'Pet a dog with the owner’s permission.', points: 5 },
  {
    id: 40,
    title: 'Unique bus line',
    description:
      'Find a bus stop sign with a unique letter, such as M or X, in the line name. You may use this line for free for the rest of the game.',
    points: 5,
  },
  {
    id: 41,
    title: 'International restaurant',
    description: 'Find a restaurant that offers non-German dishes and draw the country’s flag.',
    points: 5,
  },
  {
    id: 42,
    title: 'Queue spotting',
    description:
      'Find a location with people waiting in line to enter it. Briefly stand there too.',
    points: 5,
  },
  {
    id: 43,
    title: 'Bus number',
    description: 'Find a bus stop where a bus with a number above 200 departs.',
    points: 5,
  },
  {
    id: 44,
    title: 'Art pose',
    description:
      'Find a mural, graffiti, sticker, or statue and mimic the art’s pose or expression.',
    points: 5,
  },
  {
    id: 45,
    title: 'City sounds',
    description:
      'Record 5 distinctly different sounds of the city that are not just people talking.',
    points: 8,
  },
  {
    id: 46,
    title: 'TV tower direction',
    description:
      'Without consulting a map or phone, point in the direction of the TV tower. Confirm using any means necessary. You win if you are within 45°.',
    points: 8,
  },
  {
    id: 47,
    title: 'Street sign letters',
    description:
      'Read the nearest street sign and say all individual letters out loud in one breath. You have 2 attempts.',
    points: 5,
  },
  {
    id: 48,
    title: 'Languages around you',
    description:
      'Listen to the people around you. If you hear at least 5 different languages within the next hour, you win. You speaking or requesting others to speak does not count.',
    points: 8,
  },
  {
    id: 49,
    title: 'Cyclists counter',
    description:
      'Stand near a street or bike lane. Start a 1-minute countdown and count at least 10 cyclists passing you. You have 2 attempts.',
    points: 8,
  },
  {
    id: 50,
    title: 'Architectural styles',
    description:
      'Take a photo of two visible buildings that are clearly from 2 different periods or have 2 distinctly different architectural styles.',
    points: 5,
  },
  {
    id: 51,
    title: 'Distance guess',
    description:
      'Guess correctly whether you are closer to the Brandenburg Gate, TV Tower, or the state of Brandenburg. Confirm using a map app set to walking if in doubt.',
    points: 5,
  },
  {
    id: 52,
    title: 'Café laptops',
    description: 'Find a café and spot at least 3 customer laptops.',
    points: 5,
  },
  {
    id: 53,
    title: 'BVG vehicles',
    description:
      'Spot at least 7 BVG vehicles in the next minute. This challenge may not be postponed; the countdown starts after reading this.',
    points: 10,
  },
  {
    id: 54,
    title: 'Bench sitting',
    description: 'Find a bench and sit on it for a minute.',
    points: 8,
  },
  {
    id: 55,
    title: 'Schnappszahl',
    description: 'Say “Schnappszahl” out loud and research it if you do not know the word.',
    points: 5,
  },
  {
    id: 56,
    title: 'Temperature board',
    description: 'Find an information board that states the current temperature.',
    points: 5,
  },
  {
    id: 57,
    title: 'Bird tracking',
    description:
      'Spot a bird and track it by recording a video for 30 seconds. If it leaves your video frame for more than 2 seconds, you lose.',
    points: 8,
  },
  {
    id: 58,
    title: 'Living German',
    description: 'Name a famous German who is still alive and say why they are famous.',
    points: 5,
  },
  {
    id: 59,
    title: 'Historical German',
    description: 'Name a famous German who is no longer alive and say what they did.',
    points: 5,
  },
  {
    id: 60,
    title: 'Body of water',
    description: 'Name a body of water in Berlin. Online research is not permitted.',
    points: 3,
  },
  {
    id: 61,
    title: 'Berlin population',
    description: 'Guess the number of people in Berlin. You win if you are less than 50% off.',
    points: 5,
  },
  {
    id: 62,
    title: 'Green coverage',
    description:
      'Guess the percentage of Berlin covered by plants or water. You win if you are less than 20 percentage points off.',
    points: 5,
  },
  {
    id: 63,
    title: 'Light sources',
    description:
      'Count all light sources in the next minute and find at least 20. This challenge may not be postponed; the countdown starts after reading this.',
    points: 5,
  },
  {
    id: 64,
    title: 'Tall building',
    description: 'Find a building with more than 5 floors.',
    points: 5,
  },
  {
    id: 65,
    title: 'Non-Berlin plates',
    description: 'Find at least 3 car plates that show non-Berlin origins.',
    points: 5,
  },
  {
    id: 66,
    title: 'Pedestrian count',
    description:
      'Find a pedestrian traffic light. Decide on the starting time of your challenge. If at the next green phase there are at least 10 people crossing, you win.',
    points: 8,
  },
  {
    id: 67,
    title: 'Non-German sign',
    description: 'Find an official or hand-made sign that is not in German.',
    points: 5,
  },
  {
    id: 68,
    title: 'Bridge photo',
    description: 'Find a bridge and take a photo of what is underneath.',
    points: 5,
  },
  {
    id: 69,
    title: 'Beverage holder',
    description: 'Spot a person carrying a beverage, such as a bottle or mug.',
    points: 5,
  },
  {
    id: 70,
    title: 'Graffiti word',
    description:
      'Spot a graffiti word that is either English or German. It must not be an acronym.',
    points: 5,
  },
  {
    id: 71,
    title: 'Mirror selfie',
    description: 'Take a mirror selfie. Glass or metal fronts and water count too.',
    points: 5,
  },
  {
    id: 72,
    title: 'Non-pigeon animal',
    description: 'Spot an animal that is not a pigeon.',
    points: 5,
  },
  {
    id: 73,
    title: 'Same-letter streets',
    description: 'Find two intersecting streets whose names start with the same letter.',
    points: 5,
  },
  {
    id: 74,
    title: 'Building with flag',
    description: 'Spot a building with a flag on it.',
    points: 5,
  },
  {
    id: 75,
    title: 'Non-sports sticker',
    description: 'Spot a sticker that is not related to sports.',
    points: 5,
  },
  {
    id: 76,
    title: 'German or Berlin brand',
    description: 'Find a product or store with “German”, “Germany”, or “Berlin” in its name.',
    points: 5,
  },
  {
    id: 77,
    title: 'Transport modes',
    description: 'Take a picture of two or more transport modes in the same shot.',
    points: 5,
  },
  { id: 78, title: 'Number 9', description: 'Find the number 9 in real life.', points: 9 },
  {
    id: 79,
    title: 'Non-rectangular window',
    description: 'Spot a window that is not rectangular.',
    points: 5,
  },
  {
    id: 80,
    title: 'Colour hunt',
    description: 'Pick a colour and take photos of at least 10 different objects of that colour.',
    points: 8,
  },
  { id: 81, title: 'Cobblestone street', description: 'Find a cobblestone street.', points: 5 },
  { id: 82, title: 'Touch a tree', description: 'Touch a tree.', points: 5 },
  {
    id: 83,
    title: 'Silent minute',
    description:
      'With a teammate using a timer, close your eyes, silently count 1 minute, then say stop. You win if you are off by less than 7 seconds. You have 2 attempts.',
    points: 5,
  },
  {
    id: 84,
    title: 'Alphabetical store',
    description:
      'Find a store name where 3 consecutive letters appear in alphabetical order, such as the B, E, and R in “Barber”.',
    points: 5,
  },
  {
    id: 85,
    title: 'Coin flip',
    description: 'Flip a coin 3 times. You win if you get both sides at least once.',
    points: 5,
  },
  {
    id: 86,
    title: 'Two truths and a lie',
    description:
      'One teammate states 2 truths and 1 not overly suspicious lie about a Berlin sight. The other teammates identify the lie. Each teammate gets one attempt. Prior research is allowed.',
    points: 5,
  },
  {
    id: 87,
    title: 'Poetry challenge',
    description:
      'Write a poem about something you see. It must have a title, at least one actual rhyme, and 4 lines.',
    points: 8,
  },
  {
    id: 88,
    title: 'Animal sounds',
    description: 'Mimic the sound of 5 different animals.',
    points: 5,
  },
  {
    id: 89,
    title: 'Category master',
    description:
      'Name 10 different kinds in one category: flowers, Pokémon, car brands, European countries, or German cities.',
    points: 8,
  },
];

export const CHALLENGES: Card[] = CHALLENGE_CARDS.map((card) => ({
  ...card,
  backgroundImage: `/challenges/${card.id}.jpg`,
}));

export const CURSES: Card[] = [
  {
    id: 90,
    title: 'Train Roulette',
    description:
      'Leave your current mode of transport. Go to the next U-Bahn or S-Bahn station or bus stop and take the very next train or bus. You may leave only after seeing a different bus and a person wearing a hat or cap while aboard. Transport during this curse is free. If your line ends first, continue using the next mode of transportation from there.',
    points: 0,
    isBlocking: true,
  },
  {
    id: 91,
    title: 'Slow Down',
    description:
      'Leave your current mode of transport. For the next 20 minutes, you may only use buses and trams.',
    points: 0,
    isBlocking: false,
    timerSeconds: 1200,
  },
  {
    id: 92,
    title: 'Hurry Up',
    description:
      'Leave your current mode of transport. For the next 20 minutes, you may only use S- and U-Bahn.',
    points: 0,
    isBlocking: false,
    timerSeconds: 1200,
  },
  {
    id: 93,
    title: 'Cross the Wall',
    description:
      'Leave your current mode of transport. Reach the other side of the former wall or get within 7 kilometres of the Brandenburg border before continuing. Transport to reach the location is free.',
    points: 0,
    isBlocking: true,
  },
  {
    id: 94,
    title: 'Mamma Mia',
    description:
      'Leave your current mode of transport. Eat a pizza slice before continuing. If no pizza place is within 15 minutes, you may switch to another dish.',
    points: 0,
    isBlocking: true,
  },
  {
    id: 95,
    title: 'Lucky Flipper',
    description:
      'Leave your current mode of transport. Flip a coin 3 times and get the same side every time. If the streak is interrupted, restart.',
    points: 0,
    isBlocking: true,
  },
  {
    id: 96,
    title: 'Silent Tourist',
    description:
      'Leave your current mode of transport. Do not speak for the next 10 minutes. Reading this curse aloud is allowed. If you speak before the timer ends, restart it.',
    points: 0,
    isBlocking: true,
    timerSeconds: 600,
  },
  {
    id: 97,
    title: 'The Long Way',
    description:
      'Leave your current mode of transport. Before claiming your next district, walk around an entire block without crossing a street until you return to the same spot.',
    points: 0,
    isBlocking: true,
  },
  {
    id: 98,
    title: 'Big Brain Move',
    description:
      'Leave your current mode of transport. Do not use the BVG or DB app, or a map service, to decide which bus or train to enter next. Use only your knowledge and offline skills. The curse ends once you board and the vehicle departs.',
    points: 0,
    isBlocking: false,
  },
  {
    id: 99,
    title: 'Second Guesser',
    description:
      'Leave your current mode of transport. For the next 20 minutes, before entering a mode of transport, predict and flip a coin. If you guess wrong, choose a different vehicle or mode of transport.',
    points: 0,
    isBlocking: false,
    timerSeconds: 1200,
  },
];

export const ALL_CARDS: Card[] = [...SPECIAL_CARDS, ...CHALLENGES, ...CURSES];
