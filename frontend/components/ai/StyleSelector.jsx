"use client";

export default function StyleSelector({ options, value, onSelect, columns = 3 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 10
      }}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`chip ${value === option ? "is-active" : ""}`}
          onClick={() => onSelect(option)}
          style={{ justifyContent: "center" }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
