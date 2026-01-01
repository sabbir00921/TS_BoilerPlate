import express from "express";
const router = express.Router();
import auth from "../routes/api/auth.api";



router.use("/auth", auth);

export default router;
