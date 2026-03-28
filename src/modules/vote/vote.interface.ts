import { VoteType } from "../../generated/prisma/enums";

export interface ICreateVote {
  type: VoteType;
  ideaId: string;
}

export interface IUpdateVote {
  type: VoteType;
}
