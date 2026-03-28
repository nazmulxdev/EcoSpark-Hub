import { IdeaStatus, IdeaAccessType } from "../../generated/prisma/enums";

export interface ICreateIdea {
  title: string;
  slug: string;
  problemStatement: string;
  proposedSolution: string;
  description: string;
  images?: string[];
  accessType?: IdeaAccessType;
  price?: number | null;
  categoryId: string;
}

export interface IUpdateIdea {
  title?: string;
  slug?: string;
  problemStatement?: string;
  proposedSolution?: string;
  description?: string;
  images?: string[];
  status?: IdeaStatus;
  accessType?: IdeaAccessType;
  rejectionFeedback?: string;
  price?: number;
  publishedAt?: Date;
  categoryId?: string;
}
