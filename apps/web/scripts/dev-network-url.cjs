const { networkInterfaces } = require("node:os");
const { spawn } = require("node:child_process");

function getPort(args) {
  const envPort = process.env.PORT;
  if (envPort) {
    return envPort;
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-p" || arg === "--port") {
      return args[i + 1] ?? "3000";
    }
    if (arg.startsWith("--port=")) {
      return arg.split("=")[1] || "3000";
    }
  }

  return "3000";
}

function getLanIpV4() {
  const interfaces = networkInterfaces();
  const entries = Object.values(interfaces).flat().filter(Boolean);
  const preferred = entries.find(
    (entry) =>
      entry.family === "IPv4" &&
      !entry.internal &&
      !entry.address.startsWith("169.254."),
  );
  return preferred?.address ?? null;
}

function quoteForCmd(arg) {
  if (!arg) {
    return '""';
  }
  if (!/[\s"&|<>^]/.test(arg)) {
    return arg;
  }
  return `"${arg.replace(/"/g, '""')}"`;
}

function run() {
  const passthroughArgs = process.argv.slice(2);
  const port = getPort(passthroughArgs);
  const lanIp = getLanIpV4();

  if (lanIp) {
    console.log(`   - Network (LAN): http://${lanIp}:${port}`);
  } else {
    console.log("   - Network (LAN): not detected automatically");
  }

  const args = ["exec", "next", "dev", "--turbo", "-H", "0.0.0.0", ...passthroughArgs];
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", ["pnpm", ...args].map(quoteForCmd).join(" ")], {
          stdio: "inherit",
        })
      : spawn("pnpm", args, { stdio: "inherit" });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

run();
