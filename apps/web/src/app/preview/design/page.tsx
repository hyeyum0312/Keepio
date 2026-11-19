import { notFound } from "next/navigation";
import { isPreviewEnabled } from "@/shared/lib/preview";
import { DesignHome } from "./design-home";

// 로그인 상태에서도 기획·디자인을 보는 주소. 개발 환경에서만 열리고 배포에서는 404
export default function DesignPreviewPage() {
  if (!isPreviewEnabled()) notFound();
  return <DesignHome />;
}
