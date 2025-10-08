import { io } from 'socket.io-client';
const initializeSocket = (token, toast) => {
    const socket = io('http://localhost:3000', {
        auth: {
            token: token 
        },
    });
    socket.on('connect', () => {
        console.log('Socket Connected Successfully!');
        toast.info("Real-time connection established!", { autoClose: 1500 }); 
    });
    socket.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err.message); 
        toast.error(`Connection Failed: ${err.message}`);
    });
    socket.on('disconnect', (reason) => {
        console.log('Socket Disconnected:', reason);
        toast.warn(`You are offline. Reason: ${reason}`, { toastId: 'disconnect-warn', autoClose: false });
    });
    socket.on('getOnlineUsers', (userIds) => {
        console.log('Online Users:', userIds);
    });
    return socket;
};

export default initializeSocket;