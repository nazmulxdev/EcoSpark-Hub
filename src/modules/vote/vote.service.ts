import status from "http-status";
import AppError from "../../shared/AppError";
import { prisma } from "../../lib/prisma";
import { VoteType } from "../../generated/prisma/enums";

const castVote = async (userId: string, ideaId: string, type: VoteType) => {
  // Check if idea exists
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
  });

  if (!idea) {
    throw new AppError(status.NOT_FOUND, "Idea not found");
  }

  // Check if user has already voted on this idea
  const existingVote = await prisma.vote.findUnique({
    where: {
      userId_ideaId: {
        userId,
        ideaId,
      },
    },
  });

  if (existingVote) {
    if (existingVote.type === type) {
      // Toggle off / Unvote if same type
      await prisma.vote.delete({
        where: { id: existingVote.id },
      });
      return { message: "Vote removed successfully", vote: null };
    } else {
      // Update vote type if changing from Upvote to Downvote or vice versa
      const updatedVote = await prisma.vote.update({
        where: { id: existingVote.id },
        data: { type },
      });
      return { message: `Successfully changed to ${type.toLowerCase()}`, vote: updatedVote };
    }
  }

  // Create new vote
  const newVote = await prisma.vote.create({
    data: {
      userId,
      ideaId,
      type,
    },
  });

  return { message: `Successfully ${type.toLowerCase()}d`, vote: newVote };
};

export const voteService = {
  castVote,
};
