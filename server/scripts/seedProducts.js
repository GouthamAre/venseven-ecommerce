require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Product = require("../models/Product");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/venseven";

const initialProducts = [
  {
    name: "Men’s Casual Trousers",
    slug: "mens-casual-trousers",
    category: "Trousers",
    subcategory: "Casual Pants",
    color: "Light Olive Green",
    colorHex: "#556B2F",
    price: 2499,
    salePrice: null,
    sizes: [
      { size: "M", stock: 12, sku: "V7-TRO-M-001" },
      { size: "L", stock: 15, sku: "V7-TRO-L-001" },
      { size: "XL", stock: 8, sku: "V7-TRO-XL-001" },
    ],
    primaryImage: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/casual-pant.jpg",
    images: [
      {
        url: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/casual-pant.jpg",
        publicId: "venseven/products/casual-pant",
        alt: "Men’s Casual Trousers Front View",
      },
    ],
    isBestSeller: true,
    isNewArrival: true,
    description:
      "Crafted with a relaxed tapered silhouette and premium heavyweight cotton twill, these casual trousers offer effortless versatility for weekday meetings or weekend city exploration.",
    details: [
      "Relaxed tapered fit with comfortable mid-rise waist",
      "Reinforced dual side pockets and welt back pockets",
      "Custom branded button and heavy-duty YKK brass zipper",
      "Pre-shrunk fabric to maintain tailored shape over time",
    ],
    fabric: "98% Premium Organic Cotton, 2% Elastane",
    fit: "Relaxed Tapered",
    care: "Machine wash cold with like colors. Line dry inside out. Warm iron if needed.",
    tags: ["trousers", "casual", "olive", "cotton", "bestseller"],
    isActive: true,
  },
  {
    name: "Classic Men’s Wine Formal Shirt",
    slug: "classic-mens-wine-formal-shirt",
    category: "Shirts",
    subcategory: "Formal Shirts",
    color: "Plum Wine",
    colorHex: "#58111A",
    price: 1999,
    salePrice: null,
    sizes: [
      { size: "S", stock: 10, sku: "V7-SHT-S-002" },
      { size: "M", stock: 14, sku: "V7-SHT-M-002" },
      { size: "L", stock: 12, sku: "V7-SHT-L-002" },
      { size: "XL", stock: 6, sku: "V7-SHT-XL-002" },
    ],
    primaryImage: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/wine-shirt.jpg",
    images: [
      {
        url: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/wine-shirt.jpg",
        publicId: "venseven/products/wine-shirt",
        alt: "Classic Men’s Wine Formal Shirt Front View",
      },
    ],
    isBestSeller: true,
    isNewArrival: true,
    description:
      "A statement formal piece in rich plum wine. Tailored from compact satin-weave Egyptian cotton that drapes cleanly and resists creasing throughout long days.",
    details: [
      "Structured semi-spread collar with removable collar stays",
      "Clean French placket with mother-of-pearl finish buttons",
      "Adjustable mitered cuffs with dual button closure",
      "Curved hem tailored to stay neatly tucked in",
    ],
    fabric: "100% Giza Long-Staple Cotton (Satin Weave)",
    fit: "Slim Tailored",
    care: "Dry clean recommended or machine wash gentle. Steam iron while damp.",
    tags: ["shirts", "formal", "wine", "egyptian-cotton", "bestseller"],
    isActive: true,
  },
  {
    name: "Men’s Printed Casual Shirt",
    slug: "mens-printed-casual-shirt",
    category: "Shirts",
    subcategory: "Casual Shirts",
    color: "Black",
    colorHex: "#111111",
    price: 1999,
    salePrice: null,
    sizes: [
      { size: "M", stock: 8, sku: "V7-SHT-M-003" },
      { size: "L", stock: 10, sku: "V7-SHT-L-003" },
      { size: "XL", stock: 10, sku: "V7-SHT-XL-003" },
      { size: "XXL", stock: 4, sku: "V7-SHT-XXL-003" },
    ],
    primaryImage: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/casual-shirt.jpg",
    images: [
      {
        url: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/casual-shirt.jpg",
        publicId: "venseven/products/casual-shirt",
        alt: "Men’s Printed Casual Shirt Front View",
      },
    ],
    isBestSeller: false,
    isNewArrival: true,
    description:
      "Understated geometric micro-print crafted for dusk-to-dawn transitions. Cut in our modern relaxed fit with breathable airy cotton poplin.",
    details: [
      "Camp collar design for relaxed summer and evening styling",
      "Matte black branded buttons with cross-stitched thread",
      "Straight hemline with subtle side seam vents",
      "Garment washed for a soft lived-in feel",
    ],
    fabric: "100% Breathable Fine Cotton Poplin",
    fit: "Modern Relaxed",
    care: "Machine wash cold. Do not bleach. Tumble dry low.",
    tags: ["shirts", "casual", "black", "printed", "new-arrival"],
    isActive: true,
  },
  {
    name: "Essential Graphic Tee",
    slug: "essential-graphic-tee",
    category: "T-Shirts",
    subcategory: "Graphic Tees",
    color: "Deep Blue",
    colorHex: "#1a2a3a",
    price: 1499,
    salePrice: null,
    sizes: [
      { size: "S", stock: 15, sku: "V7-TEE-S-004" },
      { size: "M", stock: 20, sku: "V7-TEE-M-004" },
      { size: "L", stock: 18, sku: "V7-TEE-L-004" },
      { size: "XL", stock: 10, sku: "V7-TEE-XL-004" },
    ],
    primaryImage: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/graphic-tee.jpg",
    images: [
      {
        url: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/graphic-tee.jpg",
        publicId: "venseven/products/graphic-tee",
        alt: "Essential Graphic Tee Front View",
      },
    ],
    isBestSeller: true,
    isNewArrival: true,
    description:
      "A heavyweight 240 GSM luxury cotton t-shirt featuring subtle architectural typography. Engineered with a ribbed collar that maintains its shape wash after wash.",
    details: [
      "Heavyweight 240 GSM combed ring-spun cotton",
      "Ribbed crew neck with reinforced shoulder-to-shoulder tape",
      "High-density minimalist chest print that won't crack",
      "Boxy contemporary streetwear silhouette",
    ],
    fabric: "100% Combed Compact Cotton (240 GSM)",
    fit: "Boxy Streetwear",
    care: "Machine wash inside out in cold water. Iron on reverse side.",
    tags: ["t-shirts", "tees", "graphic", "heavyweight", "bestseller"],
    isActive: true,
  },
  {
    name: "Classic Black Formal Shirt",
    slug: "classic-black-formal-shirt",
    category: "Shirts",
    subcategory: "Formal Shirts",
    color: "Black",
    colorHex: "#000000",
    price: 1999,
    salePrice: null,
    sizes: [
      { size: "S", stock: 8, sku: "V7-SHT-S-005" },
      { size: "M", stock: 16, sku: "V7-SHT-M-005" },
      { size: "L", stock: 14, sku: "V7-SHT-L-005" },
      { size: "XL", stock: 8, sku: "V7-SHT-XL-005" },
      { size: "XXL", stock: 5, sku: "V7-SHT-XXL-005" },
    ],
    primaryImage: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/black-formal-shirt.jpg",
    images: [
      {
        url: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/black-formal-shirt.jpg",
        publicId: "venseven/products/black-formal-shirt",
        alt: "Classic Black Formal Shirt Front View",
      },
    ],
    isBestSeller: true,
    isNewArrival: true,
    description:
      "The definitive black formal shirt. Deep saturated onyx dye that retains intensity with an ultra-smooth finish engineered for tailored suits and formal evening wear.",
    details: [
      "Crisp point collar with fused interlining for all-day sharpness",
      "Tone-on-tone dyed buttons with sleek minimal stitching",
      "Slim tailored body cut with clean back darts",
      "Fade-resistant reactive dye technology",
    ],
    fabric: "100% Egyptian Cotton Twill",
    fit: "Slim Tailored",
    care: "Machine wash gentle cycle. Do not wring. Medium steam iron.",
    tags: ["shirts", "formal", "black", "egyptian-cotton", "bestseller"],
    isActive: true,
  },
  {
    name: "Classic White Formal Shirt",
    slug: "classic-white-formal-shirt",
    category: "Shirts",
    subcategory: "Formal Shirts",
    color: "White",
    colorHex: "#FFFFFF",
    price: 1999,
    salePrice: null,
    sizes: [
      { size: "S", stock: 12, sku: "V7-SHT-S-006" },
      { size: "M", stock: 18, sku: "V7-SHT-M-006" },
      { size: "L", stock: 15, sku: "V7-SHT-L-006" },
      { size: "XL", stock: 8, sku: "V7-SHT-XL-006" },
    ],
    primaryImage: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/white-formal-shirt.jpg",
    images: [
      {
        url: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/white-formal-shirt.jpg",
        publicId: "venseven/products/white-formal-shirt",
        alt: "Classic White Formal Shirt Front View",
      },
    ],
    isBestSeller: false,
    isNewArrival: true,
    description:
      "The cornerstone of modern menswear. Impeccable optic white shade with high opacity, smooth hand-feel, and enduring tailoring precision.",
    details: [
      "Semi-spread collar designed for four-in-hand and half-windsor knots",
      "High-opacity premium weave that prevents show-through",
      "Durable double-stitched armholes and side seams",
      "Single needle tailoring with 20 stitches per inch",
    ],
    fabric: "100% 2-Ply Supima Cotton (Royal Oxford Weave)",
    fit: "Classic Tailored",
    care: "Warm machine wash. Line dry in shade. Warm iron.",
    tags: ["shirts", "formal", "white", "supima-cotton", "essential"],
    isActive: true,
  },
  {
    name: "Essential Black Trousers",
    slug: "essential-black-trousers",
    category: "Trousers",
    subcategory: "Tailored Trousers",
    color: "Black",
    colorHex: "#000000",
    price: 2299,
    salePrice: null,
    sizes: [
      { size: "M", stock: 10, sku: "V7-TRO-M-007" },
      { size: "L", stock: 12, sku: "V7-TRO-L-007" },
      { size: "XL", stock: 6, sku: "V7-TRO-XL-007" },
    ],
    primaryImage: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/black-trouser.jpg",
    images: [
      {
        url: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/black-trouser.jpg",
        publicId: "venseven/products/black-trouser",
        alt: "Essential Black Trousers Front View",
      },
    ],
    isBestSeller: false,
    isNewArrival: true,
    description:
      "Precision-cut slim trousers in an all-season wool-touch blend. Provides four-way micro-stretch for seamless mobility between desk and dinner.",
    details: [
      "Tailored slim-straight cut with clean front crease",
      "Hidden flex waistband with internal anti-slip shirt grip",
      "Dual slant front pockets and button-through rear pockets",
      "Pre-hemmed for a clean, break-free modern cuff look",
    ],
    fabric: "65% Rayon, 30% Nylon, 5% Spandex",
    fit: "Slim Straight",
    care: "Machine wash cold on delicate cycle or dry clean.",
    tags: ["trousers", "formal", "black", "stretch", "essential"],
    isActive: true,
  },
  {
    name: "Blue Linen Shorts",
    slug: "blue-linen-shorts",
    category: "Shorts",
    subcategory: "Linen Shorts",
    color: "Denim Blue",
    colorHex: "#2C3E50",
    price: 1699,
    salePrice: null,
    sizes: [
      { size: "S", stock: 8, sku: "V7-SHTS-S-008" },
      { size: "M", stock: 14, sku: "V7-SHTS-M-008" },
      { size: "L", stock: 10, sku: "V7-SHTS-L-008" },
    ],
    primaryImage: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/blue-linen-short.jpg",
    images: [
      {
        url: "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/blue-linen-short.jpg",
        publicId: "venseven/products/blue-linen-short",
        alt: "Blue Linen Shorts Front View",
      },
    ],
    isBestSeller: false,
    isNewArrival: true,
    description:
      "Lightweight resort shorts spun from pure European flax linen. Breathable, relaxed, and naturally textured for coastal warm-weather ease.",
    details: [
      "7-inch inseam hitting right above the knee",
      "Elasticated waistband with internal herringbone drawcord",
      "Deep mesh-lined front pockets and single back pocket",
      "Garment dyed for rich depth and softened texture",
    ],
    fabric: "100% Pure European Flax Linen",
    fit: "Relaxed Resort",
    care: "Cold gentle machine wash. Hang dry in shade.",
    tags: ["shorts", "linen", "blue", "summer", "resort"],
    isActive: true,
  },
];

async function seedProducts() {
  console.log("=== VENSEVEN DATABASE PRODUCT SEEDING ===");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);

    let seededCount = 0;
    let updatedCount = 0;

    for (const item of initialProducts) {
      const existing = await Product.findOne({ slug: item.slug });

      if (!existing) {
        const prod = new Product(item);
        await prod.save();
        console.log(`[+] Seeded: ${item.name} (${item.slug}) — Stock: ${prod.totalStock} units`);
        seededCount++;
      } else {
        // Upsert non-destructive updates if needed
        let modified = false;
        if (!existing.images || existing.images.length === 0) {
          existing.images = item.images;
          existing.primaryImage = item.primaryImage;
          modified = true;
        }
        if (!existing.sizes || existing.sizes.length === 0) {
          existing.sizes = item.sizes;
          modified = true;
        }
        if (modified) {
          await existing.save();
          console.log(`[~] Updated: ${item.name} (${item.slug})`);
          updatedCount++;
        } else {
          console.log(`[=] Exists: ${item.name} (${item.slug})`);
        }
      }
    }

    console.log(`\nSeeding completed: ${seededCount} new products inserted, ${updatedCount} updated.`);
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seedProducts();
