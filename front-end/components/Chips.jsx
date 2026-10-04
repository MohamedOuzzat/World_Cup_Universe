"use client";

export default function Chips({ options, current, onChange }) {
  return (
    <>
      {options.map((x) => (
        <button
          key={x}
          type="button"
          className="chip"
          aria-pressed={x === current}
          onClick={() => onChange(x)}
        >
          {x}
        </button>
      ))}
    </>
  );
}
