import { Button } from "@redwood/shad-ui/components/button";
import { Field, FieldDescription, FieldLabel } from "@redwood/shad-ui/components/field";
import { Input } from "@redwood/shad-ui/components/input";
import { Separator } from "@redwood/shad-ui/components/separator";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import type React from "react";
import { useRef, useState } from "react";
import { webClientORPC } from "../../../../lib/orpc-web-client";

export default function CSVUpload() {
  const queryClient = useQueryClient();
  const { data: csvRecord, isFetching } = useQuery(webClientORPC.classrooms.getCSVRecord.queryOptions());
  const { isPending: isUploading, mutateAsync: uploadCSV } = useMutation(webClientORPC.classrooms.loadClassrooms.mutationOptions());

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const launchConfetti = () => {
    const end = Date.now() + 500; // 0.5 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors,
      });
      requestAnimationFrame(frame);
    };
    frame();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
  };

  const handleUpload = async () => {
    if (!csvFile) return;
    await uploadCSV({ csvFile });
    setCsvFile(null);
    if (inputRef.current) inputRef.current.value = "";

    await queryClient.invalidateQueries(webClientORPC.classrooms.getRooms.queryOptions());
    launchConfetti();
  };

  return (
    <div className="rounded-lg bg-neutral-900 p-3">
      <div className="flex flex-col items-center">
        <span className="font-bold text-lg">CSV Upload / Ingestion </span>
        <span className="text-neutral-300 text-sm">Upload a CSV file to import classrooms and availabilities</span>
      </div>
      <Separator className="my-5" />

      <div className="mt-4 flex flex-col">
        <span>Currently Using:</span>
        <span className="text-neutral-300 text-sm">{isFetching ? "Loading..." : (csvRecord?.fileName ?? "No CSV file uploaded yet")}</span>

        {csvRecord && (
          <div className="mt-4 flex flex-col">
            <span>Uploaded At:</span>
            <span className="text-neutral-300 text-sm">{isFetching ? "Loading..." : csvRecord.dateUploaded?.toLocaleString()}</span>
          </div>
        )}
      </div>

      <Separator className="my-5" />

      <div className="mt-3">
        <Field>
          <FieldLabel htmlFor="csvFile">CSV File</FieldLabel>
          <div className={cn("flex gap-1", !csvFile && "cursor-not-allowed", isUploading && "cursor-wait")}>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              className="w-full"
              onChange={handleFileSelect}
              title="Select a CSV file to upload."
              ref={inputRef}
            />
            <Button onClick={handleUpload} disabled={!csvFile || isUploading}>
              Upload CSV
            </Button>
          </div>
          <FieldDescription>Select a CSV file to upload.</FieldDescription>
        </Field>
      </div>
    </div>
  );
}
