// auth/router.ts
import { Router } from "express";
import login from "../auth/login";
import me from "../auth/me";
const r = Router();
r.post("/login", login);
r.post("/me", me);
export default r;
