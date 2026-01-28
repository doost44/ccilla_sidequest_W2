# Development Transcript: Blob Emotion Sidequest

## Overview

This document outlines the complete development process for creating an emotion-based puzzle game featuring a blob character that reacts to colored boxes placed in matching aura zones.

---

## Prompt 1: Initial Task Assignment

**User Request:**

> Redesign the blob's movement and environment to express a specific emotion (e.g., joy, frustration, panic). Bonus: Add a "mischief" mechanic, your blob steals or bumps objects on a small map.

**Response:**
I analyzed the existing p5.js sketch.js file and identified it as a platformer game with gravity and jumping mechanics. I proposed:

- A function `setEmotion()` to modify blob properties based on emotion state
- An objects array with collision detection for the mischief mechanic
- A `checkMischief()` function to detect blob-object interactions

This was so Co-pilot could get an understanding of the basic requriments of the assignment, from there I knew I could go ahead and modify the code

---

## Prompt 2: Convert to Top-Down View with Emotion Effects

**User Request:**

> We need to remove gravity and replace platforms with boxes. Different colored boxes (red/green/yellow/blue) placed in matching colored zones trigger different emotions with specific effects.

**Response:**
Complete system redesign to top-down mechanics:

**Emotion System:**

- **Red Box/Hole → Anger**: High wobble (7x multiplier) + red screen tint
- **Green Box/Hole → Nausea**: Controls reversed + green screen tint
- **Yellow Box/Hole → Joy**: Movement speed increased 1.5x + yellow screen tint
- **Blue Box/Hole → Sadness**: Movement speed reduced to 0.4x, blob becomes geometric (12 points instead of 48) + blue screen tint

**Mechanics Implemented:**

- Removed gravity system entirely
- 4 colored boxes (red, green, yellow, blue) placed at spawn locations
- 4 colored aura zones (holes) with matching colors
- Top-down movement using WASD or arrow keys
- 4-directional movement with friction-based physics (no platforms needed)

This was important to fufill the vision I had for the Side Quest (A top down achivement based game, maybe similar to Snake)

---

## Prompt 3: Add Button-Based Pickup and Drop System

**User Request:**

> Implement pickup and drop mechanics using E and Q keys. The blob should pick up boxes by pressing E and drop/place them with Q. Create proper aura zones that blur from the center and prevent boxes from disappearing when picking up other boxes.

**Response:**
Complete control system overhaul:

**Button Controls:**

- **E Key**: Pick up nearby boxes (must be within 30 pixels)
- **Q Key**: Drop/place boxes in valid aura zones

**Aura System:**

- Changed from automatic pickup to manual control
- Implemented gradient fade effect: multiple circles with decreasing opacity
- Aura zones display as colored circles fading from opaque to transparent
- Only boxes matching the hole's color can be placed in its aura

**Box Tracking:**

- Changed from `carryingColor` (string) to `heldBoxIndex` (number) to prevent box loss
- Only one box can be held at a time
- Boxes stay on map after being placed

This was important becuase Player interaction with the boxes were incorrect. The blob would pick it up and then place it on the same tick as it entered the boxes assigned area. Implemementing the hotkeys fixed this issue

---

## Prompt 4: Simplify Aura Design and Add Multi-Emotion Stacking

**User Request:**

> Remove the holes and keep only the aura zones. Aura zones should be the same color as their corresponding boxes. Remove box reset—boxes should stay where placed. Introduce stacking emotion effects so multiple emotions can be active simultaneously.

**Response:**
Major system improvements:

**Visual Simplification:**

- Removed solid hole rectangles
- Kept only the gradient aura circles
- Fixed color rendering: proper RGB values instead of string concatenation
  - Red: (255, 0, 0)
  - Green: (0, 255, 0)
  - Blue: (0, 0, 255)
  - Yellow: (255, 255, 0)

**Emotion Stacking System:**

- Changed from single `emotion: string` to `activeEmotions: {}` object with timers
- Each emotion independently tracks its remaining duration (in frames)
- Multiple emotion effects combine multiplicatively:
  - Joy (1.5x speed) + Sadness (0.4x speed) = 0.6x speed
  - Anger (2.5x wobble) + other effects compound
- Emotions auto-remove when timer expires
- Shape reset only happens when sadness expires and no other shape-changing emotions active

I just thought this would be more visually appealing.

---

## Prompt 5: Persistent Emotions and Color-Matching Auras

**User Request:**

> Make sure emotional effects don't disappear when a second box is placed in its zone. Make the aura areas the same color as their corresponding boxes.

**Response:**
Two fixes implemented:

**Persistent Emotions:**

- Emotion timer system already refreshed timer to 900 frames when same color box placed again
- Added clarifying comments that timers refresh (don't reset) on repeated placement

**Color Fix:**

- Replaced string concatenation approach with proper RGB color mapping
- Each hole's aura now correctly displays in its matching color
- Gradient fade effect applies alpha transparency properly

## At this point Co-pilot had the auras as a gray for all boxes making it difficult to place them in their proper locations. It also lead to the idea for the 6ths prompt.

## Prompt 6: Extended Duration, Sliding Mechanics, and Edge Zones

**User Request:**

> Make effects last longer. When effects end, blocks slide off the platform. Introduce edge zones around canvas edges where boxes push themselves off and reset to neutral. Boxes respawn in a random location inside the platform zone.

**Response:**
Significant new mechanics:

**Extended Duration:**

- Increased emotion timers from 300 frames (~5 seconds) to 900 frames (~15 seconds)

**Sliding System:**

- Added `sliding`, `vx`, `vy` properties to boxes
- `slideBoxOff()` function determines nearest edge and applies velocity
- Box direction determined by: left (-3, 0), right (+3, 0), top (0, -3), bottom (0, +3)

**Edge Zones:**

- Added 30-pixel danger zone around all canvas edges
- Visual feedback: semi-transparent gray overlay shows edge zones
- When box exits canvas completely, it triggers respawn

**Respawn Mechanic:**

- `platformZone` constants define safe area (excludes edges)
- Boxes respawn at random coordinates within safe zone
- `updateSlidingBoxes()` function manages sliding and respawn logic

## I thought this would be a fun way to introduce a time-based mechanic as to encourage active play. I was also surprise as to how effectively Co-pilot was able to creaate this code.

## Prompt 7: Emotion Removal by Picking Up and Victory Condition

**User Request:**

> Make sure effects disappear when blocks are picked up from the aura zone (to give player control). Add victory screen when all boxes are in their matching zones with "VICTORY!" text and restart button.

**Response:**
Final core features:

**Emotion Removal on Pickup:**

- Modified E key handler to detect if box was in a hole
- If box is being picked up from aura, emotion is deleted from `activeEmotions`
- Sadness restores blob shape to 48 points on removal
- Gives players strategic control to deactivate unwanted effects

**Victory System:**

- `checkVictory()` function checks if all 4 holes have a `placedBox`
- Victory screen displays:
  - Semi-transparent black overlay (180 alpha)
  - Large yellow "VICTORY!" text (72pt)
  - Green "Press R to Restart" button with rounded corners
- Victory persists until player presses R

**Game Reset:**

- `resetGame()` function resets entire game state:
  - All emotion timers cleared
  - Blob position and velocity reset
  - All boxes returned to starting positions
  - All holes cleared of placed boxes
  - Screen tint cleared
  - Blob shape reset to 48 points

The removal feature was important to allow for a better flow between choices and to not soft-lock players with the chosen box placement. Plus VICTORY!
