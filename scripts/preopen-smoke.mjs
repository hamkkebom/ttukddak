const baseUrl = process.env.PREOPEN_BASE_URL;

if (!baseUrl) {
  console.log("PREOPEN_BASE_URL is not set; skipping external smoke test.");
  process.exit(0);
}

const normalized = baseUrl.replace(/\/$/, "");
const homeRes = await fetch(normalized, { headers: { accept: "text/html" } });
if (!homeRes.ok) {
  console.error(`Home page smoke failed: ${homeRes.status} ${normalized}`);
  process.exit(1);
}

const healthUrl = `${normalized}/api/health`;
const res = await fetch(healthUrl, { headers: { accept: "application/json" } });
const body = await res.text();

if (!res.ok) {
  console.error(`Health check failed: ${res.status}`);
  console.error(body.slice(0, 1000));
  process.exit(1);
}

console.log(`Smoke passed: ${homeRes.status} ${normalized}, ${res.status} ${healthUrl}`);
