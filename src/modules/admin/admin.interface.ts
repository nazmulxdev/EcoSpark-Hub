import {
  IdeaStatus,
  MemberStatus,
  UserStatus,
} from "../../generated/prisma/enums";

export interface IChangeUserStatus {
  userStatus: UserStatus;
}

export interface IChangeMemberStatus {
  status: MemberStatus;
}

export interface IChangeIdeaStatus {
  status: IdeaStatus;
  rejectionFeedback?: string;
}