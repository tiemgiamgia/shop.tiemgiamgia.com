import { execSync } from "child_process";

console.log("🔥 Uploading KV...");

execSync(
  `wrangler kv:bulk put kv-data.json --binding=PRODUCTS`,
  { stdio: "inherit" }
);

console.log("✅ KV Upload Done");