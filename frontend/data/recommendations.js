// Mock "Personalized Recommendation" data for the Home page.
// Keyed loosely by style preference; falls back to a default set.

export const recommendationsByStyle = {
  minimal: ["p001", "p019", "p024", "p021"],
  "smart-casual": ["p003", "p006", "p009", "p022"],
  streetstyle: ["p002", "p017", "p020", "p010"],
  basic: ["p001", "p005", "p015", "p019"],
  vintage: ["p008", "p010", "p026", "p012"],
  "sporty-chic": ["p014", "p028", "p020", "p017"]
};

export const defaultRecommendations = ["p001", "p003", "p008", "p019"];

export function getRecommendationsFor(stylePreference) {
  return recommendationsByStyle[stylePreference] || defaultRecommendations;
}

// Quick-choice options used inside the AI Stylist chat flow.
export const aiOccasionOptions = ["Đi làm", "Đi chơi", "Hẹn hò", "Du lịch", "Ở nhà"];

export const aiStyleOptions = [
  "Minimal",
  "Basic",
  "Smart Casual",
  "Streetstyle",
  "Vintage",
  "Sporty"
];

export const aiBudgetOptions = ["< 500K", "500K – 1M", "1M – 2M", "> 2M"];
