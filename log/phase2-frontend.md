# Phase 2 Frontend Log

Date: 2026-03-19
Status: Completed

## Scope

Phase 2 frontend targets content management and end-to-end typing practice UX:

- content (word/sentence) management pages
- practice setup and typing runtime page
- live stats and result submission flow
- practice history list page

## Completed Items

- Implemented content management route using `/content` (replacing prior `library` direction):
  - word/sentence bank switch and list
  - bank create and selection
  - item list, add, delete
  - search and difficulty filtering
  - import entry points for word and sentence content
- Implemented practice route end-to-end:
  - practice configuration (mode/content type/bank/item count)
  - typing runtime UI (`CharDisplay`) with current/correct/incorrect states
  - live metrics area (`StatsBar`) showing WPM and accuracy
  - completion submission and summary card rendering
  - recent practice records panel
- Added history route:
  - paginated practice session list
  - mode/source/WPM/accuracy/duration display
- Added hooks:
  - `useTyping` for character-state engine, IME handling, key stats, and error extraction
  - `useWebSocket` for `/ws/practice` connection, reconnection, and stats stream updates

## Type/Build Fixes During Integration

- Fixed API error class constructor typing in `api/client.ts`.
- Fixed review mutation typing in `api/errors.ts`.
- Fixed retry timer nullability handling in `hooks/useWebSocket.ts`.
- Fixed tooltip formatter typing in `routes/analysis.tsx`.
- Fixed root user field mapping (`name` -> `username`) in `routes/__root.tsx`.

## Validation

- Build command passed:
  - `npm run build` (`tsc -b && vite build`)
- Remaining output note:
  - non-blocking Vite chunk size warning only.

## Result

Phase 2 frontend deliverables are complete and integrated with existing backend APIs.
