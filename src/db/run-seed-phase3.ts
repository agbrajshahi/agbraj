import "dotenv/config";
import { seedPhase3 } from "./seed-phase3";
import { pool } from "./index";

seedPhase3()
  .then(() => {
    console.log("Phase 3 seed execution finished.");
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Phase 3 seed execution failed:", err);
    pool.end();
    process.exit(1);
  });
