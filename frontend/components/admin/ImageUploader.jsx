"use client";

import { useRef, useState } from "react";
import { IconUpload, IconX, IconStar, IconGrip, IconImage } from "./icons";
import { uploadImageFile } from "@/lib/uploadService";
import styles from "./ImageUploader.module.css";

function generateLocalId() {
  return `img-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

export default function ImageUploader({ images, onChange, error }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const dragIndexRef = useRef(null);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setUploadError("");
    for (const file of files) {
      setUploadingCount((c) => c + 1);
      try {
        const uploadedUrl = await uploadImageFile(file);
        onChange((prev) => {
          const newImage = {
            id: generateLocalId(),
            url: uploadedUrl,
            isPrimary: prev.length === 0,
            displayOrder: prev.length + 1,
          };
          return [...prev, newImage];
        });
      } catch (err) {
        console.error("Upload error:", err);
        setUploadError(err?.message || "Lỗi khi tải ảnh lên máy chủ");
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    }
  }

  function handleInputChange(e) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function setPrimary(id) {
    onChange((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === id })));
  }

  function removeImage(id) {
    onChange((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      const removedWasPrimary = prev.find((img) => img.id === id)?.isPrimary;
      if (removedWasPrimary && filtered.length > 0) {
        filtered[0] = { ...filtered[0], isPrimary: true };
      }
      return filtered.map((img, i) => ({ ...img, displayOrder: i + 1 }));
    });
  }

  function handleCardDragStart(index) {
    dragIndexRef.current = index;
  }

  function handleCardDrop(index) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === index) return;
    onChange((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next.map((img, i) => ({ ...img, displayOrder: i + 1 }));
    });
  }

  return (
    <div className={styles.field}>
      <div className={styles.headRow}>
        <label className={styles.label}>
          Product Images <span className={styles.required}>*</span>
        </label>
        <span className={styles.hint}>Kéo để sắp xếp thứ tự hiển thị</span>
      </div>

      <div className={styles.grid}>
        {images.map((img, index) => (
          <div
            key={img.id}
            className={styles.card}
            draggable
            onDragStart={() => handleCardDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleCardDrop(index)}
          >
            <img
              src={img.url}
              alt=""
              className={styles.thumb}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex";
              }}
            />
            <div className={styles.thumbFallback} style={{ display: "none" }}>
              <IconImage size={24} />
            </div>
            {img.isPrimary ? <span className={styles.primaryTag}>PRIMARY</span> : null}
            <div className={styles.cardOverlay}>
              <span className={styles.gripHandle} aria-hidden="true">
                <IconGrip size={14} />
              </span>
              <div className={styles.cardActions}>
                {!img.isPrimary ? (
                  <button
                    type="button"
                    className={styles.cardBtn}
                    onClick={() => setPrimary(img.id)}
                    title="Set as primary image"
                    aria-label="Đặt làm ảnh chính"
                  >
                    <IconStar size={13} />
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`${styles.cardBtn} ${styles.cardBtnDanger}`}
                  onClick={() => removeImage(img.id)}
                  title="Remove image"
                  aria-label="Xoá ảnh"
                >
                  <IconX size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          disabled={uploadingCount > 0}
          className={`${styles.addTile} ${isDragOver ? styles.addTileActive : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <IconUpload size={20} />
          <span>{uploadingCount > 0 ? `Đang tải ${uploadingCount} ảnh...` : "Add Image"}</span>
          <span className={styles.addSubtext}>
            {uploadingCount > 0 ? "Đang lưu file..." : "Click hoặc kéo thả"}
          </span>
        </button>
      </div>

      {images.length === 0 ? (
        <div className={styles.emptyHint}>
          <IconImage size={16} />
          <span>Chưa có ảnh nào — thêm ít nhất 1 ảnh sản phẩm.</span>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        className={styles.hiddenInput}
        onChange={handleInputChange}
      />

      {uploadError ? <p className={styles.errorText}>{uploadError}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
}
