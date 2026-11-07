"use client";

import { useState, useRef, useEffect } from "react";
import InteractiveOutfitCard from "./InteractiveOutfitCard";
import { sendStylistChatMessage } from "@/lib/aiStylistService";
import { useUser } from "@/context/UserContext";
import styles from "./AIStylistChat.module.css";

const GENDER_QUICK_CHIPS = {
  women: [
    "Tư vấn set đồ nữ thanh lịch đi làm",
    "Áo sơ mi kết hợp chân váy dạo phố",
    "Outfit hẹn hò nữ cuối tuần dưới 1 triệu",
    "Gợi ý đầm/set đồ phong cách tối giản",
  ],
  men: [
    "Tư vấn set đồ công sở lịch sự nam",
    "Gợi ý áo polo kết hợp quần tây thanh lịch",
    "Outfit dạo phố năng động nam",
    "Tìm áo phông dáng lớn màu xám",
  ],
  default: [
    "Tìm áo phông dáng lớn màu xám dạo phố",
    "Tư vấn set đồ công sở lịch sự",
    "Outfit hẹn hò cuối tuần dưới 1 triệu",
    "Gợi ý áo polo kết hợp quần tây thanh lịch",
  ],
};

function getWelcomeConfig(user) {
  const gender = user?.gender;
  const name = user?.name ? ` ${user.name}` : "";

  if (gender === "women") {
    return {
      text: `Xin chào${name} 👋! Tôi là Trợ lý Thời trang AI Stylist của Routine. Rất vui được hỗ trợ tư vấn trang phục nữ chuẩn phong cách cho bạn. Hôm nay bạn muốn tìm đồ theo dịp nào (công sở, dạo phố, hẹn hò)?`,
      chips: GENDER_QUICK_CHIPS.women,
    };
  }

  if (gender === "men") {
    return {
      text: `Xin chào${name} 👋! Tôi là Trợ lý Thời trang AI Stylist của Routine. Rất vui được hỗ trợ tư vấn trang phục nam chuẩn gu cho bạn. Hôm nay bạn muốn tìm đồ theo dịp nào (công sở, dạo phố, hẹn hò)?`,
      chips: GENDER_QUICK_CHIPS.men,
    };
  }

  if (gender === "unisex") {
    return {
      text: `Xin chào${name} 👋! Tôi là Trợ lý Thời trang AI Stylist của Routine. Tôi sẵn sàng gợi ý và phối đồ từ tất cả bộ sưu tập thời trang trong kho cho bạn. Hôm nay bạn muốn tìm đồ theo phong cách nào?`,
      chips: GENDER_QUICK_CHIPS.default,
    };
  }

  return {
    text: "Xin chào 👋! Tôi là Trợ lý Thời trang AI Stylist của Routine. Hôm nay bạn muốn tìm trang phục theo dịp nào, dáng mặc (form rộng, vừa, ôm) hay phong cách gì?",
    chips: GENDER_QUICK_CHIPS.default,
  };
}

export default function AIStylistChat({ initialPrompt = "", currentProductId = null, embedded = false }) {
  const { user, isLoggedIn, openAuthPrompt } = useUser();
  const welcome = getWelcomeConfig(user);

  const [messages, setMessages] = useState([
    {
      id: "msg-welcome",
      role: "ai",
      text: welcome.text,
      outfit: null,
      followUps: welcome.chips,
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({ occasion: "", style: "", budget: "" });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, showQuiz]);

  // Nếu có initialPrompt được truyền từ bên ngoài (ví dụ từ nút Complete The Look)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
    }
  }, [initialPrompt]);

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Vui lòng chọn ảnh JPEG, PNG hoặc WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Vui lòng chọn ảnh dung lượng dưới 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result || null);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleQuizAnswer(field, val) {
    const updated = { ...quizAnswers, [field]: val };
    setQuizAnswers(updated);

    if (quizStep === 1) {
      setQuizStep(2);
    } else if (quizStep === 2) {
      setQuizStep(3);
    } else if (quizStep === 3) {
      setShowQuiz(false);
      setQuizStep(1);
      const prompt = `Tư vấn cho mình set đồ ${updated.occasion} theo phong cách ${updated.style}, ngân sách ${updated.budget}. Hãy gợi ý set hoàn chỉnh nhé!`;
      handleSendMessage(prompt);
    }
  }

  async function handleSendMessage(textToSend) {
    const text = textToSend || inputText;
    const imageToSend = selectedImage;

    if ((!text || !text.trim()) && !imageToSend) return;
    if (loading) return;

    const userMessageId = `usr-${Date.now()}`;
    const newHistory = messages
      .filter((m) => m.id !== "msg-welcome")
      .slice(-12)
      .map((m) => ({
        role: m.role === "ai" ? "model" : "user",
        text: m.text,
        outfitId: m.outfit?.id || null,
        outfitTitle: m.outfit?.title || null,
        products: m.outfit?.products?.map((p) => p.name) || [],
      }));

    const displayText = (text && text.trim()) || "Gợi ý set đồ tương đồng với phong cách bức ảnh này nhé";

    const updatedMessages = [
      ...messages,
      {
        id: userMessageId,
        role: "user",
        text: displayText,
        image: imageToSend,
      },
    ];

    setMessages(updatedMessages);
    setInputText("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const response = await sendStylistChatMessage({
        message: displayText,
        history: newHistory,
        currentProductId,
        image: imageToSend,
        userPreferences: user ? { gender: user.gender, style: user.stylePreference } : null,
      });

      setMessages([
        ...updatedMessages,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          text: response.message,
          outfit: response.outfit,
          products: response.products,
          followUps: response.followUps || [],
        },
      ]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          id: `ai-err-${Date.now()}`,
          role: "ai",
          text: "Xin lỗi bạn, kết nối tới AI Stylist đang bận hoặc gián đoạn. Bạn vui lòng thử lại sau ít giây nhé!",
          followUps: ["Thử lại câu hỏi vừa rồi", "Gợi ý set đồ dạo phố"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className={`${styles.aiChatContainer} ${embedded ? styles.isEmbedded : ""}`}>
      {/* Khung cuộn tin nhắn */}
      <div className={styles.aiChatThread}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.chatBubbleWrapper} ${msg.role === "ai" ? styles.isAi : styles.isUser}`}
          >
            {msg.role === "ai" && (
              <div className={styles.stylistAvatar} title="Routine AI Stylist">
                <span>R</span>
              </div>
            )}

            <div className={styles.chatBubbleContent}>
              <div className={`${styles.chatBubble} ${msg.role === "ai" ? styles.isAi : styles.isUser}`}>
                {msg.image && (
                  <img src={msg.image} alt="Uploaded outfit" className={styles.userImageThumb} />
                )}
                <p className={styles.bubbleText}>{msg.text}</p>
              </div>

              {/* Thẻ phối đồ tương tác trực quan */}
              {msg.outfit && msg.outfit.products && msg.outfit.products.length > 0 && (
                <InteractiveOutfitCard outfit={msg.outfit} />
              )}

              {/* Gợi ý câu hỏi tiếp theo (Follow-up chips) & Quiz banner */}
              {msg.role === "ai" && (
                <div className={styles.followupChipsContainer}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                    <span className={styles.chipsLabel}>Gợi ý câu hỏi:</span>
                    <button
                      type="button"
                      className={styles.quizBannerBtn}
                      onClick={() => {
                        setShowQuiz(!showQuiz);
                        setQuizStep(1);
                      }}
                      title="Trắc nghiệm chọn phong cách 3 bước"
                    >
                      <span>✨</span>
                      <span>Style Quiz (30s)</span>
                    </button>
                  </div>
                  {msg.followUps && msg.followUps.length > 0 && (
                    <div className={styles.chipsList}>
                      {msg.followUps.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={styles.chipBtn}
                          onClick={() => handleSendMessage(chip)}
                          disabled={loading}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading / Typing indicator */}
        {loading && (
          <div className={`${styles.chatBubbleWrapper} ${styles.isAi}`}>
            <div className={styles.stylistAvatar}>
              <span>R</span>
            </div>
            <div className={`${styles.chatBubble} ${styles.isAi} ${styles.typingBubble}`}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.typingText}>Stylist đang phân tích dáng đồ & phối set...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Style Quiz 3 bước tương tác nhanh */}
      {showQuiz && (
        <div style={{ padding: "0 20px" }}>
          <div className={styles.quizCard}>
            <div className={styles.quizHeader}>
              <h4 className={styles.quizTitle}>
                {quizStep === 1 && "Bước 1: Bạn muốn diện set đồ cho dịp nào?"}
                {quizStep === 2 && "Bước 2: Phong cách hoặc thời tiết bạn yêu thích?"}
                {quizStep === 3 && "Bước 3: Ngân sách dự kiến của bạn?"}
              </h4>
              <span className={styles.quizStepNumber}>{quizStep} / 3</span>
            </div>

            {quizStep === 1 && (
              <div className={styles.quizOptionsGrid}>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("occasion", "đi làm công sở thanh lịch")}>
                  🏢 Đi làm công sở
                </button>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("occasion", "dạo phố cà phê cuối tuần")}>
                  ☕ Dạo phố cuối tuần
                </button>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("occasion", "hẹn hò ăn tối lãng mạn")}>
                  🍷 Hẹn hò lãng mạn
                </button>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("occasion", "du lịch dã ngoại thoải mái")}>
                  ✈️ Du lịch / Đi chơi
                </button>
              </div>
            )}

            {quizStep === 2 && (
              <div className={styles.quizOptionsGrid}>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("style", "Routine Thu Đông giữ ấm layer")}>
                  🍂 Routine Thu Đông
                </button>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("style", "tối giản thanh lịch Minimalist")}>
                  ✨ Tối giản Minimal
                </button>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("style", "phóng khoáng dáng lớn Oversize")}>
                  🛹 Phóng khoáng Oversize
                </button>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("style", "lịch thiệp chỉn chu Smart Casual")}>
                  👔 Lịch sự Smart-Casual
                </button>
              </div>
            )}

            {quizStep === 3 && (
              <div className={styles.quizOptionsGrid}>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("budget", "dưới 800.000đ")}>
                  💰 Dưới 800.000đ
                </button>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("budget", "khoảng 1 triệu đến 1.5 triệu")}>
                  💵 1tr - 1.5 triệu
                </button>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("budget", "tầm 2 triệu đổ lại")}>
                  💳 Tầm 2 triệu
                </button>
                <button type="button" className={styles.quizOptionBtn} onClick={() => handleQuizAnswer("budget", "linh hoạt thoải mái")}>
                  💎 Không giới hạn
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input gửi tin nhắn */}
      <div className={styles.aiChatInputArea}>
        {selectedImage && (
          <div className={styles.imagePreviewBar}>
            <img src={selectedImage} alt="Preview" className={styles.imagePreviewThumb} />
            <span className={styles.imagePreviewInfo}>Đã đính kèm ảnh trang phục (Gemini Vision sẽ phân tích phong cách)</span>
            <button type="button" className={styles.btnRemoveImage} onClick={() => setSelectedImage(null)} title="Hủy ảnh">
              ✕
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />

        <div className={styles.inputWrapper}>
          <button
            type="button"
            className={styles.btnUploadImage}
            onClick={() => fileInputRef.current?.click()}
            title="Tải ảnh trang phục từ máy (Visual Stylist)"
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </button>

          <input
            type="text"
            className={styles.chatInput}
            placeholder={selectedImage ? "Thêm yêu cầu hoặc nhấn Gửi để AI phân tích ảnh..." : "Nhắn tin phong cách hoặc gửi ảnh trang phục..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <button
            type="button"
            className={styles.btnSend}
            onClick={() => handleSendMessage()}
            disabled={loading || (!inputText.trim() && !selectedImage)}
            title="Gửi câu hỏi"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
