import "dotenv/config";
import { syncAutoScoutReferences, type AutoScoutReferenceSyncMode } from "../src/lib/autoscout24/reference-sync";

type ParsedArgs = {
  mode: AutoScoutReferenceSyncMode;
  help: boolean;
};

function printHelp() {
  console.log(`AutoScout24 reference/options sync

Usage:
  npm run sync:autoscout24-references -- [options]

Options:
  --dry-run   Preview changes only (default)
  --apply     Upsert AutoScout24 reference names into the database
  --help      Show this help
`);
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    mode: "dry-run",
    help: false,
  };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--dry-run") {
      parsed.mode = "dry-run";
    } else if (arg === "--apply") {
      parsed.mode = "apply";
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function printSummary(summary: Awaited<ReturnType<typeof syncAutoScoutReferences>>) {
  console.log("\nAutoScout24 reference sync summary");
  console.log(`Mode: ${summary.mode}`);
  console.log(`Rows ${summary.mode === "dry-run" ? "to upsert" : "upserted"}: ${summary.upserted}`);

  console.log("\nFetched by culture:");
  for (const [culture, count] of Object.entries(summary.fetchedByCulture)) {
    console.log(`- ${culture}: ${count}`);
  }

  if (summary.failures.length > 0) {
    console.log("\nFailures:");
    for (const failure of summary.failures) {
      console.log(`- ${failure.culture}: ${failure.message}`);
    }
  }

  for (const action of summary.actions) {
    console.log(`- ${action}`);
  }

  if (summary.mode === "dry-run") {
    console.log("\nDry-run only. Re-run with --apply to write these changes.");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const summary = await syncAutoScoutReferences(args.mode);
  printSummary(summary);

  if (summary.failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
