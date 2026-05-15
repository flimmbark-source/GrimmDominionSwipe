# React integration notes

The PNG mockups are references. Do **not** bake UI values into images.

Use the SVG shells and CSS classes as dynamic components:

- `TimerRing({ value, variant })` renders text over `timer_ring_green_empty.svg` or `timer_ring_red_empty.svg`.
- `ChoicePanel({ title, icon, timeCost, failThreshold, greatThreshold })` renders dynamic card-choice data.
- `HeroFooter({ hero })` renders status/resource from game state.

The game state should own values such as timers, thresholds, region states, resources, and card text.
