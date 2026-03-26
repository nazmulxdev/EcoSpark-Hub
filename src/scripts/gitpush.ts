import readline from "readline";
import { exec } from "child_process";
import process from "process";

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

const log = {
  info: (msg: string) => console.log(`${COLORS.cyan}ℹ ${msg}${COLORS.reset}`),
  success: (msg: string) =>
    console.log(`${COLORS.green}✔ ${msg}${COLORS.reset}`),
  warn: (msg: string) => console.log(`${COLORS.yellow}⚠ ${msg}${COLORS.reset}`),
  error: (msg: string) => console.error(`${COLORS.red}✖ ${msg}${COLORS.reset}`),
  bold: (msg: string) => console.log(`${COLORS.bold}${msg}${COLORS.reset}`),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> =>
  new Promise((resolve) => rl.question(prompt, resolve));

const run = (command: string): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(new Error(error.message));
      else resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });

const getCurrentBranch = async (): Promise<string> => {
  const { stdout } = await run("git branch --show-current");
  return stdout.trim();
};

const sanitizeMessage = (msg: string): string =>
  msg.trim().replace(/"/g, '\\"').replace(/`/g, "\\`");

const validateMessage = (msg: string): string | null => {
  if (!msg.trim()) return "Commit message cannot be empty.";
  if (msg.trim().length < 5)
    return "Commit message too short. Min 5 characters.";
  if (msg.trim().length > 300)
    return "Commit message too long. Max 100 characters.";
  return null;
};

const main = async (): Promise<void> => {
  log.bold("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log.bold("         EcoSpark Git Push Tool        ");
  log.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Check if inside a git repo
    await run("git rev-parse --is-inside-work-tree");

    // Get current branch
    const branch = await getCurrentBranch();
    log.info(`Current branch: ${COLORS.yellow}${branch}${COLORS.reset}`);

    // Warn if pushing to main/master
    if (branch === "main" || branch === "master") {
      log.warn(`You are pushing directly to "${branch}" branch!`);
      const confirm = await question(
        `${COLORS.yellow}  Continue? (y/n): ${COLORS.reset}`,
      );
      if (confirm.toLowerCase() !== "y") {
        log.info("Push cancelled.");
        rl.close();
        return;
      }
    }

    // Get commit message
    const rawMessage = await question(
      `${COLORS.cyan}  Enter commit message: ${COLORS.reset}`,
    );

    // Validate
    const validationError = validateMessage(rawMessage);
    if (validationError) {
      log.error(validationError);
      rl.close();
      process.exit(1);
    }

    const commitMessage = sanitizeMessage(rawMessage);

    console.log("");
    log.info("Running: git add .");
    await run("git add .");
    log.success("Staged all changes.");

    log.info(`Running: git commit -m "${commitMessage}"`);
    const { stdout: commitOut } = await run(`git commit -m "${commitMessage}"`);
    if (commitOut) log.success(commitOut);

    log.info(`Running: git push origin ${branch}`);
    const { stderr: pushErr } = await run(`git push origin ${branch}`);
    if (pushErr) log.warn(pushErr); // git push info goes to stderr normally

    console.log("");
    log.success("All done! Changes pushed successfully.");
    log.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.log("");
    if (error instanceof Error) {
      log.error(`Git operation failed: ${error.message}`);
    } else {
      log.error("An unexpected error occurred.");
    }
    rl.close();
    process.exit(1);
  }

  rl.close();
};

main();
