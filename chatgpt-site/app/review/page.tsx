import { requireChatGPTUser } from "../chatgpt-auth";
import ReviewInbox from "./review-inbox";
export const dynamic = "force-dynamic";
export default async function ReviewPage() {
  await requireChatGPTUser("/review");
  return <ReviewInbox/>;
}

