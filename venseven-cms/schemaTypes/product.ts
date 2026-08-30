import { defineField, defineType, defineArrayMember } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",

  groups: [
    { name: "basic", title: "Basic Information", default: true },
    { name: "pricing", title: "Pricing" },
    { name: "content", title: "Product Content" },
    { name: "images", title: "Images" },
    { name: "inventory", title: "Inventory" },
    { name: "display", title: "Display" },
  ],

  fields: [
    /* =========================================================
       1. BASIC INFORMATION
    ========================================================= */
    defineField({
      name: "name",
      title: "Product Name",
      type: "string",
      group: "basic",
      description: "Editorial title of the garment (e.g. Classic Men’s Wine Formal Shirt)",
      validation: (Rule) => Rule.required().error("Product name is required"),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "basic",
      description: "URL-friendly slug used for the /product/:slug route",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error("Slug is required for routing"),
    }),

    defineField({
      name: "productId",
      title: "Product ID / SKU",
      type: "string",
      group: "basic",
      description: "Unique studio inventory code or identifier (e.g. V7-SH-001)",
    }),

    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "basic",
      options: {
        list: [
          { title: "Shirts", value: "Shirts" },
          { title: "Trousers", value: "Trousers" },
          { title: "T-Shirts", value: "T-Shirts" },
          { title: "Shorts", value: "Shorts" },
        ],
      },
      validation: (Rule) => Rule.required().error("Please select a primary category"),
    }),

    defineField({
      name: "subcategory",
      title: "Subcategory",
      type: "string",
      group: "basic",
      description: "Optional specific classification (e.g. Formal Shirts, Linen Shorts, Chinos)",
    }),

    defineField({
      name: "color",
      title: "Colorway",
      type: "string",
      group: "basic",
      description: "Color name (e.g. Plum Wine, Light Olive Green, Jet Black)",
    }),

    /* =========================================================
       2. PRICING
    ========================================================= */
    defineField({
      name: "price",
      title: "Price (₹)",
      type: "number",
      group: "pricing",
      description: "Selling price in INR (e.g. 1999)",
      validation: (Rule) =>
        Rule.required()
          .min(0)
          .error("Price is required and must be greater than or equal to 0"),
    }),

    defineField({
      name: "compareAtPrice",
      title: "Compare At Price / Original MRP (₹)",
      type: "number",
      group: "pricing",
      description: "Optional original price before markdown for sale display",
      validation: (Rule) => Rule.min(0),
    }),

    /* =========================================================
       3. PRODUCT CONTENT
    ========================================================= */
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      group: "content",
      description: "Editorial narrative detailing the garment drape, silhouette, and feel",
    }),

    defineField({
      name: "details",
      title: "Product Details & Features",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      group: "content",
      description: "Bullet points detailing tailoring, seams, collar stays, closures",
    }),

    defineField({
      name: "fabric",
      title: "Fabric Composition",
      type: "string",
      group: "content",
      description: "e.g. 100% Giza Long-Staple Cotton (Satin Weave)",
    }),

    defineField({
      name: "care",
      title: "Care Instructions",
      type: "text",
      rows: 3,
      group: "content",
      description: "Washing and pressing guidelines (e.g. Machine wash cold. Line dry.)",
    }),

    /* =========================================================
       4. IMAGES (CLOUDINARY)
    ========================================================= */
    defineField({
      name: "image",
      title: "Cloudinary Main Image URL",
      type: "url",
      group: "images",
      description:
        "Full HTTPS Cloudinary delivery URL for the main garment photograph (e.g. https://res.cloudinary.com/demo/image/upload/v12345/garment.jpg)",
      validation: (Rule) =>
        Rule.required()
          .uri({ scheme: ["http", "https"] })
          .error("Main Cloudinary image HTTPS URL is required"),
    }),

    defineField({
      name: "gallery",
      title: "Cloudinary Gallery Image URLs",
      type: "array",
      of: [
        defineArrayMember({
          type: "url",
          title: "Cloudinary Image URL",
          validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
        }),
      ],
      group: "images",
      description:
        "Array of additional Cloudinary HTTPS image URLs for angles, texture close-ups, and lookbook shots",
    }),

    /* =========================================================
       5. INVENTORY & SIZES
    ========================================================= */
    defineField({
      name: "sizes",
      title: "Available Sizes",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: {
        list: [
          { title: "S - Small", value: "S" },
          { title: "M - Medium", value: "M" },
          { title: "L - Large", value: "L" },
          { title: "XL - Extra Large", value: "XL" },
          { title: "XXL - Double Extra Large", value: "XXL" },
        ],
      },
      group: "inventory",
      initialValue: ["S", "M", "L", "XL"],
      description: "Select which sizes are in production for this garment",
    }),

    defineField({
      name: "stockStatus",
      title: "Stock Status",
      type: "string",
      group: "inventory",
      options: {
        list: [
          { title: "In Stock", value: "In Stock" },
          { title: "Out of Stock", value: "Out of Stock" },
          { title: "Coming Soon", value: "Coming Soon" },
        ],
        layout: "radio",
      },
      initialValue: "In Stock",
    }),

    /* =========================================================
       6. DISPLAY & MERCHANDISING
    ========================================================= */
    defineField({
      name: "isFeatured",
      title: "Featured",
      type: "boolean",
      group: "display",
      initialValue: false,
      description: "Highlight in the Featured Collection editorial sections",
    }),

    defineField({
      name: "isNewArrival",
      title: "New Arrival",
      type: "boolean",
      group: "display",
      initialValue: false,
      description: "Display in the Latest Drop & New Arrivals showcase",
    }),

    defineField({
      name: "isBestSeller",
      title: "Best Seller",
      type: "boolean",
      group: "display",
      initialValue: false,
      description: "Display in the Favorites / Best Sellers section",
    }),

    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      group: "display",
      initialValue: 0,
      description: "Custom priority order for shop listing (lower numbers appear first)",
    }),

    defineField({
      name: "isPublished",
      title: "Published",
      type: "boolean",
      group: "display",
      initialValue: true,
      description: "Whether this garment is live on the VENSEVEN storefront",
    }),
  ],

  preview: {
    select: {
      title: "name",
      category: "category",
      price: "price",
      color: "color",
      stockStatus: "stockStatus",
    },
    prepare({ title, category, price, color, stockStatus }) {
      const priceText = typeof price === "number" ? `₹${price.toLocaleString()}` : "";
      const subtitleParts = [category, color, priceText, stockStatus].filter(Boolean);
      return {
        title: title || "Untitled Product",
        subtitle: subtitleParts.join(" · "),
      };
    },
  },
});