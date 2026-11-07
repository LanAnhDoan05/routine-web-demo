"use client";

import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/adminProductService";

export default function AddProductPage() {
  return (
    <div>
      <PageHeader breadcrumb="Products / Add Product" title="Add Product" />
      <ProductForm mode="create" initialProduct={null} onSave={createProduct} />
    </div>
  );
}
