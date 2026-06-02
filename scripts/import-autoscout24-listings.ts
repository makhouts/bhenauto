import "dotenv/config";
import {
  AutoScoutImportPartialFailureError,
  runAutoScoutImport,
  type AutoScoutImportOptions,
} from "../src/lib/autoscout24/importer";

type ParsedArgs = AutoScoutImportOptions & {
  help: boolean;
};

function printHelp() {
  console.log(`AutoScout24 inventory import / status cleanup

Usage:
  npm run import:autoscout24 -- [options]

Options:
  --dry-run                 Preview changes only (default)
  --apply                   Write changes to the database and R2
  --reset-test-inventory    Delete all existing website cars/images before import
  --overwrite-from-autoscout Update/create website cars from AutoScout24 again
  --create-only-from-autoscout Create only missing website cars from AutoScout24
  --skip-cleanup-sold       Do not delete imported sold cars older than 2 days
  --customer-id <id>        Override AUTOSCOUT24_CUSTOMER_ID
  --help                    Show this help

Examples:
  npm run import:autoscout24
  npm run import:autoscout24 -- --apply --overwrite-from-autoscout
  npm run import:autoscout24 -- --apply --create-only-from-autoscout
  npm run import:autoscout24 -- --apply --reset-test-inventory

AutoScout24 is the source of truth for inventory. By default this command
will update website inventory from AutoScout24.
`);
}

function readValue(args: string[], index: number) {
  const current = args[index];
  const inline = current.split("=", 2);
  if (inline.length === 2) return { value: inline[1], nextIndex: index };
  return { value: args[index + 1], nextIndex: index + 1 };
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    mode: "dry-run",
    cleanupSold: true,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--dry-run") {
      parsed.mode = "dry-run";
    } else if (arg === "--apply") {
      parsed.mode = "apply";
    } else if (arg === "--reset-test-inventory") {
      parsed.resetTestInventory = true;
    } else if (arg === "--overwrite-from-autoscout") {
      parsed.overwriteFromAutoscout = true;
    } else if (arg === "--create-only-from-autoscout") {
      parsed.createOnlyFromAutoscout = true;
    } else if (arg === "--skip-cleanup-sold") {
      parsed.cleanupSold = false;
    } else if (arg === "--customer-id" || arg.startsWith("--customer-id=")) {
      const { value, nextIndex } = readValue(args, i);
      if (!value) throw new Error("--customer-id requires a value");
      parsed.customerId = value;
      i = nextIndex;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function printSummary(summary: Awaited<ReturnType<typeof runAutoScoutImport>>) {
  console.log("\nAutoScout24 import summary");
  console.log(`Mode: ${summary.mode}`);
  console.log(`Customer ID: ${summary.customerId}`);
  console.log(`Listings fetched: ${summary.fetchedListings}`);
  console.log(`Listing details fetched: ${summary.fetchedDetails}`);
  console.log(`Listings reused without detail fetch: ${summary.reusedExisting}`);
  console.log(`Cars created: ${summary.created}`);
  console.log(`Cars updated: ${summary.updated}`);
  console.log(`Cars skipped: ${summary.skipped}`);
  console.log(`Cars marked sold: ${summary.markedSold}`);
  console.log(`Inactive cars deleted: ${summary.deletedInactive}`);
  console.log(`Reset deleted cars: ${summary.resetDeletedCars}`);
  console.log(`Sold cars deleted after retention: ${summary.deletedSoldCars}`);
  console.log(`Images uploaded to R2: ${summary.uploadedImages}`);
  console.log(`R2 image objects deleted: ${summary.deletedImages}`);
  console.log(`Failures: ${summary.failures.length}`);

  if (summary.failures.length > 0) {
    console.log("\nFailures:");
    for (const failure of summary.failures) {
      console.log(`- ${failure.listingId ?? "unknown listing"}: ${failure.message}`);
    }
  }

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
    console.log("\nDry-run only. Re-run with --apply to write these changes.");
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (options.mode === "apply" && options.resetTestInventory) {
    console.log("Apply mode with --reset-test-inventory will delete all existing website cars and their R2 images before importing AutoScout24 listings.");
  }
  if (options.overwriteFromAutoscout && options.createOnlyFromAutoscout) {
    throw new Error("Use either --overwrite-from-autoscout or --create-only-from-autoscout, not both.");
  }
  if (options.createOnlyFromAutoscout) {
    console.log("Create-only mode: only missing AutoScout24 listings will be created. Existing website cars will be left unchanged.");
  } else if (!options.resetTestInventory && options.overwriteFromAutoscout === false) {
    console.log("Fetched AutoScout24 listings will be skipped because overwrite mode was disabled.");
  }

  const summary = await runAutoScoutImport(options);
  printSummary(summary);

  if (summary.failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  if (error instanceof AutoScoutImportPartialFailureError) {
    printSummary(error.summary);
  }
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
