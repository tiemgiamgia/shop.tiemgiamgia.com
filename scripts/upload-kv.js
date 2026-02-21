import { execSync } from "child_process";

console.log("🔥 Uploading KV...");

execSync(
  `wrangler kv:bulk put --binding=PRODUCTS kv-data.json`,
  { stdio: "inherit" }
);

console.log("✅ KV Upload Done");