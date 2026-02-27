"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { env } from "../env";
import { authClientWeb } from "../lib/auth-client-web";

export default function Home() {
  const { data, isPending } = authClientWeb.useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!(isPending || data)) {
      authClientWeb.signIn.social({
        provider: "google",
        callbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}`,
        errorCallbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}/auth/error`,
      });
    }
  }, [isPending, data]);

  if (isPending)
    return <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4 font-sans text-white">Loading...</div>;

  return <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4 font-sans text-white">Hello World</div>;
}
