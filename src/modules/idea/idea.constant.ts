import { Prisma } from "../../generated/prisma/client";

export const ideaSearchableFields = [
  "title",
  "description",
  "problemStatement",
  "proposedSolution",
];

export const ideaFilterableFields = ["status", "accessType", "categoryId"];

export const ideaIncludeConfig: Partial<
  Record<keyof Prisma.IdeaInclude, Prisma.IdeaInclude[keyof Prisma.IdeaInclude]>
> = {
  author: true,
  category: true,
  votes: true,

  comments: {
    include: {
      user: true,
    },
  },
};
