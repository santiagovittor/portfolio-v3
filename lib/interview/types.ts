import type { UIMessage } from "ai";

export type InterviewMetadata = {
  sources?: { label: string }[];
  offTheRecord?: boolean;
};

export type InterviewMessage = UIMessage<InterviewMetadata>;
