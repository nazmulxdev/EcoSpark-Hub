import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { ICreateWatchlist } from "./watchlist.interface";
import { Prisma, Watchlist } from "../../generated/prisma/client";

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
      "ALREADY_EXISTS",
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
    throw new AppError(404, "This idea is not in your watchlist.", "NOT_FOUND");
  }

  await prisma.watchlist.delete({
    where: {
      id: existingEntry.id,
    },
  });

  return { message: "Idea removed from watchlist successfully." };
};

const getMyWatchlist = async (userId: string, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Watchlist,
    Prisma.WatchlistWhereInput,
    Prisma.WatchlistInclude
  >(prisma.watchlist, query, {
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
    .include({
      idea: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          category: true,
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

const checkInWatchlist = async (userId: string, ideaId: string) => {
  const entry = await prisma.watchlist.findUnique({
    where: {
      userId_ideaId: {
        userId,
        ideaId,
      },
    },
  });

  return !!entry;
};

export const watchlistService = {
  addToWatchlist,
  removeFromWatchlist,
  getMyWatchlist,
  checkInWatchlist,
};
