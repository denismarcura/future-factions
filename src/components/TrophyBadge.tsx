import trophyFirst from "@/assets/trophies/trophy-first.webp.asset.json";
import trophySecond from "@/assets/trophies/trophy-second.webp.asset.json";
import trophyThird from "@/assets/trophies/trophy-third.webp.asset.json";

type TrophyBadgeProps = {
  position: 1 | 2 | 3;
  size?: number;
  className?: string;
};

const TROPHY_MAP = {
  1: { asset: trophyFirst, alt: "Troféu do 1º lugar" },
  2: { asset: trophySecond, alt: "Troféu do 2º lugar" },
  3: { asset: trophyThird, alt: "Troféu do 3º lugar" },
} as const;

export function TrophyBadge({ position, size = 88, className = "" }: TrophyBadgeProps) {
  const trophy = TROPHY_MAP[position];

  return (
    <img
      src={trophy.asset.url}
      alt={trophy.alt}
      loading="lazy"
      decoding="async"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
