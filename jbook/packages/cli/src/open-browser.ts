import { spawn } from "child_process";

// Best-effort: if the platform launcher is missing or fails, the URL is
// already printed in the terminal, so errors are deliberately swallowed.
export const openBrowser = (url: string) => {
  let cmd: string;
  let args: string[];

  if (process.platform === "darwin") {
    cmd = "open";
    args = [url];
  } else if (process.platform === "win32") {
    // The empty string is the window title `start` expects as its first
    // quoted argument; without it the URL would be consumed as the title.
    cmd = "cmd";
    args = ["/c", "start", "", url];
  } else {
    cmd = "xdg-open";
    args = [url];
  }

  spawn(cmd, args, { stdio: "ignore", detached: true })
    .on("error", () => {})
    .unref();
};
