import type { RegisterCommand } from "./common";
import { ensureRunning, exitWithError } from "./common";
import { network, networkRequest, clearNetwork, type NetworkFilter } from "../network";
import { runDaemon } from "../network-daemon";

export const registerNetworkCommands: RegisterCommand = (program) => {
  program
    .command("network [id]")
    .description("List network requests or show details of a specific request")
    .option("-f, --filter <pattern>", "Filter by URL pattern")
    .option("-t, --type <types>", "Filter by type (comma-separated: xhr,fetch,document,script,stylesheet,image,font,websocket,other)")
    .option("--failed", "Show only failed requests")
    .option("--headers", "Show headers (when viewing specific request)")
    .option("--body", "Show response body (when viewing specific request)")
    .option("--request-body", "Show request body (when viewing specific request)")
    .option("--clear", "Clear captured network requests for active tab")
    .action(async (id, options) => {
      await ensureRunning();

      if (options.clear) {
        await clearNetwork();
        console.log("Network requests cleared");
        return;
      }

      if (id) {
        const reqId = parseInt(id, 10);
        const request = await networkRequest(reqId);
        if (!request) {
          exitWithError(`Request #${reqId} not found`);
        }

        const duration = request.duration ? `${Math.round(request.duration)}ms` : "pending";
        const status = request.status ?? (request.failed ? "FAILED" : "...");
        console.log(`${request.method} ${status} ${request.url}  ${duration}`);
        if (request.error) console.log(`Error: ${request.error}`);
        console.log();

        if (options.headers || (!options.body && !options.requestBody)) {
          console.log("Request Headers:");
          for (const [key, value] of Object.entries(request.requestHeaders)) {
            console.log(`  ${key}: ${value}`);
          }
          console.log();

          if (request.responseHeaders) {
            console.log("Response Headers:");
            for (const [key, value] of Object.entries(request.responseHeaders)) {
              console.log(`  ${key}: ${value}`);
            }
            console.log();
          }
        }

        if (options.requestBody && request.requestBody) {
          console.log("Request Body:");
          console.log(request.requestBody);
          console.log();
        }

        if (options.body) {
          if (request.responseBody) {
            console.log("Response Body:");
            console.log(request.responseBody);
          } else {
            console.log("Response Body: (not captured)");
          }
        }
      } else {
        const filter: NetworkFilter = {};
        if (options.filter) filter.pattern = options.filter;
        if (options.type) filter.type = options.type.split(",");
        if (options.failed) filter.failed = true;

        const { requests } = await network(filter);

        if (requests.length === 0) {
          console.log("No requests captured");
          return;
        }

        for (const req of requests) {
          const duration = req.duration ? `${Math.round(req.duration)}ms`.padStart(6) : "...".padStart(6);
          const status = req.status?.toString() ?? (req.failed ? "ERR" : "...");
          const method = req.method.padEnd(6);
          const failed = req.failed ? "  FAILED" : "";
          const url = req.url.length > 60 ? req.url.slice(0, 60) + "..." : req.url;
          console.log(`#${req.id.toString().padEnd(4)} ${method} ${status.padEnd(3)} ${url}  ${duration}${failed}`);
        }
      }
    });

  program
    .command("_network-daemon", { hidden: true })
    .action(runDaemon);
};
