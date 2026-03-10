# Kidivity Categories - Current

## 1. Final Integrated Categories
The Kidivity category engine now uses **6** core buckets aligned to the app constants.

| Category ID | Label | Icon | Focus |
|---|---|---|---|
| `puzzles` | Puzzles & Logic | `Puzzle` | Mazes, matching & sorting |
| `tracing` | Letters & Tracing | `PenTool` | Alphabet, shapes & writing |
| `science` | Science & Discovery | `FlaskConical` | Animals, space & facts |
| `art` | Art & Creation | `Palette` | Drawing, coloring & crafts |
| `math` | Math & Numbers | `Calculator` | Counting, addition & logic |
| `reading` | Reading & Stories | `BookOpen` | Stories & reading skills |

---

## 2. Implementation Summary

### Frontend (Mobile App)
- **Constants**: `Kidivity/constants/categories.ts` aligned to 6 items.
- **Theming**: `Kidivity/constants/theme.ts` provides category colors per item.
- **UI Logic**: Activity detail screens render hero visuals for all visual-first categories.

### Backend (Fastify & AI)
- **Schema**: `server/src/schemas/activity.schema.ts` should validate the 6 category enums.
- **Text Engine**: `server/src/services/prompt.service.ts` should map prompts to these 6 buckets.
- **Visual Engine**: `server/src/services/prompt.service.ts` should enforce per-category visual rules (e.g., `math` count accuracy, `art` B&W for print when style is `bw`).

### Persistence (Supabase)
- **Migration**: Category check constraint should match the 6 enums above.

### Documentation
- Update `project_requirements.md`, `api_design.md`, and `data_model.md` to reflect the 6 categories.
