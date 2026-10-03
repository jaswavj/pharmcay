import React, { useEffect, useRef, useState } from 'react';

type SuggestInputProps<T> = {
  value: string;
  placeholder?: string;
  options: T[];
  getLabel: (item: T) => string;
  onChange: (value: string) => void;
  onPick: (item: T) => void;
  match?: (item: T, query: string) => boolean;
  minLetters?: number;
  inputRef?: React.Ref<HTMLInputElement>;
};

function SuggestInput<T>({
  value,
  placeholder,
  options,
  getLabel,
  onChange,
  onPick,
  match,
  minLetters = 2,
  inputRef,
}: SuggestInputProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const activeRef = useRef<HTMLButtonElement>(null);
  const query = value.trim().toLowerCase();
  const hits = query.length < minLetters
    ? []
    : options
      .filter((item) => (match ? match(item, query) : getLabel(item).toLowerCase().includes(query)))
      .slice(0, 8);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (item: T) => {
    onPick(item);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || hits.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % hits.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + hits.length) % hits.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pick(hits[active] ?? hits[0]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="mst-suggest-wrap">
      <input
        ref={inputRef}
        className="mst-inp"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {open && hits.length > 0 && (
        <div className="mst-suggest" role="listbox">
          {hits.map((item, index) => (
            <button
              key={getLabel(item) + index}
              ref={index === active ? activeRef : undefined}
              type="button"
              role="option"
              aria-selected={index === active}
              className={index === active ? 'on' : ''}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => pick(item)}
            >
              {getLabel(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SuggestInput;
