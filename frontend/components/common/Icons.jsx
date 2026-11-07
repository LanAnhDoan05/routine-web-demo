// Small, dependency-free inline SVG icons. Kept in one place so the
// stroke width / sizing stays consistent across the whole app.

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

export function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...props} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function HeartIcon({ filled = false, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      {...base}
      fill={filled ? "currentColor" : "none"}
      {...props}
      aria-hidden="true"
    >
      <path d="M20.8 8.6c0 4.4-8.8 10.4-8.8 10.4S3.2 13 3.2 8.6C3.2 5.9 5.4 4 7.9 4c1.6 0 3.1.8 4.1 2.1C13 4.8 14.5 4 16.1 4c2.5 0 4.7 1.9 4.7 4.6Z" />
    </svg>
  );
}

export function BagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...props} aria-hidden="true">
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...props} aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20c1.4-3.6 4.4-5.6 7.5-5.6s6.1 2 7.5 5.6" />
    </svg>
  );
}

export function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props} aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...props} aria-hidden="true">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...props} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props} aria-hidden="true">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export function StarIcon({ filled = false, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      {...base}
      fill={filled ? "currentColor" : "none"}
      {...props}
      aria-hidden="true"
    >
      <polygon points="12 2.5 14.9 8.6 21.6 9.4 16.8 14 18 20.7 12 17.4 6 20.7 7.2 14 2.4 9.4 9.1 8.6" />
    </svg>
  );
}

export function ArrowUpRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...props} aria-hidden="true">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}
