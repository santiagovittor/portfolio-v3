// scripts/spotify-token.ts — one-time OAuth: mint a long-lived refresh token.
// Run with: npm run spotify:token   (requires SPOTIFY_CLIENT_ID + SECRET in .env.local)
// Approve in the browser, paste the printed SPOTIFY_REFRESH_TOKEN into .env.local.
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// .env.local is not auto-loaded outside Next (matches scripts/embed.ts).
for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:8888/callback"; // Spotify bans localhost/plain-http; loopback IP is the allowed dev form
const SCOPE = "user-top-read user-read-currently-playing user-read-recently-played";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env.local.");
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    state,
  });

async function exchange(code: string): Promise<void> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const data = (await res.json()) as { refresh_token?: string; error_description?: string };
  if (!res.ok || !data.refresh_token) {
    throw new Error(data.error_description || `token exchange failed (${res.status})`);
  }
  console.log("\nSuccess. Paste this into .env.local:\n");
  console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}\n`);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", REDIRECT_URI);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }
  const respond = (msg: string) => {
    res.writeHead(200, { "Content-Type": "text/plain" }).end(msg);
  };
  try {
    if (url.searchParams.get("state") !== state) throw new Error("state mismatch");
    const err = url.searchParams.get("error");
    if (err) throw new Error(`authorization denied: ${err}`);
    const code = url.searchParams.get("code");
    if (!code) throw new Error("no code in callback");
    await exchange(code);
    respond("Refresh token minted. Check your terminal, then close this tab.");
  } catch (e) {
    console.error(`\nFailed: ${(e as Error).message}\n`);
    respond(`Failed: ${(e as Error).message}. Check the terminal.`);
  } finally {
    server.close();
    setTimeout(() => process.exit(0), 100);
  }
});

server.listen(8888, "127.0.0.1", () => {
  console.log("Open this URL, log in, and approve:\n");
  console.log(authUrl.toString() + "\n");
  console.log("Waiting for the callback on http://127.0.0.1:8888/callback ...");
});
