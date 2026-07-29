import { z } from "zod";

export const createStoreSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(3, "Store name must be at least 3 characters.")
    .max(60, "Store name must be under 60 characters."),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;

export const PRODUCT_CONDITIONS = [
  "new",
  "like_new",
  "good",
  "fair",
  "worn",
] as const;

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Give your listing a title of at least 3 characters.")
    .max(120, "Title must be under 120 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be under 2000 characters.")
    .optional()
    .or(z.literal("")),
  priceRupees: z
    .number({ error: "Enter a price." })
    .min(1, "Price must be at least ₹1.")
    .max(1000000, "That price looks too high — double check it."),
  condition: z.enum(PRODUCT_CONDITIONS),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  hostel: z.string().trim().max(80).optional().or(z.literal("")),
  branch: z.string().trim().max(80).optional().or(z.literal("")),
  quantity: z
    .number({ error: "Enter a quantity." })
    .int()
    .min(1)
    .max(999),
  images: z.array(z.string().url()).min(1, "Add at least one photo."),
});

export type ProductInput = z.infer<typeof productSchema>;
