"use client";

import { api } from "@backend/convex/_generated/api";
import type { Id } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { Calendar } from "@redwood/shad-ui/components/calendar";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@redwood/shad-ui/components/field";
import { Input } from "@redwood/shad-ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { RadioGroup, RadioGroupItem } from "@redwood/shad-ui/components/radio-group";
import { Separator } from "@redwood/shad-ui/components/separator";
import confetti from "canvas-confetti";
import { useAction, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { CalendarDays, ChevronDownIcon } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { CSV_TIME_ZONE, getCSVCalendarToday, getCSVEffectiveOn } from "../../model/csv-schedule.ts";

const CONFETTI_DURATION_MS = 500;

function getUploadErrorMessage(error: unknown) {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null && typeof error.data.message === "string") {
    return error.data.message;
  }
  return error instanceof Error ? error.message : "CSV upload failed. Please try again.";
}

export default function CSVUpload() {
  const csvRecord = useQuery(api.core.csv.service.getCSVRecord, {});
  const isFetching = csvRecord === undefined;
  const generateUploadUrl = useMutation(api.core.csv.service.generateCSVUploadUrl);
  const loadClassrooms = useAction(api.core.csv.service.loadClassroomsByCSV);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [applyWhen, setApplyWhen] = useState("immediately");
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>();
  const [uploadMessage, setUploadMessage] = useState<string>();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const calendarToday = getCSVCalendarToday();

  const launchConfetti = () => {
    const end = Date.now() + CONFETTI_DURATION_MS;
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
    setCsvFile(e.target.files?.[0] ?? null);
    setUploadError(undefined);
  };

  const handleUpload = async () => {
    if (!csvFile || isUploading) return;
    setIsUploading(true);
    setUploadError(undefined);
    setUploadMessage(undefined);
    try {
      const effectiveOn = applyWhen === "scheduled" ? getCSVEffectiveOn(effectiveDate) : undefined;
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": csvFile.type || "text/csv" },
        body: csvFile,
      });
      if (!response.ok) throw new Error("CSV upload failed.");
      const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
      await loadClassrooms({ csvFileStorageId: storageId, fileName: csvFile.name, effectiveOn });
      setUploadMessage(
        effectiveOn
          ? `${csvFile.name} is scheduled to take effect on ${new Date(effectiveOn).toLocaleDateString("en-US", { timeZone: CSV_TIME_ZONE, dateStyle: "long" })} at midnight Pacific time.`
          : `${csvFile.name} has been applied. Classrooms and availabilities are now updated.`
      );
      setCsvFile(null);
      setApplyWhen("immediately");
      setEffectiveDate(undefined);
      if (inputRef.current) inputRef.current.value = "";
      launchConfetti();
    } catch (error) {
      setUploadError(getUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
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
        <span className="w-fit rounded-lg bg-muted px-2 py-1 font-mono text-neutral-300 text-sm">
          {isFetching ? "Loading..." : (csvRecord?.fileName ?? "No CSV file uploaded yet")}
        </span>

        {csvRecord && (
          <div className="mt-4 flex flex-col">
            <span>Applied At:</span>
            <span className="w-fit rounded-lg bg-muted px-2 py-1 font-mono text-neutral-300 text-sm">
              {new Date(csvRecord.dateUploaded).toLocaleString("en-US", { timeZone: CSV_TIME_ZONE, timeZoneName: "short" })}
            </span>
          </div>
        )}
      </div>

      <Separator className="my-5" />

      <div className="mt-3 space-y-5">
        <Field>
          <FieldLabel htmlFor="csvFile">CSV File</FieldLabel>
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            className="w-full"
            onChange={handleFileSelect}
            title="Select a CSV file to upload."
            disabled={isUploading}
            ref={inputRef}
          />
          <FieldDescription>Select a CSV file to upload.</FieldDescription>
        </Field>

        <FieldSet disabled={isUploading}>
          <FieldLegend>When should this CSV take effect?</FieldLegend>
          <RadioGroup
            value={applyWhen}
            disabled={isUploading}
            onValueChange={(value) => {
              setApplyWhen(value);
              setUploadError(undefined);
            }}
            aria-label="When should this CSV take effect?"
          >
            <Field orientation="horizontal">
              <RadioGroupItem value="immediately" id="csv-immediately" />
              <FieldLabel htmlFor="csv-immediately">Immediately</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="scheduled" id="csv-scheduled" />
              <FieldLabel htmlFor="csv-scheduled">Schedule for later</FieldLabel>
            </Field>
          </RadioGroup>
        </FieldSet>

        {applyWhen === "scheduled" && (
          <Field>
            <FieldLabel htmlFor="csv-effective-on">Effective date</FieldLabel>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="csv-effective-on"
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  aria-label="Effective date"
                  aria-describedby="csv-schedule-description"
                  className="w-fit! justify-between border-zinc-700 bg-zinc-900 font-normal"
                >
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4" />
                    {effectiveDate ? effectiveDate.toLocaleDateString("en-US", { timeZone: CSV_TIME_ZONE, dateStyle: "long" }) : "Pick a date"}
                  </span>
                  <ChevronDownIcon className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto border-zinc-700 bg-zinc-900 p-0" align="start">
                <Calendar
                  mode="single"
                  timeZone={CSV_TIME_ZONE}
                  today={calendarToday}
                  selected={effectiveDate}
                  defaultMonth={effectiveDate ?? calendarToday}
                  disabled={(date) => isUploading || date.getTime() <= Date.now()}
                  onSelect={(date) => {
                    setEffectiveDate(date);
                    setIsCalendarOpen(false);
                    setUploadError(undefined);
                  }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            <FieldDescription id="csv-schedule-description" className="text-sm">
              Takes effect at midnight Pacific time on the selected date
            </FieldDescription>
          </Field>
        )}

        {uploadError && <FieldError>{uploadError}</FieldError>}
        {uploadMessage && (
          <p role="status" className="text-green-400 text-sm">
            {uploadMessage}
          </p>
        )}

        <Button onClick={handleUpload} disabled={!csvFile || isUploading || (applyWhen === "scheduled" && !effectiveDate)}>
          {isUploading ? "Uploading..." : applyWhen === "scheduled" ? "Schedule CSV" : "Upload and apply CSV"}
        </Button>
      </div>
    </div>
  );
}
