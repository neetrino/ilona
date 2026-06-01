const { spawn } = require("node:child_process");
const { getPrimaryLanIpv4 } = require("./lan-ipv4.cjs");

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
  const lanIp = getPrimaryLanIpv4();

  console.log("");
  console.log("  Local:   http://localhost:" + port);
  if (lanIp) {
    console.log("  Wi-Fi:   http://" + lanIp + ":" + port);
    console.log("  (On other devices use the Wi-Fi URL, not http://0.0.0.0:" + port + ")");
  } else {
    console.log("  Wi-Fi:   LAN IP not detected — check Wi-Fi and run: ipconfig getifaddr en0");
  }
  console.log("");

  // Listen on all interfaces; Next may still print 0.0.0.0 — use the Wi-Fi URL above.
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
