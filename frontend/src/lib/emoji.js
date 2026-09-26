// Picks a food emoji for a dish without a photo, based on words in its name/category.
const RULES = [
  [/chai|tea|coffee|kaapi/, '☕'],
  [/lassi|shake|milk|smoothie|juice|soda|lime|nimbu|drink|cola|water|sharbat|sherbet/, '🥤'],
  [/momo|dumpling|puri|golgappa|gol gappa|pani|samosa|kachori/, '🥟'],
  [/roll|wrap|frankie|shawarma|kathi/, '🌯'],
  [/pav|burger|bun|slider/, '🍔'],
  [/dosa|uttapam|crepe/, '🫓'],
  [/idli|vada|upma|south/, '🍘'],
  [/sandwich|toast/, '🥪'],
  [/pizza/, '🍕'],
  [/noodle|chowmein|chow mein|maggi|hakka|ramen/, '🍜'],
  [/fried rice|biryani|pulao|rice|khichdi/, '🍛'],
  [/thali|meal|combo/, '🍱'],
  [/paratha|roti|naan|kulcha|bread|bhature|chole/, '🫓'],
  [/chicken|tikka|kebab|kabab|tandoor|egg|mutton|fish|non-veg/, '🍗'],
  [/fries|chips|finger/, '🍟'],
  [/corn|bhutta/, '🌽'],
  [/ice cream|kulfi|falooda|sundae/, '🍨'],
  [/sweet|jalebi|gulab|halwa|dessert|cake|mithai|rabri|kheer/, '🍮'],
  [/salad|fruit|chaat|bhel|sev|papdi|tikki|dahi/, '🥗'],
  [/soup/, '🍲'],
];

export function foodEmoji(name = '', category = '') {
  const text = `${name} ${category}`.toLowerCase();
  const rule = RULES.find(([re]) => re.test(text));
  return rule ? rule[1] : '🍽️';
}

// Soft backgrounds for photo-less dishes; the same dish always gets the same one
const TILES = [
  'from-orange-100 to-amber-200',
  'from-rose-100 to-orange-200',
  'from-amber-100 to-yellow-200',
  'from-lime-100 to-emerald-200',
  'from-sky-100 to-indigo-200',
  'from-fuchsia-100 to-pink-200',
];

export function tileGradient(seed = '') {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TILES[hash % TILES.length];
}
