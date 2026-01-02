import express from "express";
import {
  forgetPassword,
  login,
  updateUser,
  logout,
  registration,
  resetPassword,
  generateAccessToken,verifyEmail
} from "../../controller/user.controller";
import { authGuard } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/multer.midleware";

const router = express.Router();

router.route("/register").post(registration);
router.route("/verify-email").post(authGuard,verifyEmail);
router.route("/login").post(login);
router
  .route("/update-user")
  .patch(
    authGuard,
    upload.fields([{ name: "image", maxCount: 1 }]),
    updateUser
  );
router.route("/logout").post(logout);
router.route("/forget-password").post(forgetPassword);
router.route("/reset-password").post(resetPassword);

//regenerate access token by using refresh token
router.route("/generate-access-token").post(generateAccessToken);

export default router;
