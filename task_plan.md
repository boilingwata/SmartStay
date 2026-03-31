# Task Plan: Fixing BuildingList.tsx Lint & Syntax Errors

## Core Goal
Resolve all lint errors (missing imports) and syntax errors in `src/views/admin/buildings/BuildingList.tsx` while adhering to the SmartStay Design System and Skill Protocols.

## Phases
| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Research & Diagnosis | complete |
| 2 | Component & Icon Imports | complete |
| 3 | Syntax & Structural Fix | complete |
| 4 | Fix SidePanel UI Freeze | complete |
| 5 | Frontend Image Upl. Integration | in_progress |
| 6 | Verification & Validation | pending |

## Critical Decisions
- **SidePanel Import**: Use `@/components/ui/SidePanel` (Verified existence).
- **Lucide Icons**: Batch all missing icons into the existing `lucide-react` import block.
- **Syntax**: Ensure the ternary chain in the return statement is correctly nested and closed.

## Tracking Errors
| Error | Attempt | Resolution |
|-------|---------|------------|
| Cannot find name 'SidePanel' | 1 | Added named import (Pending verification) |
| Syntax error line 496 | 1 | Removed redundant </div> (Pending verification) |
