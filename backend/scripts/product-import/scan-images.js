const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const backendRoot = path.resolve(__dirname, '../..');
const projectRoot = path.resolve(backendRoot, '..');
const uploadsRoot = path.resolve(process.argv[2] || path.join(backendRoot, 'public', 'uploads'));
const outputRoot = path.join(__dirname, 'output');
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.tif', '.tiff']);
const categories = [
  { pattern: /(?:^|_)ao_khoac(?:_|$)/, slugHint: 'ao-khoac', label: 'áo khoác', price: 699000 },
  { pattern: /(?:^|_)ao_len(?:_|$)/, slugHint: 'ao-len', label: 'áo len', price: 499000 },
  { pattern: /(?:^|_)ao_ni(?:_|$)/, slugHint: 'ao-ni', label: 'áo nỉ', price: 499000 },
  { pattern: /(?:^|_)ao_vest(?:_|$)/, slugHint: 'ao-vest', label: 'áo vest', price: 899000 },
  { pattern: /(?:^|_)quan_jean(?:_|$)/, slugHint: 'quan-jean', label: 'quần jeans', price: 599000 },
  { pattern: /(?:^|_)quan_kaki(?:_|$)/, slugHint: 'quan-kaki', label: 'quần kaki', price: 599000 },
  { pattern: /(?:^|_)quan_ni(?:_|$)/, slugHint: 'quan-ni', label: 'quần nỉ', price: 499000 },
  { pattern: /(?:^|_)quan_tay(?:_|$)/, slugHint: 'quan-tay', label: 'quần tây', price: 599000 },
  { pattern: /(?:^|_)quan_vai(?:_|$)/, slugHint: 'quan-vai', label: 'quần vải', price: 499000 },
  { pattern: /(?:^|_)dam_dam(?:_|$)/, slugHint: 'dam', label: 'đầm', price: 699000 },
  { pattern: /(?:^|_)giay_dep(?:_|$)/, slugHint: 'giay-dep', label: 'giày dép', price: 699000 },
  { pattern: /(?:^|_)non_bang(?:_|$)/, slugHint: 'non', label: 'mũ', price: 299000 },
  { pattern: /(?:^|_)tui_vi(?:_|$)/, slugHint: 'tui-vi', label: 'túi ví', price: 499000 },
  { pattern: /(?:^|_)vo_tat(?:_|$)/, slugHint: 'vo-tat', label: 'vớ tất', price: 79000 },
];

function listImageFiles(directory) {
  if (!fs.existsSync(directory)) throw new Error(`Không tìm thấy thư mục ảnh: ${directory}`);
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listImageFiles(fullPath));
    else if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files.sort((a, b) => a.localeCompare(b, 'en'));
}

function parseFilename(filename) {
  const stem = path.basename(filename, path.extname(filename));
  const match = stem.match(/^routine_(nam|nu|unisex|phu_kien)_(\d{8}t\d{6}z_\d+_\d+)_(.+)$/i);
  if (!match) return null;

  const sourceGender = match[1].toLowerCase();
  const tail = match[3].replace(/_anh_chup_man_hinh_.*$/i, '');
  const normalizedTail = tail.replace(/^(nam|nu|unisex|phu_kien)_/i, '');
  const category = categories.find((candidate) => candidate.pattern.test(`_${normalizedTail}_`));
  const groupKey = `${sourceGender}_${normalizedTail}`;
  const groupHash = crypto.createHash('sha256').update(groupKey).digest('hex').slice(0, 12);
  const numberMatch = normalizedTail.match(/_(\d+)(?:_[a-z]+)?$/i);

  return {
    groupKey,
    productCode: `IMPORT-${groupHash.toUpperCase()}`,
    genderHint: sourceGender === 'nam' ? 'men' : sourceGender === 'nu' ? 'women' : null,
    categorySlugHint: category?.slugHint || null,
    categoryLabelHint: category?.label || null,
    productNumberHint: numberMatch?.[1] || null,
    parseConfidence: category ? 0.65 : 0.35,
  };
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function imageUrl(filename) {
  return `/api/v1/media/${encodeURIComponent(filename)}`;
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[character]));
}

function perceptualHash(pixels) {
  const size = 32;
  const frequencies = 8;
  const weights = Array.from({ length: frequencies }, (_, frequency) => (
    Array.from({ length: size }, (_, position) => (
      Math.cos(((2 * position + 1) * frequency * Math.PI) / (2 * size))
    ))
  ));
  const coefficients = [];
  for (let vertical = 0; vertical < frequencies; vertical += 1) {
    for (let horizontal = 0; horizontal < frequencies; horizontal += 1) {
      if (vertical === 0 && horizontal === 0) continue;
      let sum = 0;
      for (let y = 0; y < size; y += 1) {
        const verticalWeight = weights[vertical][y];
        for (let x = 0; x < size; x += 1) {
          const horizontalWeight = weights[horizontal][x];
          sum += pixels[(y * size) + x] * verticalWeight * horizontalWeight;
        }
      }
      coefficients.push(sum);
    }
  }
  const sorted = [...coefficients].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  let hash = 0n;
  for (const coefficient of coefficients) hash = (hash << 1n) | (coefficient > median ? 1n : 0n);
  return hash.toString(16).padStart(16, '0');
}

function hammingDistance(first, second) {
  let value = BigInt(`0x${first}`) ^ BigInt(`0x${second}`);
  let count = 0;
  while (value) {
    value &= value - 1n;
    count += 1;
  }
  return count;
}

async function mapWithConcurrency(items, concurrency, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await callback(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function createContactSheets(records, sharp) {
  const sheetsRoot = path.join(outputRoot, 'contact-sheets');
  fs.mkdirSync(sheetsRoot, { recursive: true });
  const columns = 6;
  const rows = 8;
  const tileWidth = 180;
  const tileHeight = 200;
  const perSheet = columns * rows;

  for (let offset = 0; offset < records.length; offset += perSheet) {
    const batch = records.slice(offset, offset + perSheet);
    const composites = await Promise.all(batch.map(async (record, batchIndex) => {
      const inputPath = path.join(uploadsRoot, record.relativePath);
      const imageBuffer = await sharp(inputPath)
        .rotate()
        .resize(168, 164, { fit: 'inside', background: '#ffffff' })
        .png()
        .toBuffer();
      const left = (batchIndex % columns) * tileWidth + 6;
      const top = Math.floor(batchIndex / columns) * tileHeight + 4;
      const title = `${offset + batchIndex + 1}. ${record.productCode || 'UNMATCHED'}`;
      const filename = path.basename(record.filename);
      const caption = filename.length > 23 ? `${filename.slice(0, 20)}...` : filename;
      const label = Buffer.from(
        `<svg width="168" height="28"><rect width="100%" height="100%" fill="white"/><text x="2" y="12" font-size="10" font-family="Arial">${escapeXml(title)}</text><text x="2" y="25" font-size="8" font-family="Arial">${escapeXml(caption)}</text></svg>`,
      );
      return [
        { input: imageBuffer, left, top },
        { input: label, left, top: top + 164 },
      ];
    }));

    const tiles = composites.flat();
    const sheetNumber = String(Math.floor(offset / perSheet) + 1).padStart(3, '0');
    await sharp({
      create: {
        width: columns * tileWidth,
        height: rows * tileHeight,
        channels: 3,
        background: '#eeeeee',
      },
    })
      .composite(tiles)
      .jpeg({ quality: 82 })
      .toFile(path.join(sheetsRoot, `sheet-${sheetNumber}.jpg`));
  }
}

async function main() {
  const sharp = require(path.join(projectRoot, 'frontend', 'node_modules', 'sharp'));
  const files = listImageFiles(uploadsRoot);
  const groups = new Map();
  const output = await mapWithConcurrency(files, 4, async (fullPath, index) => {
    const filename = path.basename(fullPath);
    const relativePath = path.relative(uploadsRoot, fullPath).split(path.sep).join('/');
    const stat = fs.statSync(fullPath);
    const parsed = parseFilename(filename);
    const digest = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
    const record = {
      filename,
      relativePath,
      path: path.relative(projectRoot, fullPath).split(path.sep).join('/'),
      url: imageUrl(filename),
      extension: path.extname(filename).toLowerCase(),
      mimeType: 'image/png',
      sizeBytes: stat.size,
      sha256: digest,
      perceptualHash: null,
      width: null,
      height: null,
      decoded: false,
      decodeError: null,
      exactDuplicateOf: null,
      groupKey: parsed?.groupKey || null,
      productCode: parsed?.productCode || null,
      genderHint: parsed?.genderHint || null,
      categorySlugHint: parsed?.categorySlugHint || null,
      categoryLabelHint: parsed?.categoryLabelHint || null,
      productNumberHint: parsed?.productNumberHint || null,
      parseConfidence: parsed?.parseConfidence ?? 0,
      imageRole: 'UNVERIFIED',
      reviewStatus: parsed ? 'NEEDS_VISUAL_REVIEW' : 'UNMATCHED',
    };

    try {
      const metadata = await sharp(fullPath).metadata();
      const pixels = await sharp(fullPath)
        .rotate()
        .resize(32, 32, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer();
      record.width = metadata.width || null;
      record.height = metadata.height || null;
      record.decoded = Boolean(record.width && record.height);
      record.perceptualHash = perceptualHash(pixels);
    } catch (error) {
      record.decodeError = error.message;
    }

    const existing = groups.get(digest);
    if (existing) record.exactDuplicateOf = existing;
    else groups.set(digest, filename);

    if (index % 100 === 0) console.log(`Đã kiểm tra ${index + 1}/${files.length} ảnh`);
    return record;
  });

  const productsByCode = new Map();
  for (const record of output) {
    if (!record.productCode) continue;
    const group = productsByCode.get(record.productCode) || [];
    group.push(record);
    productsByCode.set(record.productCode, group);
  }

  const candidates = Array.from(productsByCode.entries()).map(([productCode, images]) => {
    const first = images[0];
    const genderLabel = first.genderHint === 'men' ? 'nam' : first.genderHint === 'women' ? 'nữ' : null;
    const productName = [first.categoryLabelHint, genderLabel, `mẫu ${first.productNumberHint || productCode.slice(-4)}`]
      .filter(Boolean)
      .join(' ');
    return {
      productCode,
      candidateName: productName || null,
      categorySlugHint: first.categorySlugHint,
      genderHint: first.genderHint,
      images: images.map((image) => image.url),
      imageCount: images.length,
      imageRoleStatus: 'UNVERIFIED',
      reviewStatus: 'NEEDS_VISUAL_REVIEW',
      price: categories.find((category) => category.slugHint === first.categorySlugHint)?.price || null,
      priceSource: 'ESTIMATED',
      status: 'DRAFT',
      stockQuantity: 0,
    };
  });

  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, 'image-manifest.json'), `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(path.join(outputRoot, 'product-import-data.json'), `${JSON.stringify(candidates, null, 2)}\n`);

  const mappingHeader = [
    'image_filename', 'product_code', 'product_name_candidate', 'category_slug_hint',
    'gender_hint', 'image_role', 'confidence_score', 'review_status', 'image_url',
  ];
  const mappingLines = [mappingHeader.map(csvEscape).join(',')];
  for (const record of output) {
    const candidate = candidates.find((item) => item.productCode === record.productCode);
    mappingLines.push([
      record.filename,
      record.productCode,
      candidate?.candidateName,
      record.categorySlugHint,
      record.genderHint,
      record.imageRole,
      record.parseConfidence,
      record.reviewStatus,
      record.url,
    ].map(csvEscape).join(','));
  }
  fs.writeFileSync(path.join(outputRoot, 'image-product-mapping.csv'), `${mappingLines.join('\n')}\n`);

  const duplicateGroups = new Map();
  for (const record of output) {
    const group = duplicateGroups.get(record.sha256) || [];
    group.push(record.filename);
    duplicateGroups.set(record.sha256, group);
  }
  const duplicates = Array.from(duplicateGroups.values()).filter((group) => group.length > 1);
  const nearDuplicates = [];
  for (let first = 0; first < output.length; first += 1) {
    if (!output[first].perceptualHash) continue;
    for (let second = first + 1; second < output.length; second += 1) {
      if (!output[second].perceptualHash) continue;
      const distance = hammingDistance(output[first].perceptualHash, output[second].perceptualHash);
      if (distance <= 5) {
        nearDuplicates.push({
          first: output[first].filename,
          second: output[second].filename,
          hammingDistance: distance,
        });
      }
    }
  }
  const unmatched = output.filter((record) => !record.productCode || !record.decoded);
  const report = {
    scannedAt: new Date().toISOString(),
    uploadsRoot,
    totalImages: output.length,
    validImages: output.filter((record) => record.decoded).length,
    unreadableImages: output.filter((record) => !record.decoded).length,
    exactDuplicateGroups: duplicates.length,
    duplicateImageCount: duplicates.reduce((sum, group) => sum + group.length, 0),
    perceptualNearDuplicatePairs: nearDuplicates.length,
    filenameProductCandidates: candidates.length,
    mappedImages: output.filter((record) => record.productCode).length,
    unmatchedImages: unmatched.length,
    imagesRequiringVisualReview: output.filter((record) => record.productCode).length,
    categoryHints: candidates.reduce((counts, candidate) => {
      const key = candidate.categorySlugHint || 'unclassified';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {}),
    groupsByImageCount: candidates.reduce((counts, candidate) => {
      counts[candidate.imageCount] = (counts[candidate.imageCount] || 0) + 1;
      return counts;
    }, {}),
    errors: output.filter((record) => record.decodeError).map((record) => ({
      filename: record.filename,
      error: record.decodeError,
    })),
  };
  fs.writeFileSync(path.join(outputRoot, 'duplicates.json'), `${JSON.stringify(duplicates, null, 2)}\n`);
  fs.writeFileSync(path.join(outputRoot, 'perceptual-near-duplicates.json'), `${JSON.stringify(nearDuplicates, null, 2)}\n`);
  fs.writeFileSync(path.join(outputRoot, 'unmatched-images.json'), `${JSON.stringify(unmatched, null, 2)}\n`);
  fs.writeFileSync(path.join(outputRoot, 'import-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await createContactSheets(output, sharp);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
