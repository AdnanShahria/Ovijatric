import { createClient } from "@libsql/client/web";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".dev.vars" });

async function main() {
  const url = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
  const dbClient = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  const sql = fs.readFileSync("drizzle/0001_safe_enchantress.sql", "utf-8");

  try {
    await dbClient.executeMultiple(sql);
    console.log("Migration applied successfully!");
  } catch (err) {
    if (err.message && err.message.includes("already exists")) {
       console.log("Table already exists, ignoring.");
    } else {
       console.error("Migration failed:", err);
    }
  }
}

main();
