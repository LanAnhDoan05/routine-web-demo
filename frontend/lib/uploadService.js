// Upload service để tải ảnh lên server, lưu trực tiếp vào Database MySQL (bảng media_files)
import { getApiBase } from "./api";

const MAX_SOURCE_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_SIZE = 4 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

function validateImageFile(file) {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!IMAGE_TYPES[file.type]?.includes(extension)) {
    throw new Error("Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc WEBP.");
  }
  if (file.size <= 0) {
    throw new Error("File ảnh không có dữ liệu.");
  }
  if (file.size > MAX_SOURCE_IMAGE_SIZE) {
    throw new Error("Dung lượng ảnh gốc không được vượt quá 20MB.");
  }
}

/**
 * Nén ảnh trên trình duyệt và giới hạn cạnh dài ở 1920px trước khi tải lên.
 */
async function compressImageForUpload(file) {
  // Nếu file đã rất nhỏ (< 800KB) và là webp hoặc jpeg thì không cần nén
  if (file.size < 800 * 1024 && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
    return file;
  }

  if (typeof window === 'undefined') return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDimension = 1920; // Chuẩn Full HD / 2K cho banner & hero

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        // Sử dụng format webp (nén tốt nhất, hỗ trợ cả ảnh trong suốt) hoặc jpeg
        const format = 'image/webp';
        const quality = 0.85;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            if (blob.size >= file.size) {
              return resolve(file);
            }
            const cleanName = file.name.replace(/\.[^.]+$/, '') + '.webp';
            const compressedFile = new File([blob], cleanName, {
              type: format,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          format,
          quality
        );
      };
      img.onerror = () => reject(new Error("Không thể đọc nội dung ảnh. Vui lòng chọn một ảnh hợp lệ."));
      if (typeof e.target.result !== "string") {
        reject(new Error("Không thể đọc file ảnh."));
        return;
      }
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageFile(file) {
  if (!file) throw new Error("Chưa chọn file hình ảnh");
  validateImageFile(file);

  // Tự động nén ảnh nếu file nặng, tránh lỗi 413 Payload Too Large của Vercel
  const fileToUpload = await compressImageForUpload(file);
  if (fileToUpload.size > MAX_UPLOAD_IMAGE_SIZE) {
    throw new Error("Ảnh sau khi tối ưu vẫn vượt quá 4MB. Vui lòng chọn ảnh có dung lượng thấp hơn.");
  }

  const formData = new FormData();
  formData.append('image', fileToUpload);

  let token = null;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('routine_token') || localStorage.getItem('token');
    if (stored) {
      try {
        const parts = stored.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const notExpired = !payload.exp || payload.exp * 1000 > Date.now();
          if (notExpired) {
            token = stored;
          }
        }
      } catch (e) {
        token = stored;
      }
    }
  }

  if (!token) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const res = await fetch(`${getApiBase()}/upload/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error('Dung lượng ảnh vượt quá giới hạn 4MB của máy chủ. Vui lòng chọn ảnh nhẹ hơn.');
    }
    const errorMsg = json?.message || `Lỗi tải ảnh (${res.status})`;
    throw new Error(errorMsg);
  }

  const uploadedUrl = json?.data?.url || json?.url;
  if (typeof uploadedUrl !== "string" || !uploadedUrl.trim()) {
    throw new Error("Máy chủ không trả về đường dẫn ảnh đã lưu.");
  }
  return uploadedUrl;
}

export default uploadImageFile;
