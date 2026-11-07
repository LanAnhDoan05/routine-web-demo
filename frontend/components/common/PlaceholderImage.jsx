// A minimal, dependency-free placeholder used wherever a real photo
// (from /public/images/...) isn't available yet. Every call site
// still receives the intended `src` path via the mock data, so
// swapping this component's internals for a real <Image src={src} />
// later requires no changes to any page or product/outfit component.

const tones = [
  "#F7F7F7",
  "#F1EFEC",
  "#EFEFEF",
  "#F4F1EE",
  "#F0F0F0"
];

function toneFor(text = "") {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash + text.charCodeAt(i) * (i + 1)) % tones.length;
  return tones[hash];
}

export default function PlaceholderImage({
  label = "",
  ratio = "3 / 4",
  rounded = false,
  className = "",
  style = {}
}) {
  const initials = label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      style={{
        aspectRatio: ratio,
        width: "100%",
        background: toneFor(label),
        borderRadius: rounded ? "var(--radius-md)" : 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-text-secondary)",
        position: "relative",
        overflow: "hidden",
        ...style
      }}
    >
      <span
        style={{
          fontSize: "clamp(20px, 6cqw, 40px)",
          fontWeight: 600,
          letterSpacing: "0.05em",
          opacity: 0.55
        }}
      >
        {initials || "RT"}
      </span>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid rgba(17,17,17,0.06)"
        }}
      />
    </div>
  );
}
