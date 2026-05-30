import "dotenv/config";
import { cleanupSoldCars } from "../src/lib/cars/sold-cleanup";

type ParsedArgs = {
  apply: boolean;
  retentionDays: number;
  help: boolean;
};

function printHelp() {
  console.log(`Sold car cleanup

Usage:
  npm run cleanup:sold-cars -- [options]

Options:
  --dry-run       Preview deletions only (default)
  --apply         Delete sold cars older than the retention period and their R2 images
  --days <days>   Retention period in days (default: 2)
  --help          Show this help

Examples:
  npm run cleanup:sold-cars
  npm run cleanup:sold-cars -- --apply
`);
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    apply: false,
    retentionDays: 2,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--dry-run") {
      parsed.apply = false;
    } else if (arg === "--apply") {
      parsed.apply = true;
    } else if (arg === "--days") {
      const value = Number(args[i + 1]);
      if (!Number.isFinite(value) || value < 0) throw new Error("--days must be a positive number");
      parsed.retentionDays = value;
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function printSummary(summary: Awaited<ReturnType<typeof cleanupSoldCars>>) {
  console.log("\nSold car cleanup summary");
  console.log(`Mode: ${summary.mode}`);
  console.log(`Retention days: ${summary.retentionDays}`);
  console.log(`Cutoff: ${summary.cutoff.toISOString()}`);
  console.log(`Cars matched: ${summary.carsMatched}`);
  console.log(`Cars deleted: ${summary.carsDeleted}`);
  console.log(`R2 image objects deleted: ${summary.imagesDeleted}`);

  if (summary.actions.length > 0) {
    console.log("\nActions:");
    for (const action of summary.actions.slice(0, 100)) {
      console.log(`- ${action}`);
    }
    if (summary.actions.length > 100) {
      console.log(`- ... ${summary.actions.length - 100} more actions`);
    }
  }

  if (summary.mode === "dry-run") {
    console.log("\nDry-run only. Re-run with --apply to delete these cars.");
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const summary = await cleanupSoldCars({
    apply: options.apply,
    retentionDays: options.retentionDays,
  });
  printSummary(summary);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
