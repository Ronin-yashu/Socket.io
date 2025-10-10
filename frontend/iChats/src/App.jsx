import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import initializeSocket from './socket';
import { Shield, Lock, Send, Search, Menu, X, MoreVertical, Phone, Video, Image, Paperclip, Smile, CheckCheck } from 'lucide-react';

const App = () => {
  const navigate = useNavigate();
  const messageFeedRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [onlineUserProfiles, setOnlineUserProfiles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchUserDetails = async (userIds) => {
    if (userIds.length === 0) {
      setOnlineUserProfiles([]);
      return;
    }

    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('/api/users/lookup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds: userIds })
      });

      if (response.ok) {
        const profiles = await response.json();
        setOnlineUserProfiles(profiles);
      } else if (response.status === 401) {
        localStorage.removeItem('authToken');
        toast.error('Session expired during user lookup. Please log in again.');
        setTimeout(() => navigate('/'), 2000);
      } else {
        toast.error('Failed to load contact list.');
      }
    } catch (error) {
      toast.error('Network error: Could not connect to the server for user details.');
    }
  };

  // EFFECT 1: Connects to the server, verifies JWT, and handles socket creation/cleanup.
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');

    if (!token) {
      return navigate('/');
    }

    let currentSocket = null;

    const verifyAndConnect = async () => {
      try {
        const response = await fetch('/api/Home', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();

          setCurrentUser({
            username: username,
            id: userId,
            message: data.message
          });

          const newSocket = initializeSocket(token, toast);
          currentSocket = newSocket;
          setSocket(newSocket);

          newSocket.on('getOnlineUsers', (userIds) => {
            setOnlineUserIds(userIds);
          });
        } else if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('username');
          localStorage.removeItem('userId');
          toast.error('Session expired. Please log in again.');
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (error) {
        toast.error('Network error: Could not connect to the server.');
      }
    };

    verifyAndConnect();

    return () => {
      if (currentSocket) {
        console.log('Home component unmounted. Disconnecting socket.');
        currentSocket.disconnect();
        currentSocket.off('getOnlineUsers');
        currentSocket.off('receiveMessage');
        toast.dismiss('disconnect-warn');
      }
    };
  }, [navigate]);

  // NEW EFFECT: Handle Socket Message Listeners (Decoupled from connection)
  useEffect(() => {
    if (socket) {
      const userId = localStorage.getItem('userId');

      const handleReceiveMessage = (message) => {
        console.log('Message received:', message);
        console.log('Current userId:', userId);
        console.log('Selected contact:', selectedContact);

        // Convert all IDs to strings for reliable comparison
        const messageSenderId = String(message.senderId);
        const messageRecipientId = String(message.recipientId);
        const currentUserId = String(userId);
        const selectedContactId = selectedContact ? String(selectedContact._id) : null;

        const isMessageFromSelected = messageSenderId === selectedContactId;
        const isMessageToSelected = messageRecipientId === selectedContactId;
        const isSelfSender = messageSenderId === currentUserId;

        console.log('isSelfSender:', isSelfSender);
        console.log('isMessageToSelected:', isMessageToSelected);
        console.log('isMessageFromSelected:', isMessageFromSelected);

        // Show message if:
        // 1. I sent it to the selected contact
        // 2. The selected contact sent it to me
        if (
          (isSelfSender && isMessageToSelected) ||
          (isMessageFromSelected && messageRecipientId === currentUserId)
        ) {
          console.log('✅ Adding message to chat');
          setMessages(prevMessages => [...prevMessages, message]);
        } else if (messageRecipientId === currentUserId && !isSelfSender) {
          console.log('📬 New message from another user');
          toast.info(`New message from ${message.senderUsername || 'a user'}!`);
        } else {
          console.log('❌ Message not for current conversation');
        }
      };

      socket.on('receiveMessage', handleReceiveMessage);

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
      };
    }
  }, [socket, selectedContact]);

  // EFFECT 2: Triggers user profile lookup whenever the list of online IDs changes
  useEffect(() => {
    fetchUserDetails(onlineUserIds);
  }, [onlineUserIds]);

  // EFFECT 3: Auto-scroll messages
  useEffect(() => {
    if (messageFeedRef.current) {
      messageFeedRef.current.scrollTop = messageFeedRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setMessages([]); // Clear messages for new contact
  };

  const handleSendMessage = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Debug logging
    console.log('=== SEND MESSAGE DEBUG ===');
    console.log('Socket:', socket);
    console.log('Socket connected:', socket?.connected);
    console.log('Input message:', inputMessage);
    console.log('Selected contact:', selectedContact);
    console.log('Current user:', currentUser);
    console.log('========================');

    if (!socket) {
      toast.error("Socket not connected!");
      return;
    }

    if (!socket.connected) {
      toast.error("Socket is disconnected. Please refresh the page.");
      return;
    }

    if (!inputMessage.trim()) {
      toast.warn("Please type a message first.");
      return;
    }

    if (!selectedContact) {
      toast.warn("Please select a contact first.");
      return;
    }

    if (!currentUser?.id) {
      toast.error("User session not initialized. Please log in again.");
      return;
    }

    const messagePayload = {
      recipientId: selectedContact._id,
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    console.log('📤 Sending message payload:', messagePayload);

    // EMIT THE MESSAGE TO THE SERVER
    socket.emit('sendMessage', messagePayload);

    setInputMessage(''); // Clear the input field
  };

  const MessageBubble = ({ message, senderUsername }) => {
    const isSelf = String(message.senderId) === String(currentUser?.id);
    const senderName = isSelf ? 'You' : senderUsername;

    return (
      <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-4 animate-slideIn`}>
        <div className={`flex ${isSelf ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[70%] gap-2`}>
          {!isSelf && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {senderUsername.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
            <div className={`px-4 py-2 rounded-2xl ${isSelf
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none'
                : 'bg-gray-800 text-gray-100 rounded-bl-none'
              } shadow-lg backdrop-blur-sm`}>
              {!isSelf && <p className="text-xs font-semibold mb-1 text-purple-300">{senderName}</p>}
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
            <div className="flex items-center gap-1 mt-1 px-2">
              <span className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isSelf && (
                <CheckCheck className="w-3 h-3 text-blue-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex antialiased text-gray-100 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="flex-1 flex relative z-10">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out flex-shrink-0 bg-gray-900/50 backdrop-blur-xl border-r border-gray-800/50 flex flex-col overflow-hidden`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-800/50 bg-gray-900/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">iChats</h2>
                  {currentUser && (
                    <span className="text-xs text-gray-400">{currentUser.username}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-800/50 border border-gray-700/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Online Users */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Online Users</h3>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">{onlineUserProfiles.length}</span>
            </div>

            {onlineUserProfiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-800/50 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-gray-600" />
                </div>
                No other users online
              </div>
            ) : (
              onlineUserProfiles.map(user => (
                <div
                  key={user._id}
                  onClick={() => handleSelectContact(user)}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group ${selectedContact && selectedContact._id === user._id
                      ? 'bg-indigo-500/20 border border-indigo-500/30'
                      : 'hover:bg-gray-800/50'
                    }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">Online • Tap to chat</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Security Badge */}
          <div className="p-4 border-t border-gray-800/50 bg-gray-900/30">
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-2 rounded-lg">
              <Lock className="w-4 h-4" />
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-900/30 backdrop-blur-sm">
          {/* Chat Header */}
          <header className="h-16 border-b border-gray-800/50 px-6 flex items-center justify-between bg-gray-900/50 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {selectedContact ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {selectedContact.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></span>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{selectedContact.username}</h2>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    iChats Welcome
                  </h2>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedContact && (
                <>
                  <button className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </>
              )}
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${socket && socket.connected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
                }`}>
                {socket && socket.connected ? '● Connected' : '● Offline'}
              </div>
            </div>
          </header>

          {/* Messages Area */}
          <div ref={messageFeedRef} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {!selectedContact ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center backdrop-blur-sm border border-indigo-500/20">
                  <Shield className="w-16 h-16 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Security & Freedom
                </h3>
                <p className="text-gray-400 max-w-md">
                  Select a user from the sidebar to start a secure, end-to-end encrypted conversation.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span>Your messages are protected with military-grade encryption</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Send className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-gray-400">
                  No messages yet. Start the conversation with {selectedContact.username}!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={index}
                    message={message}
                    senderUsername={
                      message.senderId === currentUser?.id ? currentUser.username : selectedContact.username
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Input Area */}
          {selectedContact && (
            <footer className="border-t border-gray-800/50 p-4 bg-gray-900/50 backdrop-blur-xl">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <div className="flex gap-2">
                  <button type="button" className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors text-gray-400 hover:text-white">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors text-gray-400 hover:text-white">
                    <Image className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`Message ${selectedContact.username}...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    className="w-full bg-gray-800/50 text-gray-200 px-4 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-gray-700/50 transition-all"
                  />
                  <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>

                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!inputMessage.trim()}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </footer>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="dark" />

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 10px) scale(1.05);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-blob {
          animation: blob 20s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}} />
    </div>
  );
};

export default App;