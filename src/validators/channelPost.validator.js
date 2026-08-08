import { z } from "zod";

export const createOrUpdateChannelPostValidatorSchema = z.object({
    content: z.string().trim().min(1, "Input cannot be empty or just spaces")
});
