export default function Badge({ children, variant = "default" }) {
  if (!children) return null;
  const classes = ["badge", variant === "sale" ? "badge-sale" : "", variant === "outline" ? "badge-outline" : ""]
    .filter(Boolean)
    .join(" ");
  return <span className={classes}>{children}</span>;
}
