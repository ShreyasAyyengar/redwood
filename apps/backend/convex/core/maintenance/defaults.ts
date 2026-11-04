import type { Id } from "../../_generated/dataModel";
import { allRoomsRule, type MaintenanceField, type MaintenanceOutcome, type MaintenanceSection, type VisibilityRule } from "./definitions";

const pass: MaintenanceOutcome = { result: "pass", followUp: "none" };
const corrected: MaintenanceOutcome = { result: "corrected", followUp: "none" };
const task: MaintenanceOutcome = { result: "follow_up", followUp: "task" };
const issue: MaintenanceOutcome = { result: "blocked", followUp: "issue" };

function dropdown(id: string, label: string, fixes: string[] = [], blocked = true): MaintenanceField {
  return {
    id,
    label,
    helpText: "",
    enabled: true,
    required: true,
    visibility: { mode: "inherit", rules: allRoomsRule() },
    type: "dropdown",
    options: [
      { id: "yes", label: "Yes", outcome: pass },
      ...fixes.map((fix, index) => ({ id: `corrected-${index}`, label: fix, outcome: corrected })),
      { id: "follow-up", label: "No, follow-up needed", outcome: task },
      ...(blocked ? [{ id: "blocked", label: "No, issue preventing completion", outcome: issue }] : []),
    ],
  };
}

export function starterChecklist(attributes: { _id: Id<"attributes">; label: string }[]): MaintenanceSection[] {
  function equipmentRule(labels: string[]): VisibilityRule {
    const attribute = attributes.find((candidate) => labels.includes(candidate.label.trim().toLowerCase()));
    return attribute ? { ...allRoomsRule(), allAttributeIds: [attribute._id] } : { ...allRoomsRule(), audience: "selected" }; // Explicitly configure equipment rooms before publishing.
  }

  return [
    {
      id: "general",
      label: "General Maintenance",
      description: "Complete the routine checks for this classroom.",
      enabled: true,
      visibility: allRoomsRule(),
      fields: [
        { id: "surfaces-wiped", label: "Surfaces wiped", helpText: "Wipe instructional surfaces, the lectern, touch panel, and media cabinet." },
        { id: "equipment-checked", label: "Equipment checked / QC'd", helpText: "Check that instructional equipment is in good working order." },
      ].map((field) => ({
        ...field,
        type: "switch",
        enabled: true,
        required: true,
        visibility: { mode: "inherit", rules: allRoomsRule() },
        trueOutcome: pass,
        falseOutcome: task,
      })),
    },
    {
      id: "microphone",
      label: "Microphone",
      description: "Check the microphone and assistive listening equipment.",
      enabled: true,
      visibility: equipmentRule(["microphone", "has microphone", "microphone equipped"]),
      fields: [
        dropdown("microphone.batteryStripe", "Battery stripe present", ["Re-applied"]),
        dropdown("microphone.chargerStripe", "Charger stripe present", ["Re-applied"]),
        dropdown("microphone.transmitterStripe", "Transmitter stripe present", ["Re-applied"]),
        dropdown("microphone.aldBatteriesCharged", "ALD batteries charged", ["Battery replaced", "Found dead, now re-charging"]),
        dropdown("microphone.windscreenSecure", "Windscreen secure", ["Re-applied"]),
        dropdown("microphone.clipInstalled", "Microphone clip installed", ["Re-applied"]),
      ],
    },
    {
      id: "dten",
      label: "DTEN",
      description: "Check the DTEN equipment.",
      enabled: true,
      visibility: equipmentRule(["dten", "has dten", "dten equipped"]),
      fields: [
        dropdown("dten.licenced", "DTEN licensed", ["Re-licensed"]),
        dropdown("dten.signPresent", "Sign present", [], false),
        dropdown("dten.microphoneWorking", "Microphone working"),
        dropdown("dten.speakerWorking", "Speaker working"),
        dropdown("dten.screenWiped", "Screen wiped"),
      ],
    },
  ];
}
