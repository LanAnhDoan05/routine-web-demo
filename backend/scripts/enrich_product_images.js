const prisma = require('../src/config/prisma');
const fs = require('fs');
const path = require('path');

// Pool các ảnh thật chất lượng cao theo từng chủng loại thời trang từ uploads
const CATEGORY_IMAGE_POOLS = {
  // Quần nam, quần nữ, jeans, khaki, short
  pants: [
    ['/uploads/img-1788789096784-121126637.webp', '/uploads/img-1788789100600-329729858.webp'],
    ['/uploads/img-1788789509639-342621014.webp', '/uploads/img-1788789512837-782537079.webp'],
    ['/uploads/img-1788789669749-422416448.jpg', '/uploads/img-1788789673509-265161391.jpg'],
    ['/uploads/img-1788789388728-43325308.jpg', '/uploads/img-1788789392144-757107411.jpg'],
    ['/uploads/img-1788794488245-271288264.webp', '/uploads/img-1788794493463-838985409.webp'],
    ['/uploads/img-1788794509055-167923952.webp', '/uploads/img-1788794513632-800301931.webp'],
    ['/uploads/img-1788794558645-955849527.webp', '/uploads/img-1788794562549-275483262.webp'],
    ['/uploads/img-1788794627591-345841381.webp', '/uploads/img-1788794631360-249341018.webp'],
    ['/uploads/img-1788794643901-682456479.webp', '/uploads/img-1788794647209-748503730.webp']
  ],
  // Áo thun, t-shirt, áo dệt kim, tank top
  tshirt: [
    ['/uploads/img-1788788886115-139226453.webp', '/uploads/img-1788788890770-383894875.jpg'],
    ['/uploads/img-1788789435756-392598710.jpg', '/uploads/img-1788789439836-321913596.jpg'],
    ['/uploads/img-1788789720272-397873601.jpg', '/uploads/img-1788789724695-218007463.webp'],
    ['/uploads/img-1788793187882-587604417.webp', '/uploads/img-1788793191940-293647310.webp'],
    ['/uploads/img-1788801063358-232650361.webp', '/uploads/img-1788801077884-24959832.jpg'],
    ['/uploads/img-1788801720935-968588778.webp', '/uploads/img-1788801729030-465640924.webp']
  ],
  // Sơ mi, polo, blouse
  shirt: [
    ['/uploads/prod_p003_1_1788764847560.webp', '/uploads/prod_p003_2_1788764847565.webp'],
    ['/uploads/img-1788789745799-962068753.jpg', '/uploads/img-1788789749677-678952506.jpg'],
    ['/uploads/img-1788789037523-58527940.avif', '/uploads/img-1788789041214-199752730.avif'],
    ['/uploads/img-1788789252248-511299441.jpg', '/uploads/img-1788789256330-57759274.jpg'],
    ['/uploads/img-1788801738528-178510945.webp', '/uploads/img-1788801751799-73294316.webp']
  ],
  // Áo khoác, blazer, bomber, jacket, coat, hoodie
  jacket: [
    ['/uploads/img-1788767099772-945379977.avif', '/uploads/img-1788767104503-521862429.png'],
    ['/uploads/img-1788789549278-699258825.jpg', '/uploads/img-1788789552761-709873296.jpg'],
    ['/uploads/img-1788788958479-491742161.jpg', '/uploads/img-1788788961701-600777499.webp'],
    ['/uploads/img-1788788771961-835441756.jpg', '/uploads/img-1788788776688-972906877.avif'],
    ['/uploads/img-1788789928154-820919560.jpg', '/uploads/img-1788789932225-455919790.webp'],
    ['/uploads/img-1788789623591-735686824.webp', '/uploads/img-1788789627222-292952969.webp']
  ],
  // Váy, đầm, chân váy
  dress: [
    ['/uploads/img-1788789197979-136891652.jpg', '/uploads/img-1788789202671-490759616.jpg'],
    ['/uploads/img-1788788917121-292761808.jpg', '/uploads/img-1788788921095-318472561.jpg'],
    ['/uploads/img-1788789037523-58527940.avif', '/uploads/img-1788789041214-199752730.avif'],
    ['/uploads/img-1788789782177-418893206.jpg', '/uploads/img-1788789786856-564475639.jpg']
  ],
  // Phụ kiện, giày, nón, túi
  accessories: [
    ['/uploads/img-1788789297086-921796527.webp', '/uploads/img-1788789300606-986812508.jpg'],
    ['/uploads/img-1788789693643-744774052.jpg', '/uploads/img-1788789698123-466651504.jpg'],
    ['/uploads/img-1788789344907-557287861.jpg', '/uploads/img-1788789353620-512109767.jpg'],
    ['/uploads/img-1788790043902-928274212.jpg', '/uploads/img-1788790046772-932424625.jpg']
  ]
};

function detectCategoryType(name = '', catSlug = '') {
  const text = (name + ' ' + catSlug).toLowerCase();
  if (text.includes('quần') || text.includes('pant') || text.includes('jean') || text.includes('khaki') || text.includes('short') || text.includes('trousers') || text.includes('bottom')) {
    return 'pants';
  }
  if (text.includes('khoác') || text.includes('blazer') || text.includes('jacket') || text.includes('bomber') || text.includes('hoodie') || text.includes('coat') || text.includes('outerwear')) {
    return 'jacket';
  }
  if (text.includes('váy') || text.includes('đầm') || text.includes('skirt') || text.includes('dress')) {
    return 'dress';
  }
  if (text.includes('sơ mi') || text.includes('shirt') || text.includes('polo') || text.includes('blouse')) {
    return 'shirt';
  }
  if (text.includes('giày') || text.includes('sneaker') || text.includes('nón') || text.includes('mũ') || text.includes('túi') || text.includes('thắt lưng') || text.includes('belt') || text.includes('phụ kiện')) {
    return 'accessories';
  }
  return 'tshirt';
}

async function run() {
  console.log('=== TIẾN HÀNH SỬA VÀ TỐI ƯU HÓA ẢNH SẢN PHẨM ===');
  const products = await prisma.product.findMany();
  console.log(`Tìm thấy tổng cộng ${products.length} sản phẩm.`);

  // Đảm bảo tất cả file trong pool đều tồn tại thật sự trên đĩa cứng
  const uploadsDir = path.resolve(__dirname, '../public/uploads');
  for (const [cat, pairs] of Object.entries(CATEGORY_IMAGE_POOLS)) {
    pairs.forEach(pair => {
      pair.forEach(url => {
        const fn = url.replace('/uploads/', '');
        const exists = fs.existsSync(path.join(uploadsDir, fn));
        if (!exists) {
          console.warn(`[WARN] File not found in pool: ${url}`);
        }
      });
    });
  }

  let fixedCount = 0;
  let keepCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let imgs = p.images;
    if (typeof imgs === 'string') {
      try { imgs = JSON.parse(imgs); } catch(e) { imgs = []; }
    }

    const first = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null;
    let isValid = false;

    if (first && typeof first === 'string' && first.startsWith('/uploads/')) {
      const fn = first.replace('/uploads/', '');
      if (fs.existsSync(path.join(uploadsDir, fn))) {
        isValid = true;
      }
    }

    if (isValid) {
      keepCount++;
    } else {
      // Cần gán ảnh thật phù hợp từ pool
      const type = detectCategoryType(p.name, p.categorySlug || p.categoryId || '');
      const pool = CATEGORY_IMAGE_POOLS[type] || CATEGORY_IMAGE_POOLS.tshirt;
      // Chọn deterministic dựa trên chuỗi id của sản phẩm
      let hash = 0;
      for (let c = 0; c < p.id.length; c++) hash += p.id.charCodeAt(c);
      const chosenImages = pool[hash % pool.length];

      await prisma.product.update({
        where: { id: p.id },
        data: {
          images: chosenImages
        }
      });
      fixedCount++;
      console.log(`[FIXED] Product ${p.id} (${p.name}) -> Type: ${type} -> Assigned ${chosenImages.length} real photos`);
    }
  }

  // Cập nhật ngày tạo của 28 sản phẩm kinh điển để chúng xuất hiện ngay trên đầu trang chủ
  console.log('\nĐang ưu tiên thứ tự hiển thị cho 28 sản phẩm Routine chính hãng...');
  const baseDate = new Date();
  for (let idx = 1; idx <= 28; idx++) {
    const pId = `p${String(idx).padStart(3, '0')}`;
    const pDate = new Date(baseDate.getTime() + idx * 1000);
    try {
      await prisma.product.update({
        where: { id: pId },
        data: {
          createdAt: pDate,
          badge: idx <= 8 ? 'NEW' : (idx <= 16 ? 'BEST SELLER' : null)
        }
      });
    } catch(e) {}
  }

  console.log(`\n✅ HOÀN TẤT:`);
  console.log(`- Giữ nguyên ảnh hợp lệ: ${keepCount} sản phẩm`);
  console.log(`- Đã sửa & gán ảnh thật 100%: ${fixedCount} sản phẩm`);
  console.log(`- Đã tối ưu thứ tự hiển thị trang chủ cho 28 sản phẩm chủ đạo.`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
