# Configurable maintenance fields

Supervisors and administrators configure the checklist under **Admin → Maintenance Fields**. Employees can complete published checklists but cannot change configuration.

## First use

The editor starts with the existing General Maintenance, Microphone, and DTEN checks. General checks apply to every classroom. Equipment sections use an existing matching equipment attribute when available; otherwise they start with an empty selected-room audience. Configure those sections' rooms or attributes before publishing.

**Save draft** saves incomplete work without changing staff forms. **Publish checklist** saves local changes, validates the saved draft, and creates an immutable version. Until the first publication, staff retain the original maintenance form. After publication, the original submission endpoint refuses new legacy entries. Existing entries and Mongo imports remain readable.

The preview uses the same visibility resolver as the backend. Select a classroom to try its fields and inspect why each field is visible or hidden. Preview answers are never persisted. Section and field order determine the staff form order. Disable a section or field to remove it from future published checklists; previous records are unaffected.

## Visibility

Each rule has an all-room or selected-room audience, explicit room exclusions, required-all attributes, required-any attributes, and excluded attributes. Audience and attribute conditions combine with AND. Empty attribute lists impose no condition. A selected-room audience with no selected rooms matches nothing. Exclusions win within a rule.

Fields have three modes:

- **Use section rules:** inherit the section audience and conditions.
- **Restrict section rules:** both the section and field rules must match.
- **Use custom rules:** field rules replace section visibility, allowing a field outside its section's usual audience.

A disabled section always suppresses every child, including custom fields. Empty resolved sections disappear. An attribute cannot be deleted while a draft or current published checklist references it. Remove the rule and publish first; historical versions do not prevent deletion.

## Answers and results

Dropdowns use stable option IDs. Each option maps to a result and an optional required task/issue link. Switches configure these mappings independently for Yes and No; unanswered is distinct from No. Text is informational and never interpreted as a result. Required text must contain non-whitespace content.

Results are `pass`, `corrected`, `follow_up`, `blocked`, `info`, and `not_applicable`. Overall priority is blocked, then corrective actions (corrected or follow-up), then clean pass. An inspection containing only informational or not-applicable answers is unscored. A submission must contain at least one answer. Corrected work and outstanding follow-ups have separate counts; unlike legacy history, a correction does not also count as a clean pass.

When a mapping requires follow-up, staff select a real task or issue for the inspected classroom. Existing task and issue creation dialogs are available; after creating work, select it in the checklist. The server verifies every linked document and its classroom. Changing an answer clears the previous link.

## Storage and consistency

- `maintenanceTemplates`: one `default` draft, revision number, and published-version pointer.
- `maintenanceTemplateVersions`: immutable published definitions, version number, author, and publication time.
- `maintenance.checklist`: the published-version reference, resolved definition snapshot, evaluated answers, display labels, and aggregate summary.

The server resolves applicability again and validates types, option IDs, required answers, follow-up links, and record size. It rejects duplicate or inapplicable field answers. Client-supplied results are never accepted.

Draft saves and publications use expected revision numbers to prevent conflicting administrator edits. Staff forms retain the version and room-attribute context they opened with. A publication or room-attribute change requires refreshing and reviewing the form. Refresh preserves compatible answer values, removes hidden/invalid answers, and clears follow-up links for review. Failed submissions remain open. Backdated entries do not move the classroom's last-maintenance date backward.

Definitions support up to 30 sections, 50 fields per section, 300 total fields, and 30 dropdown options per field. UTF-8 byte limits keep templates and recorded snapshots within Convex document limits.

## Validation

Run from the repository root:

```sh
bun test --cwd apps/backend
bun run tsgo --noEmit -p apps/backend/tsconfig.json
bun run tsgo --noEmit -p apps/web/tsconfig.json
```

The maintenance tests exercise visibility precedence, input and outcome validation, authorization, draft conflicts, immutable versions and records, reference deletion guards, stale staff forms, cross-room links, and legacy compatibility using the registered Convex handlers without a deployment.
