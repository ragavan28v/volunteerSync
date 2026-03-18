const { spawn } = require("node:child_process");

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

function run(label, args, color) {
  const child = spawn(npmCmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  const prefix = isWin ? `[${label}] ` : `\x1b[${color}m[${label}]\x1b[0m `;

  child.stdout.on("data", (d) => process.stdout.write(prefix + d.toString()));
  child.stderr.on("data", (d) => process.stderr.write(prefix + d.toString()));

  return child;
}

const backend = run("backend", ["run", "dev", "-w", "backend"], 34);
const frontend = run("frontend", ["run", "dev", "-w", "frontend"], 32);

function shutdown(code) {
  backend.kill("SIGINT");
  frontend.kill("SIGINT");
  process.exit(code);
}

backend.on("exit", (code) => shutdown(code ?? 0));
frontend.on("exit", (code) => shutdown(code ?? 0));

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

