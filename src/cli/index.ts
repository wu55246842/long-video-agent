import { Command } from "commander";
import { Orchestrator } from "../orchestrator/orchestrator";

type AsyncAction<TOptions = Record<string, unknown>> = (options: TOptions) => Promise<void>;

const program = new Command();

function withOrchestrator<TOptions = Record<string, unknown>>(
  action: (orchestrator: Orchestrator, options: TOptions) => Promise<void>
): AsyncAction<TOptions> {
  return async (options: TOptions) => {
    const orchestrator = new Orchestrator();
    await action(orchestrator, options);
  };
}

program
  .name("long-video-agent")
  .description("CLI for running the long video agent pipeline.");

program
  .command("new")
  .description("Start a new project by running the Brief stage.")
  .action(
    withOrchestrator(async (orchestrator) => {
      await orchestrator.runStage("Brief", undefined, { force: true });
    })
  );

program
  .command("run")
  .description("Run the full pipeline.")
  .action(
    withOrchestrator(async (orchestrator) => {
      await orchestrator.runAll();
    })
  );

program
  .command("demo")
  .description("Generate a demo storyboard.")
  .action(
    withOrchestrator(async (orchestrator) => {
      await orchestrator.runStage("Storyboard", undefined, { force: true });
    })
  );

program
  .command("redo")
  .description("Mark a storyboard shot for redo.")
  .requiredOption("--shot_id <id>", "Shot id to redo")
  .action(
    withOrchestrator<{ shot_id: string }>(async (orchestrator, options) => {
      await orchestrator.redoShot(options.shot_id);
    })
  );

async function main(): Promise<void> {
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
