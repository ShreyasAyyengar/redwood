import { LoaderCircle } from "lucide-react";

export default function ApplicationLoading() {
  return (
    <div className="flex min-h-0 w-full flex-1 items-center justify-center text-muted-foreground">
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}
