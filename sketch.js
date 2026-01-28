// Player character (soft, animated blob)
let blob3 = {
  // Position (centre of the blob)
  x: 320,
  y: 180,

  // Visual properties
  r: 26, // Base radius
  points: 48, // Number of points used to draw the blob
  wobble: 7, // Edge deformation amount
  wobbleFreq: 0.9,

  // Time values for breathing animation
  t: 0,
  tSpeed: 0.01,

  // Physics: velocity (top-down, no gravity)
  vx: 0, // Horizontal velocity
  vy: 0, // Vertical velocity

  // Movement tuning
  accel: 0.5, // Horizontal acceleration
  maxRun: 3.0, // Maximum speed
  friction: 0.92, // Friction (top-down)

  // State
  activeEmotions: {}, // Track active emotions: { emotion: timer }
  heldBoxIndex: null, // Index of the held box, or null
};

// Game state
let victoryAchieved = false;

// Colored boxes that the blob can pick up
let boxes = [
  {
    x: 150,
    y: 100,
    color: "red",
    width: 30,
    height: 30,
    held: false,
    sliding: false,
    vx: 0,
    vy: 0,
  },
  {
    x: 450,
    y: 80,
    color: "green",
    width: 30,
    height: 30,
    held: false,
    sliding: false,
    vx: 0,
    vy: 0,
  },
  {
    x: 200,
    y: 280,
    color: "blue",
    width: 30,
    height: 30,
    held: false,
    sliding: false,
    vx: 0,
    vy: 0,
  },
  {
    x: 500,
    y: 250,
    color: "yellow",
    width: 30,
    height: 30,
    held: false,
    sliding: false,
    vx: 0,
    vy: 0,
  },
];

// Colored holes where boxes trigger emotions
let holes = [
  {
    x: 100,
    y: 250,
    color: "red",
    width: 50,
    height: 50,
    auraRadius: 80,
    placedBox: null,
  },
  {
    x: 500,
    y: 150,
    color: "green",
    width: 50,
    height: 50,
    auraRadius: 80,
    placedBox: null,
  },
  {
    x: 300,
    y: 300,
    color: "blue",
    width: 50,
    height: 50,
    auraRadius: 80,
    placedBox: null,
  },
  {
    x: 50,
    y: 100,
    color: "yellow",
    width: 50,
    height: 50,
    auraRadius: 80,
    placedBox: null,
  },
];

// Emotion state for visual effects
let emotionIntensity = 0; // For screen tint effects
let screenTint = { r: 0, g: 0, b: 0, a: 0 }; // For color overlay

// Platform boundaries
const EDGE_ZONE = 30; // Size of edge zone
const platformZone = {
  x: EDGE_ZONE,
  y: EDGE_ZONE,
  width: 640 - EDGE_ZONE * 2,
  height: 360 - EDGE_ZONE * 2,
};

function setup() {
  createCanvas(640, 360);
  noStroke();
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  background(240);

  // Draw edge zone (danger zone)
  fill(200, 200, 200, 100);
  rect(0, 0, width, EDGE_ZONE); // Top
  rect(0, height - EDGE_ZONE, width, EDGE_ZONE); // Bottom
  rect(0, 0, EDGE_ZONE, height); // Left
  rect(width - EDGE_ZONE, 0, EDGE_ZONE, height); // Right

  // Apply emotion-based screen tint
  if (screenTint.a > 0) {
    fill(screenTint.r, screenTint.g, screenTint.b, screenTint.a);
    rect(0, 0, width, height);
    screenTint.a *= 0.95; // Fade out tint
  }

  // --- Draw holes (emotion zones) with aura only ---
  for (const hole of holes) {
    drawHoleAura(hole);
  }

  // --- Draw boxes ---
  for (const box of boxes) {
    if (!box.held) {
      drawBox(box);
    }
  }

  // --- Update sliding boxes ---
  updateSlidingBoxes();

  // --- Update active emotions (decrease timers) ---
  updateEmotionTimers();

  // --- Input: movement with emotion modifiers ---
  let moveX = 0;
  let moveY = 0;

  let leftPress = keyIsDown(65) || keyIsDown(LEFT_ARROW);
  let rightPress = keyIsDown(68) || keyIsDown(RIGHT_ARROW);
  let upPress = keyIsDown(87) || keyIsDown(UP_ARROW);
  let downPress = keyIsDown(83) || keyIsDown(DOWN_ARROW);

  // Reverse controls if nauseous
  if (blob3.activeEmotions["nausea"]) {
    leftPress = !leftPress;
    rightPress = !rightPress;
    upPress = !upPress;
    downPress = !downPress;
  }

  if (leftPress) moveX -= 1;
  if (rightPress) moveX += 1;
  if (upPress) moveY -= 1;
  if (downPress) moveY += 1;

  // Apply emotion-specific movement modifiers (cumulative)
  let speedMultiplier = 1.0;
  let wobbleMultiplier = 1.0;

  if (blob3.activeEmotions["joy"]) {
    speedMultiplier *= 1.5;
  }
  if (blob3.activeEmotions["sadness"]) {
    speedMultiplier *= 0.4;
  }
  if (blob3.activeEmotions["anger"]) {
    wobbleMultiplier *= 2.5;
  }

  // Update velocity
  blob3.vx += blob3.accel * moveX * speedMultiplier;
  blob3.vy += blob3.accel * moveY * speedMultiplier;

  // Apply friction
  blob3.vx *= blob3.friction;
  blob3.vy *= blob3.friction;

  // Clamp speed
  let speed = sqrt(blob3.vx * blob3.vx + blob3.vy * blob3.vy);
  if (speed > blob3.maxRun * speedMultiplier) {
    blob3.vx = (blob3.vx / speed) * blob3.maxRun * speedMultiplier;
    blob3.vy = (blob3.vy / speed) * blob3.maxRun * speedMultiplier;
  }

  // Update position
  blob3.x += blob3.vx;
  blob3.y += blob3.vy;

  // Keep blob inside canvas
  blob3.x = constrain(blob3.x, blob3.r, width - blob3.r);
  blob3.y = constrain(blob3.y, blob3.r, height - blob3.r);

  // Update blob's wobble based on emotion
  blob3.wobble = 7 * wobbleMultiplier;

  // Check if blob is holding a box and update its position
  for (let i = 0; i < boxes.length; i++) {
    if (blob3.heldBoxIndex !== null && i === blob3.heldBoxIndex) {
      boxes[i].x = blob3.x;
      boxes[i].y = blob3.y;
    }
  }

  // Check collisions with boxes and holes - no automatic pickup/placement
  checkNearbyBox();
  checkHolePlacement();

  // Draw the animated blob
  blob3.t += blob3.tSpeed;
  drawBlobCircle(blob3);

  // Draw carried box above blob
  if (blob3.heldBoxIndex !== null) {
    let heldBox = boxes[blob3.heldBoxIndex];
    fill(heldBox.color);
    rect(blob3.x - 12, blob3.y - 40, 24, 24);
  }

  // --- HUD ---
  fill(0);
  let emotionList = Object.keys(blob3.activeEmotions).join(", ") || "neutral";
  text(
    `Move: WASD or Arrows • E: Pick up • Q: Drop • Emotions: ${emotionList}`,
    10,
    18,
  );
  if (blob3.heldBoxIndex !== null) {
    text(`Holding: ${boxes[blob3.heldBoxIndex].color} box`, 10, 35);
  }

  // Check victory condition
  checkVictory();

  // Draw victory screen if achieved
  if (victoryAchieved) {
    drawVictoryScreen();
  }
}

// Draws the blob using Perlin noise for a soft, breathing effect
function drawBlobCircle(b) {
  fill(20, 120, 255);
  beginShape();

  for (let i = 0; i < b.points; i++) {
    const a = (i / b.points) * TAU;

    // Noise-based radius offset
    const n = noise(
      cos(a) * b.wobbleFreq + 100,
      sin(a) * b.wobbleFreq + 100,
      b.t,
    );

    const r = b.r + map(n, 0, 1, -b.wobble, b.wobble);

    vertex(b.x + cos(a) * r, b.y + sin(a) * r);
  }

  endShape(CLOSE);
}

// Check if blob is near a box (for potential pickup with E key)
function checkNearbyBox() {
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    if (!box.held) {
      let dx = blob3.x - box.x;
      let dy = blob3.y - box.y;
      let dist = sqrt(dx * dx + dy * dy);
      if (dist < blob3.r + 30) {
        // Store that this box is nearby for potential pickup
        box.nearBlob = true;
      } else {
        box.nearBlob = false;
      }
    }
  }
}

// Check if blob (with box) is in a hole's aura for placement
function checkHolePlacement() {
  if (blob3.heldBoxIndex === null) return; // Only check if holding a box

  const heldBox = boxes[blob3.heldBoxIndex];

  for (const hole of holes) {
    // Calculate distance to hole center
    let holeCenterX = hole.x + hole.width / 2;
    let holeCenterY = hole.y + hole.height / 2;
    let dx = blob3.x - holeCenterX;
    let dy = blob3.y - holeCenterY;
    let dist = sqrt(dx * dx + dy * dy);

    // Check if blob is in the aura zone with matching color
    if (dist < hole.auraRadius && heldBox.color === hole.color) {
      // Store that this hole is valid for placement
      hole.canPlace = true;
    } else {
      hole.canPlace = false;
    }
  }
}

// Apply emotion effect (can stack with existing emotions)
function applyEmotion(color, holeIndex) {
  switch (color) {
    case "red":
      blob3.activeEmotions["anger"] = 900; // 15 seconds at 60fps (timer refreshes if already active)
      screenTint = { r: 255, g: 100, b: 100, a: 100 };
      holes[holeIndex].emotionKey = "anger";
      break;
    case "green":
      blob3.activeEmotions["nausea"] = 900; // Timer refreshes if already active
      screenTint = { r: 150, g: 255, b: 150, a: 100 };
      holes[holeIndex].emotionKey = "nausea";
      break;
    case "yellow":
      blob3.activeEmotions["joy"] = 900; // Timer refreshes if already active
      screenTint = { r: 255, g: 255, b: 100, a: 80 };
      holes[holeIndex].emotionKey = "joy";
      break;
    case "blue":
      blob3.activeEmotions["sadness"] = 900; // Timer refreshes if already active
      blob3.points = 12; // Geometric shape when sad
      screenTint = { r: 100, g: 150, b: 255, a: 80 };
      holes[holeIndex].emotionKey = "sadness";
      break;
  }
}

// Update emotion timers (decrease and remove when expired)
function updateEmotionTimers() {
  for (const emotion in blob3.activeEmotions) {
    blob3.activeEmotions[emotion]--;
    if (blob3.activeEmotions[emotion] <= 0) {
      delete blob3.activeEmotions[emotion];

      // Find the hole associated with this emotion and make its box slide off
      for (let i = 0; i < holes.length; i++) {
        if (holes[i].emotionKey === emotion && holes[i].placedBox !== null) {
          slideBoxOff(holes[i].placedBox);
          holes[i].placedBox = null;
          holes[i].emotionKey = null;
        }
      }

      // Reset shape if sadness is gone and no other shape-changing emotions are active
      if (emotion === "sadness" && !blob3.activeEmotions["sadness"]) {
        blob3.points = 48;
      }
    }
  }
}

// Make a box slide off the platform
function slideBoxOff(box) {
  box.sliding = true;

  // Determine direction to nearest edge
  let distToLeft = box.x - 0;
  let distToRight = width - box.x;
  let distToTop = box.y - 0;
  let distToBottom = height - box.y;

  let minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

  if (minDist === distToLeft) {
    box.vx = -3;
    box.vy = 0;
  } else if (minDist === distToRight) {
    box.vx = 3;
    box.vy = 0;
  } else if (minDist === distToTop) {
    box.vx = 0;
    box.vy = -3;
  } else {
    box.vx = 0;
    box.vy = 3;
  }
}

// Update sliding boxes
function updateSlidingBoxes() {
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    if (box.sliding) {
      box.x += box.vx;
      box.y += box.vy;

      // Check if box has left the canvas
      if (
        box.x < -box.width ||
        box.x > width + box.width ||
        box.y < -box.height ||
        box.y > height + box.height
      ) {
        // Respawn box at random location in platform zone
        box.x = random(
          platformZone.x + 50,
          platformZone.x + platformZone.width - 50,
        );
        box.y = random(
          platformZone.y + 50,
          platformZone.y + platformZone.height - 50,
        );
        box.sliding = false;
        box.vx = 0;
        box.vy = 0;
      }
    }
  }
}

// Draw hole's aura (placement zone) with gradient fade
function drawHoleAura(hole) {
  let holeCenterX = hole.x + hole.width / 2;
  let holeCenterY = hole.y + hole.height / 2;

  // Get the color value based on the hole's color string
  let r, g, b;
  switch (hole.color) {
    case "red":
      r = 255;
      g = 0;
      b = 0;
      break;
    case "green":
      r = 0;
      g = 255;
      b = 0;
      break;
    case "blue":
      r = 0;
      g = 0;
      b = 255;
      break;
    case "yellow":
      r = 255;
      g = 255;
      b = 0;
      break;
  }

  // Draw multiple circles with decreasing opacity for gradient effect
  for (let i = hole.auraRadius; i > 0; i -= 5) {
    let alpha = map(i, 0, hole.auraRadius, 100, 0);
    fill(r, g, b, alpha);
    noStroke();
    circle(holeCenterX, holeCenterY, i * 2);
  }
}

// Draw a hole (removed - only aura is drawn now)

// Draw a box
function drawBox(box) {
  fill(box.color);
  stroke(0);
  strokeWeight(2);
  rect(box.x - box.width / 2, box.y - box.height / 2, box.width, box.height);
  noStroke();
}

// Keyboard input for picking up and dropping boxes
function keyPressed() {
  if (key === "e" || key === "E") {
    // Try to pick up a nearby box - also remove emotion if picking up from aura
    if (blob3.heldBoxIndex === null) {
      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i].nearBlob && !boxes[i].held && !boxes[i].sliding) {
          // Check if this box was in a hole (and remove its emotion)
          for (let j = 0; j < holes.length; j++) {
            if (holes[j].placedBox === boxes[i]) {
              // Remove the emotion associated with this hole
              if (holes[j].emotionKey) {
                delete blob3.activeEmotions[holes[j].emotionKey];
                // Reset shape if sadness was removed
                if (holes[j].emotionKey === "sadness") {
                  blob3.points = 48;
                }
                holes[j].emotionKey = null;
              }
              holes[j].placedBox = null;
            }
          }

          boxes[i].held = true;
          blob3.heldBoxIndex = i;
          break;
        }
      }
    }
  } else if (key === "q" || key === "Q") {
    // Try to drop the box in a valid placement zone
    if (blob3.heldBoxIndex !== null) {
      const heldBox = boxes[blob3.heldBoxIndex];

      // Check if in a valid placement zone
      for (let i = 0; i < holes.length; i++) {
        const hole = holes[i];
        if (hole.canPlace && heldBox.color === hole.color) {
          // If there's already a box in this hole, remove its emotion first
          if (hole.placedBox && hole.emotionKey) {
            delete blob3.activeEmotions[hole.emotionKey];
            if (hole.emotionKey === "sadness") {
              blob3.points = 48;
            }
          }

          // Trigger emotion and drop the box in place
          applyEmotion(heldBox.color, i);
          heldBox.held = false;
          holes[i].placedBox = heldBox; // Track which box is in this hole
          blob3.heldBoxIndex = null;
          return;
        }
      }

      // If not in a valid zone, just drop it on the ground
      heldBox.held = false;
      blob3.heldBoxIndex = null;
    }
  } else if ((key === "r" || key === "R") && victoryAchieved) {
    // Restart the game
    resetGame();
  }
}

// Check if victory condition is met
function checkVictory() {
  if (victoryAchieved) return; // Already won

  let allPlaced = true;
  for (const hole of holes) {
    if (hole.placedBox === null) {
      allPlaced = false;
      break;
    }
  }

  if (allPlaced) {
    victoryAchieved = true;
  }
}

// Draw victory screen
function drawVictoryScreen() {
  // Semi-transparent overlay
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  // Victory text
  fill(255, 255, 0);
  textAlign(CENTER, CENTER);
  textSize(72);
  text("VICTORY!", width / 2, height / 2 - 40);

  // Restart button
  fill(100, 200, 100);
  rectMode(CENTER);
  rect(width / 2, height / 2 + 60, 200, 50, 10);

  fill(255);
  textSize(24);
  text("Press R to Restart", width / 2, height / 2 + 60);

  // Reset text properties
  textAlign(LEFT, BASELINE);
  textSize(14);
  rectMode(CORNER);
}

// Reset game to initial state
function resetGame() {
  victoryAchieved = false;
  blob3.activeEmotions = {};
  blob3.heldBoxIndex = null;
  blob3.x = 320;
  blob3.y = 180;
  blob3.vx = 0;
  blob3.vy = 0;
  blob3.points = 48;

  // Reset boxes
  boxes[0] = {
    x: 150,
    y: 100,
    color: "red",
    width: 30,
    height: 30,
    held: false,
    sliding: false,
    vx: 0,
    vy: 0,
  };
  boxes[1] = {
    x: 450,
    y: 80,
    color: "green",
    width: 30,
    height: 30,
    held: false,
    sliding: false,
    vx: 0,
    vy: 0,
  };
  boxes[2] = {
    x: 200,
    y: 280,
    color: "blue",
    width: 30,
    height: 30,
    held: false,
    sliding: false,
    vx: 0,
    vy: 0,
  };
  boxes[3] = {
    x: 500,
    y: 250,
    color: "yellow",
    width: 30,
    height: 30,
    held: false,
    sliding: false,
    vx: 0,
    vy: 0,
  };

  // Reset holes
  for (let i = 0; i < holes.length; i++) {
    holes[i].placedBox = null;
    holes[i].emotionKey = null;
    holes[i].canPlace = false;
  }

  screenTint = { r: 0, g: 0, b: 0, a: 0 };
}

/* Emotion Effects:
   • RED (Anger): High wobble, screen tinted red
   • GREEN (Nausea): Controls reversed for 15 seconds
   • YELLOW (Joy): Blob moves 1.5x faster
   • BLUE (Sadness): Blob moves slower, becomes geometric shape
   
   Add more boxes or holes by modifying the boxes[] and holes[] arrays
*/
