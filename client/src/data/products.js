import corduroyPants from "../assets/images/casual-pant.jpg";
import wineShirt from "../assets/images/wine-shirt.jpg";
import casualShirt from "../assets/images/casual-shirt.jpg";
import graphicTee from "../assets/images/graphic-tee.jpg";
import blackFormalShirt from "../assets/images/black-formal-shirt.jpg";
import whiteFormalShirt from "../assets/images/white-formal-shirt.jpg";
import blackTrouser from "../assets/images/black-trouser.jpg";
import blueLinenShort from "../assets/images/blue-linen-short.jpg";

export const products = [
  {
    id: 1,
    slug: "mens-casual-trousers",
    name: "Men’s Casual Trousers",
    category: "Trousers",
    color: "Light Olive Green",
    price: "₹2,499",
    numericPrice: 2499,
    sizes: ["M", "L", "XL"],
    image: corduroyPants,
    gallery: [corduroyPants, casualPantDetail(corduroyPants)],
    isBestSeller: true,
    isNewArrival: true,
    createdAt: "2026-02-10",
    description:
      "Crafted with a relaxed tapered silhouette and premium heavyweight cotton twill, these casual trousers offer effortless versatility for weekday meetings or weekend city exploration.",
    details: [
      "Relaxed tapered fit with comfortable mid-rise waist",
      "Reinforced dual side pockets and welt back pockets",
      "Custom branded button and heavy-duty YKK brass zipper",
      "Pre-shrunk fabric to maintain tailored shape over time",
    ],
    fabric: "98% Premium Organic Cotton, 2% Elastane",
    care: "Machine wash cold with like colors. Line dry inside out. Warm iron if needed.",
  },
  {
    id: 2,
    slug: "classic-mens-wine-formal-shirt",
    name: "Classic Men’s Wine Formal Shirt",
    category: "Shirts",
    color: "Plum Wine",
    price: "₹1,999",
    numericPrice: 1999,
    sizes: ["S", "M", "L", "XL"],
    image: wineShirt,
    gallery: [wineShirt],
    isBestSeller: true,
    isNewArrival: true,
    createdAt: "2026-02-12",
    description:
      "A statement formal piece in rich plum wine. Tailored from compact satin-weave Egyptian cotton that drapes cleanly and resists creasing throughout long days.",
    details: [
      "Structured semi-spread collar with removable collar stays",
      "Clean French placket with mother-of-pearl finish buttons",
      "Adjustable mitered cuffs with dual button closure",
      "Curved hem tailored to stay neatly tucked in",
    ],
    fabric: "100% Giza Long-Staple Cotton (Satin Weave)",
    care: "Dry clean recommended or machine wash gentle. Steam iron while damp.",
  },
  {
    id: 3,
    slug: "mens-printed-casual-shirt",
    name: "Men’s Printed Casual Shirt",
    category: "Shirts",
    color: "Black",
    price: "₹1,999",
    numericPrice: 1999,
    sizes: ["M", "L", "XL", "XXL"],
    image: casualShirt,
    gallery: [casualShirt],
    isBestSeller: false,
    isNewArrival: true,
    createdAt: "2026-02-08",
    description:
      "Understated geometric micro-print crafted for dusk-to-dawn transitions. Cut in our modern relaxed fit with breathable airy cotton poplin.",
    details: [
      "Camp collar design for relaxed summer and evening styling",
      "Matte black branded buttons with cross-stitched thread",
      "Straight hemline with subtle side seam vents",
      "Garment washed for a soft lived-in feel",
    ],
    fabric: "100% Breathable Fine Cotton Poplin",
    care: "Machine wash cold. Do not bleach. Tumble dry low.",
  },
  {
    id: 4,
    slug: "essential-graphic-tee",
    name: "Essential Graphic Tee",
    category: "T-Shirts",
    color: "Deep Blue",
    price: "₹1,499",
    numericPrice: 1499,
    sizes: ["S", "M", "L", "XL"],
    image: graphicTee,
    gallery: [graphicTee],
    isBestSeller: true,
    isNewArrival: true,
    createdAt: "2026-02-14",
    description:
      "A heavyweight 240 GSM luxury cotton t-shirt featuring subtle architectural typography. Engineered with a ribbed collar that maintains its shape wash after wash.",
    details: [
      "Heavyweight 240 GSM combed ring-spun cotton",
      "Ribbed crew neck with reinforced shoulder-to-shoulder tape",
      "High-density minimalist chest print that won't crack",
      "Boxy contemporary streetwear silhouette",
    ],
    fabric: "100% Combed Compact Cotton (240 GSM)",
    care: "Machine wash inside out in cold water. Iron on reverse side.",
  },
  {
    id: 5,
    slug: "classic-black-formal-shirt",
    name: "Classic Black Formal Shirt",
    category: "Shirts",
    color: "Black",
    price: "₹1,999",
    numericPrice: 1999,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: blackFormalShirt,
    gallery: [blackFormalShirt],
    isBestSeller: true,
    isNewArrival: true,
    createdAt: "2026-02-01",
    description:
      "The definitive black formal shirt. Deep saturated onyx dye that retains intensity with an ultra-smooth finish engineered for tailored suits and formal evening wear.",
    details: [
      "Crisp point collar with fused interlining for all-day sharpness",
      "Tone-on-tone dyed buttons with sleek minimal stitching",
      "Slim tailored body cut with clean back darts",
      "Fade-resistant reactive reactive dye technology",
    ],
    fabric: "100% Egyptian Cotton Twill",
    care: "Machine wash gentle cycle. Do not wring. Medium steam iron.",
  },
  {
    id: 6,
    slug: "classic-white-formal-shirt",
    name: "Classic White Formal Shirt",
    category: "Shirts",
    color: "White",
    price: "₹1,999",
    numericPrice: 1999,
    sizes: ["S", "M", "L", "XL"],
    image: whiteFormalShirt,
    gallery: [whiteFormalShirt],
    isBestSeller: false,
    isNewArrival: true,
    createdAt: "2026-02-05",
    description:
      "The cornerstone of modern menswear. Impeccable optic white shade with high opacity, smooth hand-feel, and enduring tailoring precision.",
    details: [
      "Semi-spread collar designed for four-in-hand and half-windsor knots",
      "High-opacity premium weave that prevents show-through",
      "Durable double-stitched armholes and side seams",
      "Single needle tailoring with 20 stitches per inch",
    ],
    fabric: "100% 2-Ply Supima Cotton (Royal Oxford Weave)",
    care: "Warm machine wash. Line dry in shade. Warm iron.",
  },
  {
    id: 7,
    slug: "essential-black-trousers",
    name: "Essential Black Trousers",
    category: "Trousers",
    color: "Black",
    price: "₹2,299",
    numericPrice: 2299,
    sizes: ["M", "L", "XL"],
    image: blackTrouser,
    gallery: [blackTrouser],
    isBestSeller: false,
    isNewArrival: true,
    createdAt: "2026-01-28",
    description:
      "Precision-cut slim trousers in an all-season wool-touch blend. Provides four-way micro-stretch for seamless mobility between desk and dinner.",
    details: [
      "Tailored slim-straight cut with clean front crease",
      "Hidden flex waistband with internal anti-slip shirt grip",
      "Dual slant front pockets and button-through rear pockets",
      "Pre-hemmed for a clean, break-free modern cuff look",
    ],
    fabric: "65% Rayon, 30% Nylon, 5% Spandex",
    care: "Machine wash cold on delicate cycle or dry clean.",
  },
  {
    id: 8,
    slug: "blue-linen-shorts",
    name: "Blue Linen Shorts",
    category: "Shorts",
    color: "Denim Blue",
    price: "₹1,699",
    numericPrice: 1699,
    sizes: ["S", "M", "L"],
    image: blueLinenShort,
    gallery: [blueLinenShort],
    isBestSeller: false,
    isNewArrival: true,
    createdAt: "2026-02-09",
    description:
      "Lightweight resort shorts spun from pure European flax linen. Breathable, relaxed, and naturally textured for coastal warm-weather ease.",
    details: [
      "7-inch inseam hitting right above the knee",
      "Elasticated waistband with internal herringbone drawcord",
      "Deep mesh-lined front pockets and single back pocket",
      "Garment dyed for rich depth and softened texture",
    ],
    fabric: "100% Pure European Flax Linen",
    care: "Cold gentle machine wash. Hang dry in shade.",
  },
];

function casualPantDetail(img) {
  return img;
}

export const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);

export default products;
