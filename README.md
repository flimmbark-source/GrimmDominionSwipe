# GrimmDominionSwipe

A first-pass static prototype for **Grimm Dominion**, a 4v1 real-time adventure card game.

## Play the prototype locally

This repo is currently plain HTML/CSS/JS. No install step is required.

Open `index.html` in a browser, or run a simple local server:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Prototype controls

- Click the left or right choice panel to resolve the current encounter card.
- Use Left / Right arrow keys as quick choice shortcuts.
- Use the bottom tabs for Explore, Hero, Party, Inventory, and Log.
- Press `D` to open the Dark Lord map/debug screen.
- On the Dark Lord screen, tap a command card, then tap a region.

## Current prototype scope

- Dynamic Explore screen with card choices, thresholds, and timers.
- Threshold resolution:
  - roll at or below red skull value = Failure
  - roll between red and green = Success
  - roll above green crown value = Great Success
- Hero timer decreases in real time and from card action costs.
- Dark Lord timer is only a planning timer.
- Dark Lord cards cost **Evil Energy**, not time.
- Party, Hero, Inventory, and Log tabs are implemented as lightweight playable-support screens.
- Dark Lord map screen is implemented as a local debug/prototype view.

## Important design rule

Screenshots in this repo are visual references only. The playable prototype should use dynamic UI variables for timers, thresholds, text, resources, status, and card data.
