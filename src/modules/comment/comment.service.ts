import status from "http-status";
import AppError from "../../shared/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateComment, IUpdateComment } from "./comment.interface";
import { IdeaAccessType, Role } from "../../generated/prisma/enums";

const createComment = async (userId: string, payload: ICreateComment) => {
  const idea = await prisma.idea.findUnique({
    where: { id: payload.ideaId },
  });

  if (!idea) {
    throw new AppError(status.NOT_FOUND, "Idea not found");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "User not found");
  }

  // Verify access
  let hasAccess = false;
  if (idea.authorId === userId) {
    hasAccess = true;
  } else if (idea.accessType === IdeaAccessType.FREE) {
    hasAccess = true;
  } else if (
    idea.accessType === IdeaAccessType.MEMBER_ONLY &&
    (user.role === Role.MEMBER || user.role === Role.ADMIN)
  ) {
    hasAccess = true;
  } else {
    const purchase = await prisma.ideaPurchase.findUnique({
      where: { userId_ideaId: { userId, ideaId: payload.ideaId } },
    });
    if (purchase) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    throw new AppError(
      status.FORBIDDEN,
      "You do not have access to comment on this idea.",
    );
  }

  if (payload.parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: payload.parentId },
    });

    if (!parentComment) {
      throw new AppError(status.NOT_FOUND, "Parent comment not found");
    }

    if (parentComment.ideaId !== payload.ideaId) {
      throw new AppError(
        status.BAD_REQUEST,
        "Parent comment must belong to the same idea",
      );
    }

    if (parentComment.parentId) {
      throw new AppError(
        status.BAD_REQUEST,
        "Cannot reply to a reply. Only two levels of nested comments are allowed.",
      );
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: payload.content,
      userId,
      ideaId: payload.ideaId,
      parentId: payload.parentId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return comment;
};

const getCommentsByIdeaId = async (ideaId: string) => {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
  });

  if (!idea) {
    throw new AppError(status.NOT_FOUND, "Idea not found");
  }

  const allComments = await prisma.comment.findMany({
    where: { ideaId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  const commentMap = new Map();
  const rootComments: Array<
    (typeof allComments)[0] & { replies: Record<string, unknown>[] }
  > = [];

  for (const comment of allComments) {
    const commentWithReplies = {
      ...comment,
      replies: [] as Record<string, unknown>[],
    };
    if (commentWithReplies.isDeleted) {
      commentWithReplies.content = "[This comment has been deleted]";
    }
    commentMap.set(comment.id, commentWithReplies);
  }

  for (const comment of allComments) {
    const commentWithReplies = commentMap.get(comment.id);
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(commentWithReplies);
      } else {
        rootComments.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  }

  rootComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return rootComments;
};

const updateComment = async (
  userId: string,
  commentId: string,
  payload: IUpdateComment,
) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError(status.NOT_FOUND, "Comment not found");
  }

  if (comment.userId !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "You do not have permission to update this comment",
    );
  }

  if (comment.isDeleted) {
    throw new AppError(status.BAD_REQUEST, "Cannot update a deleted comment");
  }

  const updateData: Record<string, unknown> = {};
  if (payload.content !== undefined) updateData.content = payload.content;
  if (payload.isDeleted !== undefined) updateData.isDeleted = payload.isDeleted;

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: updateData,
  });

  return updatedComment;
};

const deleteComment = async (userId: string, commentId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError(status.NOT_FOUND, "Comment not found");
  }

  if (comment.userId !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "You do not have permission to delete this comment",
    );
  }

  if (comment.isDeleted) {
    throw new AppError(status.BAD_REQUEST, "Comment is already deleted");
  }

  const deletedComment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      isDeleted: true,
    },
  });

  return deletedComment;
};

export const commentService = {
  createComment,
  getCommentsByIdeaId,
  updateComment,
  deleteComment,
};
