import { accessor } from "./env-accessor-initial-config.js";

accessor.getOr("NODE_ENV", "DEV");
