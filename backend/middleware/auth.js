import jwt from "jsonwebtoken";
const jwt_secret = 'your_jwt_secret_key_which_is_very_secure_and_long';
const auth = (req,res,next)=>{
    const authHeader = req.headers('Authorization');
    if(!authHeader){
        return res.status(401).json({message:'Authorization header missing'});
    }
    const token = authHeader.replace('Bearer ','');
    try {
        const decoded = jwt.verify(token,jwt_secret);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(401).json({message:'Invalid or expired token'});
    }
}
export default auth;