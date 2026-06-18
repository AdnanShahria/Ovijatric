import { createClient } from "@libsql/client/web";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".dev.vars" });

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Missing TURSO credentials in .dev.vars");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  const sqlFile = path.join(process.cwd(), "drizzle", "0000_narrow_kronos.sql");
  const sqlContent = fs.readFileSync(sqlFile, "utf-8");

  const statements = sqlContent.split("--> statement-breakpoint").map(s => s.trim()).filter(s => s.length > 0);

  console.log(`Applying ${statements.length} statements...`);

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      console.log("Success:", stmt.substring(0, 50).replace(/\n/g, ' ') + "...");
    } catch (e: any) {
      if (e.message && e.message.includes("already exists")) {
        console.log("Already exists, skipping:", stmt.substring(0, 50).replace(/\n/g, ' ') + "...");
      } else {
        console.error("Error applying statement:", stmt);
        console.error(e);
        process.exit(1);
      }
    }
  }

  console.log("Migration completed successfully.");
}

main().catch(console.error);
