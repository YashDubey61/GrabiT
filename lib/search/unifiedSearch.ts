import type { MockCanteen } from "@/lib/mock/campus";
import type { CampusFoodItem } from "@/lib/supabase/data";

export interface MatchingCanteenResult {
  canteen: MockCanteen;
  matchingFoodItems: CampusFoodItem[];
  score: number;
}

export interface UnifiedSearchResults {
  foodItems: CampusFoodItem[];
  canteens: MatchingCanteenResult[];
  hasResults: boolean;
}

/**
 * Common phonetic and synonym expansion dictionary for campus foods.
 * Maps common spelling variations and synonyms to normalized query roots.
 */
const SYNONYM_MAP: Record<string, string[]> = {
  maggi: ["maggie", "maggy", "magg", "meggi", "noodle", "noodles"],
  maggie: ["maggi", "maggy", "magg", "meggi", "noodle", "noodles"],
  magg: ["maggi", "maggie", "maggy", "meggi"],
  noodle: ["noodles", "maggi", "maggie", "chowmein"],
  noodles: ["noodle", "maggi", "maggie", "chowmein"],
  chai: ["tea", "chay", "kadak chai", "hot tea"],
  tea: ["chai", "chay", "green tea", "hot tea"],
  coffee: ["cold coffee", "coldcoffee", "kafi", "coffie", "cappuccino", "latte", "espresso"],
  "cold coffee": ["coffee", "coldcoffee", "beverage", "beverages"],
  burger: ["burgers", "burgir", "patty"],
  burgers: ["burger", "burgir"],
  pizza: ["pizzas"],
  pizzas: ["pizza"],
  sandwich: ["sandwiches", "sandwhich", "sandwitch", "toast", "grilled sandwich"],
  sandwiches: ["sandwich", "sandwhich", "sandwitch"],
  samosa: ["samosas", "smosa", "aloo samosa", "snack"],
  samosas: ["samosa", "smosa"],
  paneer: ["panir", "cottage cheese"],
  beverage: ["beverages", "drink", "drinks", "juice", "coffee", "tea", "chai"],
  beverages: ["beverage", "drink", "drinks", "juice", "coffee", "tea", "chai"],
  snack: ["snacks", "quick snacks", "fast food"],
  snacks: ["snack", "quick snacks", "fast food"],
  "quick snacks": ["snack", "snacks", "fast food"],
  meal: ["meals", "thali", "rice", "lunch", "dinner"],
  meals: ["meal", "thali", "rice", "lunch", "dinner"],
};

/**
 * Normalizes query string: trims, lowercases, removes non-alphanumeric noise.
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns expanded query tokens including direct words and synonyms.
 */
export function expandQueryTokens(normalized: string): string[] {
  const tokens = new Set<string>();
  if (!normalized) return [];

  tokens.add(normalized);

  // Add individual words
  const words = normalized.split(" ").filter(Boolean);
  words.forEach((w) => tokens.add(w));

  // Add known synonyms for the whole query and individual words
  if (SYNONYM_MAP[normalized]) {
    SYNONYM_MAP[normalized].forEach((s) => tokens.add(s));
  }

  words.forEach((w) => {
    if (SYNONYM_MAP[w]) {
      SYNONYM_MAP[w].forEach((s) => tokens.add(s));
    }
  });

  return Array.from(tokens);
}

/**
 * Calculates relevance score for a food item against query and expanded tokens.
 */
function scoreFoodItem(item: CampusFoodItem, rawQuery: string, tokens: string[]): number {
  const normQuery = normalizeQuery(rawQuery);
  if (!normQuery) return 0;

  const itemName = item.name.toLowerCase().trim();
  const canteenName = item.canteenName.toLowerCase().trim();
  const category = (item.category || "").toLowerCase().trim();
  const description = (item.description || "").toLowerCase().trim();

  let maxScore = 0;

  // 1. Exact match (Score: 100)
  if (itemName === normQuery) {
    return 100;
  }

  // 2. Starts with query (Score: 80)
  if (itemName.startsWith(normQuery)) {
    maxScore = Math.max(maxScore, 80);
  }

  // 3. Contains full normalized query (Score: 65)
  if (itemName.includes(normQuery)) {
    maxScore = Math.max(maxScore, 65);
  }

  // Check all query words contained in item name (e.g. "masala maggi" in "Special Masala Maggi")
  const queryWords = normQuery.split(" ").filter(Boolean);
  if (queryWords.length > 1 && queryWords.every((w) => itemName.includes(w))) {
    maxScore = Math.max(maxScore, 70);
  }

  // 4. Token & Synonym matches in item name (Score: 50 - 60)
  for (const token of tokens) {
    if (itemName === token) {
      maxScore = Math.max(maxScore, 60);
    } else if (itemName.includes(token)) {
      maxScore = Math.max(maxScore, 50);
    }
  }

  // 5. Canteen Name match (Score: 40)
  if (canteenName === normQuery || canteenName.includes(normQuery)) {
    maxScore = Math.max(maxScore, 40);
  } else {
    for (const token of tokens) {
      if (canteenName.includes(token)) {
        maxScore = Math.max(maxScore, 35);
      }
    }
  }

  // 6. Category match (Score: 30)
  if (category.includes(normQuery)) {
    maxScore = Math.max(maxScore, 30);
  } else {
    for (const token of tokens) {
      if (category.includes(token)) {
        maxScore = Math.max(maxScore, 25);
      }
    }
  }

  // 7. Description match (Score: 20)
  if (description.includes(normQuery)) {
    maxScore = Math.max(maxScore, 20);
  } else {
    for (const token of tokens) {
      if (description.includes(token)) {
        maxScore = Math.max(maxScore, 15);
      }
    }
  }

  return maxScore;
}

/**
 * Calculates relevance score for a stall/canteen.
 */
function scoreCanteen(
  canteen: MockCanteen,
  rawQuery: string,
  tokens: string[],
  canteenFoodMatches: CampusFoodItem[],
): number {
  const normQuery = normalizeQuery(rawQuery);
  if (!normQuery) return 0;

  const canteenName = canteen.name.toLowerCase().trim();
  const cuisineTags = (canteen.cuisineTags || "").toLowerCase().trim();

  let maxScore = 0;

  // 1. Exact stall name match
  if (canteenName === normQuery) {
    return 100;
  }

  // 2. Stall name starts with query
  if (canteenName.startsWith(normQuery)) {
    maxScore = Math.max(maxScore, 85);
  }

  // 3. Stall name contains query
  if (canteenName.includes(normQuery)) {
    maxScore = Math.max(maxScore, 70);
  }

  // 4. Token/synonym matches on stall name
  for (const token of tokens) {
    if (canteenName.includes(token)) {
      maxScore = Math.max(maxScore, 55);
    }
  }

  // 5. Cuisine tags match query
  if (cuisineTags.includes(normQuery)) {
    maxScore = Math.max(maxScore, 45);
  }

  // 6. Contains matching food items
  if (canteenFoodMatches.length > 0) {
    maxScore = Math.max(maxScore, 40);
  }

  return maxScore;
}

/**
 * Unified Search across food items and stall names.
 */
export function performUnifiedSearch(
  query: string,
  foodItems: CampusFoodItem[],
  canteens: MockCanteen[],
): UnifiedSearchResults {
  const normQuery = normalizeQuery(query);
  if (!normQuery) {
    return {
      foodItems: [],
      canteens: [],
      hasResults: false,
    };
  }

  const tokens = expandQueryTokens(normQuery);

  // 1. Filter and score food items
  const scoredFoodItems = foodItems
    .map((item) => ({
      item,
      score: scoreFoodItem(item, query, tokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.name.localeCompare(b.item.name);
    });

  const matchingFoodItems = scoredFoodItems.map((e) => e.item);

  // 2. Filter and score canteens
  const scoredCanteens = canteens
    .map((canteen) => {
      // Find food items belonging to this canteen that matched the search query
      const itemsInCanteen = matchingFoodItems.filter(
        (f) => f.canteenId === canteen.id,
      );
      const score = scoreCanteen(canteen, query, tokens, itemsInCanteen);

      // If stall name matched directly, also pull available dishes from this stall
      const featuredItems =
        itemsInCanteen.length > 0
          ? itemsInCanteen
          : foodItems.filter((f) => f.canteenId === canteen.id).slice(0, 3);

      return {
        canteen,
        matchingFoodItems: featuredItems,
        score,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    foodItems: matchingFoodItems,
    canteens: scoredCanteens,
    hasResults: matchingFoodItems.length > 0 || scoredCanteens.length > 0,
  };
}
