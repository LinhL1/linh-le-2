import { ICONS, PALETTE, type IconName } from "./pixelIcons";

export type { IconName };

interface PixelIconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function PixelIcon({ name, size = 48, className }: PixelIconProps) {
  const rects: JSX.Element[] = [];
  ICONS[name].forEach((row, y) => {
    // Merge horizontal runs of the same colour to keep the DOM small.
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== ".") {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={PALETTE[ch]} />);
      }
      x = end;
    }
  });

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {rects}
    </svg>
  );
}
