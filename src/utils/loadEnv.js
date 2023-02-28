import * as dotenv from "dotenv";
import * as path from "path";
function loadEnv() {
  const pathOfEnv = path.resolve(
    process.cwd(),
    process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env.production"
  );
  console.log("pathOfEnv: ", pathOfEnv);
  dotenv.config({ path: pathOfEnv });
}
export default loadEnv;
