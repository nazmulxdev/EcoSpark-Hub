import * as z from "zod";
import { VoteType } from "../../generated/prisma/enums";

export const createVoteZodSchema = z.object({
  type: z.enum([VoteType.UPVOTE, VoteType.DOWNVOTE]),
  ideaId: z.string(),
});
