// Must be the FIRST import in server.js. ES module imports execute before
// any other top-level code in the importing file, so route modules like
// authRoutes.js (which throws if JWT_SECRET is missing) were being loaded
// and executed before server.js's own dotenv.config() calls ever ran —
// the API process crashed on every single launch, silently, since
// dev-launch.js spawns it with stdio: 'ignore'.
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../Configs/.env') });
dotenv.config();
