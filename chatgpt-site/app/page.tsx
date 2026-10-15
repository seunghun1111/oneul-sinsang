import { requireChatGPTUser } from "./chatgpt-auth";
import ReviewInbox from "./review/review-inbox";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireChatGPTUser("/");
  return <ReviewInbox/>;
}
