import { z } from "zod";

export const postVideoValidationSchema = z.object({
    title: z.string(),
    description: z.string(),
});
