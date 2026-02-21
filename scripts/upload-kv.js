import { execSync } from "child_process";

console.log("🔥 Uploading KV...");

execSync(
  `wrangler kv:bulk put --namespace-id=ab8b34413f26438bbe2122a4d128927b kv-data.json`,
  { stdio: "inherit" }
);

console.log("✅ KV Upload Done");