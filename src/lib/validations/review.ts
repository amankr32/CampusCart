import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  description: z
    .string()
    .trim()
    .max(1000, "Keep it under 1000 characters.")
    .optional()
    .or(z.literal("")),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const buyerReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  description: z
    .string()
    .trim()
    .max(1000, "Keep it under 1000 characters.")
    .optional()
    .or(z.literal("")),
});

export type BuyerReviewInput = z.infer<typeof buyerReviewSchema>;
