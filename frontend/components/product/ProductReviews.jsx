"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/common/Toast";
import {
  fetchProductReviews,
  createProductReview,
  deleteReview,
} from "@/lib/reviewService";
import { formatDate } from "@/lib/format";
import styles from "./ProductReviews.module.css";

function StarDisplay({ rating = 5, size = 14 }) {
  return (
    <div style={{ display: "inline-flex", gap: 2, color: "#f59e0b", fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{star <= Math.round(rating) ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }) {
  const { user, isLoggedIn } = useUser();
  const { showToast } = useToast();

  const [reviewsData, setReviewsData] = useState({
    items: [],
    summary: { averageRating: 5.0, totalReviews: 0, ratingBreakdown: {} },
  });
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState(0); // 0 = all

  // Form state
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadReviews = (starFilter = filterRating) => {
    if (!productId) return;
    setLoading(true);
    fetchProductReviews(productId, { rating: starFilter || undefined })
      .then((data) => {
        if (data) {
          setReviewsData(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews(filterRating);
  }, [productId, filterRating]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 2) {
      showToast("Vui lòng nhập nội dung nhận xét (tối thiểu 2 ký tự).", "error");
      return;
    }

    setSubmitting(true);
    try {
      await createProductReview(productId, {
        rating: formRating,
        comment: comment.trim(),
      });
      showToast("Cảm ơn bạn! Đánh giá đã được gửi thành công.");
      setComment("");
      setFormRating(5);
      loadReviews(filterRating);
    } catch (err) {
      showToast(err?.message || "Không thể gửi đánh giá. Vui lòng thử lại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const ok = window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không?");
    if (!ok) return;

    setDeletingId(reviewId);
    try {
      await deleteReview(reviewId);
      showToast("Đã xóa đánh giá thành công.");
      loadReviews(filterRating);
    } catch (err) {
      showToast(err?.message || "Không thể xóa đánh giá", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const summary = reviewsData.summary || { averageRating: 5.0, totalReviews: 0, ratingBreakdown: {} };
  const breakdown = summary.ratingBreakdown || {};
  const total = summary.totalReviews || 0;

  const starLabels = {
    1: "Rất tệ",
    2: "Không hài lòng",
    3: "Bình thường",
    4: "Hài lòng",
    5: "Rất tuyệt vời",
  };

  return (
    <section className={styles.reviewsSection} id="reviews">
      <h2 className={styles.sectionTitle}>
        Đánh Giá & Nhận Xét Từ Khách Hàng ({total})
      </h2>

      {/* 1. KHỐI TỔNG QUAN XẾP HẠNG */}
      <div className={styles.overviewCard}>
        <div className={styles.scoreBox}>
          <div className={styles.averageScore}>
            {summary.averageRating ? summary.averageRating.toFixed(1) : "5.0"}
          </div>
          <div className={styles.starsRow}>
            <StarDisplay rating={summary.averageRating} size={18} />
          </div>
          <div className={styles.totalCount}>Dựa trên {total} lượt đánh giá</div>
        </div>

        <div className={styles.breakdownBox}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star] || 0;
            const percent = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className={styles.barRow}>
                <span className={styles.starLabel}>{star} ★</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.countLabel}>({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. BỘ LỌC THEO SỐ SAO */}
      <div className={styles.filterRow}>
        <span style={{ fontSize: 13, fontWeight: 600, marginRight: 4 }}>Lọc theo:</span>
        <button
          type="button"
          className={`${styles.filterBtn} ${filterRating === 0 ? styles.filterBtnActive : ""}`}
          onClick={() => setFilterRating(0)}
        >
          Tất cả ({total})
        </button>
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            type="button"
            className={`${styles.filterBtn} ${filterRating === star ? styles.filterBtnActive : ""}`}
            onClick={() => setFilterRating(star)}
          >
            {star} ★ ({breakdown[star] || 0})
          </button>
        ))}
      </div>

      {/* 3. FORM GỬI ĐÁNH GIÁ (CHỈ HIỆN KHI ĐÃ ĐĂNG NHẬP) */}
      {isLoggedIn ? (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Viết đánh giá của bạn</h3>
          <form onSubmit={handleSubmitReview}>
            <div className={styles.starSelector}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)" }}>
                Đánh giá chất lượng:
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeStar = hoverRating ? star <= hoverRating : star <= formRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`${styles.starBtn} ${activeStar ? styles.starBtnActive : ""}`}
                      onClick={() => setFormRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
              <span className={styles.starHint}>
                {starLabels[hoverRating || formRating]}
              </span>
            </div>

            <textarea
              className={styles.textarea}
              placeholder="Chia sẻ cảm nhận của bạn về chất liệu vải, kích cỡ, form dáng của sản phẩm này..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required
            />

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi Đánh Giá"}
            </button>
          </form>
        </div>
      ) : (
        /* KHI CHƯA ĐĂNG NHẬP: THÔNG BÁO YÊU CẦU ĐĂNG NHẬP */
        <div className={styles.loginPrompt}>
          <div>
            <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
              Bạn đã trải nghiệm sản phẩm này?
            </div>
            <div className={styles.loginPromptText}>
              Đăng nhập tài khoản của bạn để chia sẻ đánh giá và cảm nhận thực tế về chất liệu, form dáng.
            </div>
          </div>
          <Link
            href={`/login?redirect=/product/${productId}`}
            className={styles.loginBtn}
          >
            Đăng nhập để đánh giá
          </Link>
        </div>
      )}

      {/* 4. DANH SÁCH CÁC BÌNH LUẬN */}
      <div className={styles.reviewList}>
        {loading ? (
          <p style={{ textAlign: "center", padding: 32, color: "var(--color-text-secondary)" }}>
            Đang tải đánh giá...
          </p>
        ) : reviewsData.items.length === 0 ? (
          <div className={styles.emptyReviews}>
            Chưa có đánh giá nào {filterRating > 0 ? `cho mức ${filterRating} sao` : "cho sản phẩm này"}. Hãy là người đầu tiên đánh giá!
          </div>
        ) : (
          reviewsData.items.map((rev) => {
            // Kiểm tra quyền xóa: Nếu là người viết đánh giá HOẶC là Admin
            const isOwner = Boolean(user && user.id === rev.userId);
            const isAdmin = Boolean(user && user.role === "ADMIN");
            const canDelete = isOwner || isAdmin;

            const firstLetter = (rev.userName || "K").charAt(0).toUpperCase();

            return (
              <div key={rev.id} className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                  <div className={styles.userMeta}>
                    <div className={styles.avatar}>{firstLetter}</div>
                    <div>
                      <div className={styles.userName}>{rev.userName}</div>
                      <div className={styles.reviewDate}>{formatDate(rev.createdAt)}</div>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteReview(rev.id)}
                      disabled={deletingId === rev.id}
                      title="Xóa bình luận này"
                    >
                      {deletingId === rev.id ? "Đang xóa..." : "🗑️ Xóa"}
                    </button>
                  )}
                </div>

                <div className={styles.reviewRating}>
                  <StarDisplay rating={rev.rating} size={14} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
                    {starLabels[rev.rating]}
                  </span>
                </div>

                <div className={styles.reviewComment}>{rev.comment}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
