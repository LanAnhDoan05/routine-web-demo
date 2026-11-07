// Bộ icon dạng line-art tối giản dùng chung cho toàn bộ Admin UI.
// Không phụ thuộc thư viện ngoài — chỉ là SVG thuần.

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Svg({ size = 18, children, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

export function IconHero(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </Svg>
  );
}

export function IconDashboard(props) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.5" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.5" />
    </Svg>
  );
}

export function IconProducts(props) {
  return (
    <Svg {...props}>
      <path d="M9 4h6l1.5 2.5H7.5L9 4Z" />
      <path d="M4.5 8.5 7.5 6.5h9l3 2 -1 10.5a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5L4.5 8.5Z" />
      <path d="M9.5 10.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" />
    </Svg>
  );
}

export function IconCategories(props) {
  return (
    <Svg {...props}>
      <path d="M12 3 3.5 8l8.5 5 8.5-5L12 3Z" />
      <path d="m3.5 12 8.5 5 8.5-5" />
      <path d="m3.5 16 8.5 5 8.5-5" />
    </Svg>
  );
}

export function IconStyles(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 13.8 9l5.7.1-4.5 3.6 1.7 5.5L12 15l-4.7 3.2 1.7-5.5-4.5-3.6L10.2 9 12 3.5Z" />
    </Svg>
  );
}

export function IconOutfits(props) {
  return (
    <Svg {...props}>
      <path d="M8.5 4 6 5.5v4l1.7 1-.7 8h6l-.7-8 1.7-1v-4L11.5 4" />
      <path d="M8.5 4c0 1.2 1 2 2 2s2-.8 2-2" />
      <path d="M17 9l1.8-.7L20.5 12l-1.8 1v6.5" />
    </Svg>
  );
}

export function IconOrders(props) {
  return (
    <Svg {...props}>
      <path d="M6 4h12l1 3H5l1-3Z" />
      <path d="M5 7h14l-1 12.5a1 1 0 0 1-1 .9H7a1 1 0 0 1-1-.9L5 7Z" />
      <path d="M9.5 10.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" />
    </Svg>
  );
}

export function IconCustomers(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 12.2c2.2.3 3.8 1.9 4 4.3" />
    </Svg>
  );
}

export function IconVouchers(props) {
  return (
    <Svg {...props}>
      <path d="M3.5 9.5a2 2 0 0 0 0 5v3.2c0 .7.6 1.3 1.3 1.3h14.4c.7 0 1.3-.6 1.3-1.3V16a2 2 0 0 1 0-5V5.8c0-.7-.6-1.3-1.3-1.3H4.8c-.7 0-1.3.6-1.3 1.3v3.7Z" />
      <path d="M15 4.5v15" strokeDasharray="1.8 2.2" />
    </Svg>
  );
}

export function IconReviews(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.8 13.6 8l4.6.1-3.7 2.9 1.4 4.4L12 12.8l-3.9 2.6 1.4-4.4-3.7-2.9L10.4 8 12 3.8Z" />
      <path d="M6 19.5h12" />
    </Svg>
  );
}

export function IconSettings(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8 6.3 6.3" />
    </Svg>
  );
}

export function IconMenu(props) {
  return (
    <Svg {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </Svg>
  );
}

export function IconSearch(props) {
  return (
    <Svg {...props}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m20 20-4.3-4.3" />
    </Svg>
  );
}

export function IconBell(props) {
  return (
    <Svg {...props}>
      <path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.3 5.2 1.3 5.2H4.7S6 14.5 6 10.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Svg>
  );
}

export function IconLogout(props) {
  return (
    <Svg {...props}>
      <path d="M14 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H14" />
      <path d="M11 12h9" />
      <path d="m17 8 4 4-4 4" />
    </Svg>
  );
}

export function IconChevronDown(props) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconChevronRight(props) {
  return (
    <Svg {...props}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  );
}

export function IconChevronLeft(props) {
  return (
    <Svg {...props}>
      <path d="m15 6-6 6 6 6" />
    </Svg>
  );
}

export function IconPlus(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconMoreVertical(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="5.2" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.8" r="1.15" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconTrash(props) {
  return (
    <Svg {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.2c0-.7.6-1.2 1.3-1.2h2.4c.7 0 1.3.5 1.3 1.2V7" />
      <path d="M6.5 7l.8 12c.05.8.7 1.5 1.5 1.5h6.4c.8 0 1.45-.6 1.5-1.5l.8-12" />
      <path d="M10.3 11v6M13.7 11v6" />
    </Svg>
  );
}

export function IconEdit(props) {
  return (
    <Svg {...props}>
      <path d="M14.5 4.5 19.5 9.5 8 21H3v-5L14.5 4.5Z" />
      <path d="m12.7 6.3 5 5" />
    </Svg>
  );
}

export function IconEye(props) {
  return (
    <Svg {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </Svg>
  );
}

export function IconCopy(props) {
  return (
    <Svg {...props}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
      <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </Svg>
  );
}

export function IconX(props) {
  return (
    <Svg {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconCheck(props) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19.5 7" />
    </Svg>
  );
}

export function IconUpload(props) {
  return (
    <Svg {...props}>
      <path d="M12 15.5V4.5" />
      <path d="m7.5 9 4.5-4.5L16.5 9" />
      <path d="M5 15.5v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </Svg>
  );
}

export function IconGrip(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconStar(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.8 13.6 8l4.6.1-3.7 2.9 1.4 4.4L12 12.8l-3.9 2.6 1.4-4.4-3.7-2.9L10.4 8 12 3.8Z" />
    </Svg>
  );
}

export function IconAlertCircle(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16.2" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.6" />
    </Svg>
  );
}

export function IconImage(props) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m6 17 4.5-4.5L14 16l2.5-2.5 2.5 3" />
    </Svg>
  );
}

export function IconArchive(props) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="4" rx="1" />
      <path d="M5 8.5v9a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-9" />
      <path d="M10 12.5h4" />
    </Svg>
  );
}

export function IconLink(props) {
  return (
    <Svg {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  );
}

export function IconTikTok(props) {
  return (
    <Svg {...props}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </Svg>
  );
}

export function IconFacebook(props) {
  return (
    <Svg {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </Svg>
  );
}

export function IconInstagram(props) {
  return (
    <Svg {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </Svg>
  );
}

export function IconStores(props) {
  return (
    <Svg {...props}>
      <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="M9 22V12h6v10" />
      <path d="M2 9h20" />
    </Svg>
  );
}

export function IconMapPin(props) {
  return (
    <Svg {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  );
}

export function IconPhone(props) {
  return (
    <Svg {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  );
}


