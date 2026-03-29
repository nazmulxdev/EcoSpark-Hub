export interface ICreateComment {
  content: string;
  ideaId: string;
  parentId?: string;
}

export interface IUpdateComment {
  content?: string;
  isDeleted?: boolean;
}
