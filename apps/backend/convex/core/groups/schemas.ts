import { z } from "zod";

export const groupSchema = z.object({
  label: z.string(),
});

export const groupFormSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
});
