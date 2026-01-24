import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. Authorization header missing.' });
    }
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. Invalid token format.' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.id || !decoded.username) {
             return res.status(401).json({ message: 'Invalid token payload.' });
        }
        req.user = decoded; 
        next();
    } catch (ex) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
}
export default auth;