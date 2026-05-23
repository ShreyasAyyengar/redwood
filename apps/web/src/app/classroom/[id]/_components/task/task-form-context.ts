import type { uiTaskFormSchema } from "@redwood/contracts";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type { ComponentType, ReactNode } from "react";
import type { z } from "zod";
import CompletionField from "./fields/completion-field";
import CreatedByFieldSelector from "./fields/created-by-field-selector";
import DescriptionField from "./fields/description-field";
import SupervisorNeededField from "./fields/supervisor-needed-field";
import TaskDateField from "./fields/task-date-field";
import UrgentField from "./fields/urgent-field";

export type TaskFormValues = z.input<typeof uiTaskFormSchema>;

export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

const taskFieldComponents = {
  CreatedByFieldSelector,
  TaskDateField,
  DescriptionField,
  UrgentField,
  SupervisorNeededField,
  CompletionField,
};

export type TaskFormBodyApi = {
  AppField: ComponentType<{
    name: "completion" | "completeBy" | "description" | "supervisorNeeded" | "urgent" | "visibleAt";
    children: (field: typeof taskFieldComponents) => ReactNode;
  }>;
};

export const taskAppForm = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: taskFieldComponents,
  formComponents: {},
}).useAppForm;
