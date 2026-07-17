// One shared tooltip layer, ported from the prototype: 350ms delay,
// mono 11px, theme-inverted colors, suppressed in focus mode.

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';

interface Tip {
  text: string;
  x: number;
  y: number;
  above: boolean;
}

interface TooltipApi {
  show: (text: string, above?: boolean) => (e: MouseEvent<HTMLElement>) => void;
  hide: () => void;
  setSuppressed: (v: boolean) => void;
}

const TooltipCtx = createContext<TooltipApi>({
  show: () => () => {},
  hide: () => {},
  setSuppressed: () => {},
});

export function useTooltip() {
  return useContext(TooltipCtx);
}

export function TooltipProvider({ children, theme }: { children: ReactNode; theme: 'dark' | 'light' }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const suppressed = useRef(false);

  const show = useCallback(
    (text: string, above = false) =>
      (e: MouseEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          if (suppressed.current) return;
          setTip(
            above
              ? { text, x: r.left + r.width / 2, y: r.top - 6, above: true }
              : { text, x: r.left + r.width / 2, y: r.bottom + 6, above: false },
          );
        }, 350);
      },
    [],
  );

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setTip(null);
  }, []);

  const setSuppressed = useCallback((v: boolean) => {
    suppressed.current = v;
  }, []);

  return (
    <TooltipCtx.Provider value={{ show, hide, setSuppressed }}>
      {children}
      {tip && (
        <div
          style={{
            position: 'fixed',
            left: tip.x,
            top: tip.y,
            transform: tip.above ? 'translate(-50%,-100%)' : 'translate(-50%,0)',
            background: theme === 'dark' ? '#EDEDEF' : '#1E1E20',
            color: theme === 'dark' ? '#1E1E20' : '#EDEDEF',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            lineHeight: 1,
            padding: '6px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 80,
            boxShadow: 'var(--shadow-lg)',
            animation: 'db-tip .15s ease-out',
          }}
        >
          {tip.text}
        </div>
      )}
    </TooltipCtx.Provider>
  );
}
