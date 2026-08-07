import { z } from "zod";

export const createOrUpdateChannelPostValidatorSchema = z.object({
    content: z.string("Post content is required")
});
