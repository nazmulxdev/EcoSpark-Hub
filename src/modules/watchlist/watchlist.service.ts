import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { ICreateWatchlist } from "./watchlist.interface";

const addToWatchlist = async (userId: string, payload: ICreateWatchlist) => {
  const { ideaId } = payload;

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found.", "NOT_FOUND");
  }

  const existingEntry = await prisma.watchlist.findUnique({
    where: {
      userId_ideaId: {
        userId,
        ideaId,
      },
    },
  });

  if (existingEntry) {
    throw new AppError(
      400,
      "This idea is already in your watchlist.",
      "ALREADY_EXISTS"
    );
  }

  const newWatchlist = await prisma.watchlist.create({
    data: {
      userId,
      ideaId,
    },
    include: {
      idea: true,
    },
  });

  return newWatchlist;
};

const removeFromWatchlist = async (userId: string, ideaId: string) => {
  const existingEntry = await prisma.watchlist.findUnique({
    where: {
      userId_ideaId: {
        userId,
        ideaId,
      },
    },
  });

  if (!existingEntry) {
    throw new AppError(
      404,
      "This idea is not in your watchlist.",
      "NOT_FOUND"
    );
  }

  await prisma.watchlist.delete({
    where: {
      id: existingEntry.id,
    },
  });

  return { message: "Idea removed from watchlist successfully." };
};

const getMyWatchlist = async (userId: string, query: IQueryParams) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryBuilder = new QueryBuilder(prisma.watchlist as any, query as any, {
    searchableFields: [],
    filterableFields: [],
  });

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .sort()
    .fields()
    .where({ userId })
    .dynamicInclude({
      idea: {
        include: {
          category: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      },
    })
    .execute();

  return result;
};

export const watchlistService = {
  addToWatchlist,
  removeFromWatchlist,
  getMyWatchlist,
};
