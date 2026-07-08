# TODO

## Bugs
- [ ] [low] roundToHalf: negligible-remainder heuristic produces off-by-0.5 for natural session-split values (spec: `tasks/new/roundToHalf-regression.md`)

## Tasks
- [ ] Tag extraction rearchitecture (master plan: `tasks/new/tag-extraction-rearchitecture/README.md`)
  - [x] Phase 1: Structural split — `deriveUniqueTags`, unify calls, move stats (spec: `tasks/new/tag-extraction-rearchitecture/phase-1-structural-split.md`)
  - [ ] Phase 2: Fix new-format bucket allocation (spec: `tasks/new/tag-extraction-rearchitecture/phase-2-fix-bucket-allocation.md`)
  - [ ] Phase 3: Consolidate notes-cell filter and cleanup (spec: `tasks/new/tag-extraction-rearchitecture/phase-3-consolidate-and-cleanup.md`)
