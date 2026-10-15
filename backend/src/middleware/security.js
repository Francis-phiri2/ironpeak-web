import jwt from 'jsonwebtoken';
export function authenticate(req,res,next){const token=req.headers.authorization?.replace(/^Bearer\s+/i,'');if(!token)return res.status(401).json({success:false,message:'Sign in required'});try{req.admin=jwt.verify(token,process.env.JWT_SECRET);next()}catch{return res.status(401).json({success:false,message:'Session is invalid or expired'})}}
export function validate(schema){return(req,res,next)=>{const result=schema.safeParse(req.body);if(!result.success)return res.status(422).json({success:false,message:'Please check the submitted fields',errors:result.error.flatten().fieldErrors});req.body=result.data;next()}}
export function asyncRoute(fn){return(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)}
