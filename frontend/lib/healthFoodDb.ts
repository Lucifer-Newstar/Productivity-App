/**
 * healthFoodDb — pre-seeded food library for the Health space.
 *
 * All values are ROUGH per typical serving — this is NOT a food-scale database,
 * it's an awareness tool so a 20yo lifter in Chennai can log in 2 taps. All
 * macros are grams per serving. Fiber included where known; other micros are
 * logged separately via the micronutrient radar (1-10 sliders), not per food.
 *
 * - South Indian breakfast staples
 * - Rice / roti / bread
 * - Dals & curries (veg)
 * - Non-veg curries & fry
 * - Biryanis & rice specials
 * - Tandoor / North Indian
 * - Street food / chaat / snacks
 * - Drinks (chai/filter coffee/lassi/coconut water)
 * - Sweets
 * - Western / gym staples
 * - Supplements (whey, creatine — tracked elsewhere but useful quick-add)
 *
 * Portions: "1 plate" = ~1 meal serving, "1 piece" = standard unit. Values are
 * averaged across fitliferegime / yourtrainer / morfresearch and general
 * restaurant-nutrition sources.
 */

export interface FoodEntry {
  id: string;
  name: string;
  /** typical serving label */
  serving: string;
  kcal: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  fibreG?: number;
  /** category tag */
  cat:
    | "breakfast-south"
    | "rice-bread"
    | "dal-veg"
    | "nonveg"
    | "biryani-rice"
    | "tandoor-north"
    | "street-chaat"
    | "drinks"
    | "sweets"
    | "western-gym"
    | "fruit-veg";
  /** tags for quick filtering: "veg"/"nonveg"/"high-protein"/"fried"/"dairy"/etc. */
  tags: string[];
}

export const FOOD_DB: FoodEntry[] = [
  // -------- South Indian breakfast --------
  { id: "idli",         name: "Idli (2 medium)",          serving: "2 pc (~80g)",     kcal: 85,  carbsG: 16, proteinG: 4,  fatG: 0.5, fibreG: 2, cat: "breakfast-south", tags: ["veg","breakfast"] },
  { id: "idli-sambar",  name: "Idli (2) + Sambar",         serving: "1 set",            kcal: 175, carbsG: 30, proteinG: 7,  fatG: 2,   fibreG: 3, cat: "breakfast-south", tags: ["veg","breakfast"] },
  { id: "dosa-plain",   name: "Plain Dosa",                serving: "1 medium",         kcal: 165, carbsG: 28, proteinG: 4,  fatG: 4,   fibreG: 2, cat: "breakfast-south", tags: ["veg","breakfast"] },
  { id: "dosa-masala",  name: "Masala Dosa",               serving: "1 with chutney",   kcal: 360, carbsG: 50, proteinG: 8,  fatG: 13,  fibreG: 3, cat: "breakfast-south", tags: ["veg","fried","breakfast"] },
  { id: "dosa-ghee",    name: "Ghee Roast Dosa",           serving: "1",                kcal: 420, carbsG: 50, proteinG: 7,  fatG: 20,  fibreG: 2, cat: "breakfast-south", tags: ["veg","fried"] },
  { id: "uttapam",      name: "Uttapam",                   serving: "1 with chutney",   kcal: 260, carbsG: 36, proteinG: 7,  fatG: 9,   fibreG: 3, cat: "breakfast-south", tags: ["veg"] },
  { id: "upma",         name: "Upma (rava)",               serving: "1 katori",         kcal: 200, carbsG: 35, proteinG: 5,  fatG: 5,   fibreG: 2, cat: "breakfast-south", tags: ["veg"] },
  { id: "pongal",       name: "Ven Pongal",                serving: "1 katori",         kcal: 240, carbsG: 36, proteinG: 6,  fatG: 8,   fibreG: 2, cat: "breakfast-south", tags: ["veg"] },
  { id: "vada",         name: "Medu Vada (2)",             serving: "2 pc",             kcal: 280, carbsG: 28, proteinG: 8,  fatG: 15,  fibreG: 3, cat: "breakfast-south", tags: ["veg","fried"] },
  { id: "vada-sambar",  name: "Vada Sambar",               serving: "2 vada + sambar",  kcal: 380, carbsG: 42, proteinG: 12, fatG: 18,  fibreG: 4, cat: "breakfast-south", tags: ["veg","fried"] },
  { id: "poori",        name: "Poori (3)",                 serving: "3 pc + curry",     kcal: 400, carbsG: 50, proteinG: 8,  fatG: 18,  fibreG: 3, cat: "breakfast-south", tags: ["veg","fried"] },
  { id: "appam-stew",   name: "Appam (2) + Ishtu",         serving: "1 set",            kcal: 320, carbsG: 45, proteinG: 8,  fatG: 12,  fibreG: 2, cat: "breakfast-south", tags: ["veg"] },
  { id: "idiyappam",    name: "Idiyappam (string hoppers)", serving: "3 pc + curry",    kcal: 280, carbsG: 45, proteinG: 6,  fatG: 8,   fibreG: 2, cat: "breakfast-south", tags: ["veg"] },
  { id: "adai",         name: "Adai (lentil dosa)",        serving: "2 pc",             kcal: 320, carbsG: 40, proteinG: 14, fatG: 11,  fibreG: 6, cat: "breakfast-south", tags: ["veg","high-protein"] },

  // -------- Rice / bread --------
  { id: "rice",         name: "White Rice (cooked)",       serving: "1 cup (185g)",     kcal: 240, carbsG: 53, proteinG: 4.5,fatG: 0.4, fibreG: 1, cat: "rice-bread", tags: ["veg","carb"] },
  { id: "rice-brown",   name: "Brown Rice (cooked)",       serving: "1 cup (195g)",     kcal: 215, carbsG: 45, proteinG: 5,  fatG: 1.8, fibreG: 4, cat: "rice-bread", tags: ["veg","carb","fiber"] },
  { id: "curd-rice",    name: "Curd Rice",                 serving: "1 katori (200g)",  kcal: 230, carbsG: 30, proteinG: 7,  fatG: 7,   fibreG: 1, cat: "rice-bread", tags: ["veg","dairy","probiotic"] },
  { id: "lemon-rice",   name: "Lemon Rice",                serving: "1 katori",         kcal: 240, carbsG: 38, proteinG: 4,  fatG: 8,   fibreG: 2, cat: "biryani-rice", tags: ["veg"] },
  { id: "tamarind-rice",name: "Puliyodarai / Tamarind Rice",serving: "1 katori",        kcal: 260, carbsG: 42, proteinG: 4,  fatG: 8,   fibreG: 3, cat: "biryani-rice", tags: ["veg"] },
  { id: "sambar-rice",  name: "Sambar Sadam",              serving: "1 plate",          kcal: 320, carbsG: 50, proteinG: 10, fatG: 8,   fibreG: 5, cat: "biryani-rice", tags: ["veg"] },
  { id: "jeera-rice",   name: "Jeera Rice",                serving: "1 katori",         kcal: 210, carbsG: 36, proteinG: 4,  fatG: 6,   fibreG: 1, cat: "biryani-rice", tags: ["veg"] },
  { id: "chapati",      name: "Chapati / Roti (no ghee)",  serving: "1 pc (40g)",       kcal: 105, carbsG: 18, proteinG: 3.5,fatG: 2,   fibreG: 3, cat: "rice-bread", tags: ["veg","carb"] },
  { id: "chapati-ghee", name: "Chapati with Ghee",         serving: "1 pc",             kcal: 140, carbsG: 18, proteinG: 3.5,fatG: 6,   fibreG: 3, cat: "rice-bread", tags: ["veg","dairy"] },
  { id: "parotta",      name: "Parotta (malabar)",         serving: "1 pc",             kcal: 210, carbsG: 30, proteinG: 4,  fatG: 8,   fibreG: 1, cat: "rice-bread", tags: ["veg","fried","carb"] },
  { id: "paratha-plain",name: "Plain Paratha",            serving: "1 pc",             kcal: 170, carbsG: 22, proteinG: 4,  fatG: 7,   fibreG: 2, cat: "rice-bread", tags: ["veg"] },
  { id: "aloo-paratha", name: "Aloo Paratha + curd",       serving: "1 + 50g curd",     kcal: 310, carbsG: 42, proteinG: 8,  fatG: 12,  fibreG: 4, cat: "rice-bread", tags: ["veg"] },
  { id: "naan-butter",  name: "Butter Naan",              serving: "1 piece",          kcal: 280, carbsG: 40, proteinG: 6,  fatG: 10,  fibreG: 2, cat: "tandoor-north", tags: ["veg","dairy"] },
  { id: "naan-plain",   name: "Plain Naan (tandoor)",     serving: "1",                kcal: 230, carbsG: 38, proteinG: 6,  fatG: 5,   fibreG: 2, cat: "tandoor-north", tags: ["veg"] },
  { id: "idiyappam2",   name: "Appam / Idiyappam",        serving: "see breakfast",    kcal: 0,   carbsG: 0,  proteinG: 0,  fatG: 0,   cat: "rice-bread", tags: [] }, // placeholder removed, dup
  { id: "dosa-egg",     name: "Egg Dosa / Egg Roll",      serving: "1",                kcal: 340, carbsG: 40, proteinG: 14, fatG: 13,  fibreG: 2, cat: "street-chaat", tags: ["nonveg"] },

  // -------- Dal & veg curries --------
  { id: "dal-tadka",    name: "Dal Tadka",                serving: "1 bowl",           kcal: 220, carbsG: 22, proteinG: 11, fatG: 8,   fibreG: 6, cat: "dal-veg", tags: ["veg","high-protein","plant-protein"] },
  { id: "dal-makhani",  name: "Dal Makhani",              serving: "1 bowl (200g)",    kcal: 340, carbsG: 26, proteinG: 13, fatG: 20,  fibreG: 5, cat: "tandoor-north", tags: ["veg","high-protein","dairy"] },
  { id: "sambar",       name: "Sambar (1 cup)",           serving: "1 katori",         kcal: 140, carbsG: 20, proteinG: 6,  fatG: 4,   fibreG: 4, cat: "dal-veg", tags: ["veg"] },
  { id: "rasam",        name: "Rasam",                    serving: "1 cup",            kcal: 80,  carbsG: 12, proteinG: 3,  fatG: 2,   fibreG: 3, cat: "dal-veg", tags: ["veg"] },
  { id: "rajma",        name: "Rajma Chawal",             serving: "1 plate",          kcal: 420, carbsG: 65, proteinG: 15, fatG: 10,  fibreG: 9, cat: "dal-veg", tags: ["veg","high-protein"] },
  { id: "chole",        name: "Chole / Chana Masala",     serving: "1 bowl",           kcal: 290, carbsG: 35, proteinG: 12, fatG: 11,  fibreG: 8, cat: "dal-veg", tags: ["veg","high-protein"] },
  { id: "palak-paneer", name: "Palak Paneer",             serving: "1 bowl",           kcal: 280, carbsG: 12, proteinG: 16, fatG: 20,  fibreG: 3, cat: "tandoor-north", tags: ["veg","high-protein","dairy"] },
  { id: "paneer-butter",name: "Paneer Butter Masala",     serving: "1 bowl (200g)",    kcal: 490, carbsG: 13, proteinG: 19, fatG: 40,  fibreG: 2, cat: "tandoor-north", tags: ["veg","high-protein","dairy","high-fat"] },
  { id: "aloo-gobi",    name: "Aloo Gobi",                serving: "1 bowl",           kcal: 180, carbsG: 22, proteinG: 5,  fatG: 8,   fibreG: 4, cat: "dal-veg", tags: ["veg"] },
  { id: "bhindi-masala",name: "Bhindi Masala",            serving: "1 bowl",           kcal: 190, carbsG: 16, proteinG: 5,  fatG: 12,  fibreG: 5, cat: "dal-veg", tags: ["veg"] },
  { id: "avial",        name: "Avial (mixed veg coconut)",serving: "1 bowl",           kcal: 240, carbsG: 16, proteinG: 5,  fatG: 17,  fibreG: 4, cat: "dal-veg", tags: ["veg"] },
  { id: "poriyal",      name: "Poriyal (stir-fry veg)",   serving: "1 cup",            kcal: 120, carbsG: 12, proteinG: 3,  fatG: 6,   fibreG: 4, cat: "dal-veg", tags: ["veg"] },
  { id: "kootu",        name: "Kootu (veg+dal)",          serving: "1 bowl",           kcal: 200, carbsG: 22, proteinG: 9,  fatG: 8,   fibreG: 5, cat: "dal-veg", tags: ["veg","high-protein"] },
  { id: "raita",        name: "Raita (cucumber)",         serving: "1 katori",         kcal: 85,  carbsG: 7,  proteinG: 4,  fatG: 4,   fibreG: 1, cat: "dal-veg", tags: ["veg","dairy","probiotic"] },
  { id: "kurma",        name: "Veg Kurma",                serving: "1 bowl",           kcal: 260, carbsG: 20, proteinG: 6,  fatG: 17,  fibreG: 3, cat: "dal-veg", tags: ["veg"] },

  // -------- Non-veg --------
  { id: "chicken-curry",name: "Chicken Curry (home)",     serving: "1 bowl (200g)",    kcal: 310, carbsG: 8,  proteinG: 28, fatG: 18,  fibreG: 2, cat: "nonveg", tags: ["nonveg","high-protein"] },
  { id: "chicken-65",   name: "Chicken 65",              serving: "6 pieces",         kcal: 340, carbsG: 10, proteinG: 26, fatG: 22,  fibreG: 1, cat: "nonveg", tags: ["nonveg","fried"] },
  { id: "chicken-tikka",name: "Chicken Tikka",           serving: "6 pieces (150g)",  kcal: 260, carbsG: 4,  proteinG: 35, fatG: 12,  fibreG: 0, cat: "tandoor-north", tags: ["nonveg","high-protein"] },
  { id: "butter-chicken",name: "Butter Chicken",         serving: "1 bowl (250g)",    kcal: 490, carbsG: 13, proteinG: 30, fatG: 35,  fibreG: 1, cat: "tandoor-north", tags: ["nonveg","high-fat"] },
  { id: "tandoori-chicken",name:"Tandoori Chicken (half)",serving: "½ chicken",       kcal: 460, carbsG: 4,  proteinG: 55, fatG: 22,  fibreG: 0, cat: "tandoor-north", tags: ["nonveg","high-protein"] },
  { id: "chicken-fry",  name: "Chicken Fry (South)",     serving: "3 pieces",         kcal: 320, carbsG: 8,  proteinG: 24, fatG: 22,  fibreG: 1, cat: "nonveg", tags: ["nonveg","fried"] },
  { id: "mutton-curry", name: "Mutton Curry",            serving: "1 bowl (200g)",    kcal: 380, carbsG: 8,  proteinG: 25, fatG: 28,  fibreG: 1, cat: "nonveg", tags: ["nonveg","high-fat"] },
  { id: "mutton-biryani",name: "Mutton Biryani",         serving: "1 plate (350g)",   kcal: 620, carbsG: 68, proteinG: 24, fatG: 28,  fibreG: 3, cat: "biryani-rice", tags: ["nonveg"] },
  { id: "fish-curry",   name: "Fish Curry / Meen Kuzhambu",serving:"1 bowl (200g)",    kcal: 260, carbsG: 8,  proteinG: 22, fatG: 15,  fibreG: 1, cat: "nonveg", tags: ["nonveg","omega3"] },
  { id: "fish-fry",     name: "Fish Fry (South)",        serving: "2 pieces (150g)",  kcal: 280, carbsG: 8,  proteinG: 25, fatG: 16,  fibreG: 0, cat: "nonveg", tags: ["nonveg","fried","omega3"] },
  { id: "prawn-masala", name: "Prawn / Eral Masala",     serving: "1 bowl",           kcal: 230, carbsG: 8,  proteinG: 25, fatG: 10,  fibreG: 0, cat: "nonveg", tags: ["nonveg","high-protein"] },
  { id: "egg-curry",    name: "Egg Curry (2 eggs)",      serving: "1 bowl",           kcal: 290, carbsG: 10, proteinG: 16, fatG: 20,  fibreG: 2, cat: "nonveg", tags: ["nonveg","high-protein"] },
  { id: "egg-bhurji",   name: "Egg Bhurji (2 eggs)",     serving: "with 2 roti side", kcal: 360, carbsG: 24, proteinG: 18, fatG: 20,  fibreG: 1, cat: "nonveg", tags: ["nonveg","high-protein"] },
  { id: "egg-boiled",   name: "Boiled Eggs",             serving: "2 large",          kcal: 155, carbsG: 1,  proteinG: 13, fatG: 11,  fibreG: 0, cat: "western-gym", tags: ["nonveg","high-protein"] },
  { id: "omelette",     name: "Omelette (2 eggs)",       serving: "with oil",         kcal: 220, carbsG: 2,  proteinG: 13, fatG: 18,  fibreG: 0, cat: "western-gym", tags: ["nonveg","high-protein"] },

  // -------- Biryani & rice specials --------
  { id: "veg-biryani",  name: "Veg Biryani",             serving: "1 plate (300g)",   kcal: 420, carbsG: 60, proteinG: 10, fatG: 14,  fibreG: 4, cat: "biryani-rice", tags: ["veg"] },
  { id: "chicken-biryani",name:"Chicken Biryani",        serving: "1 plate (350g)",   kcal: 560, carbsG: 65, proteinG: 24, fatG: 22,  fibreG: 3, cat: "biryani-rice", tags: ["nonveg"] },
  { id: "egg-biryani",  name: "Egg Biryani",             serving: "1 plate (350g)",   kcal: 510, carbsG: 65, proteinG: 18, fatG: 18,  fibreG: 3, cat: "biryani-rice", tags: ["nonveg"] },
  { id: "pulao-veg",    name: "Veg Pulao",               serving: "1 plate",          kcal: 320, carbsG: 50, proteinG: 7,  fatG: 10,  fibreG: 3, cat: "biryani-rice", tags: ["veg"] },
  { id: "fried-rice",   name: "Veg Fried Rice",          serving: "1 plate",          kcal: 400, carbsG: 58, proteinG: 8,  fatG: 14,  fibreG: 2, cat: "biryani-rice", tags: ["veg","fried"] },
  { id: "noodles-veg",  name: "Veg Hakka Noodles",       serving: "1 plate",          kcal: 420, carbsG: 58, proteinG: 9,  fatG: 16,  fibreG: 2, cat: "street-chaat", tags: ["veg","fried"] },
  { id: "noodles-chicken",name:"Chicken Noodles",        serving: "1 plate",          kcal: 510, carbsG: 58, proteinG: 20, fatG: 20,  fibreG: 2, cat: "street-chaat", tags: ["nonveg","fried"] },
  { id: "bisibelebath", name: "Bisi Bele Bath",          serving: "1 plate",          kcal: 440, carbsG: 66, proteinG: 12, fatG: 12,  fibreG: 6, cat: "biryani-rice", tags: ["veg"] },

  // -------- Street / chaat --------
  { id: "samosa",       name: "Samosa (2)",              serving: "2 pc",             kcal: 310, carbsG: 32, proteinG: 7,  fatG: 17,  fibreG: 3, cat: "street-chaat", tags: ["veg","fried"] },
  { id: "pani-puri",    name: "Pani Puri (6)",           serving: "6 pc",             kcal: 240, carbsG: 36, proteinG: 5,  fatG: 8,   fibreG: 3, cat: "street-chaat", tags: ["veg","fried"] },
  { id: "bhel-puri",    name: "Bhel Puri",               serving: "1 plate",          kcal: 250, carbsG: 38, proteinG: 6,  fatG: 8,   fibreG: 3, cat: "street-chaat", tags: ["veg"] },
  { id: "pav-bhaji",    name: "Pav Bhaji (2 pav+butter)",serving: "1 plate",          kcal: 600, carbsG: 70, proteinG: 12, fatG: 28,  fibreG: 5, cat: "street-chaat", tags: ["veg","high-fat"] },
  { id: "vadapav",      name: "Vada Pav",                serving: "1 pc",             kcal: 290, carbsG: 38, proteinG: 8,  fatG: 12,  fibreG: 2, cat: "street-chaat", tags: ["veg","fried"] },
  { id: "dabeli",       name: "Dabeli",                  serving: "1 pc",             kcal: 280, carbsG: 38, proteinG: 7,  fatG: 11,  fibreG: 2, cat: "street-chaat", tags: ["veg"] },
  { id: "kachori",      name: "Kachori (2)",             serving: "2 pc",             kcal: 350, carbsG: 34, proteinG: 7,  fatG: 20,  fibreG: 3, cat: "street-chaat", tags: ["veg","fried"] },
  { id: "bajji",       name: "Bajji / Pakora (6)",      serving: "6 pc",             kcal: 320, carbsG: 30, proteinG: 7,  fatG: 18,  fibreG: 3, cat: "street-chaat", tags: ["veg","fried"] },
  { id: "chicken-roll", name: "Kathi Roll (chicken)",    serving: "1",                kcal: 430, carbsG: 42, proteinG: 20, fatG: 19,  fibreG: 2, cat: "street-chaat", tags: ["nonveg"] },
  { id: "shawarma",     name: "Chicken Shawarma",        serving: "1 regular",        kcal: 530, carbsG: 48, proteinG: 28, fatG: 24,  fibreG: 2, cat: "street-chaat", tags: ["nonveg"] },
  { id: "burger",       name: "Chicken Burger (fast food)",serving:"1",                kcal: 480, carbsG: 45, proteinG: 22, fatG: 22,  fibreG: 2, cat: "street-chaat", tags: ["nonveg"] },
  { id: "pizza-slice",  name: "Pizza Slice (pepperoni)", serving: "1 large slice",    kcal: 380, carbsG: 38, proteinG: 15, fatG: 18,  fibreG: 2, cat: "street-chaat", tags: ["nonveg"] },
  { id: "fries",        name: "French Fries (medium)",   serving: "1 medium",         kcal: 380, carbsG: 48, proteinG: 5,  fatG: 18,  fibreG: 4, cat: "street-chaat", tags: ["veg","fried"] },

  // -------- Drinks --------
  { id: "water",        name: "Water",                   serving: "1 glass (250ml)",  kcal: 0,   carbsG: 0,  proteinG: 0,  fatG: 0,   cat: "drinks", tags: [] },
  { id: "coconut",      name: "Coconut Water",           serving: "1 tender/300ml",   kcal: 60,  carbsG: 12, proteinG: 2,  fatG: 0.5, fibreG: 3, cat: "drinks", tags: ["veg","electrolyte"] },
  { id: "filter-coffee",name: "Filter Coffee (with milk+sugar)", serving: "1 tumbler",kcal: 80,  carbsG: 12, proteinG: 2,  fatG: 2,   cat: "drinks", tags: ["veg","caffeine","dairy"] },
  { id: "chai",         name: "Chai (milk tea)",         serving: "1 cup (150ml)",    kcal: 70,  carbsG: 10, proteinG: 2,  fatG: 2,   cat: "drinks", tags: ["veg","caffeine","dairy"] },
  { id: "black-coffee", name: "Black Coffee",            serving: "1 cup",            kcal: 5,   carbsG: 0,  proteinG: 0,  fatG: 0,   cat: "drinks", tags: ["caffeine"] },
  { id: "lassi-sweet",  name: "Sweet Lassi",             serving: "1 glass (250ml)",  kcal: 200, carbsG: 25, proteinG: 8,  fatG: 7,   cat: "drinks", tags: ["veg","dairy","probiotic"] },
  { id: "lassi-salt",   name: "Salted Lassi / Buttermilk",serving:"1 glass",           kcal: 120, carbsG: 10, proteinG: 7,  fatG: 5,   cat: "drinks", tags: ["veg","dairy","probiotic","electrolyte"] },
  { id: "milk",         name: "Cow Milk",                serving: "1 cup (250ml)",    kcal: 160, carbsG: 12, proteinG: 8,  fatG: 8,   cat: "drinks", tags: ["veg","dairy","high-protein"] },
  { id: "juice-orange", name: "Orange Juice",            serving: "1 glass",          kcal: 120, carbsG: 28, proteinG: 2,  fatG: 0,   fibreG: 0, cat: "drinks", tags: ["veg"] },
  { id: "soda",         name: "Cola / Soft Drink",       serving: "330ml can",        kcal: 140, carbsG: 35, proteinG: 0,  fatG: 0,   cat: "drinks", tags: ["sugar"] },
  { id: "sports-drink", name: "Sports Drink (Gatorade)", serving: "500ml",            kcal: 130, carbsG: 32, proteinG: 0,  fatG: 0,   cat: "drinks", tags: ["electrolyte","sugar"] },
  { id: "ors",          name: "ORS / Electral",          serving: "1 sachet/1L",      kcal: 100, carbsG: 25, proteinG: 0,  fatG: 0,   cat: "drinks", tags: ["electrolyte"] },
  { id: "beer",         name: "Beer",                    serving: "1 pint (500ml)",   kcal: 200, carbsG: 15, proteinG: 2,  fatG: 0,   cat: "drinks", tags: ["alcohol","opt-in"] },
  { id: "whiskey",      name: "Whiskey / Rum",           serving: "60ml peg",         kcal: 140, carbsG: 0,  proteinG: 0,  fatG: 0,   cat: "drinks", tags: ["alcohol","opt-in"] },

  // -------- Sweets --------
  { id: "gulab-jamun",  name: "Gulab Jamun",             serving: "2 pc",             kcal: 300, carbsG: 45, proteinG: 5,  fatG: 10,  fibreG: 0, cat: "sweets", tags: ["veg","sugar"] },
  { id: "rasgulla",     name: "Rasgulla",                serving: "2 pc",             kcal: 230, carbsG: 40, proteinG: 5,  fatG: 5,   fibreG: 0, cat: "sweets", tags: ["veg","sugar"] },
  { id: "jalebi",       name: "Jalebi (100g)",           serving: "100g",             kcal: 400, carbsG: 60, proteinG: 4,  fatG: 16,  fibreG: 1, cat: "sweets", tags: ["veg","fried","sugar"] },
  { id: "mysore-pak",   name: "Mysore Pak",              serving: "2 pc",             kcal: 320, carbsG: 36, proteinG: 4,  fatG: 18,  fibreG: 1, cat: "sweets", tags: ["veg"] },
  { id: "laddu",        name: "Laddu (boondi)",          serving: "2 pc",             kcal: 380, carbsG: 50, proteinG: 6,  fatG: 17,  fibreG: 2, cat: "sweets", tags: ["veg"] },
  { id: "halwa",        name: "Halwa (sooji)",           serving: "1 small bowl",     kcal: 320, carbsG: 45, proteinG: 4,  fatG: 14,  fibreG: 1, cat: "sweets", tags: ["veg"] },
  { id: "ice-cream",    name: "Ice Cream (vanilla)",     serving: "1 scoop",          kcal: 180, carbsG: 22, proteinG: 4,  fatG: 9,   cat: "sweets", tags: ["veg","dairy","sugar"] },
  { id: "chocolate",    name: "Chocolate (dark)",        serving: "2 squares (20g)",  kcal: 110, carbsG: 10, proteinG: 1,  fatG: 7,   cat: "sweets", tags: ["veg"] },

  // -------- Western / gym staples --------
  { id: "oats",         name: "Oats Porridge (in milk)", serving: "1 bowl",           kcal: 280, carbsG: 40, proteinG: 14, fatG: 7,   fibreG: 6, cat: "western-gym", tags: ["veg","fiber"] },
  { id: "peanut-butter",name: "Peanut Butter (whole-grain toast)",serving:"2 slices",  kcal: 350, carbsG: 35, proteinG: 14, fatG: 17,  fibreG: 5, cat: "western-gym", tags: ["veg","high-fat"] },
  { id: "chicken-breast",name:"Grilled Chicken Breast",  serving: "150g",             kcal: 245, carbsG: 0,  proteinG: 46, fatG: 5,   fibreG: 0, cat: "western-gym", tags: ["nonveg","high-protein"] },
  { id: "whey",         name: "Whey Protein Shake",      serving: "1 scoop (30g)",    kcal: 120, carbsG: 3,  proteinG: 24, fatG: 1.5, cat: "western-gym", tags: ["supplement","high-protein","dairy"] },
  { id: "creatine",     name: "Creatine monohydrate",    serving: "5g",               kcal: 0,   carbsG: 0,  proteinG: 0,  fatG: 0,   cat: "western-gym", tags: ["supplement"] },
  { id: "tuna",         name: "Canned Tuna (in water)",  serving: "1 can (165g)",     kcal: 190, carbsG: 0,  proteinG: 42, fatG: 1,   fibreG: 0, cat: "western-gym", tags: ["nonveg","high-protein","omega3"] },
  { id: "greek-yogurt", name: "Greek Yogurt",            serving: "150g",             kcal: 130, carbsG: 8,  proteinG: 17, fatG: 3,   cat: "western-gym", tags: ["veg","high-protein","dairy","probiotic"] },
  { id: "banana",       name: "Banana (medium)",         serving: "1 (120g)",         kcal: 105, carbsG: 27, proteinG: 1.3,fatG: 0.4, fibreG: 3, cat: "fruit-veg",   tags: ["veg","fruit","potassium"] },
  { id: "apple",        name: "Apple (medium)",          serving: "1 (180g)",         kcal: 95,  carbsG: 25, proteinG: 0.5,fatG: 0.3, fibreG: 4, cat: "fruit-veg",   tags: ["veg","fruit","fiber"] },
  { id: "dates",        name: "Dates (5)",               serving: "5 pc",             kcal: 115, carbsG: 30, proteinG: 1,  fatG: 0,   fibreG: 3, cat: "fruit-veg",   tags: ["veg","fruit","potassium"] },
  { id: "almonds",      name: "Almonds (handful)",       serving: "30g (~23)",        kcal: 180, carbsG: 6,  proteinG: 6,  fatG: 15,  fibreG: 3, cat: "fruit-veg",   tags: ["veg","fats"] },
  { id: "peanuts",      name: "Peanuts (roasted)",       serving: "30g",              kcal: 170, carbsG: 5,  proteinG: 7,  fatG: 14,  fibreG: 2, cat: "fruit-veg",   tags: ["veg","fats"] },
  { id: "walnuts",      name: "Walnuts (30g)",           serving: "30g",              kcal: 195, carbsG: 4,  proteinG: 4.5,fatG: 20, fibreG: 2, cat: "fruit-veg",   tags: ["veg","fats","omega3"] },
  { id: "protein-bar",  name: "Protein Bar",             serving: "1 (60g)",          kcal: 230, carbsG: 24, proteinG: 20, fatG: 7,   fibreG: 3, cat: "western-gym", tags: ["supplement"] },
  { id: "paneer-raw",   name: "Paneer (raw/grilled)",    serving: "100g",             kcal: 265, carbsG: 3,  proteinG: 18, fatG: 20,  fibreG: 0, cat: "western-gym", tags: ["veg","high-protein","dairy"] },
  { id: "sprouts",      name: "Sprouts Salad (moong)",   serving: "1 bowl (150g)",    kcal: 110, carbsG: 18, proteinG: 10, fatG: 0.8, fibreG: 5, cat: "fruit-veg",   tags: ["veg","high-protein","plant-protein"] },
];

/** Get food by id (case-insensitive). */
export function getFood(id: string): FoodEntry | undefined {
  return FOOD_DB.find(f => f.id === id);
}

/** Search by name fragment, case-insensitive. Returns up to `limit`. */
export function searchFoods(q: string, limit = 20): FoodEntry[] {
  if (!q) return FOOD_DB.slice(0, limit);
  const ql = q.toLowerCase();
  return FOOD_DB.filter(f => f.name.toLowerCase().includes(ql)).slice(0, limit);
}

export const FOOD_CATEGORIES: { id: FoodEntry["cat"]; label: string }[] = [
  { id: "breakfast-south", label: "South Indian Breakfast" },
  { id: "rice-bread",      label: "Rice &amp; Bread" },
  { id: "dal-veg",         label: "Dal &amp; Veg Curries" },
  { id: "nonveg",          label: "Non-Veg Curries &amp; Fry" },
  { id: "biryani-rice",    label: "Biryani &amp; Rice Specials" },
  { id: "tandoor-north",   label: "Tandoor &amp; North Indian" },
  { id: "street-chaat",    label: "Street Food &amp; Chaat" },
  { id: "drinks",          label: "Drinks" },
  { id: "sweets",          label: "Sweets" },
  { id: "western-gym",     label: "Gym &amp; Western Staples" },
  { id: "fruit-veg",       label: "Fruit, Nuts &amp; Raw" },
];
