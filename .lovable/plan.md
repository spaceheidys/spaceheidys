## Part 1 — Random rotation wallpapers (weighted, like Back images)

**CMS (`src/components/admin/Main2Section.tsx`)**
- Store `card_bg_wallpapers` as JSON array of `{ url, weight }` (migrate old string entries transparently: `typeof it === "string" ? { url: it, weight: 1 } : it`).
- Under every thumbnail in the "Random rotation" grid, add a small `%` input (0–100, integer) — same UX pattern as Back images weights. Persist on change.
- Keep the top main preview `<img>` as-is (shows `card_bg_wallpaper`, the primary), so uploader still sees opacity live.

**Frontend (`src/pages/IndexPage/PortfolioSection.tsx`)**
- Update `activeWallpaper` `useMemo` to parse the new `{ url, weight }` shape and pick weighted-random on mount (same algorithm as `pickWeightedBack` in `PortfolioCard.tsx`). Fallback to uniform random if all weights are 0; fallback to `card_bg_wallpaper` if list is empty.

## Part 2 — Animated reveal for ABOUT / CONTACT / SHOP text

Behavior on menu button click (ABOUT, CONTACT, SHOP — any nav that reveals `MainTextSection` content):
1. Page smooth-scrolls to the text section (already partly wired via section refs — extend duration / easing to feel "slow and smooth").
2. Instead of the text fading in immediately, a **placeholder frame** animates:
   - A tiny 1px square blinks 3 times at the target text center.
   - Then expands (width animation) to a horizontal line matching the eventual text block: `border 1px`, `padding: 8px top/bottom`, `left: 8px` from container edge, `right: 60px` from side menu.
   - The `2px` figure refers to total stroke rendering; use `border: 1px solid` = 1px line thickness, wrapper padded to feel like 2px visual weight.
3. After the frame is drawn, the text fades into place inside it.

Implementation in `src/pages/IndexPage/MainTextSection.tsx`:
- Add a new inner component `AnimatedTextReveal` wrapping each `<motion.div>` (about / contact / shop).
- Sequence via framer-motion `AnimatePresence` + keyframes:
  - phase 1 (0–600ms): 1px×1px square, opacity blink `[0,1,0,1,0,1]`
  - phase 2 (600–1000ms): expand width to 100%, keep height auto
  - phase 3 (1000ms+): text opacity 0→1
- Read a CMS flag `text_reveal_animation` (`"on"` default / `"off"`). When `off`, skip phases 1–2 but keep smooth scroll — text fades in normally after scroll completes.

Slow scroll:
- In `src/pages/Index.tsx` (where `scrollIntoView` is called for section clicks), replace `behavior: "smooth"` with a manual easing tween (~1200ms `easeInOutCubic`) so the descent feels plainly slower than default. Applies to both animation on/off states.

**CMS toggle (`src/components/admin/Main2Section.tsx` or `ContentSection.tsx`)**
- Add a switch: "Animated text reveal" bound to `text_reveal_animation` in `section_content`.
- Save via existing `useSectionContent` upsert path.

## Technical details

- New content keys: `card_bg_wallpapers` schema upgrade (JSON `{url,weight}[]`), `text_reveal_animation` (`"on"|"off"`).
- No DB migration needed — `section_content` already stores arbitrary key/value strings.
- Weighted picker: shared inline helper (duplicate the small function from `PortfolioCard.tsx` locally to avoid new module).
- Reveal animation uses framer-motion only; no new deps.
- The blinking square is positioned absolutely centered inside the text container so text can render underneath once expanded.

## Files touched
- `src/components/admin/Main2Section.tsx` — weights UI on wallpapers, animation toggle
- `src/pages/IndexPage/PortfolioSection.tsx` — weighted wallpaper picker
- `src/pages/IndexPage/MainTextSection.tsx` — `AnimatedTextReveal` wrapper
- `src/pages/Index.tsx` — slow smooth scroll to text sections

Ready to implement — confirm and I'll build it.
