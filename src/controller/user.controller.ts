import type { Request, Response } from 'express';
import { userModel } from './../models/user.model';
import ApiResponse from './../utils/apiResponse';
import CustomError from './../helpers/CustomError';
import { asyncHandler } from './../utils/asyncHandler';
import crypto from 'crypto';
import { mailer } from './../helpers/nodeMailer';
import { forgotPasswordOtpTemplate } from './../tempaletes/auth.templates';

//create user/register user
export const registration = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await userModel.create(req.body);
    ApiResponse.sendSuccess(res, 200, 'User registered successfully', user);
  },
);

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) throw new CustomError(400, 'Email or password invalid');

  const isMatch = await user.comparePassword(req.body.password);
  if (!isMatch) throw new CustomError(400, 'Email or password invalid');

  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'none',
  });

  ApiResponse.sendSuccess(res, 200, 'User logged in', {
    name: user.name,
    email: user.email,
    accesstoken: accessToken,
  });
});

//logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) throw new CustomError(400, 'Email or password invalid');

  // update database refresh field
  user.refreshToken = '';
  await user.save();

  // clear cookie
  res.clearCookie('refreshToken');
  ApiResponse.sendSuccess(res, 200, 'User logged out', {});
});

//forget password
export const forgetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) throw new CustomError(400, 'Email not found');

    // use crypto to generate otp
    const otp = crypto.randomInt(100000, 999999);

    // update database refresh field
    user.forgetPasswordOtp = otp;
    user.frogetPasswordOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // send email
    await mailer({
      subject: 'Password Reset OTP',
      template: forgotPasswordOtpTemplate(user.name, otp.toString()),
      email: user.email,
    });

    ApiResponse.sendSuccess(res, 200, 'Otp sent', {});
  },
);

//reset password
export const resetPassword = asyncHandler(
  async (
    req: Request<{}, {}, { otp: number; password: string; email: string }>,
    res: Response,
  ) => {
    const { otp, password, email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) throw new CustomError(400, 'Email not found');

    if (!user.forgetPasswordOtp) throw new CustomError(400, 'Otp not found');

    if ((user.frogetPasswordOtpExpire as any) < Date.now())
      throw new CustomError(400, 'Otp expired');

    if (user.forgetPasswordOtp !== otp)
      throw new CustomError(400, 'Invalid otp');

    // update database refresh field
    user.forgetPasswordOtp = null;
    user.frogetPasswordOtpExpire = null;
    user.password = password;
    await user.save();

    ApiResponse.sendSuccess(res, 200, 'Password reset successfully', {});
  },
);
