"use client";

import Link from "next/link";

/**
 * Shared button. Renders a <button> or, when `href` is provided, a
 * Next.js <Link> styled the same way — keeps CTAs consistent across
 * the whole site.
 */
export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  type = "button",
  onClick,
  disabled = false,
  ariaLabel,
  className = ""
}) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : "",
    fullWidth ? "btn-full" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
