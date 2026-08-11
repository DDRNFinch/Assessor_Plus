# Assessor+ V0.7.0 Multi-course implementation

Work from this branch. Current application baseline is V0.6.4.

## First step
Run:

```bash
node scripts/materialize-level2-course.mjs
```

This creates the complete authoritative Level 2 file:

`level2-trowel-6570-04-FULL-course-data.json`

Do not reconstruct Level 2 from Level 3 units. Do not restore the deleted partial Level 2 manifest/unit files.

The Level 2 full dataset is independent and must validate to:
- 11 units
- 72 learning outcomes
- 331 assessment criteria
- 126 Practical
- 205 Knowledge
- 0 ambiguous

Structure:
- Mandatory: 102, 219, 235, 609, 701
- Optional: 234, 238, 690, 817, 828, 837

Level 3 remains authoritative in `level3-trowel-6570-05-FULL-course-data.json` and must remain unchanged.

## Implement
Convert Assessor+ from a single-course app to a generic two-course engine supporting:

- `cg-6570-04-l2-trowel` -> Level 2 full JSON
- `cg-6570-05-l3-trowel` -> Level 3 full JSON

Each learner stores `courseId`. Existing learners without `courseId` must continue as Level 3.

Make these course-aware without duplicating business logic:
- Add Learner course selector
- optional-unit selector
- learner profile
- active units
- unit progress / OBSERVED status
- new observation Primary Unit selector
- Practical ACs
- Knowledge / Professional Discussion ACs
- previous-evidence highlighting and traceability
- Evidence Matrix
- holistic mapping
- Confirm / Ignore mappings
- saved assessments
- PDF qualification/unit wording
- Evidence ZIP qualification identity
- offline course loading

Never map evidence across qualifications. Level 2 mappings are generated within Level 2 only; Level 3 mappings remain within Level 3 only.

Preserve existing mapping thresholds exactly:
- >= 0.70 automatic
- >= 0.40 and < 0.70 confirmation-required
- < 0.40 hidden

Existing Level 3 mapping inventory must remain exactly:
- 1,468 automatic
- 388 confirmation-required

Generate and report the independent Level 2 mapping inventory.

## Preserve V0.6.4
Do not regress:
- provider/profile persistence
- provider logo
- assessor signature and historical snapshots
- UK DD-MM-YYYY dates
- Evidence ZIP
- professional PDF
- 3x4 photo pages
- grouped Unit/AC output
- manual assessor feedback
- compact unit selector
- percentages and OBSERVED marker
- previously-evidenced pale-teal AC state
- previous-evidence traceability
- Camera / Video / Gallery / Record Audio / Files controls
- media previews
- learner deletion
- observation deletion
- offline storage

Do not add Firebase, analytics or cloud learner storage.

## Release
Release as V0.7.0 with fresh cache `assessor-plus-v0.7.0`.

Update package, manifest, visible version, Settings/Admin, build identification, PDF identification where applicable, service worker and tests consistently.

## Testing
Run baseline and final:

```bash
npm test
npm run validate
npm run build
node --check src/app.js
git diff --check
```

Add tests for:
- legacy learner without courseId defaults to Level 3
- new Level 2/Level 3 learners save correct courseId
- qualification-specific optional units
- Level 2 active units = mandatory + selected optional
- Level 3 active units unchanged
- course-specific Practical and Knowledge ACs
- previous evidence is learner/course scoped
- zero cross-course evidence contamination
- holistic mapping is qualification-scoped
- Level 2 validation exact totals above
- Level 3 validation remains 12 units / 75 LOs / 335 ACs / 128 Practical / 207 Knowledge / 0 ambiguous
- Level 3 mapping inventory remains 1,468 / 388
- PDFs and ZIPs resolve the correct qualification
- existing historical Level 3 learners/assessments remain readable
- both courses function offline
- all V0.6.4 observation/media features remain present

Do not present the release as complete until the full test suite passes. Report exact Level 2 mapping counts, exact test results, commit hash and PR status.
