// Best-effort platform/browser labels for the connected-devices registry,
// parsed from the user-agent. Coarse on purpose — these are display labels,
// not fingerprints. Order matters: Edge/Opera UAs also contain "Chrome",
// and Chrome's UA also contains "Safari".

export interface DeviceInfo {
  platform: string;
  browser: string;
}

export function describeDevice(): DeviceInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = /iPhone/i.test(ua)
    ? 'iPhone'
    : /iPad/i.test(ua)
      ? 'iPad'
      : /Android/i.test(ua)
        ? 'Android'
        : /Macintosh|Mac OS X/i.test(ua)
          ? 'Mac'
          : /Windows/i.test(ua)
            ? 'Windows'
            : /Linux/i.test(ua)
              ? 'Linux'
              : 'This device';
  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /OPR\//i.test(ua)
      ? 'Opera'
      : /Chrome\//i.test(ua)
        ? 'Chrome'
        : /Firefox\//i.test(ua)
          ? 'Firefox'
          : /Safari\//i.test(ua)
            ? 'Safari'
            : 'Browser';
  return { platform, browser };
}

// True when a platform label should show the phone icon (vs. a computer).
export function isHandheld(platform: string): boolean {
  return /iPhone|Android/i.test(platform);
}
