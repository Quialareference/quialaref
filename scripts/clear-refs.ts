import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { refs } from "../lib/db/schema";
import { like } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function clearSeedRefs() {
  const deleted = await db
    .delete(refs)
    .where(like(refs.mediaPublicId, "seed/%"))
    .returning({ title: refs.title });

  console.log(`✅ ${deleted.length} refs supprimées :`);
  deleted.forEach((r) => console.log(`  - ${r.title}`));
  await client.end();
}

clearSeedRefs().catch((err) => {
  console.error(err);
  process.exit(1);
});
