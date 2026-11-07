"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./HeroSlider.module.css";

export default function HeroSlider({
  images = [],
  interval = 2500,
  showIndicators = true,
  overlay = true,
  className = "",
  style = {},
}) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const validImages = Array.isArray(images) ? images.filter((img) => img && (img.url || img)) : [];

  useEffect(() => {
    if (validImages.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % validImages.length);
    }, Math.max(1500, interval || 2500));

    return () => clearInterval(timer);
  }, [validImages.length, interval, isHovered]);

  if (validImages.length === 0) {
    return (
      <div className={`${styles.sliderContainer} ${className}`} style={style}>
        <img
          src="/images/hero/hero-right-1.svg"
          alt="Hero"
          className={styles.slideImage}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.sliderContainer} ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {validImages.map((img, i) => {
        const src = typeof img === "string" ? img : img.url;
        const isActive = i === index;
        return (
          <div
            key={img.id || src || i}
            className={`${styles.slide} ${isActive ? styles.slideActive : ""}`}
            aria-hidden={!isActive}
          >
            <img
              src={src}
              alt={img.title || "Routine Hero Look"}
              className={styles.slideImage}
              onError={(e) => {
                e.currentTarget.src = "/images/hero/hero-right-1.svg";
              }}
            />
            {overlay ? <div className={styles.overlayGradient} /> : null}
          </div>
        );
      })}

      {showIndicators && validImages.length > 1 ? (
        <div className={styles.dots} role="tablist" aria-label="Hero slider pagination">
          {validImages.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Chuyển tới ảnh ${i + 1}`}
              aria-selected={i === index}
              role="tab"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
