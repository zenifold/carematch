import { useSeniorPreferences, type TextSize } from "@/hooks/use-senior-preferences";

/**
 * Public text-size control. Large Text Mode is advertised on the homepage and
 * named in PRODUCT.md as a primary reason this audience can use the product at
 * all, so it has to be reachable before sign-in rather than only inside the
 * senior portal.
 *
 * Real radio inputs, so arrow keys and screen-reader semantics come free. The
 * glyphs are sized in em against a fixed-px container: the control has to stay
 * a stable size while it scales everything around it, otherwise pressing A++
 * moves the button out from under the pointer.
 */

const SIZES: { value: TextSize; glyph: string; label: string }[] = [
  { value: "normal", glyph: "A", label: "Normal text size" },
  { value: "large", glyph: "A", label: "Large text size" },
  { value: "xlarge", glyph: "A", label: "Extra large text size" },
];

const GLYPH_PX = ["13px", "16px", "20px"];

export function TextSizeControl({ className = "" }: { className?: string }) {
  const { prefs, setPref } = useSeniorPreferences();

  return (
    <fieldset
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 ${className}`}
      style={{ fontSize: "16px" }}
    >
      <legend className="sr-only">Text size</legend>
      {SIZES.map((size, i) => {
        const active = prefs.textSize === size.value;
        return (
          <label
            key={size.value}
            title={size.label}
            className={`grid size-11 cursor-pointer place-items-center rounded-full leading-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/60 ${
              active
                ? "bg-primary font-bold text-primary-foreground"
                : "font-semibold text-foreground hover:bg-secondary"
            }`}
          >
            <input
              type="radio"
              name="cc-text-size"
              className="sr-only"
              checked={active}
              onChange={() => setPref("textSize", size.value)}
            />
            <span aria-hidden style={{ fontSize: GLYPH_PX[i] }}>
              {size.glyph}
            </span>
            <span className="sr-only">{size.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
