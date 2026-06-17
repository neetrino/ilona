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

function createUrlRewriteWriter(targetStream, replacements) {
  let carry = "";

  function applyReplacements(text) {
    let output = text;
    for (const [from, to] of replacements) {
      output = output.split(from).join(to);
    }
    return output;
  }

  return {
    write(chunk) {
      const text = carry + chunk.toString("utf8");
      const safeLength = Math.max(0, text.length - 128);
      const output = text.slice(0, safeLength);
      carry = text.slice(safeLength);
      targetStream.write(applyReplacements(output));
    },
    flush() {
      if (!carry) {
        return;
      }
      targetStream.write(applyReplacements(carry));
      carry = "";
    },
  };
}

function run() {
  const passthroughArgs = process.argv.slice(2);
  const port = getPort(passthroughArgs);
  const lanIp = getPrimaryLanIpv4();
  const hasCustomHost = passthroughArgs.some(
    (arg, index) => arg === "-H" || arg === "--hostname" || arg.startsWith("--hostname=") || (arg === "--host" && passthroughArgs[index + 1])
  );

  console.log("");
  console.log("  Local:   http://localhost:" + port);
  if (lanIp) {
    console.log("  Wi-Fi:   http://" + lanIp + ":" + port);
    console.log("  (Use Local on this computer, Wi-Fi URL on other devices)");
  } else {
    console.log("  Wi-Fi:   LAN IP not detected — check Wi-Fi and run: ipconfig getifaddr en0");
  }
  console.log("");

  // On macOS, localhost usually resolves to ::1 first.
  // Using "::" keeps localhost working while still exposing the app on LAN.
  const defaultHost = process.platform === "win32" ? "0.0.0.0" : "::";
  const hostArgs = hasCustomHost ? [] : ["-H", defaultHost];
  const args = ["exec", "next", "dev", "--turbo", ...hostArgs, ...passthroughArgs];
  const networkUrl = lanIp ? "http://" + lanIp + ":" + port : null;
  const replacements = networkUrl
    ? [
        ["http://0.0.0.0:" + port, networkUrl],
        ["0.0.0.0:" + port, lanIp + ":" + port],
        ["http://[::]:" + port, networkUrl],
        ["[::]:" + port, lanIp + ":" + port],
      ]
    : [];
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", ["pnpm", ...args].map(quoteForCmd).join(" ")], {
          stdio: "inherit",
        })
      : spawn("pnpm", args, { stdio: ["inherit", "pipe", "pipe"] });

  if (process.platform !== "win32" && child.stdout && child.stderr) {
    const stdoutWriter = createUrlRewriteWriter(process.stdout, replacements);
    const stderrWriter = createUrlRewriteWriter(process.stderr, replacements);

    child.stdout.on("data", stdoutWriter.write);
    child.stderr.on("data", stderrWriter.write);

    child.stdout.on("end", stdoutWriter.flush);
    child.stderr.on("end", stderrWriter.flush);
  }

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

run();
