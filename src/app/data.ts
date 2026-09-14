export type Product = {
  id: string;
  name: string;
  category: string;
  presentation: string;
  price: number;
  oldPrice?: number;
  status: string;
  description: string;
  accent: string;
  imageUrl?: string;
  gallery?: string[];
  stockQuantity: number;
  available: boolean;
  featured: boolean;
  bestseller: boolean;
  isNew: boolean;
  slug: string;
};

export const formatPrice = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
