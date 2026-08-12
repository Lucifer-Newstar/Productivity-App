/**
 * exerciseLibrary — curated default exercise database for Kaizen.
 *
 * ~120 exercises across calisthenics, barbell/dumbbell/cable/machine gym work,
 * and cardio. Each is tagged with a primary muscle (maps to the heatmap),
 * secondary muscles, equipment, level, movement pattern, and 2-4 form cues.
 *
 * IDs are stable strings so seeded PRs / routines keep linking up.  New
 * exercises added by users live in store alongside these.
 */

import type {
  WorkoutExercise, WorkoutUnit, MuscleGroup, Equipment, Level, MovementPattern,
} from "./types";

// Internal builder: keeps seed terse and guarantees every field is populated.
function ex(
  id: string,
  name: string,
  unit: WorkoutUnit,
  muscleGroup: MuscleGroup,
  equipment: Equipment,
  level: Level,
  cues: string[],
  pattern: MovementPattern,
  secondary: MuscleGroup[] = [],
  estimatedSetSeconds = 30,
): WorkoutExercise {
  return {
    id,
    name,
    unit,
    muscleGroup,
    secondaryMuscles: secondary,
    equipment,
    level,
    cues,
    pattern,
    estimatedSetSeconds,
    // createdAt is injected by the store seed using A.
    createdAt: 0,
  };
}

/* =============================================================
 *  CHEST
 * ============================================================= */
const CHEST: WorkoutExercise[] = [
  ex("w-bench",    "Barbell Bench Press",      "kg", "chest", "barbell",  "intermediate", ["Brace core","Elbows 45°","Drive through heels","Bar path diagonal"], "Push", ["triceps","frontDelt"]),
  ex("w-inbench",  "Incline Barbell Press",    "kg", "upperChest", "barbell", "intermediate", ["30° bench","Elbows tucked","Drive up"], "Push", ["frontDelt","triceps"]),
  ex("w-dbbench",  "Dumbbell Bench Press",     "kg", "chest", "dumbbell", "intermediate", ["Palms forward","Slight arc","Squeeze at top"], "Push", ["triceps","frontDelt"]),
  ex("w-inclinedb","Incline Dumbbell Press",   "kg", "upperChest", "dumbbell", "intermediate", ["30° incline","Palms neutral start","Press up & in"], "Push", ["frontDelt","triceps"]),
  ex("w-dips",     "Chest Dips",               "reps","chest", "bodyweight","intermediate", ["Lean forward","Elbows out","Stretch at bottom"], "Push", ["triceps","frontDelt"]),
  ex("w-pushup",   "Push-up",                  "reps","chest", "bodyweight","beginner", ["Body in a line","Elbows 45°","Squeeze chest"], "Push", ["triceps","core"]),
  ex("w-inpushup", "Incline Push-up",          "reps","chest", "bodyweight","beginner", ["Hands elevated","Controlled descent"], "Push", ["triceps"]),
  ex("w-decpushup","Decline Push-up",          "reps","upperChest", "bodyweight", "intermediate", ["Feet elevated","Elbows 45°"], "Push", ["triceps","frontDelt"]),
  ex("w-diamond",  "Diamond Push-up",          "reps","triceps","bodyweight","intermediate", ["Hands form diamond","Elbows tight"], "Push", ["chest","triceps"]),
  ex("w-flye",     "Cable Flye",               "kg", "chest", "cable",    "beginner", ["Slight elbow bend","Squeeze chest","Slow eccentric"], "Push", []),
  ex("w-pecdeck",  "Pec Deck",                 "kg", "chest", "machine",  "beginner", ["Chest up","Squeeze at contraction"], "Push", []),
  ex("w-wpushup",  "Wide Push-up",             "reps","chest", "bodyweight","intermediate", ["Wide hands","Stretch chest","Elbows out"], "Push", ["chest"]),
  ex("w-spoto",    "Spoto Press",              "kg", "chest", "barbell",  "advanced",     ["Pause 1cm off chest","No bounce","Tight upper back"], "Push", ["triceps","frontDelt"]),
];

/* =============================================================
 *  BACK
 * ============================================================= */
const BACK: WorkoutExercise[] = [
  ex("w-dead",      "Deadlift",                 "kg", "hamstrings", "barbell", "advanced",     ["Neutral spine","Bar close","Lift with legs"], "Hinge", ["glutes","lats","lowerBack","traps"]),
  ex("w-sumodead",  "Sumo Deadlift",            "kg", "glutes",     "barbell", "advanced",     ["Wide stance","Toes out","Upright torso"], "Hinge", ["quads","lats","traps"]),
  ex("w-row",       "Barbell Row",              "kg", "upperBack",  "barbell", "intermediate", ["Hinge 45°","Pull to hip","Squeeze scaps"], "Pull", ["lats","biceps","rearDelt"]),
  ex("w-pendlay",   "Pendlay Row",              "kg", "upperBack",  "barbell", "advanced",     ["Bar rests on floor","Explosive pull","Strict horizontal"], "Pull", ["lats","biceps"]),
  ex("w-dbrow",     "Single-arm Dumbbell Row",  "kg", "lats",       "dumbbell","intermediate", ["Bench support","Pull to hip","Stretch at bottom"], "Pull", ["biceps","upperBack"]),
  ex("w-tbarrow",   "T-Bar Row",                "kg", "upperBack",  "barbell", "intermediate", ["Chest up","Elbows tight","Squeeze scaps"], "Pull", ["lats","biceps"]),
  ex("w-cablerow",  "Cable Seated Row",         "kg", "lats",       "cable",   "beginner",     ["Chest tall","Pull to lower chest","Squeeze scaps"], "Pull", ["biceps","upperBack"]),
  ex("w-pulldown",  "Lat Pulldown",             "kg", "lats",       "cable",   "beginner",     ["Chest up","Pull to upper chest","Elbows down"], "Pull", ["biceps","upperBack"]),
  ex("w-pullover",  "Cable Pullover",           "kg", "lats",       "cable",   "beginner",     ["Arms slightly bent","Drive elbows down","Stretch lats"], "Pull", ["chest"]),
  ex("w-wpullup",   "Wide-grip Pull-up",        "reps","lats",      "bodyweight","intermediate",["Chest to bar","Squeeze lats","No kip"], "Pull", ["biceps","upperBack"]),
  ex("w-pullup",    "Pull-up",                  "reps","lats",      "bodyweight","intermediate",["Squeeze scapulae","Chest to bar","Full lockout"], "Pull", ["biceps","upperBack"]),
  ex("w-chinup",    "Chin-up (underhand)",      "reps","biceps",   "bodyweight","intermediate",["Supinated grip","Chest up","Full ROM"], "Pull", ["lats","upperBack"]),
  ex("w-australian","Australian Pull-up",      "reps","lats",      "bodyweight","beginner",    ["Feet on floor","Chest to bar","Keep body line"], "Pull", ["biceps","upperBack"]),
  ex("w-facepull",  "Face Pull",                "kg", "rearDelt",   "cable",   "beginner",     ["Pull to forehead","External rotate","Squeeze rear delts"], "Pull", ["upperBack","traps"]),
  ex("w-shrug",     "Barbell Shrug",            "kg", "traps",      "barbell", "beginner",     ["Shoulders to ears","No arm bend","Hold top 1s"], "Pull", ["forearms"]),
  ex("w-dbshrug",   "Dumbbell Shrug",           "kg", "traps",      "dumbbell","beginner",     ["Straight arms","Squeeze traps"], "Pull", ["forearms"]),
  ex("w-rackpull",  "Rack Pull",                "kg", "traps",      "barbell", "intermediate", ["Bar at knee height","Hinge","Finish tall"], "Hinge", ["glutes","lowerBack"]),
  ex("w-goodmorn",  "Good Morning",             "kg", "lowerBack",  "barbell", "intermediate", ["Soft knees","Hinge at hips","Neutral spine"], "Hinge", ["glutes","hamstrings"]),
];

/* =============================================================
 *  SHOULDERS
 * ============================================================= */
const SHOULDERS: WorkoutExercise[] = [
  ex("w-ohp",        "Overhead Press",          "kg", "shoulders","barbell",  "intermediate", ["Core tight","No back arch","Straight up"], "Push", ["frontDelt","triceps","upperChest"]),
  ex("w-pushpress",  "Push Press",              "kg", "shoulders","barbell",  "intermediate", ["Dip & drive","Legs help","Lockout strong"], "Push", ["quads","triceps","frontDelt"]),
  ex("w-dbohp",      "Dumbbell OHP",            "kg", "shoulders","dumbbell", "intermediate", ["Palms forward","Press straight up"], "Push", ["triceps","frontDelt"]),
  ex("w-arnold",     "Arnold Press",            "kg", "shoulders","dumbbell", "intermediate", ["Twist palms up","Full ROM","Squeeze at top"], "Push", ["triceps","frontDelt","sideDelt"]),
  ex("w-latraise",   "Lateral Raise",           "kg", "sideDelt",  "dumbbell", "beginner",     ["Slight elbow bend","Lead with elbows","Control eccentric"], "Push", ["sideDelt"]),
  ex("w-cablelat",   "Cable Lateral Raise",     "kg", "sideDelt",  "cable",    "intermediate", ["Cable across body","Raise to shoulder height"], "Push", ["sideDelt"]),
  ex("w-fraise",     "Front Raise",             "kg", "frontDelt", "dumbbell", "beginner",     ["Arms straight","Raise to shoulder","Thumb up for shoulder health"], "Push", ["frontDelt"]),
  ex("w-rearraise",  "Rear Delt Flye",          "kg", "rearDelt",  "dumbbell", "intermediate", ["Hinge 45°","Slight elbow bend","Squeeze rear delts"], "Pull", ["rearDelt","upperBack"]),
  ex("w-ys",         "Y-Raise",                 "kg", "rearDelt",  "dumbbell", "intermediate", ["Thumb up","Thumbs to ceiling","Light weight"], "Pull", ["lowerBack"]),
  ex("w-upright",    "Upright Row",             "kg", "sideDelt",  "barbell",  "intermediate", ["Wide grip","Elbows high","Raise to chin"], "Pull", ["traps","biceps"]),
];

/* =============================================================
 *  ARMS
 * ============================================================= */
const ARMS: WorkoutExercise[] = [
  ex("w-bicep",       "Barbell Curl",           "kg", "biceps",   "barbell",  "beginner", ["Elbows pinned","Full ROM","No swing"], "Pull", ["forearms"]),
  ex("w-dbcurl",      "Dumbbell Curl",          "kg", "biceps",   "dumbbell", "beginner", ["Supination at top","Control eccentric"], "Pull", ["forearms"]),
  ex("w-hammer",      "Hammer Curl",            "kg", "forearms", "dumbbell", "beginner", ["Neutral grip","Brachiallis focus","No swing"], "Pull", ["biceps"]),
  ex("w-preacher",    "Preacher Curl",          "kg", "biceps",   "barbell",  "intermediate", ["Bench supports","Stretch at bottom","No elbow lift"], "Pull", []),
  ex("w-concentra",   "Concentration Curl",     "kg", "biceps",   "dumbbell", "beginner", ["Elbow on inner thigh","Squeeze peak"], "Pull", []),
  ex("w-tbextend",    "Tricep Pushdown",        "kg", "triceps",  "cable",    "beginner", ["Elbows tight","Cable down","Full lockout"], "Push", []),
  ex("w-tboh",        "Overhead Tricep Extension","kg","triceps", "dumbbell", "beginner", ["Elbows by ears","Full stretch","Press up"], "Push", []),
  ex("w-skull",       "Skull Crusher",          "kg", "triceps",  "barbell",  "intermediate", ["Elbows fixed","Lower to forehead","Don't flare elbows"], "Push", []),
  ex("w-tricepdiptb", "Bench Tricep Dips",      "reps","triceps", "bodyweight","beginner", ["Hands on bench","Elbows straight back","No swinging"], "Push", ["chest"]),
  ex("w-zwrist",      "Wrist Curl",             "kg", "forearms", "dumbbell", "beginner", ["Forearm on knee","Wrist only","Squeeze at top"], "Pull", []),
  ex("w-farmer",      "Farmer's Carry",         "seconds","forearms","dumbbell","intermediate", ["Shoulders back","Tall posture","Grip hard"], "Carry", ["core","traps"]),
];

/* =============================================================
 *  LEGS
 * ============================================================= */
const LEGS: WorkoutExercise[] = [
  ex("w-squat",       "Back Squat",             "kg", "quads",    "barbell",  "intermediate", ["Chest up","Knees track toes","Drive through heels","Hip crease below knee"], "Squat", ["glutes","hamstrings","core"]),
  ex("w-frontsq",     "Front Squat",            "kg", "quads",    "barbell",  "advanced",     ["Bar on front shoulders","Elbows up","Torso upright"], "Squat", ["quads","core"]),
  ex("w-atzsquat",    "ATG Split Squat",        "kg", "quads",    "dumbbell", "advanced",     ["Back knee down","Front knee over toe","Upright torso"], "Squat", ["glutes","hamstrings"]),
  ex("w-lunge",       "Walking Lunge",          "reps","quads",   "dumbbell", "beginner",     ["Step long","Knee tracking toe","Drive through heel"], "Squat", ["glutes","hamstrings"]),
  ex("w-rdl",         "Romanian Deadlift",      "kg", "hamstrings","dumbbell","intermediate", ["Soft knees","Hinge at hips","Stretch hamstrings"], "Hinge", ["glutes","lowerBack"]),
  ex("w-hipthrust",   "Hip Thrust",             "kg", "glutes",   "barbell",  "intermediate", ["Upper back on bench","Full hip extension","Squeeze glutes"], "Hinge", ["hamstrings"]),
  ex("w-bulg",        "Bulgarian Split Squat",  "kg", "quads",    "dumbbell", "intermediate", ["Rear foot elevated","Knee tracks toe","Upright torso"], "Squat", ["glutes","hamstrings"]),
  ex("w-legext",      "Leg Extension",          "kg", "quads",    "machine",  "beginner",     ["Slow eccentric","No momentum"], "Squat", []),
  ex("w-legcurl",     "Lying Leg Curl",         "kg", "hamstrings","machine", "beginner",     ["Hips pinned","Squeeze at top","Controlled down"], "Hinge", []),
  ex("w-legpress",    "Leg Press",              "kg", "quads",    "machine",  "beginner",     ["Feet shoulder width","Knees tracking","Don't lock knees"], "Squat", ["glutes"]),
  ex("w-goblet",      "Goblet Squat",           "kg", "quads",    "kettlebell","beginner",    ["Dumbbell at chest","Elbows inside knees","Upright torso"], "Squat", ["glutes","core"]),
  ex("w-bwgsquat",    "Bodyweight Squat",       "reps","quads",   "bodyweight","beginner",    ["Hips back","Chest up","Depth below parallel"], "Squat", ["glutes"]),
  ex("w-pistol",      "Pistol Squat",           "reps","quads",   "bodyweight","advanced",    ["One leg","Other leg forward","Controlled descent"], "Squat", ["glutes","hamstrings","core"]),
  ex("w-calf",        "Standing Calf Raise",    "reps","calves",  "machine",  "beginner",     ["Full stretch at bottom","Raise high","Hold top 1s"], "Other", []),
  ex("w-seatcalf",    "Seated Calf Raise",      "reps","calves",  "machine",  "beginner",     ["Knees bent","Full ROM","Heavy hold"], "Other", []),
  ex("w-hack",        "Hack Squat",             "kg", "quads",    "machine",  "intermediate", ["Back on pad","Feet low for quads","Full depth"], "Squat", ["glutes"]),
  ex("w-sldl",        "Stiff-leg DL",           "kg", "hamstrings","barbell", "intermediate", ["Knees almost locked","Hinge deep","Stretch hams"], "Hinge", ["glutes","lowerBack"]),
  ex("w-gluteham",    "Glute-Ham Raise",        "reps","hamstrings","machine", "advanced",     ["Hinge on pad","Pull with hamstrings","No momentum"], "Hinge", ["glutes","lowerBack"]),
];

/* =============================================================
 *  CORE
 * ============================================================= */
const CORE: WorkoutExercise[] = [
  ex("w-plank",       "Plank",                  "seconds","abs", "bodyweight","beginner", ["Glutes squeezed","Neck neutral","Tight core"], "Isometric", ["core","obliques"]),
  ex("w-situp",       "Sit-up",                 "reps","abs",     "bodyweight","beginner", ["Feet anchored","Touch shoulders to knees"], "Other", []),
  ex("w-crunch",      "Crunch",                 "reps","abs",     "bodyweight","beginner", ["Lower back on floor","Squeeze abs","Short ROM"], "Other", []),
  ex("w-lraise",      "Hanging Leg Raise",      "reps","abs",     "bodyweight","intermediate", ["No swing","Legs straight","Lift with abs"], "Other", ["quads","core"]),
  ex("w-kraise",      "Hanging Knee Raise",     "reps","abs",     "bodyweight","beginner", ["Knees up","Pelvis tilt","No swing"], "Other", []),
  ex("w-russian",     "Russian Twist",          "reps","obliques","bodyweight","beginner", ["Lean back 45°","Twist from torso","Optional weight"], "Rotation", ["abs"]),
  ex("w-abwheel",     "Ab Wheel Rollout",       "reps","abs",     "machine",   "intermediate", ["Hips extended","Roll forward","Pull back"], "Other", ["core"]),
  ex("w-deadbug",     "Dead Bug",               "reps","core",    "bodyweight","beginner", ["Lower back flat","Opposite arm/leg","Breathe out"], "Other", []),
  ex("w-birdog",      "Bird Dog",               "reps","lowerBack","bodyweight","beginner", ["Extend opposite arm/leg","Hips level","No arching"], "Other", []),
  ex("w-sideplank",   "Side Plank",             "seconds","obliques","bodyweight","beginner", ["Body straight","Hips high"], "Isometric", []),
  ex("w-hollow",      "Hollow Body Hold",       "seconds","abs",  "bodyweight","intermediate", ["Lower back pressed","Legs & shoulders 6 inches","Squeeze core"], "Isometric", []),
  ex("w-windshield",  "Windshield Wipers",      "reps","obliques","bodyweight","advanced", ["Legs straight","Rotate hips","Shoulders on ground"], "Rotation", []),
  ex("w-woodchop",    "Cable Woodchop",         "kg", "obliques", "cable",     "intermediate", ["Rotate through torso","Arms straight","Hips pivot"], "Rotation", ["core"]),
  ex("w-lsit",        "L-Sit Hold",             "seconds","abs",  "bodyweight","advanced", ["Locked elbows","Hips high","Legs straight"], "Isometric", ["triceps","shoulders"]),
];

/* =============================================================
 *  CALISTHENICS / BODYWEIGHT SKILLS
 * ============================================================= */
const CALI: WorkoutExercise[] = [
  ex("w-muscleup",    "Bar Muscle-up",          "reps","lats",   "bodyweight","advanced", ["Explosive pull","Rotate elbows over","Press out"], "Pull", ["chest","triceps","shoulders"]),
  ex("w-ringmu",      "Ring Muscle-up",         "reps","lats",   "bodyweight","advanced", ["False grip","Aggressive pull","Press support"], "Pull", ["chest","triceps"]),
  ex("w-ringdip",     "Ring Dips",              "reps","chest",  "bodyweight","intermediate", ["Rings turned out at top","No flaring"], "Push", ["triceps"]),
  ex("w-handstand",   "Handstand Hold",         "seconds","shoulders","bodyweight","advanced", ["Fingers spread","Push tall","Tight core"], "Isometric", ["core","triceps"]),
  ex("w-hspu",        "Handstand Push-up",      "reps","shoulders","bodyweight","advanced", ["Handstand against wall","Elbows forward","Press up"], "Push", ["triceps","core"]),
  ex("w-tuckplanche", "Tuck Planche",           "seconds","chest","bodyweight","advanced", ["Lean forward","Shoulders over wrists","Hips high"], "Isometric", ["triceps","shoulders","core"]),
  ex("w-straddleplanche","Straddle Planche",    "seconds","chest","bodyweight","advanced", ["Legs split","Massive lean","Locked elbows"], "Isometric", ["shoulders","core"]),
  ex("w-frontlever",  "Front Lever",            "seconds","lats","bodyweight","advanced", ["Straight body horizontal","Depress scaps","Tight body"], "Isometric", ["core","biceps"]),
  ex("w-backlever",   "Back Lever",             "seconds","lats","bodyweight","advanced", ["Supinated grip","Keep body straight","Engage lats"], "Isometric", ["core"]),
];

/* =============================================================
 *  CARDIO
 * ============================================================= */
const CARDIO: WorkoutExercise[] = [
  ex("w-run5k",       "5k Run",                 "seconds","cardio","cardio","beginner", ["Easy pace","Steady breathing"], "Gait"),
  ex("w-run10k",      "10k Run",                "seconds","cardio","cardio","intermediate", ["Pace discipline","Even splits","Hydrate"], "Gait"),
  ex("w-longrun",     "Long Slow Distance Run", "seconds","cardio","cardio","intermediate", ["Conversational pace","Z2 heart rate","Fuel early"], "Gait"),
  ex("w-sprint",      "Sprint Intervals",       "meters", "cardio","cardio","intermediate", ["Full sprint","Walk recovery","Explosive"], "Gait"),
  ex("w-hillsprint",  "Hill Sprints",           "seconds","cardio","cardio","advanced", ["Power up hills","Walk down recovery","Short rest"], "Gait"),
  ex("w-bike",        "Cycling (outdoor)",      "meters", "cardio","cardio","beginner", ["Steady cadence","Slight resistance"], "Gait"),
  ex("w-erg",         "Rowing (erg)",           "meters", "cardio","cardio","intermediate", ["Legs -> back -> arms","Legs 60% of power"], "Other"),
  ex("w-swimfree",    "Swim - Freestyle",       "meters", "cardio","cardio","beginner", ["Rotating torso","Long strokes","Bilateral breathing"], "Gait"),
  ex("w-jumprope",    "Jump Rope",              "seconds","cardio","cardio","beginner", ["Wrists turn rope","Bounce on balls of feet","Small jumps"], "Other", ["calves"]),
  ex("w-du",          "Double-unders",          "reps",   "calves","bodyweight","intermediate", ["Higher jump","Faster wrists","Whip twice"], "Other", ["cardio","forearms"]),
  ex("w-burpee",      "Burpees",                "reps","cardio","bodyweight","intermediate", ["Chest to floor","Jump high","Breathing sync"], "Other", ["chest","legs","core"]),
  ex("w-boxjump",     "Box Jumps",              "reps","quads","bodyweight","intermediate", ["Two-foot takeoff","Soft landing","Full hip ext"], "Squat", ["glutes","cardio"]),
  ex("w-elliptical",  "Elliptical",             "seconds","cardio","cardio","beginner", ["Full leg drive","Arms push-pull"], "Gait"),
  ex("w-stairmaster", "StairMaster",            "seconds","cardio","cardio","beginner", ["Full steps","Don't rail-lean","Keep cadence"], "Gait", ["glutes","quads"]),
  ex("w-walk",        "Brisk Walk",             "meters", "cardio","cardio","beginner", ["Arms swinging","Heel-to-toe","Nose breathing"], "Gait"),
  ex("w-hike",        "Hiking",                 "meters", "cardio","cardio","beginner", ["Trekking poles on ascents","Even pace","Pack light"], "Gait", ["quads","glutes"]),
];

/* =============================================================
 *  Combine into a single ordered array
 * ============================================================= */
export const DEFAULT_EXERCISES: WorkoutExercise[] = [
  ...CHEST,
  ...BACK,
  ...SHOULDERS,
  ...ARMS,
  ...LEGS,
  ...CORE,
  ...CALI,
  ...CARDIO,
];

/* Re-export a simple lookup for routines/seeds that want to reference by id. */
export function findDefaultExercise(id: string): WorkoutExercise | undefined {
  return DEFAULT_EXERCISES.find((e) => e.id === id);
}
