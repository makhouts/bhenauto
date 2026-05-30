import { processAutoScoutSyncJobs } from "../src/lib/autoscout24/sync-jobs";

type Options = {
  limit: number;
};

function parseArgs(args: string[]): Options {
  const options: Options = { limit: 10 };

  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      const limit = Number(arg.slice("--limit=".length));
      if (Number.isFinite(limit) && limit > 0) options.limit = Math.trunc(limit);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = await processAutoScoutSyncJobs({ limit: options.limit });

  console.log("AutoScout24 sync queue");
  console.log(`processed=${summary.processed}`);
  console.log(`succeeded=${summary.succeeded}`);
  console.log(`skipped=${summary.skipped}`);
  console.log(`retrying=${summary.retrying}`);
  console.log(`failed=${summary.failed}`);

  for (const error of summary.errors) {
    console.log(`error=${error}`);
  }

  if (summary.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
