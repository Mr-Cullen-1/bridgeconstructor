export const en = {
  brand: "Bridge Master",
  academy: "JUNIOR · GAMELAB",
  edition: "BUILD. TEST. DISCOVER.",
  workshop: "Builders' workshop",
  levelProgress: "Progress through levels",
  remaining: "Material left",
  yourGoal: "TODAY'S MISSION",
  goalBody:
    "Connect the two banks. Build a strong bridge and get the car to the finish.",
  keyboardHint: "Ctrl + Z — undo · Delete — remove",
  sceneTitle: "Building site",
  sceneDetail: "Connect the points. Test your idea.",
  nextStep: "NEXT STEP",
  buildFeedback: "LET'S ADJUST A BIT",
  adventureStart: "THE ADVENTURE STARTS HERE",
  buildTools: "BUILDING TOOLS",
  toolDescriptions: {
    road: "For the car to drive on",
    support: "To hold the bridge up",
  },
  leave: "Back",
  toolShort: { undo: "Undo", remove: "Remove", redo: "Redo" },
  yourJourney: "EVERY LEVEL — A NEW IDEA.",
  previousPage: "Previous page",
  nextPage: "Next page",
  levelPages: "Level pages",
  currentLevel: "Current",
  levelComplete: "LEVEL COMPLETE",
  tryAgain: "EVERY TRY — NEW EXPERIENCE",
  activeTime: "Active time",
  seconds: "sec",
  collection: "Engineering adventure",
  worldName: "ALPINE VALLEY · BUILD. TEST. DISCOVER.",
  webglError:
    "The 3D scene could not be opened. Turn on hardware acceleration in your browser and reload the page.",
  subtitle: "Every great bridge starts with a first beam.",
  level: "Level",
  levels: "Levels",
  material: "Material",
  materialLabel: "Material used",
  target: "3-star target",
  road: "Road",
  support: "Support",
  undo: "Undo last action",
  remove: "Remove selected segment",
  redo: "Redo the undone step",
  test: "Test the bridge",
  pause: "Pause",
  resume: "Resume",
  soundOn: "Turn sound on",
  soundOff: "Turn sound off",
  start: "Start building",
  next: "Next level",
  replay: "Play again",
  retry: "Improve the bridge",
  exit: "Exit the game",
  close: "Close",
  introTitle: "Little builder, big ideas.",
  introBody:
    "Connect the points, build a bridge and drive the car to the other bank.",
  introSteps: [
    "Pick the first point",
    "Connect it to the next point",
    "Test the finished bridge",
  ],
  paused: "Take a short break?",
  pausedBody: "Your bridge is right here. We'll continue when you're ready.",
  success: "Great bridge!",
  successBody: "The car reached the finish. You did it!",
  failed: "There's another solution!",
  failedBody:
    "The marked spot is weak. Add a triangle support and test again.",
  failureReasons: {
    roadGap:
      "The car couldn't cross where the road breaks. Continue the road and try again.",
    noSupport:
      "Not enough support — the bridge couldn't carry the load. Add supports and try again.",
  },
  score: "Score",
  stability: "Strength",
  attempts: "Attempt",
  used: "Used",
  hintFirst: "Tap point A, then point B.",
  hintNext: "Keep building the road — connect neighbouring points.",
  hintTest: "The road is ready! Now test the bridge.",
  hintSupport:
    "Build the road. In Support mode, connect the upper points.",
  levelHints: {
    "bridge-04":
      "You don't have to use points B and D. Road: A–C, C–E. Support: A–F, C–F, E–F. Don't route the road through B and D — otherwise they need supports too.",
    "bridge-06":
      "Connect the inner points of the sloping road to the upper support as well.",
    "bridge-07":
      "Point F is below the road. Triangles built from below strengthen the bridge too.",
    "bridge-08":
      "Make triangles along the rising and falling parts of the road.",
    "bridge-09":
      "Don't forget to connect the lowest road point to the upper support.",
    "bridge-10":
      "F helps the left half, G helps the right half. The middle point can link both supports.",
    "bridge-11":
      "Supports don't have to be at the same height. Strengthen every part of the road.",
    "bridge-12":
      "Roads A–B and D–E are already built. They don't cost your material; build the middle and the supports.",
    "bridge-13":
      "Use the two lower supports to join the left and right halves of the bridge.",
    "bridge-14":
      "Long segments are limited. Use neighbouring road points and nearby supports.",
    "bridge-15":
      "The outer supports hold the banks, and the middle one unites the central road.",
    "bridge-16":
      "The central node G is low. Strengthen the middle of the pass from below and both ends from above.",
    "bridge-17":
      "Supports A–F and E–H are already built. Connect the remaining road points to that system.",
    "bridge-18":
      "Put every road segment into a triangle. There is little material for extra supports.",
    "bridge-19":
      "You don't need every node. Skip B and D and try a shorter support system through H.",
    "bridge-20":
      "Bring together what you've learned: three supports, a complete road and an exact plan with no extra segments.",
  },
  chooseNext: "Now pick the second point.",
  selectedEdge: "Segment selected. You can remove it.",
  testing: "The bridge is being tested…",
  building: "Building mode",
  ready: "Ready?",
  startFlag: "START",
  finishFlag: "FINISH",
  wood: "Wood",
  singleMaterial: "One material. Endless ideas.",
  legendAnchor: "Solid anchor",
  legendNode: "Connection point",
  legendRoad: "Road for the car",
  footer: "An adventure built with mathematics",
  local: "Standalone demo",
  chooseLevel: "Choose your adventure",
  chooseLevelBody: "Every level is a new idea. Start wherever you like.",
  exited: "See you soon!",
  exitBody: "We're always ready to get back to your bridges.",
  back: "Back to the game",
  configError: "This level could not be opened. Check the configuration.",
  node: (id) => `Point ${id.toUpperCase()}`,
  edge: (a, b) => `Segment ${a.toUpperCase()}–${b.toUpperCase()}`,
  levelLabel: (i, title) => `Level ${i}: ${title}`,
  stars: (n) => `${n} ${n === 1 ? "star" : "stars"}`,
  messages: {
    unknownNode: "That point was not found.",
    sameNode: "Pick a different point.",
    invalidType: "That material type doesn't exist.",
    duplicate: "These points are already connected.",
    roadOnly: "Build the road only between road points.",
    zeroLength: "The segment length is not valid.",
    tooLong: "That segment is too long. Pick a closer point.",
    budget:
      "Not enough material. Remove a segment or choose a shorter route.",
    roadGap: "The road is still broken. Connect the two banks completely.",
    noSupport:
      "The road needs support. Connect the inner road points to the bank through supports.",
    invalidConfig: "The level data is not valid.",
    invalidGraph: "The bridge data is not valid.",
  },
  levelTexts: {
    "bridge-01": { title: "First Bridge", subtitle: "Connect the two banks" },
    "bridge-02": { title: "Power of Support", subtitle: "Give the road a strong support" },
    "bridge-03": { title: "Triangle Secret", subtitle: "Triangles make a bridge strong" },
    "bridge-04": { title: "Smart Builder", subtitle: "Less material, a better solution" },
    "bridge-05": { title: "New Heights", subtitle: "Find a path between the heights" },
    "bridge-06": { title: "Road Downhill", subtitle: "Strengthen every segment of the slope" },
    "bridge-07": { title: "Support from Below", subtitle: "Try building the support under the road" },
    "bridge-08": { title: "Gentle Pass", subtitle: "Join the climb and the descent in one bridge" },
    "bridge-09": { title: "Valley Slope", subtitle: "Hold up the road across the dip" },
    "bridge-10": { title: "Two Wings", subtitle: "Give each half of the bridge its own support" },
    "bridge-11": { title: "Mountain Road", subtitle: "Join supports of different heights" },
    "bridge-12": { title: "Keep Building", subtitle: "Connect the ready-made road pieces" },
    "bridge-13": { title: "Help from Below", subtitle: "Strengthen the road with two lower nodes" },
    "bridge-14": { title: "Uneven Banks", subtitle: "Build an uneven road with short segments" },
    "bridge-15": { title: "Three Supports", subtitle: "Share the job between three support nodes" },
    "bridge-16": { title: "Pass Master", subtitle: "Use upper and lower supports together" },
    "bridge-17": { title: "Ready Foundation", subtitle: "Make smart use of the pre-built supports" },
    "bridge-18": { title: "Chain of Heights", subtitle: "Build a continuous support system at three heights" },
    "bridge-19": { title: "Thrifty Road", subtitle: "Drop unneeded nodes and save material" },
    "bridge-20": { title: "Master Engineer", subtitle: "The final bridge: an exact plan, a strong result" },
  },
  save: {
    label: "Save status",
    start: "Start",
    result: "Result",
    idle: "Not saved yet",
    saving: "Saving…",
    queued: "Waiting to send",
    saved: "Saved",
    error: "Not saved",
    retry: "Retry saving",
    panelTitle: "Save status",
    panelBody:
      "Every attempt is saved separately. You can resend the ones that didn't save.",
    pending: (n) => `${n} ${n === 1 ? "result" : "results"} not saved`,
    outcomes: {
      success: "Succeeded",
      failure: "Failed",
      aborted: "Stopped",
      active: "In progress",
    },
    attemptRow: (n, level) => `Attempt ${n} · ${level}`,
  },
  intro: {
    title: "Bridge Master",
    hello: "Hi!",
    lead: "Build a bridge between two banks, drive the car across and collect 3 stars!",
    howTitle: "How to play",
    steps: [
      {
        title: "Connect the points",
        text: "Tap two points in a row — a road segment appears.",
      },
      {
        title: "Add supports",
        text: "Triangles make the bridge strong and thrifty.",
      },
      {
        title: "Test the bridge",
        text: "If the car reaches the other bank, the level is complete.",
      },
    ],
    facts: [
      { value: "20", label: "levels" },
      { value: "3", label: "stars" },
      { value: "∞", label: "tries" },
    ],
    mathLine: "Length, triangles and material budgeting — all inside the game.",
    levelBadge: (n, total) => `LEVEL ${n} / ${total}`,
    budget: "Material",
    starGoal: "For 3 stars",
    tip: "Tip",
  },
  // Guided lessons: every step points at the real element it talks about (see onboarding/steps.js).
  tour: {
    label: "Game tutorial",
    skip: "Skip",
    next: "Got it",
    fresh: "NEW!",
    stepOf: (n, total) => `${n} / ${total}`,
    lessons: {
      "bridge-01": {
        goal: {
          title: "Let’s build a bridge!",
          text: "We will build a bridge from the left bank (A) to the right bank (E). The car will drive across it.",
        },
        level: {
          title: "This is the level",
          text: "Here you see the level number and name. There are 20 levels in all. The button on the left lets you pick any level.",
        },
        budget: {
          title: "Material is your wallet",
          text: "Every piece of road uses material. When it runs out, you cannot add more pieces. Use less than the number below and you earn 3 stars!",
        },
        tools: {
          title: "Two tools",
          text: "The yellow button is “Road”: the part the car drives on, and it is chosen now. The blue button is “Support”: it holds the bridge up, and you will need it in the next level.",
        },
        pickFirst: {
          title: "Step 1: point A",
          text: "We start the road on the left bank.",
          cta: "Tap point A",
        },
        pickSecond: {
          title: "Step 2: point B",
          text: "Now we stretch the road to B. Look, a road appears between A and B!",
          cta: "Tap point B",
        },
        edit: {
          title: "Made a mistake? No problem!",
          text: "“Undo” (↶) takes back your last step. “Redo” (↷) puts back what you undid. “Remove” (bin) deletes the chosen piece. The material comes back.",
        },
        road: {
          title: "Finish the road",
          text: "Keep going the same way. Each time, tap two points one after the other.",
          cta: "Connect B–C, C–D and D–E",
        },
        controls: {
          title: "Sound and pause",
          text: "Turn the sound on here. Pause stops the game and your bridge stays where it is.",
        },
        test: {
          title: "Shall we test it?",
          text: "The road is ready! Can the car drive across? Let’s find out!",
          cta: "Tap the green “Test the bridge” button",
        },
      },
      "bridge-02": {
        new: {
          title: "New: a support point!",
          text: "Look, a point F has appeared in the air. It is a support point: it holds the road up from above.",
        },
        road: {
          title: "Road first",
          text: "We build the road in two pieces: from A to B, then from B to E.",
          cta: "Connect A–B and B–E",
        },
        tool: {
          title: "The Support tool",
          text: "Now we choose “Support”. With this tool we build the lines that hold the bridge up.",
          cta: "Tap the blue “Support” button",
        },
        supports: {
          title: "Lower ropes from F",
          text: "Connect F to A, B and E. It is like three ropes hanging down from F.",
          cta: "Connect F–A, F–B and F–E",
        },
        triangles: {
          title: "Triangles!",
          text: "See that? Yellow triangles appeared. A triangle is the strongest shape, so the bridge will not fall.",
        },
        test: {
          title: "Let’s test it!",
          text: "The bridge is ready. Will the support help?",
          cta: "Tap the green “Test the bridge” button",
        },
      },
      "bridge-03": {
        idea: {
          title: "The triangle secret",
          text: "The road is longer now: four pieces. Here is the secret: when every piece has a triangle under it, the bridge is strong!",
        },
        road: {
          title: "Build the road",
          text: "First connect the four road pieces: A–B, B–C, C–D and D–E.",
          cta: "Connect the road from A to E",
        },
        tool: {
          title: "On to supports",
          text: "Now choose the “Support” tool.",
          cta: "Tap the blue “Support” button",
        },
        fan: {
          title: "From F in every direction",
          text: "Connect F to every road point. Two neighbouring points and F make one triangle.",
          cta: "Connect F to A, B, C, D and E",
        },
        triangles: {
          title: "Four triangles!",
          text: "There is the secret: every piece of road has a triangle under it. The bridge is very strong!",
        },
        star: {
          title: "Save material",
          text: "For 3 stars, keep the material used below this number. Do not add extra pieces!",
        },
        test: {
          title: "Let’s test it!",
          text: "The triangles are ready. Will the car make it?",
          cta: "Tap the green “Test the bridge” button",
        },
      },
      "bridge-04": {
        skip: {
          title: "Not much material!",
          text: "This time material is short. Skip B and D: long pieces save material.",
        },
        road: {
          title: "Long pieces",
          text: "Connect the road from A to C, then from C to E.",
          cta: "Connect A–C and C–E",
        },
      },
      "bridge-07": {
        news: {
          title: "The support is below!",
          text: "Point F is now under the road. Triangles built from below make the bridge strong too.",
        },
      },
      "bridge-10": {
        news: {
          title: "Two support points",
          text: "Now there are F and G: F helps the left half, G helps the right half.",
        },
      },
      "bridge-12": {
        news: {
          title: "Part of the road is built",
          text: "The roads A–B and D–E are already built and cost no material. Build the middle yourself.",
        },
      },
      "bridge-17": {
        news: {
          title: "The supports are ready",
          text: "The supports A–F and E–H are already built and cost no material. Connect the other road points to them.",
        },
      },
    },
  },
};
