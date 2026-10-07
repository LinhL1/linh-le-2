# Credits

## Fonts
- **Silkscreen** by Jason Kottke, SIL Open Font License 1.1, loaded from Google Fonts. Used for the brand text outside the retro computer and the desktop wallpaper text.
- **VT323** by Peter Hull, SIL Open Font License 1.1, loaded from Google Fonts. Used for the terminal, the desktop icon labels and taskbar, and the HUD/boot screen around the retro computer.
- **Source Serif 4** and **Inter**, SIL Open Font License 1.1, loaded from Google Fonts. Used for body text.
- **ZT Bros Oskon 90s** (free version), bundled in `src/assets/fonts/oksan/`. Used for display text on the classic site.
- **Tahoma / Verdana** (window content inside the retro computer) are the visitor's own system fonts; nothing is bundled or downloaded.

## 3D model
The computer on `/` is built procedurally from three.js primitives in
`src/retro/scene/ProceduralComputer.tsx`, so it has no third-party model or licence.

If you swap in a downloaded `.glb` (see `src/retro/scene/model.config.ts`), credit it here,
for example:

- **Model:** _<title>_ by _<author>_ — _<source URL, e.g. Sketchfab page>_
- **License:** _<e.g. CC BY 4.0>_, with changes noted if you modified it

CC BY models need attribution that visitors can actually see, so also add a credit line on
the site itself, e.g. in the About window or the classic site's footer.

## Libraries
three.js, @react-three/fiber and @react-three/drei, all MIT licensed.
