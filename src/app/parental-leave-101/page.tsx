import { getExplorerAccess } from "@/lib/explorerAccess";
import LeaveGuideClient from "./LeaveGuideClient";

export default async function LeaveGuideIndexPage() {
  const access = await getExplorerAccess();
  return <LeaveGuideClient initialAccess={access} />;
}
