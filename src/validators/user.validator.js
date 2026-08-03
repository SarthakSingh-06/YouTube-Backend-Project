import { z } from "zod";

export const registerUserPostRequestValidationSchema = z.object({
    email: z.email("Enter a valid email!"),
    username: z.string("Username is required").lowercase("username must be in lowercase"),
    fullName: z.string("Fullname is requried"),
    password: z.string("Password is required").min(8, "Password must contain at least 8 characters")
});
