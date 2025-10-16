// Create a new file: hooks/useWebRTC.js

import { useRef, useState, useEffect } from 'react';

const useWebRTC = (socket, currentUser) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ICE servers for NAT traversal
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // Initialize peer connection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('iceCandidate', {
          to: incomingCall?.from || callType?.recipientId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    return pc;
  };

  // Start a call
  const startCall = async (recipientId, type) => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setCallType({ type, recipientId });
      setIsCallActive(true);

      peerConnection.current = createPeerConnection();

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit('callUser', {
        to: recipientId,
        callType: type
      });

      socket.emit('offer', {
        to: recipientId,
        offer: offer
      });

    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  // Answer a call
  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      const constraints = {
        audio: true,
        video: incomingCall.callType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setCallType({ type: incomingCall.callType, recipientId: incomingCall.from });
      setIsCallActive(true);

      peerConnection.current = createPeerConnection();

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      socket.emit('answerCall', {
        to: incomingCall.from,
        answer: true
      });

      setIncomingCall(null);

    } catch (error) {
      console.error('Error answering call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  // Reject a call
  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('rejectCall', { to: incomingCall.from });
      setIncomingCall(null);
    }
  };

  // End call
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    if (callType?.recipientId || incomingCall?.from) {
      socket.emit('endCall', {
        to: callType?.recipientId || incomingCall?.from
      });
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setCallType(null);
    setIncomingCall(null);
    peerConnection.current = null;
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming call
    socket.on('incomingCall', (data) => {
      setIncomingCall({
        from: data.from,
        fromUsername: data.fromUsername,
        callType: data.callType
      });
    });

    // Call answered
    socket.on('callAnswered', async (data) => {
      console.log('Call answered by', data.from);
    });

    // Call rejected
    socket.on('callRejected', () => {
      alert('Call was rejected');
      endCall();
    });

    // Call ended
    socket.on('callEnded', () => {
      endCall();
    });

    // WebRTC signaling
    socket.on('offer', async (data) => {
      if (!peerConnection.current) {
        peerConnection.current = createPeerConnection();
      }

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit('answer', {
        to: data.from,
        answer: answer
      });
    });

    socket.on('answer', async (data) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    });

    socket.on('iceCandidate', async (data) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    return () => {
      socket.off('incomingCall');
      socket.off('callAnswered');
      socket.off('callRejected');
      socket.off('callEnded');
      socket.off('offer');
      socket.off('answer');
      socket.off('iceCandidate');
    };
  }, [socket, incomingCall, callType]);

  // Update video refs when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return {
    localStream,
    remoteStream,
    isCallActive,
    callType,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    rejectCall,
    endCall
  };
};

export default useWebRTC;