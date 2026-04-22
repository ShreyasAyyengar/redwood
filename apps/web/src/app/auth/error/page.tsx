"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BackButton = () => {
  const router = useRouter();

  return (
    <Button variant="secondary" className="group" onClick={() => router.back()}>
      <ArrowLeft
        className="ms-0 me-2 opacity-60 transition-transform group-hover:-translate-x-0.5"
        size={16}
        strokeWidth={2}
        aria-hidden="true"
      />
      Go back
    </Button>
  );
};

export default function Page() {
  return (
    <div className="mt-30">
      <div className="relative flex min-h-[60svh] w-full flex-col justify-center bg-background p-6 md:p-10">
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="absolute inset-0">
            <div className="flex h-full w-full items-center justify-center opacity-[0.04] dark:opacity-[0.03]">
              <span className="select-none font-bold text-[500px] text-foreground leading-none">401</span>
            </div>
          </div>

          <div className="relative z-1 pt-52 text-center">
            <h1 className="mt-4 text-balance font-semibold text-5xl text-red-800 tracking-tight sm:text-7xl">UNAUTHORIZED</h1>

            <p className="mt-6 text-pretty font-medium text-lg text-muted-foreground sm:text-xl/8">
              You do not have permission to view this page. Please contact the ITS IS&T administrators for assistance.
            </p>

            <div className="mt-10 flex flex-col gap-x-4 gap-y-3 sm:flex-row sm:items-center sm:justify-center">
              <BackButton />
              <Button className="-order-1 sm:order-0" asChild>
                <Link href="/">
                  <Home className="me-2" size={16} />
                  Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
