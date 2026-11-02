import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

const ALLOWED_COMMAND_PREFIXES = [
  "python main.py",
  "python runSystem.py",
  "python -c",
  "python --version",
  "py main.py",
  "py runSystem.py",
  "py -c",
  "py --version",
  "cat ",
  "ls ",
  "sqlite3 ",
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const command = (body.command || "python main.py --demo").trim();

    // Verify command is reasonably safe
    const isAllowed = ALLOWED_COMMAND_PREFIXES.some((prefix) => command.startsWith(prefix)) ||
      command === "python" ||
      command === "py" ||
      command === "help";

    if (!isAllowed) {
      return NextResponse.json({
        ok: false,
        error: "Command not permitted in web terminal. Use 'python main.py --help', 'py main.py --receipt thermal', etc.",
      }, { status: 400 });
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 15000,
        env: {
          ...process.env,
          TERM: "xterm-256color",
          PYTHONUNBUFFERED: "1",
        },
      });

      return NextResponse.json({
        ok: true,
        command,
        stdout: stdout || "",
        stderr: stderr || "",
        exitCode: 0,
      });
    } catch (execError: any) {
      return NextResponse.json({
        ok: true,
        command,
        stdout: execError.stdout || "",
        stderr: execError.stderr || execError.message || "Command execution failed",
        exitCode: execError.code || 1,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
