"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import EmptyState from "@/components/admin/EmptyState";
import { getProductById, updateProduct } from "@/lib/adminProductService";
import styles from "./page.module.css";

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    let active = true;
    getProductById(id).then((data) => {
      if (active) setProduct(data);
    });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div>
      <PageHeader breadcrumb="Products / Edit Product" title="Edit Product" />

      {product === undefined ? (
        <p className={styles.loadingText}>Đang tải dữ liệu sản phẩm…</p>
      ) : product === null ? (
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description="Sản phẩm này có thể đã bị xoá hoặc đường dẫn không chính xác."
          action={
            <Link href="/admin/products" className={styles.backLink}>
              Quay lại danh sách sản phẩm
            </Link>
          }
        />
      ) : (
        <ProductForm mode="edit" initialProduct={product} onSave={(payload) => updateProduct(id, payload)} />
      )}
    </div>
  );
}
