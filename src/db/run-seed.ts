import "dotenv/config";
import { seedDatabase } from "./seed";
import { pool } from "./index";

seedDatabase()
  .then(() => {
    console.log("Seed execution finished.");
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed execution failed:", err);
    pool.end();
    process.exit(1);
  });
