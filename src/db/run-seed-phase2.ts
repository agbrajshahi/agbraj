import "dotenv/config";
import { seedPhase2 } from "./seed-phase2";
import { pool } from "./index";

seedPhase2()
  .then(() => {
    console.log("Phase 2 seed execution finished.");
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Phase 2 seed execution failed:", err);
    pool.end();
    process.exit(1);
  });
