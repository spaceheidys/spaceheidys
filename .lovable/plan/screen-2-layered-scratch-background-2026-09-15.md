# Screen 2 layered scratch background

## What will change
- Replace the single **Screen 2 Background** editor with two image slots:
  - **Layer 1** — bottom image.
  - **Layer 2** — top image that can be erased.
- Show both uploaded images together in the admin preview, with the upper layer covering the lower one.
- Keep Screen 2 audio controls unchanged.

## Interaction
- When Screen 2 opens, both images fill the screen in the same position and crop.
- Holding and dragging the left mouse button erases the upper layer, revealing the lower image beneath it.
- The same interaction works by dragging a finger on phones and tablets.
- Opening Screen 2 again restores the untouched upper layer.
- The Back and sound controls stay above the scratch surface and remain usable.

## Technical details
- Reuse `lvlup_sub2_bg` for Layer 1 so the current Screen 2 image remains available.
- Add `lvlup_sub2_bg_layer2` for the upper image; no database migration is needed because LVLUP settings already accept dynamic keys.
- Add a focused canvas-based scratch layer that scales to the viewport, preserves cover-style image cropping, follows continuous pointer movement, and prevents accidental page gestures while drawing.
- Restrict these two Screen 2 slots to images/GIF-compatible uploads; video cannot be erased reliably on a canvas.
- Verify admin upload/preview states and desktop/mobile Screen 2 interaction, then check the preview build and runtime logs.
