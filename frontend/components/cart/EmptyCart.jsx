import EmptyState from "@/components/common/EmptyState";
import Button from "@/components/common/Button";

export default function EmptyCart() {
  return (
    <EmptyState
      title="YOUR BAG IS EMPTY"
      description="Bạn chưa có sản phẩm nào trong giỏ hàng."
      action={
        <Button href="/" variant="primary">
          Continue Shopping
        </Button>
      }
    />
  );
}
