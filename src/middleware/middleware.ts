import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';

const secretKey = 'secret_Key';

export const authorize = (roles: string[]) => {
  console.log(1)
  return async (req: any, res: Response, next: NextFunction) => {
    console.log(2222)
    try {
      console.log(3333)
      const token = req.headers.token;
      console.log("token at middleware is :", token)
      if (!token) {
        return res.status(401).json({ message: "Authorization token missing 1" });
      }

      const decoded = jwt.verify(token, secretKey) as any;
      const user = await User.findById(decoded.userId);
      // console.log('user is :', user)
     if ((!user) || !roles.includes(user.role!)) { 
        return res.status(403).json({ message: "Access denied" });
      }

      req.user = user;
      next();
    } catch (error: any) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: `Authorization error: ${error.message}` });
    }
  };
};
