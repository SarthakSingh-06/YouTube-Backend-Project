import { z } from "zod";

export const postVideoValidationSchema = z.object({
    title: z.string(),
    description: z.string(),
});

export const getAllVideosValidationSchema = z.object({
    page: z.string().optional(), // URL queries are by-default string
    limit: z.string().optional(),
    query: z.string().optional(),
    sortBy: z.enum(["duration", "views"]).default("views"),
    sortType: z.enum(["asc", "desc"]).default("desc"),
    userId: z.string().optional()
});

export const updateVideoDetailsValidationSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional()
});
