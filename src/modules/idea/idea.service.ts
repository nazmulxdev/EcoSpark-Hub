import { deleteFileFromCloudinary } from "../../config/cloudinary.config";

import { Idea, Prisma } from "../../generated/prisma/client";
import {
  IdeaAccessType,
  IdeaStatus,
  PaymentStatus,
  Role,
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

const getAllIdeasForAdmin = async (query: IQueryParams) => {
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
const getAllIdeasPublic = async (query: IQueryParams) => {
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
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          votes: true,
          comments: true,
          purchases: true,
        },
      },
    })
    .sort()
    .where({ status: IdeaStatus.APPROVED })
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
    .include({
      category: true,
      author: true,
      comments: true,
      votes: true,
      purchases: true,
    })
    .execute();

  return result;
};

const getDraftIdeasForMember = async (userId: string, query: IQueryParams) => {
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
    .where({ authorId: userId, status: IdeaStatus.DRAFT })
    .include({
      category: true,
      author: true,
      comments: true,
      votes: true,
      purchases: true,
    })
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

const getIdeaById = async (slug: string, userId?: string) => {
  const getSuggestedActionText = (suggestedAction: string) => {
    switch (suggestedAction) {
      case "complete_payment":
        return "Complete Payment";
      case "buy_membership_or_idea":
        return "Become Member or Purchase";
      case "buy_idea":
        return "Purchase Now";
      default:
        return "Get Access";
    }
  };

  const ideaDetails = await prisma.idea.findUnique({
    where: { slug },
    include: {
      category: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          votes: true,
          comments: true,
          purchases: true,
        },
      },
    },
  });

  if (!ideaDetails) {
    throw new AppError(404, "Idea not found", "NOT_FOUND");
  }

  const fetchFullIdea = () =>
    prisma.idea.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: {
          where: { parentId: null, isDeleted: false },
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            replies: {
              where: { isDeleted: false },
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
                replies: {
                  where: { isDeleted: false },
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
                },
              },
            },
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
            purchases: true,
          },
        },
      },
    });

  const buildLockedResponse = (extra: Record<string, unknown> = {}) => ({
    id: ideaDetails.id,
    title: ideaDetails.title,
    slug: ideaDetails.slug,
    accessType: ideaDetails.accessType,
    price: ideaDetails.price,
    status: ideaDetails.status,
    images: ideaDetails.images?.[0] ? [ideaDetails.images[0]] : [],
    category: ideaDetails.category,
    author: ideaDetails.author,
    _count: ideaDetails._count,
    createdAt: ideaDetails.createdAt,
    updatedAt: ideaDetails.updatedAt,

    problemStatement: null,
    proposedSolution: null,
    description: null,
    comments: [],

    hasAccess: false,
    requiresAccess: true,
    contentLocked: true,
    suggestedActionText: getSuggestedActionText(
      extra.suggestedAction as string,
    ),
    ...extra,
  });

  if (!userId) {
    if (ideaDetails.accessType === IdeaAccessType.FREE) {
      const full = await fetchFullIdea();
      return {
        ...full,
        hasAccess: true,
        requiresAccess: false,
        contentLocked: false,
      };
    }

    return buildLockedResponse({
      guestLocked: true,
      isMemberOnly: ideaDetails.accessType === IdeaAccessType.MEMBER_ONLY,
      isPaid: ideaDetails.accessType === IdeaAccessType.PAID,
    });
  }

  const [user, isPurchased, pendingPayment] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
      },
    }),
    prisma.ideaPurchase.findUnique({
      where: {
        userId_ideaId: { userId, ideaId: ideaDetails.id },
      },
    }),

    prisma.ideaPayment.findFirst({
      where: {
        userId,
        ideaId: ideaDetails.id,
        status: "PENDING",
      },
    }),
  ]);

  if (!user) {
    throw new AppError(401, "User not found", "UNAUTHORIZED");
  }

  if (user.role === Role.ADMIN) {
    const full = await fetchFullIdea();
    return {
      ...full,
      hasAccess: true,
      requiresAccess: false,
      contentLocked: false,
    };
  }

  let hasAccess = false;

  if (ideaDetails.accessType === IdeaAccessType.FREE) {
    hasAccess = true;
  } else if (ideaDetails.accessType === IdeaAccessType.MEMBER_ONLY) {
    hasAccess = user.role === Role.MEMBER || !!isPurchased;
  } else if (ideaDetails.accessType === IdeaAccessType.PAID) {
    hasAccess = !!isPurchased;
  }

  if (hasAccess) {
    const full = await fetchFullIdea();
    return {
      ...full,
      hasAccess: true,
      requiresAccess: false,
      contentLocked: false,
    };
  }

  const isMemberActive =
    user.member?.status === "APPROVED" && user.member?.isActive;

  return buildLockedResponse({
    userRole: user.role,
    isMember: user.role === Role.MEMBER,
    isMemberActive,

    hasPendingPayment: !!pendingPayment,
    pendingPaymentId: pendingPayment?.id ?? null,
    suggestedAction: pendingPayment
      ? "complete_payment"
      : ideaDetails.accessType === IdeaAccessType.MEMBER_ONLY &&
          user.role !== Role.MEMBER
        ? "buy_membership_or_idea"
        : "buy_idea",
  });
};

const submitIdeaForAdminApproval = async (userId: string, slug: string) => {
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

  const updatedIdea = await prisma.idea.update({
    where: { id: idea.id },
    data: {
      status: IdeaStatus.UNDER_REVIEW,
    },
  });

  return updatedIdea;
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

const myPurchasedIdeas = async (userId: string) => {
  const ideas = await prisma.ideaPayment.findMany({
    where: { userId },
    include: {
      idea: {
        include: {
          category: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
              purchases: true,
            },
          },
        },
      },
    },
  });

  return ideas;
};

const checkPurchaseStatus = async (userId: string, ideaId: string) => {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    throw new AppError(404, "Idea not found", "NOT_FOUND");
  }

  // Check if user has purchased
  const purchase = await prisma.ideaPurchase.findUnique({
    where: {
      userId_ideaId: { userId, ideaId: idea.id },
    },
  });

  // Check if payment is completed
  const payment = await prisma.ideaPayment.findFirst({
    where: {
      userId,
      ideaId: idea.id,
      status: PaymentStatus.PAID,
    },
  });

  const hasAccess = !!(purchase || payment);

  return { hasAccess };
};

export const ideaService = {
  createIdea,
  getIdeasForMember,
  getIdeaByIdForMember,
  updateIdeaForMember,
  deleteIdeaForMember,
  getAllIdeasForAdmin,
  getAllIdeasPublic,
  getIdeaById,
  getDraftIdeasForMember,
  submitIdeaForAdminApproval,
  myPurchasedIdeas,
  checkPurchaseStatus,
};
