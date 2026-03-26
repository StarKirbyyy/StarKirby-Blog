import { siteConfig } from "@/config/site";
import { GiscusComments } from "./GiscusComments";
import { LocalComments } from "./LocalComments";

interface CommentsSectionProps {
  postSlug: string;
}

export function CommentsSection({ postSlug }: CommentsSectionProps) {
  if (siteConfig.comments.provider === "local") {
    return <LocalComments postSlug={postSlug} />;
  }

  return <GiscusComments />;
}
