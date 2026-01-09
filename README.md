# Long Video Agent

## Project purpose
Long Video Agent is a TypeScript-based pipeline that mocks out a multi-stage, long-form video production workflow. It orchestrates sequential stages (Brief → QA), stores artifacts to disk, and provides a CLI for running the pipeline, generating demo storyboard data, and marking individual storyboard shots for redo.

## Architecture diagram
```
┌────────────────────────────┐
│          CLI               │
│  new | run | demo | redo   │
└──────────────┬─────────────┘
               │
               ▼
      ┌─────────────────┐
      │  Orchestrator   │
      │  (pipeline)     │
      └───────┬─────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│ Stages: Brief → Outline → Script → Storyboard│
│         → RenderPlan → Production → QA       │
└──────────────┬───────────────────────────────┘
               │
               ▼
      ┌─────────────────┐
      │  Artifacts/     │
      │  *.json files   │
      └─────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│ Production helpers (mock providers):         │
│ - Image placeholders                          │
│ - TTS mock audio                               │
│ - Subtitle generator                           │
│ - FFmpeg composer                              │
└──────────────────────────────────────────────┘
```

## Data flow
1. The CLI instantiates the orchestrator and chooses a stage (or the full pipeline).
2. The orchestrator loads any existing artifacts from `artifacts/*.json` unless `force` is used.
3. Each stage (mocked today) returns an artifact payload that is persisted to disk.
4. The storyboard artifact includes shot metadata; the production helpers can use that data to generate placeholder images/audio/subtitles and assemble video output.
5. `redo` updates a shot’s status in the storyboard artifact and rewrites the storyboard JSON.

## How to run demo
The demo runs the storyboard stage with mock data and writes `artifacts/storyboard.json`.

```bash
# Use your preferred TypeScript runner
npx tsx src/cli/index.ts demo
# or
npx ts-node src/cli/index.ts demo
```

## How to redo a single shot
The redo command marks a storyboard shot as `redo` and updates the storyboard artifact.

```bash
npx tsx src/cli/index.ts redo --shot_id shot-001
```

If you are integrating the orchestrator directly, you can call `orchestrator.redoShot("shot-001")` to update the storyboard artifact programmatically.
