import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * Custom dropdown aligned with Create AI Prospect / scorecard modal selects.
 * The native <select> list cannot be themed; this uses a listbox for orange/peach highlights.
 */
export default function ThemedMenuSelect({
  value,
  onChange,
  options,
  className = "",
  disabled = false,
  id: idProp,
  /** For <label htmlFor> — must match label’s `htmlFor`. */
  buttonId,
  /** Accessible name when no visible label (e.g. toolbar filters). */
  ariaLabel,
}) {
  const uid = useId();
  const listId = idProp ?? `tms-${uid}`;
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex] ?? options[0];

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlighted(selectedIndex);
      requestAnimationFrame(() => listRef.current?.focus());
    }
  }, [open, selectedIndex]);

  const selectAt = useCallback(
    (i) => {
      const opt = options[i];
      if (!opt) return;
      onChange(opt.value);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange, options],
  );

  const onTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        setHighlighted((h) => (h + 1) % options.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        setHighlighted((h) => (h - 1 + options.length) % options.length);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) selectAt(highlighted);
      else setOpen(true);
    }
  };

  const onListKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectAt(highlighted);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`tm-menu-select ${open ? "tm-menu-select--open" : ""} ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        id={buttonId}
        type="button"
        className="tm-menu-select__trigger"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="tm-menu-select__value">{selected?.label}</span>
        <span className="tm-menu-select__chevron" aria-hidden>
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </button>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          className="tm-menu-select__list"
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listId}-opt-${highlighted}`}
          onKeyDown={onListKeyDown}
        >
          {options.map((opt, i) => (
            <li key={`${listId}-li-${i}`} role="presentation" className="tm-menu-select__li">
              <button
                id={`${listId}-opt-${i}`}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={`tm-menu-select__opt${opt.value === value ? " tm-menu-select__opt--selected" : ""}${i === highlighted ? " tm-menu-select__opt--active" : ""}`}
                onMouseEnter={() => setHighlighted(i)}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => selectAt(i)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
