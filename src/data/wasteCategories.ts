export interface WasteCategory {
  id: "organic" | "inorganic" | "residual";
  binColor: "green" | "blue" | "gray";
  title: string;
  description: string;
  items: readonly string[];
  tip: string;
}

/**
 * The three waste categories, in the order green/organic, blue/inorganic,
 * gray/residual, with the copy and examples unchanged from the legacy page.
 */
export const wasteCategories: readonly WasteCategory[] = [
  {
    id: "organic",
    binColor: "green",
    title: "Sampah organik",
    description:
      "Sisa yang berasal dari makhluk hidup dan bisa membusuk secara alami. Tong hijau adalah rumahnya — sekaligus bahan paling mudah diolah menjadi kompos.",
    items: ["Sisa makanan", "Kulit buah", "Daun & ranting", "Cangkang telur"],
    tip: "Tiriskan dulu sebelum dibuang supaya tidak berbau dan tidak mengundang lalat.",
  },
  {
    id: "inorganic",
    binColor: "blue",
    title: "Sampah anorganik",
    description:
      "Yang tidak membusuk, tapi masih bisa didaur ulang — asal bersih. Ini tong untuk kertas, plastik, botol, dan kaleng yang layak dijual kembali atau diolah lagi.",
    items: ["Kertas & kardus", "Botol plastik", "Kaleng", "Botol & gelas kaca"],
    tip: "Bilas dan keringkan dulu; sampah kotor justru menurunkan nilai daur ulangnya.",
  },
  {
    id: "residual",
    binColor: "gray",
    title: "Sampah residu",
    description:
      "Sisa yang tidak bisa dikomposkan dan tidak layak didaur ulang. Kalau pemilahan di dua tong lain benar, isi tong ini jauh lebih sedikit.",
    items: ["Bungkus makanan berminyak", "Styrofoam kotor", "Popok bekas", "Pembalut"],
    tip: "Ikat kantongnya rapat sebelum dibuang agar tidak menyebar ke tumpukan lain.",
  },
];
