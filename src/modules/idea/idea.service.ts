import { deleteFileFromCloudinary } from "../../config/cloudinary.config";

import { Idea, Prisma } from "../../generated/prisma/client";
import {
  IdeaAccessType,
  IdeaStatus,
  PaymentStatus,
} from "../../generated/prisma/enums";
import { IdeaInclude } from "../../generated/prisma/models";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { generateUniqueSlug } from "../../utils/generateSlug";
import { ideaFilterableFields, ideaSearchableFields } from "./idea.constant";
import { ICreateIdea } from "./idea.interface";



// ── 4. Member CRUD operations ────────────────────────────────────────────────

const createIdea = async (userId: string, payload: ICreateIdea) => {
  if (payload.accessType && payload.accessType !== IdeaAccessType.FREE) {
    if (!payload.price || Number(payload.price) <= 0) {
      throw new AppError(
        400,
        "Price must be strictly positive for non-free ideas",
        "INVALID_PRICE",
      );
    }
  } else {
    payload.price = null;
  }

  const slug = await generateUniqueSlug(payload.title, "idea");

  const idea = await prisma.idea.create({
    data: {
      ...payload,
      title: payload.title as string,
      slug: slug,
      problemStatement: payload.problemStatement as string,
      proposedSolution: payload.proposedSolution as string,
      description: payload.description as string,
      categoryId: payload.categoryId as string,
      authorId: userId,
      status: IdeaStatus.DRAFT,
      images: payload.images as string[],
      accessType: payload.accessType as IdeaAccessType,
      price: payload.price as number | null,
    },
  });

  return idea;
};

const getAllIdeas = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Idea,
    Prisma.IdeaWhereInput,
    IdeaInclude
  >(prisma.idea, query, {
    searchableFields: ideaSearchableFields,
    filterableFields: ideaFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .include({
      category: true,
      author: true,
      comments: true,
      votes: true,
      purchases: true,
    })
    .sort()
    .fields()
    .execute();

  return result;
};

const getIdeasForMember = async (userId: string, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Idea,
    Prisma.IdeaWhereInput,
    IdeaInclude
  >(prisma.idea, query, {
    searchableFields: ideaSearchableFields,
    filterableFields: ideaFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .sort()
    .fields()
    .where({ authorId: userId })
    .execute();

  return result;
};

const getIdeaByIdForMember = async (userId: string, slug: string) => {
  const idea = await prisma.idea.findUnique({
    where: { slug: slug, authorId: userId },
    include: {
      category: true,
      _count: {
        select: {
          votes: true,
          comments: true,
          purchases: true,
        },
      },
    },
  });

  if (!idea) {
    throw new AppError(
      404,
      "Idea not found or you don't have access",
      "NOT_FOUND",
    );
  }

  return idea;
};

const getIdeaById = async (slug: string) => {
  const idea = await prisma.idea.findUnique({
    where: { slug },
    include: {
      // ✅ Category info (name, slug, etc.)
      category: true,

      // ✅ Author basic public profile (never expose password/role)
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },

      // ✅ Top-level comments only (parentId: null are root comments)
      comments: {
        where: {
          parentId: null, // 👈 only fetch root comments, not replies
          isDeleted: false, // 👈 exclude soft deleted comments
        },
        orderBy: { createdAt: "desc" },
        include: {
          // comment owner
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },

          // ✅ Nested replies under each root comment
          replies: {
            where: {
              isDeleted: false, // 👈 exclude soft deleted replies too
            },
            orderBy: { createdAt: "asc" }, // 👈 replies oldest first (natural thread order)
            include: {
              // reply owner
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      },

      // ✅ Aggregate counts (no need to fetch full arrays just for numbers)
      _count: {
        select: {
          votes: true, // total votes count
          comments: true, // total comments count (including replies)
          purchases: true, // total purchases count
        },
      },
    },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found", "NOT_FOUND");
  }

  return idea;
};

const updateIdeaForMember = async (
  userId: string,
  slug: string,
  payload: Record<string, unknown>,
) => {
  const idea = await prisma.idea.findUnique({
    where: { slug: slug, authorId: userId },
  });

  if (!idea) {
    throw new AppError(
      404,
      "Idea not found or you don't have access",
      "NOT_FOUND",
    );
  }

  const newAccessType = payload.accessType ?? idea.accessType;
  const newPrice = payload.price !== undefined ? payload.price : idea.price;

  if (newAccessType !== IdeaAccessType.FREE) {
    if (newPrice === null || newPrice === undefined || Number(newPrice) <= 0) {
      throw new AppError(
        400,
        "Price must be strictly positive for non-free access types",
        "INVALID_PRICE",
      );
    }
  } else if (newAccessType === IdeaAccessType.FREE) {
    payload.price = null;
  }

  const updatedIdea = await prisma.idea.update({
    where: { id: idea.id },
    data: payload,
  });

  return updatedIdea;
};

const deleteIdeaForMember = async (userId: string, slug: string) => {
  const idea = await prisma.idea.findUnique({
    where: { slug: slug, authorId: userId },
  });

  if (!idea) {
    throw new AppError(
      404,
      "Idea not found or you don't have access",
      "NOT_FOUND",
    );
  }

  if (idea.status === IdeaStatus.APPROVED) {
    throw new AppError(
      400,
      "Idea cannot be deleted as it is in approved mode",
      "ALREADY_PURCHASED",
    );
  }

  if (idea.status === IdeaStatus.REJECTED) {
    throw new AppError(
      400,
      "Idea cannot be deleted as it is in rejected mode",
      "ALREADY_PURCHASED",
    );
  }

  if (idea.status === IdeaStatus.UNDER_REVIEW) {
    throw new AppError(
      400,
      "Idea cannot be deleted as it is in under review mode",
      "ALREADY_PURCHASED",
    );
  }

  const isIdeaPurchased = await prisma.ideaPayment.findFirst({
    where: { ideaId: idea.id, status: PaymentStatus.PAID },
  });

  if (isIdeaPurchased) {
    throw new AppError(
      400,
      "Idea cannot be deleted as it has been purchased",
      "ALREADY_PURCHASED",
    );
  }

  if (idea.images) {
    if (idea.images.length > 0) {
      await Promise.all(
        idea.images.map((image) => deleteFileFromCloudinary(image)),
      );
    }
  }

  await prisma.idea.delete({
    where: { id: idea.id },
  });

  return { message: "Idea deleted successfully" };
};

export const ideaService = {
 
  createIdea,
  getIdeasForMember,
  getIdeaByIdForMember,
  updateIdeaForMember,
  deleteIdeaForMember,
  getAllIdeas,
  getIdeaById,
};
