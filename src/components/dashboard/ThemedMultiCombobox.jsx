import { useEffect, useId, useMemo, useRef, useState } from "react";

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function SearchIcon() {
  return (
    <svg className="cap-mcombo__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="cap-mcombo__check-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`cap-mcombo__chevron-svg${open ? " cap-mcombo__chevron-svg--open" : ""}`}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * Multi-select combobox: chips in trigger, search + checklist dropdown, custom add footer.
 * @param {{
 *   options: { value: string; label: string }[];
 *   selected: string[];
 *   onSelectedChange: import("react").Dispatch<import("react").SetStateAction<string[]>>;
 *   customItems: string[];
 *   onCustomItemsChange: import("react").Dispatch<import("react").SetStateAction<string[]>>;
 *   placeholder?: string;
 *   searchPlaceholder?: string;
 *   addCustomPlaceholder?: string;
 *   className?: string;
 *   labelledBy?: string;
 *   comboboxId?: string;
 *   footerMode?: "customAdd" | "close";
 *   showClearAll?: boolean;
 * }} props
 */
export default function ThemedMultiCombobox({
  options,
  selected,
  onSelectedChange,
  customItems,
  onCustomItemsChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  addCustomPlaceholder = "Add custom…",
  className = "",
  labelledBy,
  comboboxId,
  footerMode = "customAdd",
  showClearAll = true,
}) {
  const uid = useId();
  const baseId = comboboxId ?? `cap-mcombo-${uid}`;
  const wrapRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customDraft, setCustomDraft] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const hasAny = selected.length > 0 || customItems.length > 0;

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

  function clearAll(e) {
    e.stopPropagation();
    onSelectedChange([]);
    onCustomItemsChange([]);
  }

  function closeDropdown() {
    setOpen(false);
    setSearch("");
  }

  function addCustom() {
    const t = customDraft.trim();
    if (!t) return;
    onCustomItemsChange((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setCustomDraft("");
  }

  return (
    <div
      ref={wrapRef}
      className={`cap-mcombo ${open ? "cap-mcombo--open" : ""} ${className}`.trim()}
    >
      <div className="cap-mcombo__trigger">
        <div
          id={baseId}
          role="combobox"
          tabIndex={0}
          className="cap-mcombo__main"
          aria-expanded={open}
          aria-controls={`${baseId}-list`}
          aria-labelledby={labelledBy}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
        >
          <div className="cap-mcombo__chips">
            {!hasAny ? (
              <span className="cap-mcombo__placeholder">{placeholder}</span>
            ) : (
              <>
                {selected.map((v) => {
                  const opt = options.find((o) => o.value === v);
                  const label = opt?.label ?? v;
                  return (
                    <span key={v} className="cap-mcombo__chip">
                      <span className="cap-mcombo__chip-text">{label}</span>
                      <button
                        type="button"
                        className="cap-mcombo__chip-remove"
                        aria-label={`Remove ${label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectedChange((prev) => prev.filter((x) => x !== v));
                        }}
                      >
                        <span className="cap-mcombo__chip-remove-inner" aria-hidden>
                          ×
                        </span>
                      </button>
                    </span>
                  );
                })}
                {customItems.map((item) => (
                  <span key={`custom-${item}`} className="cap-mcombo__chip">
                    <span className="cap-mcombo__chip-text">{item}</span>
                    <button
                      type="button"
                      className="cap-mcombo__chip-remove"
                      aria-label={`Remove ${item}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCustomItemsChange((prev) => prev.filter((x) => x !== item));
                      }}
                    >
                      <span className="cap-mcombo__chip-remove-inner" aria-hidden>
                        ×
                      </span>
                    </button>
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="cap-mcombo__actions">
          {showClearAll && hasAny ? (
            <button
              type="button"
              className="cap-mcombo__clear"
              aria-label="Clear all"
              onClick={clearAll}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            className="cap-mcombo__toggle"
            aria-label={open ? "Close list" : "Open list"}
            aria-expanded={open}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
          >
            <ChevronIcon open={open} />
          </button>
        </div>
      </div>

      {open ? (
        <div
          id={`${baseId}-list`}
          className="cap-mcombo__dropdown"
          role="listbox"
          aria-multiselectable="true"
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
          <ul className="cap-mcombo__options">
            {filtered.length === 0 ? (
              <li className="cap-mcombo__empty" role="presentation">
                No matches
              </li>
            ) : (
              filtered.map((opt) => {
                const isOn = selected.includes(opt.value);
                return (
                  <li key={opt.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isOn}
                      className={`cap-mcombo__row${isOn ? " cap-mcombo__row--selected" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSelectedChange((prev) => toggleInList(prev, opt.value))}
                    >
                      <span className={`cap-mcombo__mark${isOn ? " cap-mcombo__mark--on" : ""}`} aria-hidden>
                        {isOn ? <CheckIcon /> : null}
                      </span>
                      <span className="cap-mcombo__row-label">{opt.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {footerMode === "close" ? (
            <div className="cap-mcombo__footer cap-mcombo__footer--close-only">
              <button
                type="button"
                className="cap-mcombo__close-dropdown"
                onMouseDown={(e) => e.preventDefault()}
                onClick={closeDropdown}
              >
                Close
              </button>
            </div>
          ) : (
            <div className="cap-mcombo__footer">
              <input
                type="text"
                className="cap-mcombo__custom-input"
                placeholder={addCustomPlaceholder}
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label={addCustomPlaceholder}
              />
              <button type="button" className="cap-mcombo__custom-add" onMouseDown={(e) => e.preventDefault()} onClick={addCustom}>
                Add
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
