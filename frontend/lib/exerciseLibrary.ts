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
  ex("w-decdumbb", "Decline Dumbbell Press",   "kg", "chest", "dumbbell", "intermediate", ["15° decline","Palms forward","Drive up"], "Push", ["triceps","chest"]),
  ex("w-cablepres","Cable Chest Press",        "kg", "chest", "cable",    "beginner",     ["Mid-chest handle height","Press forward","Squeeze pecs"], "Push", ["triceps","frontDelt"]),
  ex("w-machinepres","Machine Chest Press",    "kg", "chest", "machine",  "beginner",     ["Back flat","Full ROM","Control eccentric"], "Push", ["triceps","frontDelt"]),
  ex("w-svpress",  "Svend Press",              "kg", "chest", "dumbbell", "intermediate", ["Squeeze plates together","Press straight out","Inner chest focus"], "Push", []),
  ex("w-dumbflye", "Dumbbell Flye",            "kg", "chest", "dumbbell", "beginner",     ["Flat bench","Soft elbows","Arc motion"], "Push", []),
  ex("w-lowcablefly","Low-to-High Cable Flye","kg", "upperChest", "cable","intermediate", ["Pulleys at bottom","Squeeze up and in","Upper chest focus"], "Push", ["frontDelt"]),
  ex("w-crossover","High Cable Crossover",     "kg", "chest", "cable",    "intermediate", ["Pulleys up high","Cross hands at bottom","Squeeze lower chest"], "Push", []),
  ex("w-weighteddip","Weighted Chest Dip",     "reps","chest","bodyweight","advanced",    ["Dip belt","Lean forward","Full depth"], "Push", ["triceps"]),
  ex("w-clapushup","Clap Push-up",             "reps","chest","bodyweight","intermediate",["Explode up","Soft landing","Body line"], "Push", ["triceps","core"]),
  ex("w-spiderman","Spiderman Push-up",        "reps","chest","bodyweight","intermediate",["Knee to elbow on push","Core braced"], "Push", ["obliques","triceps"]),
  ex("w-plyopushup","Plyometric Push-up",      "reps","chest","bodyweight","advanced",    ["Push hard enough to lift hands","Quick stretch reflex"], "Push", ["triceps"]),
  ex("w-jm",       "JM Press",                 "kg", "triceps","barbell","intermediate", ["Elbows over wrists","Press & extend","Skull crusher hybrid"], "Push", ["triceps"]),
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
  ex("w-kbrow",     "Kroc Row",                 "kg", "lats",       "dumbbell","advanced",     ["Heavy DB","Drive elbow up","Allow slight body english"], "Pull", ["biceps","upperBack"]),
  ex("w-meadowrow", "Meadows Row",              "kg", "lats",       "barbell", "intermediate", ["Single-arm landmine","Hinge deep","Pull to hip"], "Pull", ["biceps","upperBack"]),
  ex("w-widepull",  "Wide-grip Lat Pulldown",   "kg", "lats",       "cable",   "beginner",     ["Wide bar","Chest up","Squeeze lats at bottom"], "Pull", ["biceps","upperBack"]),
  ex("w-closepull", "Close-grip Lat Pulldown",  "kg", "lats",       "cable",   "beginner",     ["V-bar","Lean back slightly","Pull to sternum"], "Pull", ["biceps","upperBack"]),
  ex("w-straightarm","Straight-arm Pulldown",   "kg", "lats",       "cable",   "beginner",     ["Arms straight","Drive to thighs","Great lat isolator"], "Pull", []),
  ex("w-singledb",  "Single-arm Lat Pulldown",  "kg", "lats",       "cable",   "intermediate", ["One arm","Stretch at top","Pull to hip"], "Pull", ["biceps"]),
  ex("w-vtbar",     "V-T Bar Row",              "kg", "upperBack",  "machine", "beginner",     ["Chest on pad","Pull to chest","Squeeze scaps"], "Pull", ["biceps","lats"]),
  ex("w-chestsup",  "Chest-supported Row",      "kg", "upperBack",  "dumbbell","intermediate", ["Incline bench face-down","Elbows at 45°","No momentum"], "Pull", ["rearDelt","biceps"]),
  ex("w-sealcable", "Seal Row",                 "kg", "upperBack",  "dumbbell","intermediate", ["Chest on flat bench","Both arms","Hinge off table"], "Pull", ["biceps","rearDelt"]),
  ex("w-bentfly",   "Bent-over Reverse Flye",   "kg", "rearDelt",   "dumbbell","beginner",     ["Hinge 45°","T-fly","Light weight"], "Pull", ["upperBack"]),
  ex("w-bandpullap","Band Pull-apart",          "reps","upperBack","bands",   "beginner",     ["Band chest height","Pull apart","Squeeze scaps"], "Pull", ["rearDelt"]),
  ex("w-dbshrug",   "Dumbbell Shrug",           "kg", "traps",      "dumbbell","beginner",     ["Straight arms","Squeeze traps"], "Pull", ["forearms"]),
  ex("w-kbswing",   "Kettlebell Swing",         "reps","glutes",   "kettlebell","intermediate",["Hip drive","Brace core","Don't pull with arms"], "Hinge", ["hamstrings","core","lowerBack"]),
  ex("w-snatch",    "Snatch",                   "kg", "glutes",    "barbell", "advanced",     ["Explosive triple extension","Catch overhead","Full depth"], "Hinge", ["shoulders","traps","core"]),
  ex("w-cjerk",     "Clean & Jerk",             "kg", "glutes",    "barbell", "advanced",     ["Clean to shoulders","Jerk overhead","Elbows locked"], "Hinge", ["shoulders","quads","core"]),
  ex("w-powerclean","Power Clean",              "kg", "glutes",    "barbell", "advanced",     ["Triple extension","Catch 1/4 squat","Elbows high"], "Hinge", ["quads","traps","core"]),
  ex("w-landmine",  "Landmine T-Bar Row",       "kg", "lats",      "barbell", "intermediate", ["Landmine anchor","Straddle stance","Pull to hip"], "Pull", ["biceps","upperBack"]),
  ex("w-hypr",      "Back Extension (hyperext)","reps","lowerBack","machine", "beginner",     ["Padded hip","Hinge and extend","Weight optional"], "Hinge", ["glutes","hamstrings"]),
  ex("w-pullovdb",  "Dumbbell Pullover",        "kg", "lats",      "dumbbell","intermediate", ["Flat bench","Arms over chest","Arc over and back"], "Pull", ["chest","triceps"]),
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
  ex("w-ktapres",    "Kettlebell Press",        "kg", "shoulders","kettlebell","intermediate", ["KB racked","Press straight up","Lockout"], "Push", ["triceps","core"]),
  ex("w-landminepr", "Landmine Press",          "kg", "shoulders","barbell",  "intermediate", ["Bar in corner","Press at angle","Core tight"], "Push", ["triceps","core"]),
  ex("w-handstdb",   "Dumbbell Handstand Push-up","kg","shoulders","dumbbell","advanced",    ["Kick to wall","Dumbbell press","Strict form"], "Push", ["triceps","core"]),
  ex("w-cabllat",    "Cable Lateral Raise (unilateral)","kg","sideDelt","cable","beginner",  ["Cable across body","Raise to side","Light weight"], "Push", []),
  ex("w-bradel",     "Bradford Press",          "kg", "shoulders","barbell",  "intermediate", ["Press to forehead","Rotate head through","Hybrid press/raises"], "Push", ["triceps","frontDelt"]),
  ex("w-zpress",     "Z Press",                 "kg", "shoulders","barbell",  "advanced",     ["Seated on floor","Legs straight","Upright torso"], "Push", ["triceps","core"]),
  ex("w-deltmachine","Machine Lateral Raise",   "kg", "sideDelt", "machine",  "beginner",     ["Pad on elbow","Raise to shoulder","Control down"], "Push", []),
  ex("w-reardeltmach","Rear Delt Machine",      "kg", "rearDelt",  "machine",  "beginner",     ["Chest on pad","Drive elbows back","Squeeze"], "Pull", ["upperBack"]),
  ex("w-cablefacep", "Cable Face Pull (rope)",  "kg", "rearDelt",  "cable",    "beginner",     ["Rope attachment","Pull to forehead","External rotation"], "Pull", ["upperBack","traps"]),
  ex("w-trapraise",  "Trap 3 Raise",            "kg", "rearDelt",  "dumbbell", "intermediate", ["Hinge 45°","Raise 30° to side","Lower traps"], "Pull", []),
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
  ex("w-fatbcurl",    "Barbell Curl (EZ bar)",   "kg", "biceps",  "barbell",  "beginner",     ["EZ bar wrist-friendly","Elbows pinned"], "Pull", ["forearms"]),
  ex("w-preachdb",    "Preacher Curl (DB)",      "kg", "biceps",  "dumbbell", "intermediate", ["Bench supports","Full stretch at bottom"], "Pull", []),
  ex("w-spidercurl",  "Spider Curl",             "kg", "biceps",  "dumbbell", "intermediate", ["Chest on incline bench","Curl up","Full contraction"], "Pull", []),
  ex("w-cablecurl",   "Cable Curl",              "kg", "biceps",  "cable",    "beginner",     ["Constant tension","Elbows tight","Full ROM"], "Pull", ["forearms"]),
  ex("w-21curl",      "21s Curl",                "kg", "biceps",  "barbell",  "intermediate", ["7 half low, 7 half high, 7 full","Burn baby"], "Pull", ["forearms"]),
  ex("w-hammerrope",  "Rope Hammer Curl",        "kg", "forearms","cable",    "beginner",     ["Rope attachment","Thumbs up at top"], "Pull", ["biceps"]),
  ex("w-revcurl",     "Reverse Curl",            "kg", "forearms","barbell",  "beginner",     ["Overhand grip","Curl up","Wrist extensors"], "Pull", ["biceps"]),
  ex("w-wristcurl",   "Wrist Curl (palm up)",    "kg", "forearms","barbell",  "beginner",     ["Forearm on knee","Wrist only","Full flexion"], "Other", []),
  ex("w-revwrist",    "Wrist Curl (palm down)",  "kg", "forearms","barbell",  "beginner",     ["Forearm on knee","Wrist extension"], "Other", []),
  ex("w-tbohsingle",  "Single-arm Overhead Tri Extension","kg","triceps","dumbbell","intermediate",["One arm overhead","Elbows fixed","Full stretch"], "Push", []),
  ex("w-tbrope",      "Rope Triceps Pushdown",   "kg", "triceps", "cable",    "beginner",     ["Rope","Spread at bottom","Elbows tight"], "Push", []),
  ex("w-tbvbar",      "V-bar Triceps Pushdown",  "kg", "triceps", "cable",    "beginner",     ["V-bar","Press down","Lockout"], "Push", []),
  ex("w-trikickbk",   "Triceps Kickback",        "kg", "triceps", "dumbbell", "beginner",     ["Elbow high","Kick back fully","Light weight"], "Push", []),
  ex("w-tbclosegrip", "Close-grip Bench Press",  "kg", "triceps", "barbell",  "intermediate", ["Shoulder-width grip","Elbows tucked","Tricep focus"], "Push", ["chest","frontDelt"]),
  ex("w-boardpres",   "Board Press",             "kg", "triceps", "barbell",  "advanced",     ["2-board on chest","Partial press","Lockout strength"], "Push", ["chest"]),
  ex("w-pinhbench",   "Pin Press",               "kg", "triceps", "barbell",  "advanced",     ["Rack pins above chest","Dead-stop press","Lockout power"], "Push", ["chest","frontDelt"]),
  ex("w-tates",       "Tate Press",              "kg", "triceps", "dumbbell", "intermediate", ["Elbows flared","Press like a flye-press hybrid","Tricep isolator"], "Push", ["chest"]),
  ex("w-tricepdipw",  "Weighted Tricep Dip",     "reps","triceps","bodyweight","advanced",    ["Upright torso","Dip belt","Elbows back"], "Push", ["chest"]),
  ex("w-gripper",     "Gripper (hand trainer)","reps","forearms","dumbbell","intermediate", ["Set gripper","Close fully","Isometric hold at close"], "Other", []),
  ex("w-platepinch",  "Plate Pinch Carry",       "seconds","forearms","dumbbell","intermediate",["Two smooth plates together","Pinch hard","Walk"], "Carry", ["core"]),
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
  ex("w-zercher",     "Zercher Squat",          "kg", "quads",    "barbell",  "advanced",     ["Bar in crooks of elbows","Upright torso","Full depth"], "Squat", ["core","glutes","upperBack"]),
  ex("w-overheadsquat","Overhead Squat",        "kg", "quads",    "barbell",  "advanced",     ["Bar locked overhead","Upright torso","Deep squat"], "Squat", ["shoulders","core","glutes"]),
  ex("w-boxsquat",    "Box Squat",              "kg", "quads",    "barbell",  "intermediate", ["Box behind","Sit back","Pause then drive"], "Squat", ["glutes","hamstrings","core"]),
  ex("w-stepup",      "Step-up",                "reps","quads",   "dumbbell", "beginner",     ["Knee over toe","Drive through heel","Box height 30-50cm"], "Squat", ["glutes"]),
  ex("w-hipsling",    "Hip Abductor",           "kg", "glutes",   "machine",  "beginner",     ["Knees wide","Squeeze at top"], "Other", ["glutes"]),
  ex("w-hipadduct",   "Hip Adductor",           "kg", "legs",     "machine",  "beginner",     ["Legs in","Control out"], "Other", []),
  ex("w-kbgsquat",    "Kettlebell Goblet Squat","reps","quads",   "kettlebell","beginner",    ["KB at chest","Elbows inside knees"], "Squat", ["glutes","core"]),
  ex("w-sissy",       "Sissy Squat",            "reps","quads",   "bodyweight","intermediate",["Heels up","Knees forward","Body leaning back"], "Squat", []),
  ex("w-nordic",      "Nordic Curl",            "reps","hamstrings","bodyweight","advanced",  ["Anchor feet","Lower slowly","Use hands if needed"], "Hinge", []),
  ex("w-donkeyk",     "Donkey Calf Raise",      "reps","calves",  "machine",  "intermediate", ["Bent over","Heavy load","Full stretch at bottom"], "Other", []),
  ex("w-tipcalf",     "Single-leg Calf Raise",  "reps","calves",  "bodyweight","beginner",   ["One foot","Hold wall","Full ROM"], "Other", []),
  ex("w-jumplunge",   "Jump Lunge",             "reps","quads",   "bodyweight","intermediate",["Jump-switch","Soft landing","Explosive"], "Squat", ["glutes","cardio"]),
  ex("w-kbsumo",      "Kettlebell Sumo Deadlift","kg","glutes",  "kettlebell","beginner",   ["Wide stance","KB between feet","Hinge"], "Hinge", ["hamstrings"]),
  ex("w-hipthrustbar","Barbell Hip Thrust",     "kg", "glutes",   "barbell",  "intermediate", ["Upper back on bench","Bar on hips","Full extension"], "Hinge", ["hamstrings"]),
  ex("w-bridge",      "Glute Bridge",           "reps","glutes",  "bodyweight","beginner",   ["Lie on back","Hips high","Squeeze at top"], "Hinge", ["hamstrings","core"]),
  ex("w-curtsey",     "Curtsey Lunge",          "reps","glutes",  "dumbbell", "intermediate", ["Back leg crosses behind","Knee outside foot"], "Squat", ["quads"]),
  ex("w-cossack",     "Cossack Squat",          "reps","legs",    "bodyweight","intermediate",["Deep side-to-side","Keep other leg straight","Great mobility"], "Squat", ["quads","glutes"]),
  ex("w-wall",        "Wall Sit",               "seconds","quads","bodyweight","beginner",   ["Thighs parallel","Back flat on wall","Knees 90°"], "Isometric", ["glutes"]),
  ex("w-kbcarry",     "Suitcase Carry",         "seconds","core", "kettlebell","intermediate",["One-side load","No side-bend","Tall posture"], "Carry", ["forearms","obliques","core"]),
  ex("w-raiselegc",   "Leg Curl (seated)",      "kg", "hamstrings","machine", "beginner",     ["Seated","Legs curled","Squeeze"], "Hinge", []),
  ex("w-smithsquat",  "Smith Machine Squat",    "kg", "quads",    "machine",  "beginner",     ["Bar on traps","Feet forward a bit","Controlled descent"], "Squat", ["glutes"]),
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
  ex("w-vup",         "V-Up",                   "reps","abs",     "bodyweight","intermediate", ["Touch toes","Body V-shape","Legs straight"], "Other", []),
  ex("w-hangingwip",  "Hanging Windshield Wiper","reps","obliques","bodyweight","advanced", ["Hanging from bar","Legs side to side","No swing"], "Rotation", []),
  ex("w-heeltap",     "Heel Taps",              "reps","obliques","bodyweight","beginner",   ["Upper body off ground","Tap heels","Squeeze side abs"], "Rotation", []),
  ex("w-cablecrunch", "Cable Crunch",           "kg", "abs",     "cable",     "intermediate", ["Kneeling","Rope behind neck","Curl down"], "Other", []),
  ex("w-dragonflag",  "Dragon Flag",            "reps","abs",    "bodyweight","advanced",     ["Lie on bench","Body straight","Lower slowly"], "Other", ["core"]),
  ex("w-hollowrock",  "Hollow Rock",            "reps","abs",    "bodyweight","intermediate", ["Hollow position","Rock back/forth","Rounded lower back"], "Other", []),
  ex("w-superman",    "Superman Hold",          "seconds","lowerBack","bodyweight","beginner",["Face down","Arms & legs up","Glutes squeezed"], "Isometric", []),
  ex("w-plankjack",   "Plank Jack",             "reps","core",   "bodyweight","intermediate",["Plank position","Jump feet in/out","Core braced"], "Other", ["cardio"]),
  ex("w-mtbclimb",    "Mountain Climbers",      "reps","core",   "bodyweight","beginner",     ["Plank position","Drive knees fast","Hips low"], "Gait", ["cardio","quads"]),
  ex("w-bicycle",     "Bicycle Crunch",         "reps","obliques","bodyweight","beginner",  ["Elbow to opposite knee","Full extension on other side"], "Rotation", ["abs"]),
  ex("w-flutterkck",  "Flutter Kicks",          "seconds","abs", "bodyweight","beginner",   ["Legs 6 inches off ground","Small quick kicks"], "Other", []),
  ex("w-legraiseflr", "Lying Leg Raise",        "reps","abs",    "bodyweight","beginner",   ["On back","Legs up","No arching"], "Other", []),
  ex("w-garhammer",   "Garhammer Raise",        "reps","abs",    "bodyweight","advanced",   ["Hanging","Knees up then kick up","L-sit transition"], "Other", []),
  ex("w-kettlewind",  "Kettlebell Windmill",    "reps","obliques","kettlebell","advanced",  ["KB overhead","Hinge sideways","Eyes on KB"], "Rotation", ["shoulders","core"]),
  ex("w-turkgup",     "Turkish Get-up",         "reps","core",   "kettlebell","advanced",   ["KB overhead","Full stand sequence","Flow"], "Other", ["shoulders","core","glutes"]),
  ex("w-pallof",      "Pallof Press",           "kg", "obliques","cable",     "intermediate", ["Cable to side","Press forward","Resist rotation"], "Rotation", ["core"]),
  ex("w-hanginglegw","Hanging Leg Raise (weighted)","reps","abs","bodyweight","advanced", ["Dumbbell between feet","No swing"], "Other", []),
  ex("w-banana",      "Banana Hold",            "seconds","abs", "bodyweight","beginner",   ["Hollow body supine","Arms overhead","Feet off floor"], "Isometric", []),
  ex("w-plankupdown", "Plank Up/Down",          "reps","core",  "bodyweight","intermediate",["From elbows to hands alternate","Core braced"], "Other", ["chest","triceps"]),
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
  ex("w-fullplanche", "Full Planche",           "seconds","chest","bodyweight","advanced", ["Legs together","Full lean","Locked elbows"], "Isometric", ["shoulders","core"]),
  ex("w-frontlever",  "Front Lever",            "seconds","lats","bodyweight","advanced", ["Straight body horizontal","Depress scaps","Tight body"], "Isometric", ["core","biceps"]),
  ex("w-backlever",   "Back Lever",             "seconds","lats","bodyweight","advanced", ["Supinated grip","Keep body straight","Engage lats"], "Isometric", ["core"]),
  ex("w-tuckfront","Tuck Front Lever",          "seconds","lats","bodyweight","intermediate", ["Tuck legs","Straight back","Scaps depressed"], "Isometric", ["core"]),
  ex("w-tuckback","Tuck Back Lever",            "seconds","lats","bodyweight","intermediate", ["Tuck knees","Straight arms","Engage lats"], "Isometric", ["core"]),
  ex("w-hanginghs",   "Hanging L-sit to Handstand","reps","core","bodyweight","advanced", ["Pull feet up","Lever to invert","Press to handstand"], "Isometric", ["shoulders","lats"]),
  ex("w-pistol-hold", "Pistol Hold (bottom)",   "seconds","quads","bodyweight","intermediate", ["One leg squat bottom","Other leg forward","Hold balance"], "Isometric", ["glutes"]),
  ex("w-shrimp",      "Shrimp Squat",           "reps","quads","bodyweight","intermediate", ["Ankle behind","Knee tap floor","Upright torso"], "Squat", ["glutes","hamstrings"]),
  ex("w-wallwalk",    "Wall Walk",              "reps","shoulders","bodyweight","intermediate", ["Start push-up pos","Walk feet up wall","Chest to wall"], "Push", ["core","chest"]),
  ex("w-elbowlever",  "Elbow Lever",            "seconds","core","bodyweight","intermediate", ["Elbow into stomach","Balance body parallel","Gaze forward"], "Isometric", []),
  ex("w-frogstand",   "Frog / Crow Stand",      "seconds","shoulders","bodyweight","beginner", ["Knees on elbows","Lean forward","Balance"], "Isometric", ["core"]),
  ex("w-planchelean", "Planche Lean",           "seconds","chest","bodyweight","intermediate", ["Straight arms","Lean forward past wrists","Scaps protracted"], "Isometric", ["shoulders","core"]),
  ex("w-archerpull",  "Archer Pull-up",         "reps","lats","bodyweight","advanced", ["One arm straight, one pulling","Lower to straight side"], "Pull", ["biceps"]),
  ex("w-archerpush",  "Archer Push-up",         "reps","chest","bodyweight","intermediate", ["One arm straight out","Push with other arm"], "Push", ["triceps"]),
  ex("w-typewriter",  "Typewriter Push-up",     "reps","chest","bodyweight","advanced", ["Shift side to side at bottom","One arm bends, other straight"], "Push", ["triceps"]),
  ex("w-aztec",       "Aztec Push-up",          "reps","core","bodyweight","advanced", ["Explode up","Touch toes in air","Soft landing"], "Push", ["cardio"]),
  ex("w-maltese",     "Maltese",                "seconds","chest","bodyweight","advanced", ["Rings/floor wide","Lean way forward","Iron cross territory"], "Isometric", ["shoulders"]),
  ex("w-ironcross",   "Iron Cross",             "seconds","lats","bodyweight","advanced", ["Rings","Arms straight out","Full cross position"], "Isometric", ["chest","shoulders"]),
  ex("w-300secplank", "3-min Plank Challenge",  "seconds","core","bodyweight","intermediate", ["Accumulate 3 min plank","No sagging","Breathe"], "Isometric", []),
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
  ex("w-tri-sprint",  "Sprint Triathlon",       "seconds","cardio","cardio","advanced", ["Swim→Bike→Run","Quick transitions","Pace discipline"], "Gait"),
  ex("w-martial",     "Martial Arts / MMA",     "seconds","cardio","bodyweight","intermediate", ["Guard hands","Rotate hips","Breath control"], "Gait", ["core","shoulders"]),
  ex("w-dance",       "Dance / Zumba",          "seconds","cardio","cardio","beginner", ["Let loose","Stay on beat","Keep moving"], "Gait"),
  ex("w-rowkm",       "1k Row Time Trial",      "seconds","cardio","cardio","intermediate", ["First 500 fast","Hold pace","Empty the tank last 200m"], "Other", ["lats","legs"]),
  ex("w-row2k",       "2k Row",                 "seconds","cardio","cardio","advanced", ["Start fast","Settle 500m splits","Negative split mentally"], "Other", ["lats","legs"]),
  ex("w-burpeebroad", "Burpee Broad Jump",      "reps","cardio","bodyweight","advanced", ["Burpee then jump forward","Cover distance","Stay low"], "Other", ["quads","chest"]),
  ex("w-thruster",    "Thruster (barbell)",     "kg", "quads",  "barbell",  "intermediate", ["Front squat into press","One motion","Use legs"], "Squat", ["shoulders","glutes","triceps"]),
  ex("w-wallball",    "Wall Ball",              "reps","quads",  "dumbbell",  "intermediate", ["Squat deep","Throw ball 10ft","Catch & squat"], "Squat", ["shoulders","cardio"]),
  ex("w-kbthruster",  "Kettlebell Thruster",    "kg", "quads",  "kettlebell","intermediate", ["Rack at shoulders","Squat press","Explosive"], "Squat", ["shoulders","glutes"]),
  ex("w-bearcrawl",   "Bear Crawl",             "meters", "core", "bodyweight","beginner", ["Knees an inch off ground","Opposite hand/foot","Flat back"], "Gait", ["shoulders","core"]),
  ex("w-crabwalk",    "Crab Walk",              "meters", "triceps","bodyweight","beginner", ["Facing up","Hips high","Walk backward"], "Gait", ["shoulders","glutes"]),
  ex("w-battle",      "Battle Ropes",           "seconds","cardio","cardio","intermediate", ["Waves or slams","Full arm motion","Brace core"], "Other", ["shoulders","arms","core"]),
  ex("w-sledpush",    "Sled Push",              "meters", "quads", "machine",   "intermediate", ["Body forward into sled","High knees","Drive through forefoot"], "Carry", ["glutes","calves"]),
  ex("w-sledpull",    "Sled Pull",              "meters", "lats",  "machine",   "intermediate", ["Harness on waist","Pull backward","Long steps"], "Pull", ["biceps","glutes"]),
  ex("w-sandbag",     "Sandbag Shoulder",       "reps","glutes","sandbag",       "intermediate", ["Deadlift bag","Clean to shoulder","Alternate sides"], "Hinge", ["core","quads"]),
  ex("w-ttb",         "Toes to Bar",            "reps","abs",   "bodyweight","intermediate", ["Hanging","Feet to bar","Tight kip or strict"], "Other", ["core"]),
  ex("w-gorow",       "GHD Sit-up",             "reps","abs",   "machine",   "intermediate", ["Anchored feet","Touch floor behind","Explode up"], "Other", ["quads","core"]),
  ex("w-broomstick",  "Broomstick Mobility",    "seconds","other","misc","beginner", ["Pass over & behind","Keep arms straight","Shoulder opener"], "Other", ["shoulders"]),
  ex("w-foamroll",    "Foam Roll",              "seconds","other","foam-roll","beginner", ["Slow rolls","Pause on knots","30s per spot"], "Other"),
  ex("w-stepper",     "Stair Sprints",          "seconds","cardio","cardio","intermediate", ["Up fast","Walk down recovery","Maintain form"], "Gait", ["quads","glutes"]),
  ex("w-mobilityw",   "Mobility Flow (full body)","seconds","other","bodyweight","beginner", ["Cat-cow → world's greatest → down dog","Flow continuously"], "Other", ["core"]),
  ex("w-jumpropealt", "Jump Rope - Alt Foot",   "seconds","calves","bodyweight","intermediate", ["Alternate feet","Light on toes","Wrists turn"], "Other", ["cardio"]),
  ex("w-crawling",    "Crocodile Walk",         "meters", "chest","bodyweight","intermediate", ["Low push-up position","Knee to elbow on walk"], "Gait", ["core","triceps"]),
  ex("w-swimbreast",  "Swim - Breaststroke",    "meters", "cardio","cardio","beginner", ["Kick and glide","Breath on pull"], "Gait"),
  ex("w-swimbk",      "Swim - Backstroke",      "meters", "cardio","cardio","beginner", ["Float supine","Arms overhead alternate"], "Gait", ["lats"]),
  ex("w-swimbutter",  "Swim - Butterfly",       "meters", "cardio","cardio","advanced", ["Dolphin kick","Both arms over together","Undulate"], "Gait", ["chest","shoulders"]),
  ex("w-tabata",      "Tabata (20s on / 10s off)","seconds","cardio","bodyweight","intermediate", ["8 rounds","All-out bursts","Strict rest timing"], "Other"),
  ex("w-jumplungewt", "Weighted Jump Lunge",    "reps","quads",  "dumbbell",  "advanced", ["DBs held","Jump switch","Soft landings"], "Squat", ["cardio","glutes"]),
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
