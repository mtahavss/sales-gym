import { useEffect, useId, useMemo, useRef, useState } from "react";

function SearchIcon() {
  return (
    <svg className="cap-mcombo__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

/**
 * Single-select dropdown with search (B2C occupation-style).
 * @param {{
 *   value: string;
 *   onChange: (v: string) => void;
 *   options: { value: string; label: string }[];
 *   buttonId?: string;
 *   className?: string;
 *   searchPlaceholder?: string;
 *   labelledBy?: string;
 *   showCloseFooter?: boolean;
 * }} props
 */
export default function ThemedSearchableSelect({
  value,
  onChange,
  options,
  buttonId,
  className = "",
  searchPlaceholder = "Search…",
  labelledBy,
  showCloseFooter = true,
}) {
  const uid = useId();
  const baseId = buttonId ?? `cap-ssel-${uid}`;
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value) ?? options[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      if (o.value === "") return true;
      return o.label.toLowerCase().includes(q);
    });
  }, [options, search]);

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (wrapRef.current?.contains(e.target)) return;
      setOpen(false);
      setSearch("");
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      setSearch("");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  function close() {
    setOpen(false);
    setSearch("");
    triggerRef.current?.focus();
  }

  function pick(v) {
    onChange(v);
    close();
  }

  return (
    <div
      ref={wrapRef}
      className={`tm-menu-select cap-search-select ${open ? "tm-menu-select--open" : ""} ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        id={baseId}
        type="button"
        className="tm-menu-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${baseId}-listbox`}
        aria-labelledby={labelledBy}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? "tm-menu-select__value" : "tm-menu-select__value tm-menu-select__value--placeholder"}>
          {selected?.label ?? "Select"}
        </span>
        <span className="tm-menu-select__chevron" aria-hidden>
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </button>
      {open ? (
        <div
          id={`${baseId}-listbox`}
          className="cap-search-select__panel cap-mcombo__dropdown"
          role="listbox"
        >
          <div className="cap-mcombo__search-wrap">
            <SearchIcon />
            <input
              ref={searchRef}
              type="search"
              className="cap-mcombo__search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label={searchPlaceholder}
            />
          </div>
          <ul className="cap-mcombo__options cap-search-select__options">
            {filtered.length === 0 ? (
              <li className="cap-mcombo__empty" role="presentation">
                No matches
              </li>
            ) : (
              filtered.map((opt) => {
                const isSel = opt.value === value;
                const isPlaceholder = opt.value === "";
                return (
                  <li key={opt.value || "__ph"} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      className={`cap-mcombo__row cap-search-select__row${isSel ? " cap-mcombo__row--selected" : ""}${isPlaceholder ? " cap-search-select__row--placeholder" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(opt.value)}
                    >
                      <span className={`cap-mcombo__mark${isSel ? " cap-mcombo__mark--on" : ""}`} aria-hidden>
                        {isSel ? (
                          <svg className="cap-mcombo__check-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : null}
                      </span>
                      <span className="cap-mcombo__row-label">{opt.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {showCloseFooter ? (
            <div className="cap-mcombo__footer cap-mcombo__footer--close-only">
              <button type="button" className="cap-mcombo__close-dropdown" onMouseDown={(e) => e.preventDefault()} onClick={close}>
                Close
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
