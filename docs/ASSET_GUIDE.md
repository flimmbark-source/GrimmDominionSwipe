# Grimm Dominion UI Kit Asset Guide

This pack separates **visual reference** from **dynamic UI elements**.

## Folder structure

- `reference_screens/` — full mockup screenshots. Use as art direction only.
- `art_crops/` — cropped illustrations and item/portrait art that can be used as temporary prototype art.
- `svg/` — empty UI shells with no baked values. Use these for timers, panels, choice frames, item slots, and command cards.
- `css/grimm-ui.css` — prototype CSS for building dynamic screens in the same style.
- `react_examples/` — small component snippets and threshold formula.
- `demo_explore_screen.html` — static browser demo showing how dynamic text overlays the extracted assets.

## Important implementation rule

Do not use screenshots as UI.

Screenshots contain baked text and values. Instead, build the interface from components and bind real game variables:

- timers: `hero.timer`, `darkLord.planningTimer`
- thresholds: calculated from stat + difficulty
- status: `hero.status`, `region.state`
- resources: `hero.resourceValue`, `darkLord.evilEnergy`
- card labels/text: from card data

## Timer assets

Use:

- `svg/timer_ring_green_empty.svg` for hero timer
- `svg/timer_ring_red_empty.svg` for Dark Lord timer

Overlay real text in HTML/React. Do not use timer screenshots.

## Choice panel assets

Use CSS or SVG shells for the choice panels. The choice content should be rendered dynamically:

- choice title
- stat icon
- time cost
- red failure threshold
- green great-success threshold

The player should see only icons + numbers for thresholds:

- skull + red number
- crown + green number

No redundant labels like “fails if below” or “uses stealth” are needed.

## Dark Lord command cards

Dark Lord command cards should show **Evil Energy cost**, not time cost. There should be no hourglass/time-cost language on Dark Lord cards.

## Recommended next repo step

Create components:

- `TimerRing.jsx`
- `EncounterCard.jsx`
- `ChoicePanel.jsx`
- `HeroFooter.jsx`
- `BottomTabs.jsx`
- `DarkLordMap.jsx`
- `CommandCard.jsx`

Then wire them to the data model instead of hardcoding UI content.
