import PlaceholderPage from "@/components/admin/PlaceholderPage";
import { IconReviews } from "@/components/admin/icons";

export default function ReviewsPage() {
  return (
    <PlaceholderPage
      title="Reviews"
      subtitle="Quản lý đánh giá sản phẩm"
      icon={<IconReviews size={20} />}
      message="Review management will be connected to backend later."
    />
  );
}
