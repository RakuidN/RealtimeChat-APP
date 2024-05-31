import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsersForSidebar, updateUserStatus } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.post('/status', protectRoute, updateUserStatus);

export default router;
