import {Request,Response,NextFunction} from 'express'; import jwt from 'jsonwebtoken';
export interface AuthRequest extends Request{userId?:string}
export function auth(req:AuthRequest,res:Response,next:NextFunction){const h=req.headers.authorization;if(!h?.startsWith('Bearer '))return res.status(401).json({message:'Authentication required'});try{const p=jwt.verify(h.slice(7),process.env.JWT_SECRET||'dev-secret') as {id:string};req.userId=p.id;next()}catch{return res.status(401).json({message:'Invalid or expired token'})}}
