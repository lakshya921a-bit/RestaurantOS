import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    await requireUser(["OWNER", "MANAGER"]);
    const body = await req.json().catch(() => null);
    const appName = typeof body?.appName === "string" && body.appName.trim() ? body.appName.trim() : "RestaurantOS";
    const iconChoice = typeof body?.iconChoice === "string" ? body.iconChoice : "gold";

    const scriptPath = path.join(process.cwd(), "scripts", "customize-desktop-shortcut.ps1");

    const { stdout, stderr } = await execFileAsync("powershell", [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-AppName",
      appName,
      "-IconChoice",
      iconChoice
    ]);

    return NextResponse.json({
      success: true,
      appName,
      iconChoice,
      output: stdout,
      message: `Desktop shortcut successfully updated to "${appName}" with ${iconChoice} icon!`
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Failed to update desktop shortcut"
    }, { status: 500 });
  }
}
