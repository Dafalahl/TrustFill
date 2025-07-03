import { useAutoTopupManager } from "../lib/useAutoTopupManager";
import AutoTopupUI from "./AutoTopupUI";

export default function AutoTopupContainer() {
  const props = useAutoTopupManager();
  return <AutoTopupUI {...props} />;
}
