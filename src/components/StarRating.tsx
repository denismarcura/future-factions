import { Star } from "lucide-react";
import { useState } from "react";

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 16,
  showValue = false,
  count,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: number;
  showValue?: boolean;
  count?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(shown);
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(i)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => !readOnly && onChange?.(i)}
            className={readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 transition"}
            aria-label={`${i} estrela${i > 1 ? "s" : ""}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-yellow-400 stroke-yellow-500" : "stroke-muted-foreground/50"}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="text-xs text-muted-foreground ml-1">
          {value > 0 ? value.toFixed(1) : "—"}
          {typeof count === "number" && count > 0 ? ` (${count})` : ""}
        </span>
      )}
    </span>
  );
}
