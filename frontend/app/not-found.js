import Link from "next/link";
import EmptyState from "@/components/common/EmptyState";

export default function NotFound() {
  return (
    <div className="container section">
      <EmptyState
        title="Không tìm thấy trang"
        description="Trang bạn tìm không tồn tại hoặc đã được di chuyển."
        action={
          <Link href="/" className="btn btn-primary">
            Về trang chủ
          </Link>
        }
      />
    </div>
  );
}
