import { Suspense } from "react";
import ListingsPage from "@/features/listings/pages/ListingsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ListingsPage />
    </Suspense>
  );
}
