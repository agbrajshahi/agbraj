import "dotenv/config";
import { seedPhase4 } from "./seed-phase4";
import { pool } from "./index";
seedPhase4().then(() => { pool.end(); process.exit(0); }).catch((e) => { console.error(e); pool.end(); process.exit(1); });
