/* @ds-bundle: {"format":3,"namespace":"FormaDesignSystem_019df9","components":[{"name":"ActivityHeader","sourcePath":"src/components/activity-detail/ActivityHeader.tsx"},{"name":"CelebrationStrip","sourcePath":"src/components/activity-detail/overview/CelebrationStrip.tsx"},{"name":"FeatureCard","sourcePath":"src/components/activity-detail/overview/FeatureCard.tsx"},{"name":"HeroStrip","sourcePath":"src/components/activity-detail/overview/HeroStrip.tsx"},{"name":"QuickStats","sourcePath":"src/components/activity-detail/overview/QuickStats.tsx"},{"name":"FounderNote","sourcePath":"src/components/landing/FounderNote.tsx"},{"name":"Landing","sourcePath":"src/components/landing/Landing.tsx"},{"name":"FooterCTA","sourcePath":"src/components/landing/LandingFooter.tsx"},{"name":"SiteFooter","sourcePath":"src/components/landing/LandingFooter.tsx"},{"name":"LandingHero","sourcePath":"src/components/landing/LandingHero.tsx"},{"name":"LandingSection","sourcePath":"src/components/landing/LandingSection.tsx"},{"name":"StravaButton","sourcePath":"src/components/landing/StravaButton.tsx"},{"name":"AvatarMenu","sourcePath":"src/components/layout/avatar-menu.tsx"},{"name":"Avatar","sourcePath":"src/components/layout/avatar.tsx"},{"name":"FormaMark","sourcePath":"src/components/layout/forma-mark.tsx"},{"name":"Header","sourcePath":"src/components/layout/header.tsx"},{"name":"NAV_ITEMS","sourcePath":"src/components/layout/nav-config.ts"},{"name":"PageHeader","sourcePath":"src/components/layout/page-header.tsx"},{"name":"PageTitle","sourcePath":"src/components/layout/page-title.tsx"},{"name":"Sidebar","sourcePath":"src/components/layout/sidebar.tsx"},{"name":"ThemeToggle","sourcePath":"src/components/layout/theme-toggle.tsx"},{"name":"TopBar","sourcePath":"src/components/layout/top-bar.tsx"},{"name":"CardHeader","sourcePath":"src/components/ui/card-header.tsx"},{"name":"Card","sourcePath":"src/components/ui/card.tsx"},{"name":"CardPartialNotice","sourcePath":"src/components/ui/card.tsx"},{"name":"CardEmptyState","sourcePath":"src/components/ui/card.tsx"},{"name":"InsightBlock","sourcePath":"src/components/ui/insight-block.tsx"},{"name":"Label","sourcePath":"src/components/ui/label.tsx"},{"name":"Legend","sourcePath":"src/components/ui/legend.tsx"},{"name":"PillToggle","sourcePath":"src/components/ui/pill-toggle.tsx"},{"name":"TABLE_HEADER_CLASS","sourcePath":"src/components/ui/sortable-header.tsx"},{"name":"SortHeader","sourcePath":"src/components/ui/sortable-header.tsx"},{"name":"StatStrip","sourcePath":"src/components/ui/stat-strip.tsx"},{"name":"StatCell","sourcePath":"src/components/ui/stat-strip.tsx"},{"name":"StatStripCustomCell","sourcePath":"src/components/ui/stat-strip.tsx"},{"name":"StatTile","sourcePath":"src/components/ui/stat-tile.tsx"},{"name":"Subtitle","sourcePath":"src/components/ui/subtitle.tsx"},{"name":"Tabs","sourcePath":"src/components/ui/tabs.tsx"},{"name":"TabList","sourcePath":"src/components/ui/tabs.tsx"},{"name":"Tab","sourcePath":"src/components/ui/tabs.tsx"},{"name":"TabPanel","sourcePath":"src/components/ui/tabs.tsx"},{"name":"Tooltip","sourcePath":"src/components/ui/tooltip.tsx"}],"sourceHashes":{"src/components/activity-detail/ActivityHeader.tsx":"fe499f366225","src/components/activity-detail/overview/CelebrationStrip.tsx":"985b3d223e37","src/components/activity-detail/overview/FeatureCard.tsx":"e85877af0d81","src/components/activity-detail/overview/HeroStrip.tsx":"c8acbea81632","src/components/activity-detail/overview/QuickStats.tsx":"ab2534ba5b09","src/components/landing/FounderNote.tsx":"36fd5b94fc3d","src/components/landing/Landing.tsx":"559ba6ac4820","src/components/landing/LandingFooter.tsx":"3ccdcd3810a9","src/components/landing/LandingHero.tsx":"0c90446de630","src/components/landing/LandingSection.tsx":"d924e5b98c4e","src/components/landing/StravaButton.tsx":"58cca8c54872","src/components/layout/avatar-menu.tsx":"c04a4edb0719","src/components/layout/avatar.tsx":"e3f64cd2605d","src/components/layout/forma-mark.tsx":"c80f3105a9dd","src/components/layout/header.tsx":"f0d31c1752fa","src/components/layout/nav-config.ts":"adbbdcc0a311","src/components/layout/page-header.tsx":"31a90f458ccb","src/components/layout/page-title.tsx":"f1c1a0c334d2","src/components/layout/sidebar.tsx":"3abbf85c06fd","src/components/layout/theme-toggle.tsx":"f7333b3247f5","src/components/layout/top-bar.tsx":"c822e5b0e994","src/components/ui/card-header.tsx":"405842f60adc","src/components/ui/card.tsx":"a7303ba7c156","src/components/ui/insight-block.tsx":"977bd78de861","src/components/ui/label.tsx":"00ab3837cca1","src/components/ui/legend.tsx":"81bd330cf2e2","src/components/ui/pill-toggle.tsx":"ce058b0817dd","src/components/ui/sortable-header.tsx":"5b4533e7519a","src/components/ui/stat-strip.tsx":"8d29864a2fdb","src/components/ui/stat-tile.tsx":"bfe8e59bb9f8","src/components/ui/subtitle.tsx":"91977868963b","src/components/ui/tabs.tsx":"d26d111ff3a8","src/components/ui/tooltip.tsx":"da93adc0d600","ui_kits/app/app.jsx":"4ac8f500bc14","ui_kits/marketing/app.jsx":"8b77f7c65502"},"inlinedExternals":[],"unexposedExports":[{"name":"avatarColor","sourcePath":"src/components/layout/avatar.tsx"},{"name":"avatarInitial","sourcePath":"src/components/layout/avatar.tsx"},{"name":"compareNullable","sourcePath":"src/components/ui/sortable-header.tsx"},{"name":"useSortToggle","sourcePath":"src/components/ui/sortable-header.tsx"}]} */

(() => {

const __ds_ns = (window.FormaDesignSystem_019df9 = window.FormaDesignSystem_019df9 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// src/components/activity-detail/ActivityHeader.tsx
try { (() => {
"use client";

const {
  useEffect,
  useRef,
  useState
} = React;
const TABS = [{
  key: "overview",
  label: "Overview"
}, {
  key: "analysis",
  label: "Analysis"
}, {
  key: "progress",
  label: "Progress"
}];

/**
 * Small icon + label used inside the activity-header subtitle row. The
 * `inline-flex` + `align-middle` mirrors the weather chip's treatment
 * so all subtitle parts share the same vertical centerline.
 */
function SubtitleIconLabel({
  icon: Icon,
  label
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 align-middle"
  }, /*#__PURE__*/React.createElement(Icon, {
    size: 14,
    strokeWidth: 1.7
  }), label);
}
function ActivityHeader({
  title,
  date,
  time,
  location,
  device,
  weather,
  shoes,
  kudosCount,
  commentCount,
  stravaActivityId,
  sportMeta,
  activitySequence,
  activeTab,
  onTabChange
}) {
  const Icon = sportMeta.icon;
  const tabRefs = useRef([]);
  const onTabKeyDown = (e, index) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") {
      return;
    }
    e.preventDefault();
    let nextIndex = index;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
    if (e.key === "ArrowLeft") nextIndex = (index - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") nextIndex = 0;
    if (e.key === "End") nextIndex = TABS.length - 1;
    const next = TABS[nextIndex];
    onTabChange(next.key);
    tabRefs.current[nextIndex]?.focus();
  };

  // Subtitle parts read left-to-right: where → when → conditions. Each
  // text part gets a small Lucide icon so the row scans without the
  // viewer having to parse "Apr 26 / 3:21 PM / Toronto" by position
  // alone. Weather already arrives as a ReactNode with its own icon.
  const subtitleParts = [location ? /*#__PURE__*/React.createElement(SubtitleIconLabel, {
    key: "loc",
    icon: MapPin,
    label: location
  }) : null, /*#__PURE__*/React.createElement(SubtitleIconLabel, {
    key: "date",
    icon: Calendar,
    label: date
  }), /*#__PURE__*/React.createElement(SubtitleIconLabel, {
    key: "time",
    icon: Clock,
    label: time
  }), weather].filter(part => Boolean(part));
  const equipmentItems = [];
  if (device) equipmentItems.push({
    icon: Watch,
    label: device
  });
  if (shoes) equipmentItems.push({
    icon: Icon,
    label: shoes
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3 pt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex min-w-0 items-center gap-[10px] text-[var(--muted)]",
    style: {
      fontSize: 14,
      lineHeight: "20px"
    }
  }, /*#__PURE__*/React.createElement(Link, {
    href: "/activities",
    className: "group inline-flex items-center gap-1.5 rounded transition-colors hover:text-[var(--fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    style: {
      outlineColor: sportMeta.accentColor
    }
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    size: 14,
    className: "transition-transform duration-200 ease-out group-hover:-translate-x-1"
  }), "Activities"), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--fg)"
    }
  }, sportMeta.label), /*#__PURE__*/React.createElement("span", {
    className: "inline-flex h-6 shrink-0 items-center rounded-md border px-1.5 font-mono text-[var(--muted)]",
    style: {
      backgroundColor: "var(--surface)",
      borderColor: "var(--border)",
      fontSize: 12,
      lineHeight: "16px"
    }
  }, "#", activitySequence)))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4",
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[14px]",
    style: {
      background: `${sportMeta.accentColor}26`
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    size: 40,
    strokeWidth: 1.5,
    style: {
      color: sportMeta.accentColor
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex min-w-0 flex-1 items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "min-w-0 flex-1"
  }, /*#__PURE__*/React.createElement(PageTitle, null, title), subtitleParts.length > 0 &&
  /*#__PURE__*/
  // Flex + items-center so the weather icon (an inline-flex
  // element) sits on the same vertical centerline as the
  // plain-text date/time/location parts. Without this, mixing
  // text-baseline parts with an inline-flex part shifts the
  // weather row a pixel or two below the others.
  React.createElement("div", {
    className: "flex flex-wrap items-center",
    style: {
      color: "var(--muted)",
      fontSize: 14,
      lineHeight: "20px",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Subtitle, {
    parts: subtitleParts
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex shrink-0 items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(SocialButton, {
    icon: ThumbsUp,
    count: kudosCount,
    label: "Kudos"
  }), /*#__PURE__*/React.createElement(SocialButton, {
    icon: MessageCircle,
    count: commentCount,
    label: "Comments"
  }), /*#__PURE__*/React.createElement(SocialButton, {
    icon: Share2,
    label: "Share",
    text: "Share"
  }), /*#__PURE__*/React.createElement(MoreActionsMenu, {
    stravaActivityId: stravaActivityId
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-x-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-[var(--border)]",
    role: "tablist",
    "aria-label": "Activity sections",
    style: {
      marginTop: 32
    }
  }, TABS.map(({
    key,
    label
  }, i) => {
    const isActive = key === activeTab;
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      ref: el => {
        tabRefs.current[i] = el;
      },
      type: "button",
      role: "tab",
      "aria-selected": isActive
      // All tabs are sequentially focusable so Tab/Shift-Tab walks
      // through the list. Arrow keys are still wired up below for
      // power users who prefer the WAI-ARIA tablist convention.
      ,
      tabIndex: 0,
      onClick: () => onTabChange(key),
      onKeyDown: e => onTabKeyDown(e, i)
      // Inset outline (offset -2) so the focus ring stays inside
      // the tab bounds. The parent has `overflow-x-auto`, which
      // per spec computes `overflow-y` to `auto` as well — a
      // positive offset would get clipped on the top/bottom edges.
      ,
      className: "relative shrink-0 pb-3 text-sm transition-colors duration-[0.12s] focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:rounded-sm",
      style: {
        color: isActive ? "var(--fg)" : "var(--muted)",
        fontWeight: isActive ? 500 : 400,
        outlineColor: sportMeta.accentColor
      }
    }, label, isActive && /*#__PURE__*/React.createElement("span", {
      className: "absolute inset-x-0 bottom-0 h-0.5 rounded-full",
      style: {
        backgroundColor: sportMeta.accentColor
      }
    }));
  })));
}
function Divider() {
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true
  }, "/");
}
function MoreActionsMenu({
  stravaActivityId
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDocClick = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = e => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const handleCopyLink = () => {
    const url = `${window.location.origin}/activities/${stravaActivityId}`;
    navigator.clipboard?.writeText(url);
    setOpen(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    className: "relative"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(v => !v),
    "aria-label": "More actions",
    "aria-haspopup": "menu",
    "aria-expanded": open,
    className: "inline-flex h-9 w-9 items-center justify-center rounded-[10px] border text-[var(--fg)] transition-colors hover:border-[color-mix(in_srgb,var(--fg)_20%,transparent)]",
    style: {
      backgroundColor: "var(--surface)",
      borderColor: "var(--border)"
    }
  }, /*#__PURE__*/React.createElement(MoreHorizontal, {
    size: 14,
    strokeWidth: 1.7
  })), open && /*#__PURE__*/React.createElement("div", {
    role: "menu",
    className: "absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border py-1 text-sm shadow-lg",
    style: {
      background: "var(--surface)",
      borderColor: "var(--border)",
      color: "var(--fg)"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: `https://www.strava.com/activities/${stravaActivityId}`,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: () => setOpen(false),
    className: "flex items-center gap-2 px-3 py-2 hover:bg-[var(--row-hover)]"
  }, /*#__PURE__*/React.createElement(ExternalLink, {
    size: 16,
    "aria-hidden": true
  }), "View in Strava"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleCopyLink,
    className: "flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--row-hover)]"
  }, /*#__PURE__*/React.createElement(Copy, {
    size: 16,
    "aria-hidden": true
  }), "Copy link"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(false),
    className: "flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--row-hover)]",
    style: {
      color: "var(--danger)"
    }
  }, /*#__PURE__*/React.createElement(Trash2, {
    size: 16,
    "aria-hidden": true
  }), "Delete")));
}
function SocialButton({
  icon: Icon,
  count,
  text,
  label
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": count !== undefined ? `${label} (${count})` : label,
    className: "inline-flex h-9 items-center gap-[6px] rounded-[10px] border px-[10px] text-[var(--fg)] transition-colors hover:border-[color-mix(in_srgb,var(--fg)_20%,transparent)]",
    style: {
      backgroundColor: "var(--surface)",
      borderColor: "var(--border)",
      fontSize: 14,
      lineHeight: "20px"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    size: 14,
    strokeWidth: 1.7
  }), count !== undefined && /*#__PURE__*/React.createElement("span", {
    className: "font-mono tabular-nums"
  }, count), text && /*#__PURE__*/React.createElement("span", null, text));
}
Object.assign(__ds_scope, { ActivityHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/activity-detail/ActivityHeader.tsx", error: String((e && e.message) || e) }); }

// src/components/activity-detail/overview/CelebrationStrip.tsx
try { (() => {
/**
 * Celebration strip. Renders only when the celebration-engine emits a
 * qualifying moment — yoga uses an ensō-circle mark, run and strength use
 * a trophy. No exclamation marks, no hype; accent value is right-aligned.
 *
 * Returns null when `celebration` is null, so the caller can render it
 * unconditionally without a wrapping guard.
 */
function CelebrationStrip({
  celebration,
  sportMeta
}) {
  if (!celebration) return null;
  const accent = sportMeta.accentColor;
  return /*#__PURE__*/React.createElement("aside", {
    role: "status",
    "aria-live": "polite",
    "aria-label": `${celebration.title} — ${celebration.detail}, ${celebration.accentValue}`,
    className: "flex items-center gap-[14px] rounded-[14px] px-5 py-[14px]",
    style: {
      border: `1px solid ${hexWithAlpha(accent, 0.2)}`,
      background: `linear-gradient(90deg, ${hexWithAlpha(accent, 0.08)}, ${hexWithAlpha(accent, 0.02)})`
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
    style: {
      backgroundColor: hexWithAlpha(accent, 0.18),
      color: accent
    }
  }, celebration.kind === "enso" ? /*#__PURE__*/React.createElement(EnsoMark, {
    accent: accent
  }) : /*#__PURE__*/React.createElement(Trophy, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0 flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "truncate text-[13.5px] font-medium text-[var(--fg)]"
  }, celebration.title), /*#__PURE__*/React.createElement("div", {
    className: "mt-[2px] truncate text-[12px] text-[var(--muted)]"
  }, celebration.detail)), /*#__PURE__*/React.createElement("div", {
    className: "shrink-0 font-mono text-[13px] font-medium whitespace-nowrap tabular-nums",
    style: {
      color: accent
    }
  }, celebration.accentValue));
}

/**
 * Ensō-inspired mark: a nearly-closed dashed circle with a filled center
 * dot. Used for yoga celebrations instead of a trophy icon.
 */
function EnsoMark({
  accent
}) {
  return /*#__PURE__*/React.createElement("svg", {
    "aria-hidden": true,
    viewBox: "0 0 20 20",
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "10",
    cy: "10",
    r: "7",
    strokeDasharray: "2 2.4",
    pathLength: 40
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "10",
    cy: "10",
    r: "1.6",
    fill: accent,
    stroke: "none"
  }));
}
function hexWithAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
Object.assign(__ds_scope, { CelebrationStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/activity-detail/overview/CelebrationStrip.tsx", error: String((e && e.message) || e) }); }

// src/components/activity-detail/overview/FeatureCard.tsx
try { (() => {
function FeatureCard({
  title,
  subtitle,
  tag,
  actions,
  children,
  footer
}) {
  return /*#__PURE__*/React.createElement(Card, {
    variant: "feature",
    title: title,
    subtitle: subtitle,
    tag: tag,
    actions: actions,
    footer: footer
  }, children);
}
Object.assign(__ds_scope, { FeatureCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/activity-detail/overview/FeatureCard.tsx", error: String((e && e.message) || e) }); }

// src/components/activity-detail/overview/HeroStrip.tsx
try { (() => {
/**
 * Hero strip: two-part insight (top) + 5 metric cells (bottom) inside one
 * card. The accent bar on the left signals the insight region; one of the
 * metric cells is tinted with the sport accent to carry the effort read.
 */
function HeroStrip({
  insight,
  metrics,
  sportMeta
}) {
  const accent = sportMeta.accentColor;
  return /*#__PURE__*/React.createElement("section", {
    "aria-label": "Activity overview",
    className: "overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative px-7 py-6",
    style: {
      background: `linear-gradient(135deg, ${hexWithAlpha(accent, 0.05)}, ${hexWithAlpha(accent, 0.01)})`
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    className: "absolute top-0 bottom-0 left-0 w-[3px]",
    style: {
      backgroundColor: accent
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "mb-2 font-medium tracking-[0.08em] uppercase",
    style: {
      color: accent,
      fontSize: 14,
      lineHeight: "20px"
    }
  }, "Insight"), /*#__PURE__*/React.createElement("p", {
    className: "text-[var(--fg)]",
    style: {
      fontSize: 14,
      lineHeight: "20px"
    }
  }, insight.lead, " ", /*#__PURE__*/React.createElement("span", {
    className: "text-[var(--muted)]"
  }, insight.tag))), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto border-t border-[var(--border)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid min-w-[480px] grid-cols-5 sm:min-w-0",
    role: "list",
    "aria-label": "Key metrics"
  }, metrics.slice(0, 5).map((m, i) => /*#__PURE__*/React.createElement(StatTile, {
    key: `${m.label}-${i}`,
    label: m.label,
    value: m.value,
    accent: m.accent ? accent : undefined,
    divided: i > 0,
    variant: "primary"
  })))));
}

/**
 * Expand a `#RRGGBB` to `rgba(...)` with the given alpha. Kept tiny and local;
 * the insight-row gradient is the only place that needs it.
 */
function hexWithAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
Object.assign(__ds_scope, { HeroStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/activity-detail/overview/HeroStrip.tsx", error: String((e && e.message) || e) }); }

// src/components/activity-detail/overview/QuickStats.tsx
try { (() => {
/**
 * Two-column shell for sport-specific Quick-Stats preview cards. Collapses
 * gracefully when one slot has no data (single column, full width) or
 * disappears entirely when both are empty — voices.md "when in doubt,
 * leave it out". `null` is the canonical "no data" signal from each slot
 * builder.
 */
function QuickStats({
  left,
  right
}) {
  const hasLeft = left != null && left !== false;
  const hasRight = right != null && right !== false;
  if (!hasLeft && !hasRight) return null;
  if (!hasLeft || !hasRight) {
    return /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1"
    }, hasLeft ? left : right);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-4 md:grid-cols-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full"
  }, left), /*#__PURE__*/React.createElement("div", {
    className: "h-full"
  }, right));
}
Object.assign(__ds_scope, { QuickStats });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/activity-detail/overview/QuickStats.tsx", error: String((e && e.message) || e) }); }

// src/components/landing/FounderNote.tsx
try { (() => {
function FounderNote() {
  return /*#__PURE__*/React.createElement("section", {
    className: "px-6 py-24 md:px-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto flex max-w-2xl flex-col gap-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm uppercase tracking-wide text-muted"
  }, "From the maker"), /*#__PURE__*/React.createElement("p", {
    className: "text-lg leading-relaxed text-fg"
  }, "Hey!"), /*#__PURE__*/React.createElement("p", {
    className: "text-lg leading-relaxed text-fg"
  }, "I'm Fardeen, a designer, and someone who trains. I built Forma because Strava holds years of my data without ever showing it back to me in a way that felt personal or fun. This is what I wanted to see. If you've felt the same way, you're in the right place.")));
}
Object.assign(__ds_scope, { FounderNote });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/landing/FounderNote.tsx", error: String((e && e.message) || e) }); }

// src/components/landing/Landing.tsx
try { (() => {
function Landing() {
  return /*#__PURE__*/React.createElement("main", {
    className: "flex flex-1 flex-col"
  }, /*#__PURE__*/React.createElement(ForceSystemTheme, null), /*#__PURE__*/React.createElement(LandingHero, null), /*#__PURE__*/React.createElement(LandingSection, {
    eyebrow: "A year, at a glance",
    headline: "Every workout, every day.",
    body: "One square per day. Color shows the type of session, opacity shows the work you put in."
  }, /*#__PURE__*/React.createElement(ActivityHeatmap, {
    days: mockHeatmapData.days,
    availableYears: mockHeatmapData.availableYears,
    categoryCounts: mockHeatmapData.categoryCounts
  })), /*#__PURE__*/React.createElement(LandingSection, {
    eyebrow: "Your records",
    headline: "Your fastest, your longest, your hardest.",
    body: "Surfaced where you can see them, not buried three taps deep."
  }, /*#__PURE__*/React.createElement(PersonalBests, {
    data: mockPBData
  })), /*#__PURE__*/React.createElement(LandingSection, {
    eyebrow: "The rhythm of training",
    headline: "See your weeks, your months, your year.",
    body: "Every day, stacked against the next. The patterns become obvious."
  }, /*#__PURE__*/React.createElement(RunningLogChart, {
    activities: mockActivities
  })), /*#__PURE__*/React.createElement(FounderNote, null), /*#__PURE__*/React.createElement(FooterCTA, null), /*#__PURE__*/React.createElement(SiteFooter, null));
}
Object.assign(__ds_scope, { Landing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/landing/Landing.tsx", error: String((e && e.message) || e) }); }

// src/components/landing/LandingFooter.tsx
try { (() => {
function FooterCTA() {
  return /*#__PURE__*/React.createElement("section", {
    className: "px-6 py-32 md:px-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto flex max-w-3xl flex-col items-center gap-6 text-center"
  }, /*#__PURE__*/React.createElement(PageTitle, {
    as: "h2"
  }, "Ready to see yours?"), /*#__PURE__*/React.createElement(StravaButton, {
    size: "lg"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-muted"
  }, "In early access")));
}
function SiteFooter() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "border-t border-border px-6 py-8 md:px-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 sm:flex-row"
  }, /*#__PURE__*/React.createElement(Link, {
    href: "/",
    className: "flex items-center text-accent",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(FormaMark, {
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-semibold tracking-tight"
  }, "Forma")), /*#__PURE__*/React.createElement("nav", {
    className: "flex items-center gap-6 text-sm text-muted"
  }, /*#__PURE__*/React.createElement(Link, {
    href: "/privacy",
    className: "transition hover:text-fg"
  }, "Privacy"), /*#__PURE__*/React.createElement("a", {
    href: "mailto:hello@forma.app",
    className: "transition hover:text-fg"
  }, "Contact"))));
}
Object.assign(__ds_scope, { FooterCTA, SiteFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/landing/LandingFooter.tsx", error: String((e && e.message) || e) }); }

// src/components/landing/LandingHero.tsx
try { (() => {
"use client";

function LandingHero() {
  return /*#__PURE__*/React.createElement("section", {
    className: "relative flex min-h-screen flex-col px-6 md:px-10"
  }, /*#__PURE__*/React.createElement("header", {
    className: "mx-auto flex w-full max-w-[1400px] items-center justify-between pt-6 md:pt-8"
  }, /*#__PURE__*/React.createElement(Link, {
    href: "/",
    className: "flex items-center text-accent",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(FormaMark, {
    size: 24
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold tracking-tight",
    style: {
      fontSize: 20,
      lineHeight: 1
    }
  }, "Forma")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => signIn("strava", {
      callbackUrl: "/overview"
    }),
    className: "text-sm text-muted transition hover:text-fg"
  }, "Sign in")), /*#__PURE__*/React.createElement("div", {
    className: "mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-center justify-center gap-10 pb-16 pt-20 md:pb-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center text-center"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "font-medium tracking-tight",
    style: {
      fontSize: 56,
      lineHeight: "72px",
      marginBottom: 32
    }
  }, "The shape of your training"), /*#__PURE__*/React.createElement("p", {
    className: "max-w-xl text-muted",
    style: {
      fontSize: 16,
      lineHeight: "24px",
      marginBottom: 24
    }
  }, "Made for people who train. Shaped by the years of data you already have."), /*#__PURE__*/React.createElement(StravaButton, {
    size: "lg"
  }), /*#__PURE__*/React.createElement("p", {
    className: "mt-4 text-sm text-muted"
  }, "In early access")), /*#__PURE__*/React.createElement("div", {
    className: "pointer-events-none w-full max-w-[min(82vw,640px)] aspect-square"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pointer-events-auto h-full w-full"
  }, /*#__PURE__*/React.createElement(Globe, {
    totals: mockGlobeTotals
  })))));
}
Object.assign(__ds_scope, { LandingHero });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/landing/LandingHero.tsx", error: String((e && e.message) || e) }); }

// src/components/landing/LandingSection.tsx
try { (() => {
function LandingSection({
  eyebrow,
  headline,
  body,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "px-6 py-32 md:px-10 md:py-40"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-[1400px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-12 flex flex-col gap-4 md:mb-16"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm uppercase tracking-wide text-muted"
  }, eyebrow), /*#__PURE__*/React.createElement(PageTitle, {
    as: "h2"
  }, headline), /*#__PURE__*/React.createElement("p", {
    className: "max-w-2xl text-lg text-muted"
  }, body)), /*#__PURE__*/React.createElement("div", {
    className: "w-full"
  }, children)));
}
Object.assign(__ds_scope, { LandingSection });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/landing/LandingSection.tsx", error: String((e && e.message) || e) }); }

// src/components/landing/StravaButton.tsx
try { (() => {
"use client";

function StravaButton({
  size = "default",
  className = "",
  callbackUrl = "/overview"
}) {
  const sizeClasses = size === "lg" ? "px-7 py-4 text-base gap-3" : "px-5 py-3 text-sm gap-2";
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => signIn("strava", {
      callbackUrl
    }),
    className: `inline-flex items-center justify-center rounded-md bg-[#FC4C02] font-semibold text-white transition hover:bg-[#e34402] focus:outline-none focus:ring-2 focus:ring-[#FC4C02] focus:ring-offset-2 focus:ring-offset-bg ${sizeClasses} ${className}`
  }, /*#__PURE__*/React.createElement(StravaGlyph, {
    className: size === "lg" ? "h-5 w-5" : "h-4 w-4"
  }), /*#__PURE__*/React.createElement("span", null, "Connect with Strava"));
}
function StravaGlyph({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    className: className,
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M13.828 6.078 9.996 13.64H7.52L13.828 1.25l6.302 12.39h-2.476l-3.826-7.562zm2.56 11.672-1.857-3.677h-2.755l4.612 9.177 4.608-9.177h-2.755z"
  }));
}
Object.assign(__ds_scope, { StravaButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/landing/StravaButton.tsx", error: String((e && e.message) || e) }); }

// src/components/layout/avatar.tsx
try { (() => {
"use client";

/**
 * Deterministic colorful palette keyed off the user's name.
 * Hues are spread across the wheel at ~54% lightness / 70% saturation,
 * echoing the brand orange (#E8612B ≈ HSL 17 78 54) so every chip reads
 * as a saturated accent against both the dark (#111113) and light
 * (#F5F5F3) surfaces.
 */
const AVATAR_PALETTE = ["#E8612B",
// brand orange
"#D89B2B",
// amber
"#B5A82B",
// chartreuse
"#4BA85C",
// green
"#2BA89B",
// teal
"#3B82D6",
// blue
"#5A5AD6",
// indigo
"#9B4BD6",
// purple
"#D64B8F",
// pink
"#D64B4B" // red
];
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}
function avatarColor(name) {
  const key = (name ?? "?").trim().toLowerCase();
  return AVATAR_PALETTE[hashString(key) % AVATAR_PALETTE.length];
}
function avatarInitial(name) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}
function Avatar({
  name,
  image,
  size = 36
}) {
  if (image) {
    return (
      /*#__PURE__*/
      // eslint-disable-next-line @next/next/no-img-element
      React.createElement("img", {
        src: image,
        alt: name ?? "avatar",
        width: size,
        height: size,
        className: "rounded-full object-cover",
        style: {
          width: `${size}px`,
          height: `${size}px`
        }
      })
    );
  }
  const bg = avatarColor(name);
  const initial = avatarInitial(name);
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center rounded-full",
    style: {
      width: `${size}px`,
      height: `${size}px`,
      background: "var(--surface)"
    },
    "aria-label": name ?? "avatar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center rounded-full",
    style: {
      width: "20px",
      height: "20px",
      background: bg,
      color: "#FFFFFF",
      fontSize: 14,
      lineHeight: "20px",
      fontWeight: 500
    }
  }, initial));
}
Object.assign(__ds_scope, { avatarColor, avatarInitial, Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/layout/avatar.tsx", error: String((e && e.message) || e) }); }

// src/components/layout/avatar-menu.tsx
try { (() => {
"use client";

const {
  useCallback,
  useEffect,
  useRef,
  useState
} = React;
const ROW_STYLE = {
  height: 36,
  paddingLeft: 12,
  paddingRight: 12,
  gap: 10,
  borderRadius: 8
};
const PANEL_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 6,
  color: "var(--fg)"
};
const THEME_MODES = [{
  key: "light",
  label: "Light",
  Icon: Sun
}, {
  key: "dark",
  label: "Dark",
  Icon: Moon
}, {
  key: "system",
  label: "System",
  Icon: Monitor
}];
const LANGUAGES = [{
  key: "en-US",
  label: "English (United States)"
}];
function AvatarMenu({
  user,
  size = 36,
  expanded = false
}) {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState(null);
  const ref = useRef(null);
  const {
    theme,
    setTheme
  } = useTheme();
  const currentLanguage = "en-US";
  const closeMenu = useCallback(() => {
    setOpen(false);
    setSubmenu(null);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onClick = e => {
      if (ref.current && !ref.current.contains(e.target)) closeMenu();
    };
    const onKey = e => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeMenu]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    className: "relative"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(v => !v),
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-label": "Open profile menu",
    className: "group flex w-full items-center transition-[background] duration-[120ms] hover:bg-[color:var(--nav-hover)]",
    style: {
      height: 36,
      paddingLeft: 4,
      paddingRight: 4,
      gap: 10,
      borderRadius: 8,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center justify-center shrink-0",
    style: {
      width: 28,
      height: 28
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: user.name,
    image: user.image,
    size: 28
  })), /*#__PURE__*/React.createElement("span", {
    className: "truncate text-left text-sm font-medium",
    style: {
      color: "var(--fg)",
      whiteSpace: "nowrap"
    }
  }, user.name?.trim().split(/\s+/)[0] ?? "Signed in")), open && /*#__PURE__*/React.createElement("div", {
    role: "menu",
    className: "absolute z-40 shadow-lg",
    style: {
      bottom: "calc(100% + 8px)",
      left: 0,
      width: 260,
      ...PANEL_STYLE
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: 14,
      paddingRight: 14,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 12,
      lineHeight: "16px",
      color: "var(--muted-2)",
      userSelect: "text",
      WebkitUserSelect: "text",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    onMouseEnter: () => setSubmenu(null)
  }, user.email ?? "Signed in"), /*#__PURE__*/React.createElement(MenuSection, null, /*#__PURE__*/React.createElement(Link, {
    href: "/settings",
    onClick: closeMenu,
    onMouseEnter: () => setSubmenu(null),
    className: "group flex items-center w-full transition text-sm hover:bg-[color:var(--nav-hover)] hover:text-[color:var(--fg)]",
    style: {
      ...ROW_STYLE,
      color: "var(--fg)"
    }
  }, /*#__PURE__*/React.createElement(SettingsIcon, {
    size: 16,
    "aria-hidden": true
  }), /*#__PURE__*/React.createElement("span", null, "Settings")), /*#__PURE__*/React.createElement(SubmenuRow, {
    icon: /*#__PURE__*/React.createElement(GlobeIcon, {
      size: 16,
      "aria-hidden": true
    }),
    label: "Language",
    active: submenu === "language",
    onEnter: () => setSubmenu("language")
  }, LANGUAGES.map(({
    key,
    label
  }) => /*#__PURE__*/React.createElement(MenuButton, {
    key: key,
    label: label,
    trailing: key === currentLanguage ? /*#__PURE__*/React.createElement(CheckMark, null) : null
  }))), /*#__PURE__*/React.createElement(SubmenuRow, {
    icon: /*#__PURE__*/React.createElement(Palette, {
      size: 16,
      "aria-hidden": true
    }),
    label: "Appearance",
    active: submenu === "appearance",
    onEnter: () => setSubmenu("appearance")
  }, THEME_MODES.map(({
    key,
    label,
    Icon
  }) => /*#__PURE__*/React.createElement(MenuButton, {
    key: key,
    icon: /*#__PURE__*/React.createElement(Icon, {
      size: 16,
      "aria-hidden": true
    }),
    label: label,
    onClick: () => setTheme(key),
    trailing: theme === key ? /*#__PURE__*/React.createElement(CheckMark, null) : null
  })))), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(MenuSection, null, /*#__PURE__*/React.createElement("a", {
    href: "mailto:help@forma.run",
    onMouseEnter: () => setSubmenu(null),
    className: "group flex items-center w-full transition text-sm hover:bg-[color:var(--nav-hover)] hover:text-[color:var(--fg)]",
    style: {
      ...ROW_STYLE,
      color: "var(--fg)"
    }
  }, /*#__PURE__*/React.createElement(CircleHelp, {
    size: 16,
    "aria-hidden": true
  }), /*#__PURE__*/React.createElement("span", null, "Get help"))), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(MenuSection, null, /*#__PURE__*/React.createElement("form", {
    action: signOutAction
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    onMouseEnter: () => setSubmenu(null),
    className: "group flex items-center w-full transition text-sm hover:bg-[color:var(--nav-hover)] hover:text-[color:var(--fg)]",
    style: {
      ...ROW_STYLE,
      color: "var(--fg)"
    }
  }, /*#__PURE__*/React.createElement(LogOut, {
    size: 16,
    "aria-hidden": true
  }), /*#__PURE__*/React.createElement("span", null, "Sign out"))))));
}
function MenuSection({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col",
    style: {
      gap: 2
    }
  }, children);
}
function Divider() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border)",
      marginTop: 6,
      marginBottom: 6,
      marginLeft: 6,
      marginRight: 6
    }
  });
}
function CheckMark() {
  return /*#__PURE__*/React.createElement(Check, {
    size: 16,
    "aria-hidden": true,
    style: {
      color: "var(--accent)"
    }
  });
}
function MenuButton({
  icon,
  label,
  trailing,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    className: "flex items-center w-full transition text-sm hover:bg-[color:var(--nav-hover)] hover:text-[color:var(--fg)]",
    style: {
      ...ROW_STYLE,
      color: "var(--fg)"
    }
  }, icon, /*#__PURE__*/React.createElement("span", {
    className: "flex-1 text-left truncate"
  }, label), trailing);
}
function SubmenuRow({
  icon,
  label,
  active,
  onEnter,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "relative",
    onMouseEnter: onEnter
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-haspopup": "menu",
    "aria-expanded": active,
    className: "flex items-center w-full transition text-sm hover:text-[color:var(--fg)]",
    style: {
      ...ROW_STYLE,
      color: "var(--fg)",
      background: active ? "var(--nav-hover)" : "transparent"
    }
  }, icon, /*#__PURE__*/React.createElement("span", {
    className: "flex-1 text-left"
  }, label), /*#__PURE__*/React.createElement(ChevronRight, {
    size: 14,
    "aria-hidden": true,
    style: {
      opacity: 0.5
    }
  })), active && /*#__PURE__*/React.createElement("div", {
    role: "menu",
    className: "absolute z-50 shadow-lg",
    style: {
      left: "calc(100% - 6px)",
      top: -6,
      width: 260,
      ...PANEL_STYLE
    }
  }, /*#__PURE__*/React.createElement(MenuSection, null, children)));
}
Object.assign(__ds_scope, { AvatarMenu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/layout/avatar-menu.tsx", error: String((e && e.message) || e) }); }

// src/components/layout/forma-mark.tsx
try { (() => {
/**
 * Forma mark — two stacked, vertically-symmetric chevrons.
 *
 *  - Outer chevron: the summit / peak (Strava's angular-chevron DNA).
 *  - Inner chevron: a second layer nested inside the peak, reading as
 *    a data / insight stratum laid over the underlying form.
 *  - Symmetry around the vertical axis reinforces "form" and sets it
 *    apart from Strava's directional trail motif.
 */
function FormaMark({
  size = 20,
  strokeWidth = 1.75,
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className,
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 18.5 L12 5 L21.5 18.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 18.5 L12 11.5 L17 18.5"
  }));
}
Object.assign(__ds_scope, { FormaMark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/layout/forma-mark.tsx", error: String((e && e.message) || e) }); }

// src/components/layout/header.tsx
try { (() => {
"use client";

const {
  useSyncExternalStore
} = React;
const TITLES = {
  "/activities": "Activities",
  "/settings": "Settings"
};
function greetingFor(date) {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
function firstName(full) {
  if (!full) return null;
  const token = full.trim().split(/\s+/)[0];
  return token || null;
}
const subscribeMinute = cb => {
  const id = setInterval(cb, 60000);
  return () => clearInterval(id);
};
const minuteSnapshot = () => Math.floor(Date.now() / 60000);
const minuteServerSnapshot = () => 0;
function Header({
  lastSyncedAt,
  userName
}) {
  const pathname = usePathname();
  const isOverview = pathname === "/overview" || pathname.startsWith("/overview/");
  const mounted = useMounted();
  // Subscribed to a 1-minute tick so `formatRelativeTime` re-runs without a
  // setState-in-effect timer. Read but unused: presence in the dep graph is
  // what triggers re-renders.
  useSyncExternalStore(subscribeMinute, minuteSnapshot, minuteServerSnapshot);
  const greeting = mounted ? greetingFor(new Date()) : null;
  const rel = mounted && lastSyncedAt ? formatRelativeTime(lastSyncedAt) : null;
  const staticTitle = Object.entries(TITLES).find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Forma";
  const first = firstName(userName);
  const title = isOverview ? greeting && first ? `Good ${greeting}, ${first}` : greeting ? `Good ${greeting}` : "Overview" : staticTitle;
  return /*#__PURE__*/React.createElement("div", {
    className: "hidden md:flex items-start justify-between px-6 pt-6 pb-4"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "flex items-center font-semibold text-[color:var(--fg)]",
    style: {
      height: "36px",
      fontSize: "16px",
      lineHeight: "24px"
    },
    suppressHydrationWarning: true
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4",
    style: {
      height: "36px"
    }
  }, rel && /*#__PURE__*/React.createElement("span", {
    className: "text-sm",
    style: {
      color: "var(--muted)"
    }
  }, "Last synced ", rel)));
}
Object.assign(__ds_scope, { Header });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/layout/header.tsx", error: String((e && e.message) || e) }); }

// src/components/layout/nav-config.ts
try { (() => {
const NAV_ITEMS = [{
  label: "Overview",
  href: "/overview",
  icon: LayoutGrid
}, {
  label: "Fitness",
  href: "/fitness",
  icon: Activity
}, {
  label: "Activities",
  href: "/activities",
  icon: List
}];
Object.assign(__ds_scope, { NAV_ITEMS });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/layout/nav-config.ts", error: String((e && e.message) || e) }); }

// src/components/layout/page-title.tsx
try { (() => {
/**
 * Design-system page title.
 *
 * Token: 24px / 32px line-height / font-weight 600 / `var(--fg)`.
 *
 * Single source of truth for every page heading in the app and on
 * marketing pages. If you need a different size, you want a different
 * component — eyebrow, section heading, etc. — not this one.
 */
function PageTitle({
  as: Tag = "h1",
  className = "",
  style,
  children
}) {
  return /*#__PURE__*/React.createElement(Tag, {
    className: `font-semibold tracking-tight ${className}`.trim(),
    style: {
      color: "var(--fg)",
      fontSize: 24,
      lineHeight: "32px",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { PageTitle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/layout/page-title.tsx", error: String((e && e.message) || e) }); }

// src/components/layout/page-header.tsx
try { (() => {
function PageHeader({
  title,
  subtitle,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-start justify-between gap-4",
    style: {
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(__ds_scope.PageTitle, {
    style: {
      marginBottom: subtitle ? 6 : 0
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--muted)",
      fontSize: 14,
      lineHeight: "20px"
    }
  }, subtitle)), action);
}
Object.assign(__ds_scope, { PageHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/layout/page-header.tsx", error: String((e && e.message) || e) }); }

// src/components/layout/sidebar.tsx
try { (() => {
"use client";

const {
  useCallback,
  useState
} = React;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const DURATION = 200;

// Sidebar horizontal padding + row inset are calibrated so 18-px nav icons
// are centered at x=32 from the sidebar edge — the same center as the
// 36x36 toggle button in the 64-px collapsed rail. This also pushes the
// label's left edge past the row's right edge when collapsed, so nothing
// peeks through under overflow: hidden.
const SIDE_PAD_X = 14;
const ROW_INSET = 9;
function Sidebar({
  user,
  expanded,
  onToggle,
  width,
  animate
}) {
  const pathname = usePathname();
  return /*#__PURE__*/React.createElement("aside", {
    className: "hidden lg:flex sticky top-0 z-30 flex-col bg-[color:var(--bg)]",
    style: {
      width,
      height: "100dvh",
      paddingLeft: SIDE_PAD_X,
      paddingRight: SIDE_PAD_X,
      paddingTop: 12,
      paddingBottom: 12,
      borderRight: "1px solid var(--border)",
      transition: animate ? `width ${DURATION}ms ${EASE}` : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between",
    style: {
      height: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-1 min-w-0 items-center",
    style: {
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(Link, {
    href: "/overview",
    "aria-label": "Forma home",
    className: "flex items-center",
    style: {
      paddingLeft: ROW_INSET,
      gap: 10,
      color: "var(--fg)",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.FormaMark, {
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold tracking-tight",
    style: {
      fontSize: 15
    }
  }, "Forma"))), /*#__PURE__*/React.createElement(ToggleButton, {
    expanded: expanded,
    onToggle: onToggle
  })), /*#__PURE__*/React.createElement("nav", {
    id: "app-sidebar",
    className: "mt-4 flex flex-col",
    style: {
      gap: 2
    }
  }, __ds_scope.NAV_ITEMS.map(({
    label,
    href,
    icon: Icon
  }) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return /*#__PURE__*/React.createElement(NavItem, {
      key: href,
      label: label,
      href: href,
      Icon: Icon,
      active: active,
      expanded: expanded
    });
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-auto"
  }, /*#__PURE__*/React.createElement(__ds_scope.AvatarMenu, {
    user: user,
    expanded: expanded
  })));
}
function ToggleButton({
  expanded,
  onToggle
}) {
  const [hovered, setHovered] = useState(false);
  const label = expanded ? "Close sidebar" : "Open sidebar";
  return /*#__PURE__*/React.createElement(Tooltip, {
    label: label,
    kbd: "\u2318B"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onToggle,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    "aria-label": label,
    "aria-keyshortcuts": "Meta+B",
    "aria-expanded": expanded,
    "aria-controls": "app-sidebar",
    className: "flex items-center justify-center shrink-0 transition-[background,color] duration-[120ms] hover:bg-[color:var(--nav-hover)]",
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      color: hovered ? "var(--fg)" : "var(--muted)"
    }
  }, /*#__PURE__*/React.createElement(PanelLeft, {
    size: 18,
    "aria-hidden": true
  })));
}
function NavItem({
  label,
  href,
  Icon,
  active,
  expanded
}) {
  const [hovered, setHovered] = useState(false);
  const handleEnter = useCallback(() => setHovered(true), []);
  const handleLeave = useCallback(() => setHovered(false), []);
  const bg = active && hovered ? "var(--nav-hover)" : active ? "var(--nav-active)" : hovered ? "var(--nav-hover)" : "transparent";
  const iconColor = active || hovered ? "var(--fg)" : "var(--muted)";
  const labelColor = active || hovered ? "var(--fg)" : "var(--muted)";
  const link = /*#__PURE__*/React.createElement(Link, {
    href: href,
    "aria-label": label,
    "aria-current": active ? "page" : undefined,
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
    className: "flex items-center transition-[background] duration-[120ms]",
    style: {
      height: 36,
      paddingLeft: ROW_INSET,
      paddingRight: ROW_INSET,
      gap: 10,
      borderRadius: 8,
      background: bg,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    size: 18,
    "aria-hidden": true,
    style: {
      color: iconColor,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-normal",
    style: {
      color: labelColor,
      whiteSpace: "nowrap"
    }
  }, label));
  if (expanded) {
    return link;
  }
  return /*#__PURE__*/React.createElement(Tooltip, {
    label: label
  }, link);
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/layout/sidebar.tsx", error: String((e && e.message) || e) }); }

// src/components/layout/theme-toggle.tsx
try { (() => {
"use client";

const ORDER = ["light", "dark", "system"];
function ThemeToggle({
  className
}) {
  const {
    theme,
    setTheme
  } = useTheme();
  const mounted = useMounted();
  const current = mounted && ORDER.includes(theme) ? theme : "system";
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;
  const label = `Theme: ${current}`;
  const cycle = () => {
    const i = ORDER.indexOf(current);
    setTheme(ORDER[(i + 1) % ORDER.length]);
  };
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: cycle,
    "aria-label": label,
    title: label,
    suppressHydrationWarning: true,
    className: "flex h-9 w-9 items-center justify-center rounded-lg border text-[color:var(--fg)] transition hover:bg-[color:var(--surface)] " + (className ?? ""),
    style: {
      borderColor: "var(--border)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    size: 16,
    "aria-hidden": true
  }));
}
Object.assign(__ds_scope, { ThemeToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/layout/theme-toggle.tsx", error: String((e && e.message) || e) }); }

// src/components/layout/top-bar.tsx
try { (() => {
"use client";

function TopBar({
  user
}) {
  const pathname = usePathname();
  return /*#__PURE__*/React.createElement("header", {
    className: "hidden md:flex lg:hidden sticky top-0 z-30 h-16 items-center justify-between bg-[color:var(--bg)] px-4"
  }, /*#__PURE__*/React.createElement(__ds_scope.Logo, null), /*#__PURE__*/React.createElement("nav", {
    className: "flex items-center gap-2"
  }, __ds_scope.NAV_ITEMS.map(({
    label,
    href,
    icon: Icon
  }) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return /*#__PURE__*/React.createElement(Link, {
      key: href,
      href: href,
      title: label,
      "aria-label": label,
      "aria-current": active ? "page" : undefined,
      className: "flex items-center justify-center transition",
      style: {
        width: "36px",
        height: "36px",
        borderRadius: 12,
        background: active ? "var(--nav-active)" : "transparent",
        color: active ? "var(--accent)" : "var(--muted)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 18,
      "aria-hidden": true
    }));
  })), /*#__PURE__*/React.createElement(__ds_scope.AvatarMenu, {
    user: user,
    size: 36
  }));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/layout/top-bar.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/insight-block.tsx
try { (() => {
"use client";

/**
 * Left-accent insight panel used in hero cards across the app.
 * First sentence renders at fg weight; subsequent sentences render muted.
 * `accentColor` defaults to `--accent` (orange); pass the phase color
 * token for the fitness hero.
 */
function InsightBlock({
  sentences,
  accentColor = "var(--accent)"
}) {
  if (sentences.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl border-l-2 px-4 py-3",
    style: {
      borderLeftColor: accentColor,
      background: `color-mix(in srgb, ${accentColor} 5%, transparent)`
    }
  }, sentences.map((s, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    className: i === 0 ? "text-[14px] leading-[1.5] text-[var(--fg)]" : "mt-1 text-[13px] leading-[1.5] text-[var(--muted)]"
  }, s)));
}
Object.assign(__ds_scope, { InsightBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/insight-block.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/label.tsx
try { (() => {
/**
 * The canonical uppercase label primitive — the small caps line that sits
 * above or below a stat, captions a table column, or labels a chip.
 *
 * Typography contract:
 *   - `md` (default): 12/16 uppercase tracking-0.04em muted. Used under
 *     `<StatTile>` values, `<CardHeader>` tag eyebrows, and any standalone
 *     stat label that doesn't sit inside a tight grid row.
 *   - `sm`: 11/16 uppercase tracking-0.04em muted. Used for table column
 *     headers, narrow chip captions, and other space-constrained slots
 *     where 12px would crowd the row height.
 *
 * The `tracking-0.04em` value is deliberate: tracking-wide (Tailwind's
 * 0.025em) reads too tight at small caps; tracking-widest (0.1em) reads
 * institutional. 0.04em is the system's middle ground.
 *
 * Render via `as` to match the surrounding semantic role — `span` inline,
 * `div` as a block, `p` inside running copy, `th` as a table header cell.
 *
 * Pass extra `className` to layer in spacing or selective color overrides
 * (e.g. `tone="accent"`-style chip use) without re-declaring the type spec.
 */
function Label({
  children,
  size = "md",
  as: Component = "span",
  className = "",
  style,
  "aria-hidden": ariaHidden
}) {
  const sizeClass = size === "sm" ? "text-[11px] leading-[16px]" : "text-[12px] leading-[16px]";
  return /*#__PURE__*/React.createElement(Component, {
    "aria-hidden": ariaHidden,
    style: style,
    className: `uppercase tracking-[0.04em] text-[var(--muted)] ${sizeClass} ${className}`.trim()
  }, children);
}
Object.assign(__ds_scope, { Label });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/label.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/legend.tsx
try { (() => {
/**
 * Legend — universal legend row for activity-detail charts.
 *
 * Three visual vocabularies, chosen per item via `type`:
 *
 *   "area"   — Rounded-rect chip with semi-transparent fill + border.
 *              Use for filled area traces (altitude, ATL, CTL).
 *
 *   "line"   — Short solid horizontal bar (3 px tall, rounded).
 *              Use for single-colour trendlines (heart rate, accent line).
 *
 *   "dashed" — Same bar shape but rendered with repeating-gradient dashes.
 *              Use for secondary/derived lines (TSB/Form).
 *
 *   "pill"   — Bordered pill badge enclosing a dot + label.
 *              Use for categorical zone legends (RPE bands).
 *
 * Pass `items` as a typed array; the component renders them in a wrapping
 * flex row. Drop it into a card's `actions` prop or any inline position.
 */

function Legend({
  items
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 text-[var(--muted)]",
    style: {
      fontSize: 14,
      lineHeight: "20px"
    }
  }, items.map((item, i) => /*#__PURE__*/React.createElement(LegendEntry, {
    key: i,
    item: item
  })));
}
function LegendEntry({
  item
}) {
  if (item.type === "pill") {
    return /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center gap-1.5 text-[var(--muted)]"
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      className: "h-2 w-2 shrink-0 rounded-full",
      style: {
        background: item.color
      }
    }), item.label);
  }
  return /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Swatch, {
    item: item
  }), item.label);
}
function Swatch({
  item
}) {
  if (item.type === "dashed") {
    return /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      className: "inline-block h-[3px] w-4 shrink-0 rounded-full",
      style: {
        background: `repeating-linear-gradient(90deg, ${item.color} 0 4px, transparent 4px 7px)`
      }
    });
  }
  if (item.type === "line") {
    return /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      className: "inline-block h-[3px] w-4 shrink-0 rounded-full",
      style: {
        background: item.color
      }
    });
  }

  // "area"
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    className: "inline-block h-2.5 w-4 shrink-0 rounded-[3px]",
    style: {
      background: `color-mix(in srgb, ${item.color} 22%, transparent)`,
      border: `1px solid color-mix(in srgb, ${item.color} 50%, transparent)`
    }
  });
}
Object.assign(__ds_scope, { Legend });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/legend.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/pill-toggle.tsx
try { (() => {
"use client";

/**
 * Compact two/three-option pill toggle used in card `actions` slots
 * (Splits switching splits/laps, Zones switching HR/cadence). Default
 * font sizing (14/20) keeps it inline with header copy without feeling
 * heavier than the card title.
 */
function PillToggle({
  options,
  value,
  onChange,
  ariaLabel
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "group",
    "aria-label": ariaLabel,
    className: "flex items-center rounded-full border border-[var(--border)] p-0.5",
    style: {
      fontSize: 14,
      lineHeight: "20px"
    }
  }, options.map(opt => {
    const active = value === opt.value;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.value,
      type: "button",
      "aria-pressed": active,
      onClick: () => onChange(opt.value),
      className: `h-7 rounded-full px-3 transition-colors ${active ? "bg-[color-mix(in_srgb,var(--fg)_8%,transparent)] text-[var(--fg)]" : "text-[var(--muted)]"}`
    }, opt.label);
  }));
}
Object.assign(__ds_scope, { PillToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/pill-toggle.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/sortable-header.tsx
try { (() => {
"use client";

const {
  useCallback,
  useState
} = React;
/**
 * Canonical class string for a sortable table header row container.
 * Apply to the wrapping div alongside your grid/flex layout.
 *
 * @example
 * <div className={`grid grid-cols-[...] px-5 ${TABLE_HEADER_CLASS}`}>
 *   <SortHeader ... />
 * </div>
 */
const TABLE_HEADER_CLASS = "pt-3 pb-2 text-[12px] font-medium leading-[16px] tracking-[0.06em] uppercase text-[var(--muted)]";

/**
 * Three-state header toggle: idle → desc → asc → idle. Returning to idle
 * lets each card fall back to its own default order (chronological splits,
 * Z-high → Z-low zones) without forcing a sticky sort.
 */
function useSortToggle(initialSort = null) {
  const [sort, setSort] = useState(initialSort);
  const toggle = useCallback(column => {
    setSort(prev => {
      if (!prev || prev.column !== column) return {
        column,
        direction: "desc"
      };
      if (prev.direction === "desc") return {
        column,
        direction: "asc"
      };
      return null;
    });
  }, []);
  return [sort, toggle];
}
function compareNullable(a, b, dir) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return dir === "asc" ? a - b : b - a;
}
function SortHeader({
  column,
  label,
  align = "left",
  sort,
  onClick
}) {
  const isActive = sort?.column === column;
  const isAscending = isActive && sort?.direction === "asc";
  const justify = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onClick(column),
    className: `flex w-full items-center gap-1 p-0 uppercase tracking-[0.04em] transition-colors duration-[120ms] hover:text-[var(--fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${justify}`,
    style: {
      color: isActive ? "var(--fg)" : "inherit",
      fontSize: "inherit",
      lineHeight: "inherit"
    },
    "aria-label": isActive ? `Sort by ${label}, currently ${isAscending ? "ascending" : "descending"}. Click to ${isAscending ? "clear sort" : "sort ascending"}.` : `Sort by ${label}`
  }, /*#__PURE__*/React.createElement("span", null, label), isActive && (isAscending ? /*#__PURE__*/React.createElement(ChevronUp, {
    size: 14,
    "aria-hidden": true,
    style: {
      color: "var(--accent)",
      flexShrink: 0
    }
  }) : /*#__PURE__*/React.createElement(ChevronDown, {
    size: 14,
    "aria-hidden": true,
    style: {
      color: "var(--accent)",
      flexShrink: 0
    }
  })));
}
Object.assign(__ds_scope, { TABLE_HEADER_CLASS, useSortToggle, compareNullable, SortHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/sortable-header.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/stat-tile.tsx
try { (() => {
"use client";

const {
  useEffect,
  useMemo,
  useState
} = React;
/**
 * The single value-over-label primitive for the app. Renders one stat with
 * the canonical typography contract:
 *   - Value: font-mono medium tabular-nums (size from `variant`).
 *   - Label: 12/16 uppercase tracking-0.04em muted, mt-2 below the value.
 *   - Optional `delta`: 12/16 mono tabular-nums tag inline with the value,
 *     tinted by direction (up→z2, down→z4, flat→muted).
 *   - Optional `sub`: 12/16 muted-2 line below the label.
 *
 * ## Hierarchy contract
 *
 * Variants drive size hierarchy across a page:
 *   - `primary` (24/32) — reserved for the **page-level insight card** (the
 *     one a reader's eye should land on first). Use **at most once** per
 *     page; the Hero strip on activity-detail is the canonical example.
 *   - `secondary` (18/24, **default**) — every other stat: route footers,
 *     stat strips, card metrics. Quieter so it doesn't compete with the
 *     primary insight.
 *
 * Default is `secondary` on purpose: opting *into* primary forces a deliberate
 * choice and keeps the hierarchy honest.
 *
 * ## Surfaces
 *
 *   - `default` — owns its padding (`px-5 py-5`), optional left divider via
 *     `divided`. Use inside an explicit row or grid that already provides the
 *     surface fill.
 *   - `strip` — used inside `<StatStrip>`, which paints the hairline grid
 *     behind the cells. The cell paints `bg-[var(--surface)]` so the parent
 *     border bleeds through `gap-px` as a 1px divider.
 *
 * ## Animation
 *
 * String values count up on mount (eased over 1.2s); reduced-motion users see
 * the final value immediately. Non-string `value` (e.g. JSX) renders static.
 */
function StatTile({
  label,
  value,
  accent,
  divided,
  variant = "secondary",
  onClick,
  active,
  tone,
  delta,
  valueAdornment,
  sub,
  surface = "default"
}) {
  const valueText = typeof value === "string" ? value : "";
  const valueColor = accent ?? (tone === "up" ? "var(--z2)" : tone === "down" ? "var(--z4)" : tone === "neutral" ? "var(--fg)" : undefined);
  const valueStyle = variant === "secondary" ? {
    fontSize: 18,
    lineHeight: "24px",
    color: valueColor
  } : {
    fontSize: 24,
    lineHeight: "32px",
    color: valueColor
  };
  const deltaColor = delta ? delta.direction === "up" ? "var(--z2)" : delta.direction === "down" ? "var(--z4)" : "var(--muted)" : undefined;
  const valueRowClass = valueAdornment ? "flex items-center gap-3" : delta ? "flex items-baseline gap-2" : undefined;
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    className: valueRowClass
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-mono font-medium tabular-nums",
    style: valueStyle
  }, typeof value === "string" ? /*#__PURE__*/React.createElement(CountUpValue, {
    value: value
  }) : value), valueAdornment, delta && /*#__PURE__*/React.createElement("span", {
    className: "font-mono tabular-nums"
    // Delta sits next to the value at 14/20 so the trend reads as a
    // companion line rather than a footnote — the previous 12/16
    // sat too far below the value's 18/24 weight to be glanceable
    // alongside it.
    ,
    style: {
      fontSize: 14,
      lineHeight: "20px",
      color: deltaColor
    }
  }, delta.value)), /*#__PURE__*/React.createElement(__ds_scope.Label, {
    as: "div",
    className: "mt-2",
    "aria-hidden": true
  }, label), sub && /*#__PURE__*/React.createElement("div", {
    className: "mt-1 text-[12px] leading-[16px] text-[var(--muted-2)]"
  }, sub));

  // Surface chrome differs between standalone tiles and strip-cell tiles.
  // Strip cells delegate divider rendering to the parent's hairline grid; a
  // `divided` prop is meaningless inside a strip.
  if (surface === "strip") {
    if (onClick) {
      return /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: onClick,
        role: "listitem",
        "aria-current": active ? "true" : undefined,
        "aria-label": valueText ? `${label}: ${valueText}` : label
        // Inset focus ring (offset -2): clickable tiles abut the parent
        // hairline grid / each other directly, so an outset ring would
        // bleed into the neighbor cell. The global accent outline still
        // applies — we just pull it inside the cell bounds. We also
        // give the cell itself a focus-only 6px border-radius so the
        // outline tracks rounded corners on tiles that land at the
        // ends of a strip (which inherit the parent card's rounding);
        // without this the inset rectangle reads as sharp edges that
        // collide with the surrounding curve. The first/last children
        // also pick up bottom-left / bottom-right `rounded-2xl` to
        // match the parent FeatureCard's 16px curve exactly — those
        // are the corners that visibly butt up against the card's
        // clipped edge.
        ,
        className: `flex flex-col items-start bg-[var(--surface)] p-5 text-left transition-colors hover:bg-[var(--row-hover)] focus-visible:rounded-[6px] first:focus-visible:rounded-bl-2xl last:focus-visible:rounded-br-2xl focus-visible:[outline-offset:-2px] ${active ? "bg-[var(--row-hover)]" : ""}`
      }, inner);
    }
    return /*#__PURE__*/React.createElement("div", {
      role: "listitem",
      "aria-label": valueText ? `${label}: ${valueText}` : label,
      className: "flex flex-col bg-[var(--surface)] p-5"
    }, inner);
  }
  if (onClick) {
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClick,
      role: "listitem",
      "aria-current": active ? "true" : undefined,
      "aria-label": valueText ? `${label}: ${valueText}` : label
      // Inset focus ring — see the strip-surface branch above for the
      // rationale. Same situation here: divided tiles share a 1px border
      // with their neighbor, so an outset ring would crash into it. The
      // focus-only 6px border-radius (with `rounded-bl-2xl` /
      // `rounded-br-2xl` on the first / last children) keeps the
      // outline from reading as sharp edges when a tile sits at a
      // rounded card corner (e.g. the averages strip footer on
      // RouteFeature).
      ,
      className: `flex h-full flex-col items-start px-5 py-5 text-left transition-colors hover:bg-[var(--row-hover)] focus-visible:rounded-[6px] first:focus-visible:rounded-bl-2xl last:focus-visible:rounded-br-2xl focus-visible:[outline-offset:-2px] ${active ? "bg-[var(--row-hover)]" : ""} ${divided ? "border-l border-[var(--border)]" : ""}`
    }, inner);
  }
  return /*#__PURE__*/React.createElement("div", {
    role: "listitem",
    "aria-label": valueText ? `${label}: ${valueText}` : label,
    className: `flex h-full flex-col px-5 py-5 ${divided ? "border-l border-[var(--border)]" : ""}`
  }, inner);
}

/* ── Count-up animation ──────────────────────────────────────── */

const DURATION_MS = 1200;
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
/**
 * Parse a formatted display string into something animatable. Handles:
 *   - Time:  "32:15", "1:32:15", "5:24 / km"
 *   - Number: "6.09 km", "156 bpm", "3.2%", "1,234 m"
 * Falls back to "static" for non-numeric values like "—".
 */
function parse(value) {
  const timeMatch = value.match(/^(\d+):(\d{2})(?::(\d{2}))?(.*)$/);
  if (timeMatch) {
    const [, a, b, c, rest] = timeMatch;
    const hasHours = c != null;
    const total = hasHours ? Number(a) * 3600 + Number(b) * 60 + Number(c) : Number(a) * 60 + Number(b);
    return {
      kind: "time",
      total,
      hasHours,
      suffix: rest
    };
  }
  const numMatch = value.match(/^([^\d-]*)(-?[\d,]+(?:\.(\d+))?)(.*)$/);
  if (numMatch) {
    const [, prefix, raw, decimalDigits, suffix] = numMatch;
    const total = Number(raw.replace(/,/g, ""));
    if (Number.isFinite(total)) {
      return {
        kind: "number",
        total,
        decimals: decimalDigits ? decimalDigits.length : 0,
        prefix,
        suffix
      };
    }
  }
  return {
    kind: "static"
  };
}
function formatTime(seconds, hasHours) {
  const s = Math.max(0, Math.floor(seconds));
  if (hasHours) {
    const h = Math.floor(s / 3600);
    const m = Math.floor(s % 3600 / 60);
    const r = s % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
function formatNumber(n, decimals, sample) {
  const fixed = n.toFixed(decimals);
  // Preserve thousands separator if the sample used one.
  if (!sample.includes(",")) return fixed;
  const [intPart, fracPart] = fixed.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fracPart != null ? `${withCommas}.${fracPart}` : withCommas;
}
function render(parsed, t, finalValue) {
  if (parsed.kind === "static") return finalValue;
  if (parsed.kind === "time") {
    const current = parsed.total * t;
    return `${formatTime(current, parsed.hasHours)}${parsed.suffix}`;
  }
  const current = parsed.total * t;
  const numStr = formatNumber(current, parsed.decimals, finalValue);
  return `${parsed.prefix}${numStr}${parsed.suffix}`;
}
function CountUpValue({
  value
}) {
  const parsed = useMemo(() => parse(value), [value]);
  // Initial render uses the final value so SSR markup matches the first
  // client paint. The animation kicks in on mount, jumping to 0 then ramping.
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (parsed.kind === "static") {
      // Defer to escape the effect body — keeps `react-hooks/set-state-in-effect`
      // happy while still syncing display when the value prop changes.
      queueMicrotask(() => setDisplay(value));
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setDisplay(value));
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / DURATION_MS, 1);
      setDisplay(render(parsed, easeOutCubic(t), value));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [parsed, value]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, display);
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/stat-tile.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/stat-strip.tsx
try { (() => {
/**
 * Hairline-grid wrapper for a row of stat cells. The grid background is
 * `var(--border)`; each cell paints `var(--surface)` so the 1px gap reads as
 * a divider. `bg-clip-padding` prevents the cell fill from stacking against
 * an abutting `border-t` / `border-b` and producing a doubled-alpha edge.
 *
 * Pair with `<StatCell>` for the standard pattern (delegates to
 * `<StatTile variant="secondary" surface="strip">`). Drop a custom child in
 * via `<StatStripCustomCell>` when you need a non-standard cell (phase pill,
 * tag, etc.) and still want it to share the strip's surface fill and padding.
 *
 * `edge` controls which side abuts other content via a 1px stroke; pick the
 * side facing the next block in the card.
 */
function StatStrip({
  children,
  edge = "top"
}) {
  const edgeClass = edge === "top" ? "border-t border-[var(--border)]" : edge === "bottom" ? "border-b border-[var(--border)]" : edge === "both" ? "border-y border-[var(--border)]" : "";
  return /*#__PURE__*/React.createElement("div", {
    className: `grid grid-cols-2 gap-px bg-[var(--border)] bg-clip-padding md:grid-cols-4 ${edgeClass}`
  }, children);
}
/**
 * Standard strip cell — a thin facade around `<StatTile variant="secondary"
 * surface="strip">`. All cell typography lives in StatTile; this component
 * exists so call-sites read as a strip composition (`StatStrip > StatCell`)
 * rather than StatTile-with-modifiers.
 */
function StatCell({
  label,
  value,
  tone,
  accent,
  sub,
  delta
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.StatTile, {
    variant: "secondary",
    surface: "strip",
    label: label,
    value: value,
    tone: tone,
    accent: accent,
    sub: sub,
    delta: delta
  });
}

/**
 * Wrapper for non-standard cells — keeps the surface fill and padding rule
 * consistent so a custom cell doesn't visually fall out of the strip.
 */
function StatStripCustomCell({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col bg-[var(--surface)] p-5"
  }, children);
}
Object.assign(__ds_scope, { StatStrip, StatCell, StatStripCustomCell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/stat-strip.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/subtitle.tsx
try { (() => {
/**
 * Renders subtitle clauses joined by 2×2px dot dividers (10px gap each side).
 * Falsy parts are filtered out. Matches the card-subtitle pattern in voices.md
 * — short noun phrases, dropped articles, no hype.
 *
 * `parts` accepts either an array of ReactNodes or a plain string. Plain
 * strings are split on the legacy " · " middle-dot separator so call sites
 * that pass a single formatted string don't need manual splitting.
 */
function Subtitle({
  parts
}) {
  const list = typeof parts === "string" ? parts.split(" · ") : parts;
  const visible = list.filter(p => p !== null && p !== undefined && p !== false && p !== "");
  return /*#__PURE__*/React.createElement(React.Fragment, null, visible.map((part, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    className: "mx-2.5 inline-block h-[2px] w-[2px] rounded-full bg-[var(--muted-2)] align-middle"
  }), part)));
}
Object.assign(__ds_scope, { Subtitle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/subtitle.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/card-header.tsx
try { (() => {
/**
 * Canonical header chrome for the app's card surfaces — Progress cards,
 * Milestones tiles, Feature cards on the Overview tab. Centralizes the
 * title/subtitle scale, the optional eyebrow tag, the right-side actions
 * slot, and the 1px `border-b` separator.
 *
 * Typography contract:
 *   - Title: 15/24 font-medium tracking-[-0.005em], `truncate`.
 *   - Subtitle: 14/20 muted, accepts `ReactNode`. String subtitles are
 *     auto-split on " · " and routed through `<Subtitle>` so legacy
 *     fixture copy upgrades to dot-divider rendering for free.
 *   - Tag eyebrow (optional): 12/16 uppercase tracking-0.04em muted —
 *     same spec as `<StatTile>`'s label so eyebrows don't compete with
 *     stat labels elsewhere on the page.
 *
 * Actions slot is a flex row aligned to the right edge; pass buttons,
 * legends, save indicators, etc.
 */
function CardHeader({
  title,
  subtitle,
  tag,
  actions
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "flex shrink-0 items-center gap-4 border-b border-[var(--border)] p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "min-w-0 flex-1"
  }, tag ? /*#__PURE__*/React.createElement(__ds_scope.Label, {
    as: "div",
    className: "mb-[2px] font-medium"
  }, tag) : null, /*#__PURE__*/React.createElement("h3", {
    className: "truncate text-[15px] font-medium tracking-[-0.005em] text-[var(--fg)]"
  }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
    className: "mt-1 truncate text-[14px] leading-[20px] text-[var(--muted)]"
  }, typeof subtitle === "string" ? /*#__PURE__*/React.createElement(__ds_scope.Subtitle, {
    parts: subtitle
  }) : subtitle) : null), actions ? /*#__PURE__*/React.createElement("div", {
    className: "flex shrink-0 items-center gap-2"
  }, actions) : null);
}
Object.assign(__ds_scope, { CardHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/card-header.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/card.tsx
try { (() => {
"use client";

/**
 * Universal card surface. Three structural variants driven by `variant`:
 *
 *   "default" — Progress-tab card. Auto-height, `mb-4` spacing, children
 *               render directly (no padding wrapper — StatStrip fills edge-to-edge).
 *               Use `CardPartialNotice` / `CardEmptyState` for data-state handling.
 *
 *   "feature" — Overview-tab centrepiece. `<section>`, `h-full min-h-0 flex-col`
 *               to fill its grid cell. Body wrapped in `p-5 flex-1`. Optional
 *               `footer` ReactNode separated by a `border-t`.
 *
 *   "tile"    — Milestones tile. Centered body (`justify-center`); pass
 *               `bodyAlign="start"` for bar charts / lists. Optional string
 *               `footer` rendered as 14/20 muted text below a `border-t`.
 */
function Card({
  title,
  subtitle,
  tag,
  actions,
  children,
  footer,
  variant = "default",
  bodyAlign = "center"
}) {
  const header = /*#__PURE__*/React.createElement(__ds_scope.CardHeader, {
    title: title,
    subtitle: subtitle,
    tag: tag,
    actions: actions
  });
  if (variant === "feature") {
    return /*#__PURE__*/React.createElement("section", {
      className: "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
    }, header, /*#__PURE__*/React.createElement("div", {
      className: "flex min-h-0 flex-1 flex-col p-5"
    }, children), footer != null ? /*#__PURE__*/React.createElement("footer", {
      className: "shrink-0 border-t border-[var(--border)] p-5"
    }, footer) : null);
  }
  if (variant === "tile") {
    return /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
    }, header, /*#__PURE__*/React.createElement("div", {
      className: `flex flex-1 justify-center p-5 ${bodyAlign === "start" ? "items-start" : "items-center"}`
    }, children), footer != null && /*#__PURE__*/React.createElement("div", {
      className: "border-t border-[var(--border)] p-5 text-[14px] leading-[20px] text-[var(--muted)]"
    }, footer));
  }

  // "default"
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
  }, header, children);
}

// ── Body-state helpers (used with "default" variant) ──────────────────────────

/**
 * Soft "comes alive after N more sessions" notice. Sits above the card body
 * when there is partial data. Voice rule: present-tense, concrete count.
 */
function CardPartialNotice({
  message
}) {
  return /*#__PURE__*/React.createElement("p", {
    className: "px-5 pb-2 pt-4 text-[12px] leading-[16px] text-[var(--muted-2)]"
  }, message);
}

/**
 * Body-replacement empty state. Renders when the card has zero usable data.
 * One plain-copy sentence + an optional CTA (e.g. "Add a goal").
 */
function CardEmptyState({
  message,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "p-5"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[14px] leading-[20px] text-[var(--muted)]"
  }, message), action && /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, action));
}
Object.assign(__ds_scope, { Card, CardPartialNotice, CardEmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/card.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/tabs.tsx
try { (() => {
"use client";

const {
  createContext,
  useContext,
  useState
} = React;
const TabsContext = createContext(null);
function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}
function Tabs({
  defaultValue,
  children,
  className
}) {
  const [value, setValue] = useState(defaultValue);
  return /*#__PURE__*/React.createElement(TabsContext.Provider, {
    value: {
      value,
      setValue
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: className
  }, children));
}
function TabList({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    className: "flex gap-0.5 border-b border-[var(--border)] px-3"
  }, children);
}
function Tab({
  value,
  children
}) {
  const {
    value: current,
    setValue
  } = useTabs();
  const active = current === value;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "tab",
    "aria-selected": active,
    onClick: () => setValue(value),
    className: `relative h-11 px-3.5 text-[13px] font-medium tracking-[-0.005em] transition-colors ${active ? "text-[var(--fg)]" : "text-[var(--muted)] hover:text-[color-mix(in_srgb,var(--fg)_72%,transparent)]"}`
  }, children, active && /*#__PURE__*/React.createElement("span", {
    className: "absolute inset-x-3 -bottom-px h-[2px] rounded-t bg-[var(--accent)]"
  }));
}
function TabPanel({
  value,
  children,
  className
}) {
  const {
    value: current
  } = useTabs();
  if (current !== value) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: className
  }, children);
}
Object.assign(__ds_scope, { Tabs, TabList, Tab, TabPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/tabs.tsx", error: String((e && e.message) || e) }); }

// src/components/ui/tooltip.tsx
try { (() => {
"use client";

const {
  useCallback,
  useEffect,
  useRef,
  useState
} = React;
const DEFAULT_DELAY = 300;
const DEFAULT_OFFSET = 10;
function Tooltip({
  label,
  kbd,
  side = "right",
  offset = DEFAULT_OFFSET,
  delay = DEFAULT_DELAY,
  children
}) {
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);
  const show = useCallback(() => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(true), delay);
  }, [delay]);
  const hide = useCallback(() => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
    setVisible(false);
  }, []);
  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "relative",
    onMouseEnter: show,
    onMouseLeave: hide
  }, children, visible && /*#__PURE__*/React.createElement("div", {
    role: "tooltip",
    style: positionStyle(side, offset, !!kbd)
  }, /*#__PURE__*/React.createElement("span", null, label), kbd && /*#__PURE__*/React.createElement(TooltipKbd, null, kbd)));
}
function TooltipKbd({
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      height: 18,
      paddingLeft: 5,
      paddingRight: 5,
      marginLeft: 8,
      borderRadius: 4,
      fontSize: 11,
      fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
      background: "color-mix(in oklab, var(--bg) 20%, transparent)",
      color: "color-mix(in oklab, var(--bg) 80%, var(--fg))",
      border: "1px solid color-mix(in oklab, var(--bg) 25%, transparent)"
    }
  }, children);
}
function positionStyle(side, offset, hasKbd) {
  const base = {
    position: "absolute",
    height: 32,
    display: "flex",
    alignItems: "center",
    paddingLeft: 10,
    // When a kbd chip is present, trim the trailing padding so the chip
    // sits visually snug to the pill's right edge.
    paddingRight: hasKbd ? 6 : 10,
    borderRadius: 8,
    background: "var(--fg)",
    color: "var(--bg)",
    whiteSpace: "nowrap",
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1,
    zIndex: 50,
    pointerEvents: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
  };
  switch (side) {
    case "right":
      return {
        ...base,
        left: `calc(100% + ${offset}px)`,
        top: "50%",
        transform: "translateY(-50%)"
      };
    case "left":
      return {
        ...base,
        right: `calc(100% + ${offset}px)`,
        top: "50%",
        transform: "translateY(-50%)"
      };
    case "top":
      return {
        ...base,
        bottom: `calc(100% + ${offset}px)`,
        left: "50%",
        transform: "translateX(-50%)"
      };
    case "bottom":
      return {
        ...base,
        top: `calc(100% + ${offset}px)`,
        left: "50%",
        transform: "translateX(-50%)"
      };
  }
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components/ui/tooltip.tsx", error: String((e && e.message) || e) }); }

// ui_kits/app/app.jsx
try { (() => {
/* global React */
const {
  useState
} = React;

// ─── Forma wordmark (PR #45 — wordmark + accent dot) ─────────
function FormaWordmark() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "baseline",
      gap: 3,
      color: "var(--fg)",
      fontWeight: 600,
      fontSize: 16,
      letterSpacing: "-0.005em",
      whiteSpace: "nowrap"
    }
  }, "Forma", /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 4,
      borderRadius: "50%",
      background: "var(--accent)",
      flexShrink: 0,
      alignSelf: "baseline",
      display: "inline-block"
    },
    "aria-hidden": true
  }));
}

// ─── Lucide-style inline icons ──────────────────────────────
const I = {
  grid: /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"
  })),
  activity: /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M22 12h-4l-3 9L9 3l-3 9H2"
  })),
  list: /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
  })),
  panelLeft: /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 3v18"
  })),
  share: /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "5",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "19",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"
  })),
  more: /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "5",
    cy: "12",
    r: "1"
  }))
};

// ─── Sidebar ────────────────────────────────────────────────
function Sidebar({
  active = "/activities"
}) {
  const [expanded, setExpanded] = useState(true);
  const w = expanded ? 240 : 64;
  const items = [{
    label: "Overview",
    href: "/overview",
    icon: I.grid
  }, {
    label: "Fitness",
    href: "/fitness",
    icon: I.activity
  }, {
    label: "Activities",
    href: "/activities",
    icon: I.list
  }];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: w,
      height: "100dvh",
      position: "sticky",
      top: 0,
      flexShrink: 0,
      background: "var(--bg)",
      borderRight: "1px solid var(--border)",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      transition: "width 200ms cubic-bezier(0.32, 0.72, 0, 1)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 48,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    "aria-label": "Forma home",
    style: {
      display: "flex",
      alignItems: "baseline",
      paddingLeft: 9,
      textDecoration: "none",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement(FormaWordmark, null))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setExpanded(e => !e),
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      border: 0,
      background: "transparent",
      color: "var(--muted)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    onMouseEnter: e => e.currentTarget.style.background = "var(--nav-hover)",
    onMouseLeave: e => e.currentTarget.style.background = "transparent"
  }, I.panelLeft)), /*#__PURE__*/React.createElement("nav", {
    style: {
      marginTop: 16,
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, items.map(item => {
    const isActive = active.startsWith(item.href);
    return /*#__PURE__*/React.createElement("a", {
      key: item.href,
      href: "#",
      style: {
        height: 36,
        paddingLeft: 9,
        paddingRight: 9,
        gap: 10,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: isActive ? "var(--nav-active)" : "transparent",
        color: isActive ? "var(--fg)" : "var(--muted)",
        textDecoration: "none",
        fontSize: 14,
        whiteSpace: "nowrap",
        transition: "background 120ms ease-out"
      },
      onMouseEnter: e => {
        if (!isActive) e.currentTarget.style.background = "var(--nav-hover)";
      },
      onMouseLeave: e => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flexShrink: 0
      }
    }, item.icon), expanded && /*#__PURE__*/React.createElement("span", null, item.label));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      padding: "0 4px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 6px",
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 9999,
      flexShrink: 0,
      background: "linear-gradient(135deg, #E8612B, #C46CB0)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: 12,
      fontWeight: 600
    }
  }, "JM"), expanded && /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--fg)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, "Jordan Maines")))));
}

// ─── Page header ────────────────────────────────────────────
function PageHeader({
  title,
  lastSynced
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "24px 32px 16px"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 16,
      lineHeight: "24px",
      fontWeight: 600,
      margin: 0,
      color: "var(--fg)"
    }
  }, title), lastSynced && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "var(--muted)"
    }
  }, "Last synced ", lastSynced));
}

// ─── Tabs ────────────────────────────────────────────────────
function Tabs({
  tabs,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 24,
      borderBottom: "1px solid var(--border)",
      padding: "0 32px"
    }
  }, tabs.map(t => {
    const active = value === t;
    return /*#__PURE__*/React.createElement("button", {
      key: t,
      type: "button",
      onClick: () => onChange(t),
      style: {
        position: "relative",
        padding: "12px 0",
        fontSize: 14,
        fontWeight: 500,
        color: active ? "var(--fg)" : "var(--muted)",
        background: "transparent",
        border: 0,
        cursor: "pointer",
        transition: "color 120ms ease-out"
      }
    }, t, active && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        height: 2,
        background: "var(--accent)",
        borderRadius: 2
      }
    }));
  }));
}

// ─── Activity header ────────────────────────────────────────
function ActivityHeader() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 24,
      padding: "0 10px",
      background: "rgba(224,104,56,0.12)",
      color: "#C45525",
      borderRadius: 9999,
      fontSize: 12,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 9999,
      background: "#E06838"
    }
  }), "Run"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--muted)"
    }
  }, "2 days ago \xB7 6:42 am")), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      lineHeight: "32px",
      fontWeight: 600,
      letterSpacing: "-0.005em",
      margin: 0
    }
  }, "Regent Park morning loop"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 6,
      fontSize: 14,
      color: "var(--muted)"
    }
  }, "5.03 km ", /*#__PURE__*/React.createElement(Dot, null), " 22:48 ", /*#__PURE__*/React.createElement(Dot, null), " 4:32 /km ", /*#__PURE__*/React.createElement(Dot, null), " tempo"));
}
function Dot() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      width: 2,
      height: 2,
      borderRadius: 9999,
      background: "var(--muted-2)",
      verticalAlign: "middle",
      margin: "0 10px"
    },
    "aria-hidden": true
  });
}

// ─── Hero strip ─────────────────────────────────────────────
function HeroStrip() {
  const accent = "#E06838";
  const metrics = [{
    label: "Distance",
    value: "5.03",
    unit: "km"
  }, {
    label: "Time",
    value: "22:48",
    unit: null
  }, {
    label: "Pace",
    value: "4:32",
    unit: "/km",
    accent: true
  }, {
    label: "Avg HR",
    value: "152",
    unit: "bpm"
  }, {
    label: "Cadence",
    value: "178",
    unit: "spm"
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "24px 28px",
      background: `linear-gradient(135deg, rgba(224,104,56,0.05), rgba(224,104,56,0.01))`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      background: accent
    },
    "aria-hidden": true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: accent,
      marginBottom: 8
    }
  }, "Insight"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      lineHeight: "20px",
      color: "var(--fg)"
    }
  }, "3rd-fastest pace on this 5 km route across 6 attempts.", " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--muted)"
    }
  }, "HR held 4 bpm below your usual at this pace \u2013 fresh legs."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      borderTop: "1px solid var(--border)"
    }
  }, metrics.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: m.label,
    style: {
      padding: "20px",
      borderLeft: i === 0 ? "none" : "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4,
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 500,
      fontSize: 24,
      lineHeight: "32px",
      color: m.accent ? accent : "var(--fg)"
    }
  }, m.value, m.unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "var(--muted)"
    }
  }, m.unit)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: "var(--muted)"
    }
  }, m.label)))));
}

// ─── Card ───────────────────────────────────────────────────
function Card({
  title,
  subtitle,
  actions,
  children,
  footer
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: 20,
      borderBottom: "1px solid var(--border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 15,
      lineHeight: "24px",
      fontWeight: 500,
      letterSpacing: "-0.005em",
      color: "var(--fg)"
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "4px 0 0",
      fontSize: 14,
      lineHeight: "20px",
      color: "var(--muted)"
    }
  }, subtitle)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexShrink: 0
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20
    }
  }, children), footer && /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: "1px solid var(--border)",
      padding: 20,
      fontSize: 14,
      color: "var(--muted)"
    }
  }, footer));
}

// ─── Pill toggle ────────────────────────────────────────────
function PillToggle({
  options,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      padding: 3,
      background: "var(--pill-bg)",
      borderRadius: 9999,
      gap: 2
    }
  }, options.map(o => {
    const active = o === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o,
      type: "button",
      onClick: () => onChange(o),
      style: {
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 9999,
        cursor: "pointer",
        border: 0,
        color: active ? "var(--fg)" : "var(--muted)",
        background: active ? "var(--surface)" : "transparent",
        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
        transition: "all 120ms ease-out"
      }
    }, o);
  }));
}

// ─── Quick stats grid ───────────────────────────────────────
function QuickStats() {
  const stats = [{
    label: "Elevation",
    value: "84",
    unit: "m"
  }, {
    label: "Calories",
    value: "412",
    unit: "kcal"
  }, {
    label: "Effort",
    value: "6.2",
    unit: "/10"
  }, {
    label: "Splits",
    value: "5",
    unit: "× 1 km"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12
    }
  }, stats.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4,
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 500,
      fontSize: 18,
      lineHeight: "24px"
    }
  }, s.value, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--muted)"
    }
  }, s.unit)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: "var(--muted)"
    }
  }, s.label))));
}

// ─── Route map placeholder ──────────────────────────────────
function RouteMap() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      aspectRatio: "16/7",
      background: "#EFEDE8",
      borderRadius: 10,
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 800 350",
    width: "100%",
    height: "100%",
    preserveAspectRatio: "none",
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("pattern", {
    id: "grid",
    width: "40",
    height: "40",
    patternUnits: "userSpaceOnUse"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 40 0 L 0 0 0 40",
    fill: "none",
    stroke: "rgba(0,0,0,0.05)",
    strokeWidth: "1"
  }))), /*#__PURE__*/React.createElement("rect", {
    width: "800",
    height: "350",
    fill: "url(#grid)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 80 260 C 140 220, 200 180, 260 200 S 380 280, 460 260 S 600 160, 680 180 L 720 200",
    fill: "none",
    stroke: "#E06838",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "80",
    cy: "260",
    r: "6",
    fill: "#E06838"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "720",
    cy: "200",
    r: "6",
    fill: "#E06838",
    stroke: "white",
    strokeWidth: "2"
  })));
}

// ─── HR / pace chart ────────────────────────────────────────
function PaceChart() {
  const points = Array.from({
    length: 60
  }, (_, i) => {
    const x = i / 59 * 100;
    const base = 50 + Math.sin(i * 0.18) * 12;
    const noise = Math.sin(i * 1.7) * 3 + Math.cos(i * 0.7) * 2;
    return {
      x,
      y: base + noise
    };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = path + ` L 100 100 L 0 100 Z`;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 180,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none",
    width: "100%",
    height: "100%"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "paceFill",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "#E06838",
    stopOpacity: "0.22"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "#E06838",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: "url(#paceFill)"
  }), /*#__PURE__*/React.createElement("path", {
    d: path,
    fill: "none",
    stroke: "#E06838",
    strokeWidth: "0.8",
    vectorEffect: "non-scaling-stroke"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 0 58 C 20 56, 40 60, 60 58 S 90 56, 100 60",
    fill: "none",
    stroke: "rgba(0,0,0,0.25)",
    strokeWidth: "0.6",
    strokeDasharray: "2 2",
    vectorEffect: "non-scaling-stroke"
  })));
}
function ChartLegend() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      fontSize: 12,
      color: "var(--muted)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 2,
      background: "#E06838"
    }
  }), " This run"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 0,
      borderTop: "2px dashed rgba(0,0,0,0.4)"
    }
  }), " Your median (6 attempts)"));
}

// ─── Splits table ───────────────────────────────────────────
function SplitsTable() {
  const splits = [{
    km: 1,
    pace: "4:38",
    hr: 144,
    delta: "−4 s"
  }, {
    km: 2,
    pace: "4:34",
    hr: 150,
    delta: "−8 s"
  }, {
    km: 3,
    pace: "4:30",
    hr: 153,
    delta: "−12 s"
  }, {
    km: 4,
    pace: "4:28",
    hr: 156,
    delta: "−14 s"
  }, {
    km: 5,
    pace: "4:26",
    hr: 159,
    delta: "−16 s"
  }];
  const max = 280; // bar visual scaling
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "40px 1fr 80px 70px",
      gap: 12,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: "var(--muted)",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, "km"), /*#__PURE__*/React.createElement("span", null, "pace"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "right"
    }
  }, "HR"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "right"
    }
  }, "\u0394 avg")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, splits.map(s => {
    const len = parseInt(s.pace.split(":")[0]) * 60 + parseInt(s.pace.split(":")[1]) - 260;
    const w = 60 + (1 - len / 20) * 30;
    return /*#__PURE__*/React.createElement("div", {
      key: s.km,
      style: {
        display: "grid",
        gridTemplateColumns: "40px 1fr 80px 70px",
        gap: 12,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        fontSize: 13,
        color: "var(--muted)"
      }
    }, s.km), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 18,
        width: `${w}%`,
        background: "rgba(224,104,56,0.55)",
        borderRadius: 3
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        fontSize: 13
      }
    }, s.pace)), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "right",
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        fontSize: 13,
        color: "var(--muted)"
      }
    }, s.hr), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: "right",
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        fontSize: 13,
        color: "var(--z2)"
      }
    }, s.delta));
  })));
}

// ─── Buttons ────────────────────────────────────────────────
function GhostButton({
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 28,
      padding: "0 10px",
      background: "transparent",
      color: "var(--muted)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer"
    },
    onMouseEnter: e => {
      e.currentTarget.style.color = "var(--fg)";
      e.currentTarget.style.background = "var(--row-hover)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.color = "var(--muted)";
      e.currentTarget.style.background = "transparent";
    }
  }, children);
}

// ─── Main page ──────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState("Overview");
  const [chartWindow, setChartWindow] = useState("Pace");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      minHeight: "100dvh",
      background: "var(--bg)"
    },
    "data-screen-label": "App \xB7 Activity detail"
  }, /*#__PURE__*/React.createElement(Sidebar, null), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "Activities",
    lastSynced: "3 minutes ago"
  }), /*#__PURE__*/React.createElement(ActivityHeader, null), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: ["Overview", "Analysis", "Progress"],
    value: tab,
    onChange: setTab
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 32px 64px",
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, tab === "Overview" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(HeroStrip, null), /*#__PURE__*/React.createElement(QuickStats, null), /*#__PURE__*/React.createElement(Card, {
    title: "Route",
    subtitle: "Regent Park loop \xB7 5.03 km \xB7 84 m elevation",
    actions: /*#__PURE__*/React.createElement(GhostButton, null, "Open")
  }, /*#__PURE__*/React.createElement(RouteMap, null)), /*#__PURE__*/React.createElement(Card, {
    title: "Pace through the run",
    subtitle: "Compared to your median on this route",
    actions: /*#__PURE__*/React.createElement(PillToggle, {
      options: ["Pace", "HR", "Cadence"],
      value: chartWindow,
      onChange: setChartWindow
    }),
    footer: /*#__PURE__*/React.createElement(ChartLegend, null)
  }, /*#__PURE__*/React.createElement(PaceChart, null)), /*#__PURE__*/React.createElement(Card, {
    title: "Splits",
    subtitle: "Every km \xB7 pace, HR, delta from average"
  }, /*#__PURE__*/React.createElement(SplitsTable, null))), tab === "Analysis" && /*#__PURE__*/React.createElement(Card, {
    title: "Analysis",
    subtitle: "Comparison \xB7 Phases \xB7 Notable moments"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--muted)",
      fontSize: 14,
      margin: 0
    }
  }, "Comes alive after a few sessions on this route. Detailed breakdowns of cadence drift, HR drift, and segment performance live here.")), tab === "Progress" && /*#__PURE__*/React.createElement(Card, {
    title: "Progress",
    subtitle: "Best efforts \xB7 Fitness & freshness \xB7 Consistency"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--muted)",
      fontSize: 14,
      margin: 0
    }
  }, "Trends over the last 12 weeks live here. Each card decides for itself when there's enough history to render meaningfully.")))));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/app.jsx
try { (() => {
/* global React */
const {
  useState
} = React;
function FormaWordmark({
  size = 20
}) {
  const dot = Math.max(3, Math.round(size * 0.22));
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "baseline",
      gap: 3,
      color: "var(--fg)",
      fontWeight: 600,
      fontSize: size,
      letterSpacing: "-0.005em",
      lineHeight: 1,
      whiteSpace: "nowrap"
    }
  }, "Forma", /*#__PURE__*/React.createElement("span", {
    style: {
      width: dot,
      height: dot,
      borderRadius: "50%",
      background: "var(--accent)",
      flexShrink: 0,
      alignSelf: "baseline",
      display: "inline-block"
    },
    "aria-hidden": true
  }));
}
function _LegacyMark({
  size = 20,
  strokeWidth = 1.75
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 18.5 L12 5 L21.5 18.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 18.5 L12 11.5 L17 18.5"
  }));
}
function StravaButton({
  size = "default"
}) {
  const big = size === "lg";
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: big ? 12 : 8,
      padding: big ? "16px 28px" : "12px 20px",
      fontSize: big ? 16 : 14,
      fontWeight: 600,
      background: "#FC4C02",
      color: "white",
      borderRadius: 8,
      border: 0,
      cursor: "pointer",
      transition: "background 0.12s ease-out"
    },
    onMouseDown: e => e.currentTarget.style.background = "#C63D02",
    onMouseUp: e => e.currentTarget.style.background = "#FC4C02"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: big ? 20 : 16,
    height: big ? 20 : 16,
    fill: "currentColor",
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("path", {
    d: "M13.828 6.078 9.996 13.64H7.52L13.828 1.25l6.302 12.39h-2.476l-3.826-7.562zm2.56 11.672-1.857-3.677h-2.755l4.612 9.177 4.608-9.177h-2.755z"
  })), /*#__PURE__*/React.createElement("span", null, "Connect with Strava"));
}
function GlobePlaceholder() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "min(82vw, 560px)",
      aspectRatio: "1 / 1",
      margin: "0 auto",
      borderRadius: "9999px",
      background: "radial-gradient(circle at 30% 30%, #2a2e3a 0%, #0d1117 55%, #050608 100%)",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 40px 80px rgba(0,0,0,0.45), inset 0 0 80px rgba(80,120,200,0.15)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "100%",
    viewBox: "0 0 400 400",
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: "g",
    cx: "32%",
    cy: "32%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "rgba(255,255,255,0.08)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "rgba(255,255,255,0)"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: "200",
    cy: "200",
    r: "195",
    fill: "url(#g)"
  }), [0.3, 0.5, 0.7].map((r, i) => /*#__PURE__*/React.createElement("ellipse", {
    key: i,
    cx: "200",
    cy: "200",
    rx: 195 * r,
    ry: "195",
    fill: "none",
    stroke: "rgba(150,180,220,0.18)",
    strokeWidth: "0.7"
  })), [0.3, 0.5, 0.7].map((r, i) => /*#__PURE__*/React.createElement("ellipse", {
    key: "p" + i,
    cx: "200",
    cy: "200",
    rx: "195",
    ry: 195 * r,
    fill: "none",
    stroke: "rgba(150,180,220,0.18)",
    strokeWidth: "0.7"
  })), /*#__PURE__*/React.createElement("path", {
    d: "M120 180 Q180 140 250 175 T340 200",
    fill: "none",
    stroke: "#E8612B",
    strokeWidth: "1.5",
    opacity: "0.85"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M150 220 Q200 250 270 230",
    fill: "none",
    stroke: "#E8612B",
    strokeWidth: "1.2",
    opacity: "0.7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M105 240 Q140 220 175 250 T240 270",
    fill: "none",
    stroke: "#E8612B",
    strokeWidth: "1.2",
    opacity: "0.6"
  })));
}
function Header() {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      maxWidth: 1400,
      margin: "0 auto",
      padding: "32px 40px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    "aria-label": "Forma home",
    style: {
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement(FormaWordmark, {
    size: 20
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 14,
      color: "var(--muted)",
      textDecoration: "none"
    }
  }, "Sign in"));
}
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "80px 40px 96px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 580,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 56,
      lineHeight: "72px",
      fontWeight: 500,
      letterSpacing: "-0.01em",
      margin: "0 0 32px"
    }
  }, "The shape of your training"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: "24px",
      color: "var(--muted)",
      margin: "0 0 24px"
    }
  }, "Made for people who train. Shaped by the years of data you already have."), /*#__PURE__*/React.createElement(StravaButton, {
    size: "lg"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 16,
      fontSize: 14,
      color: "var(--muted)"
    }
  }, "In early access")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 56
    }
  }, /*#__PURE__*/React.createElement(GlobePlaceholder, null)));
}
function Section({
  eyebrow,
  headline,
  body,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "128px 40px",
      maxWidth: 1400,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      marginBottom: 64
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: "var(--muted)"
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 32,
      lineHeight: "40px",
      fontWeight: 600,
      letterSpacing: "-0.005em",
      margin: 0
    }
  }, headline), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      lineHeight: "28px",
      color: "var(--muted)",
      maxWidth: 640,
      margin: 0
    }
  }, body)), children);
}
function ActivityHeatmap() {
  // 7 weekdays × 26 weeks ≈ half-year strip
  const weeks = 26;
  const cells = [];
  const pal = ["#E06838", "#7B68EE", "#c46cb0", "#82a86a", "#10b4a8"];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const r = Math.random();
      const empty = r < 0.45;
      const color = pal[Math.floor(Math.random() * pal.length)];
      const opacity = empty ? 0 : 0.25 + Math.random() * 0.75;
      cells.push({
        w,
        d,
        color: empty ? "var(--row-hover)" : color,
        opacity: empty ? 1 : opacity
      });
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: `repeat(${weeks}, 1fr)`,
      gridAutoFlow: "column",
      gridTemplateRows: "repeat(7, 1fr)",
      gap: 4,
      maxWidth: 900
    }
  }, cells.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: "100%",
      aspectRatio: "1 / 1",
      borderRadius: 3,
      background: c.color,
      opacity: c.opacity
    }
  })));
}
function PersonalBests() {
  const pbs = [{
    sport: "Run",
    color: "#E06838",
    label: "5 km",
    value: "21:14",
    sub: "August · Regent Park loop"
  }, {
    sport: "Strength",
    color: "#c46cb0",
    label: "Bench 1RM",
    value: "104 kg",
    sub: "Estimated · top set 92.5 × 5"
  }, {
    sport: "Yoga",
    color: "#7B68EE",
    label: "Longest flow",
    value: "62 min",
    sub: "September · Vinyasa"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 16
    }
  }, pbs.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 9999,
      background: p.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: "var(--muted)"
    }
  }, p.sport)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--muted)",
      marginBottom: 4
    }
  }, p.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums",
      fontSize: 32,
      lineHeight: "40px",
      fontWeight: 500,
      letterSpacing: "-0.005em"
    }
  }, p.value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--muted)",
      marginTop: 8
    }
  }, p.sub))));
}
function RunningLog() {
  const weeks = 12;
  const heights = Array.from({
    length: weeks
  }, (_, i) => 30 + Math.sin(i * 0.6) * 25 + Math.random() * 25);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: 32,
      height: 320
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      height: 220,
      gap: 8
    }
  }, heights.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: `${h}%`,
      borderRadius: "4px 4px 0 0",
      background: i === heights.length - 1 ? "var(--accent)" : "rgba(232,97,43,0.55)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--muted)",
      fontFamily: "var(--font-mono)"
    }
  }, "12 weeks ago"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--muted)",
      fontFamily: "var(--font-mono)"
    }
  }, "this week")));
}
function FounderNote() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "96px 40px",
      maxWidth: 720,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: "var(--muted)"
    }
  }, "From the maker"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      lineHeight: "28px",
      margin: 0
    }
  }, "Hey!"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      lineHeight: "28px",
      margin: 0
    }
  }, "I'm Fardeen, a designer, and someone who trains. I built Forma because Strava holds years of my data without ever showing it back to me in a way that felt personal or fun. This is what I wanted to see. If you've felt the same way, you're in the right place.")));
}
function FooterCTA() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "128px 40px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 32,
      lineHeight: "40px",
      fontWeight: 600,
      letterSpacing: "-0.005em",
      margin: 0
    }
  }, "Ready to see yours?"), /*#__PURE__*/React.createElement(StravaButton, {
    size: "lg"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: "var(--muted)",
      margin: 0
    }
  }, "In early access")));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: "1px solid var(--border)",
      padding: "32px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1400,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    "aria-label": "Forma home",
    style: {
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement(FormaWordmark, {
    size: 14
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 14,
      color: "var(--muted)",
      textDecoration: "none"
    }
  }, "Privacy"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 14,
      color: "var(--muted)",
      textDecoration: "none"
    }
  }, "Contact"))));
}
function App() {
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Marketing landing"
  }, /*#__PURE__*/React.createElement(Header, null), /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(Section, {
    eyebrow: "A year, at a glance",
    headline: "Every workout, every day.",
    body: "One square per day. Color shows the type of session, opacity shows the work you put in."
  }, /*#__PURE__*/React.createElement(ActivityHeatmap, null)), /*#__PURE__*/React.createElement(Section, {
    eyebrow: "Your records",
    headline: "Your fastest, your longest, your hardest.",
    body: "Surfaced where you can see them, not buried three taps deep."
  }, /*#__PURE__*/React.createElement(PersonalBests, null)), /*#__PURE__*/React.createElement(Section, {
    eyebrow: "The rhythm of training",
    headline: "See your weeks, your months, your year.",
    body: "Every day, stacked against the next. The patterns become obvious."
  }, /*#__PURE__*/React.createElement(RunningLog, null)), /*#__PURE__*/React.createElement(FounderNote, null), /*#__PURE__*/React.createElement(FooterCTA, null), /*#__PURE__*/React.createElement(Footer, null));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/app.jsx", error: String((e && e.message) || e) }); }

__ds_ns.ActivityHeader = __ds_scope.ActivityHeader;

__ds_ns.CelebrationStrip = __ds_scope.CelebrationStrip;

__ds_ns.FeatureCard = __ds_scope.FeatureCard;

__ds_ns.HeroStrip = __ds_scope.HeroStrip;

__ds_ns.QuickStats = __ds_scope.QuickStats;

__ds_ns.FounderNote = __ds_scope.FounderNote;

__ds_ns.Landing = __ds_scope.Landing;

__ds_ns.FooterCTA = __ds_scope.FooterCTA;

__ds_ns.SiteFooter = __ds_scope.SiteFooter;

__ds_ns.LandingHero = __ds_scope.LandingHero;

__ds_ns.LandingSection = __ds_scope.LandingSection;

__ds_ns.StravaButton = __ds_scope.StravaButton;

__ds_ns.AvatarMenu = __ds_scope.AvatarMenu;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.FormaMark = __ds_scope.FormaMark;

__ds_ns.Header = __ds_scope.Header;

__ds_ns.NAV_ITEMS = __ds_scope.NAV_ITEMS;

__ds_ns.PageHeader = __ds_scope.PageHeader;

__ds_ns.PageTitle = __ds_scope.PageTitle;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.ThemeToggle = __ds_scope.ThemeToggle;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardPartialNotice = __ds_scope.CardPartialNotice;

__ds_ns.CardEmptyState = __ds_scope.CardEmptyState;

__ds_ns.InsightBlock = __ds_scope.InsightBlock;

__ds_ns.Label = __ds_scope.Label;

__ds_ns.Legend = __ds_scope.Legend;

__ds_ns.PillToggle = __ds_scope.PillToggle;

__ds_ns.TABLE_HEADER_CLASS = __ds_scope.TABLE_HEADER_CLASS;

__ds_ns.SortHeader = __ds_scope.SortHeader;

__ds_ns.StatStrip = __ds_scope.StatStrip;

__ds_ns.StatCell = __ds_scope.StatCell;

__ds_ns.StatStripCustomCell = __ds_scope.StatStripCustomCell;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Subtitle = __ds_scope.Subtitle;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.TabList = __ds_scope.TabList;

__ds_ns.Tab = __ds_scope.Tab;

__ds_ns.TabPanel = __ds_scope.TabPanel;

__ds_ns.Tooltip = __ds_scope.Tooltip;

})();
