import { whopApi } from "../whop-api-init";

const userDetails = await whopApi.PublicUser({ userId: "user_nrxHyu5XRFjkS" });

console.log(userDetails);
