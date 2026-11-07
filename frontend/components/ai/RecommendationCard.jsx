// Inside the AI Stylist chat, the recommendation is rendered as a
// message bubble. We reuse the shared OutfitRecommendation card so
// styling and "Add All To Cart" / "View Outfit" behavior stay
// consistent with the rest of the Smart Outfit feature.
import OutfitRecommendation from "@/components/outfit/OutfitRecommendation";

export default function RecommendationCard({ recommendation }) {
  return <OutfitRecommendation recommendation={recommendation} />;
}
