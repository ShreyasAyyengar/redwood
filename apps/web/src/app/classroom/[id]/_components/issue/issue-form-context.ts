import type { uiIssueFormSchema } from "@redwood/contracts";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type { ComponentType, ReactNode } from "react";
import type { z } from "zod";
import CruzfixField from "./fields/cruzfix-field";
import DescriptionField from "./fields/description-field";
import IssueDateField from "./fields/issue-date-field";
import ReportedByFieldSelector from "./fields/reported-by-field-selector";
import ResolutionField from "./fields/resolution-field";
import SodIDField from "./fields/sod-field";
import SupervisorNeededField from "./fields/supervisor-needed-field";
import UrgentField from "./fields/urgent-field";

export type IssueFormValues = z.input<typeof uiIssueFormSchema>;

export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

const issueFieldComponents = {
  DescriptionField,
  UrgentField,
  SupervisorNeededField,
  CruzfixField,
  SodIDField,
  ReportedByFieldSelector,
  IssueDateField,
  ResolutionField,
};

export type IssueFormBodyApi = {
  AppField: ComponentType<{
    name: "cruzfixId" | "description" | "resolution" | "sodId" | "supervisorNeeded" | "urgent";
    children: (field: typeof issueFieldComponents) => ReactNode;
  }>;
  setFieldValue: (field: "description", value: string) => void;
};

export const issueAppForm = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: issueFieldComponents,
  formComponents: {},
}).useAppForm;
