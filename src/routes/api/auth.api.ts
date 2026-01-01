import express from 'express';
import {
  forgetPassword,
  login,
  logout,
  registration,
  resetPassword,
} from '../../controller/user.controller';

const router = express.Router();

router.route('/register').post(registration);
router.route('/login').post(login);
router.route('/logout').post(logout);
router.route('/forget-password').post(forgetPassword);
router.route('/reset-password').post(resetPassword);

export default router;
