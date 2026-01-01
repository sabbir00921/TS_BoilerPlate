import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import CustomError from './../helpers/CustomError';
import config from '../config';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  refreshToken: string | null;
  forgetPasswordOtp: number | null;
  frogetPasswordOtpExpire: Date | null;
  comparePassword: (password: string) => Promise<boolean>;
  createAccessToken: () => string;
  createRefreshToken: () => string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    forgetPasswordOtp: {
      type: Number,
    },
    frogetPasswordOtpExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

//
userSchema.pre<IUser>('save', async function () {
  const userModel = this.constructor as Model<IUser>;
  const existingUser = await userModel.findOne({
    email: this.email,
  });

  if (existingUser && existingUser._id.toString() !== this._id.toString()) {
    throw new CustomError(409, 'Email already exists');
  }
});

// encrypt password in pre middleware
userSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// compare password
userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

//create access token
userSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { userId: this._id },
    config.jwt.accessTokenSecret as string,
    {
      expiresIn: config.jwt.accessTokenExpires as any,
    },
  );
};

//create refresh token
userSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { userId: this._id },
    config.jwt.refreshTokenSecret as string,
    {
      expiresIn: config.jwt.refreshTokenExpires as any,
    },
  );
};

//verify access token
userSchema.methods.verifyAccessToken = function (token: string) {
  return jwt.verify(token, config.jwt.accessTokenSecret as string);
};

//verify refresh token
userSchema.methods.verifyRefreshToken = function (token: string) {
  return jwt.verify(token, config.jwt.refreshTokenSecret as string);
};

export const userModel: Model<IUser> = mongoose.model<IUser>(
  'User',
  userSchema,
);
