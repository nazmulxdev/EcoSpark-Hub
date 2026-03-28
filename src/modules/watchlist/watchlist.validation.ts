import * as z from "zod";

export const createWatchlistZodSchema = z.object({
  ideaId: z.string(),
});
