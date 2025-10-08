import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import initializeSocket from './socket';

const App = () => {
  const navigate = useNavigate();
  const messageFeedRef = useRef(null); // Ref for auto-scrolling
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [onlineUserProfiles, setOnlineUserProfiles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);

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
    const userId = localStorage.getItem('userId'); // Assuming you save this on login

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

          // Assuming login response also returns ID, but setting default here
          setCurrentUser({
            username: username,
            id: userId, // CRITICAL: Ensure this ID is available
            message: data.message
          });

          const newSocket = initializeSocket(token, toast);
          currentSocket = newSocket;
          setSocket(newSocket);

          newSocket.on('getOnlineUsers', (userIds) => {
            setOnlineUserIds(userIds);
          });

          // 🛑 FIX 1: Message Listener - Add the message to state
          newSocket.on('receiveMessage', (message) => {
            console.log('Message received:', message);
            // Only add message if it belongs to the current chat
            const isRelevant = message.senderId === selectedContact?._id || message.recipientId === selectedContact?._id;

            if (isRelevant) {
              setMessages(prevMessages => [...prevMessages, message]);
            } else {
              // 🛑 FIX 2: Show notification for messages in other chats
              toast.info(`New message from ${message.senderUsername || 'a user'}!`);
            }
          });


        } else if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('username');
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
  }, [navigate, selectedContact]); // Added selectedContact to dependencies to handle message filter on new selection

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
    // Mocked Media Data
    const mockedContact = {
      ...contact,
      sharedMedia: [
        { id: 1, type: 'image', url: 'https://placehold.co/80x80/4F46E5/FFFFFF?text=PIC' },
        { id: 2, type: 'doc', url: 'https://placehold.co/80x80/000000/FFFFFF?text=DOC' },
      ]
    };
    setSelectedContact(mockedContact);
    setMessages([]); // Clear messages for new contact (placeholder)
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!socket || !inputMessage.trim() || !selectedContact) {
      return toast.warn("Cannot send message. Select a user and type a message.");
    }

    const messagePayload = {
      recipientId: selectedContact._id,
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      // senderId will be added by the server securely
    };

    // 💡 EMIT THE MESSAGE TO THE SERVER
    socket.emit('sendMessage', messagePayload);

    // 🛑 FIX 3: NO OPTIMISTIC UPDATE HERE! The message is added when the server echoes it back.

    setInputMessage(''); // Clear the input field
  };


  const MessageBubble = ({ message, senderUsername }) => {
    // 🛑 FIX 4: Use currentUser.username for comparison
    // The senderId is now coming from the server, which is better.
    const isSelf = message.senderId === currentUser?.id;

    // Use currentUser.username if it's the sender, otherwise use the selected user's name
    const senderName = isSelf ? 'You' : senderUsername;

    // 🛑 FIX 5: Adjust bubble color based on sender
    const bubbleColor = isSelf ? 'bg-indigo-600' : 'bg-zinc-700';
    const alignment = isSelf ? 'justify-end' : 'justify-start';

    return (
      <div className={`flex ${alignment}`}>
        <div className={`${bubbleColor} max-w-xs p-3 rounded-xl ${isSelf ? 'rounded-br-none' : 'rounded-tl-none'} shadow-md`}>
          <p className="text-xs font-semibold mb-1 text-gray-300">{senderName}</p>
          <p className="text-sm text-white">{message.content}</p>
          <span className="text-xs text-gray-400 block text-right mt-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };


  return (
    <div className="h-screen box-border flex antialiased text-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex h-full">

          {/* COLUMN 1: Sidebar - Contacts */}
          <div id="sidebar-users" className="w-1/4 flex-shrink-0 border-r border-zinc-700 bg-zinc-900 lg:block hidden">
            <header className="flex flex-col items-start p-4 border-b border-zinc-700">
              <h2 className="text-xl font-semibold mb-1">iChats</h2>
              {currentUser && (
                <span className="text-xs text-gray-400">Logged in as: {currentUser.username}</span>
              )}
            </header>
            <div className="p-2 border-b border-zinc-700">
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase">Online Users ({onlineUserProfiles.length})</h3>
              <div className="overflow-y-auto h-[calc(100vh-170px)] space-y-1">

                {onlineUserProfiles.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No other users online right now.</p>
                ) : (
                  onlineUserProfiles.map(user => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectContact(user)}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition duration-150 ease-in-out ${selectedContact && selectedContact._id === user._id ? 'bg-indigo-600/50' : 'hover:bg-zinc-700'}`}
                    >
                      <div className="relative">
                        <img
                          src={`https://placehold.co/40x40/4F46E5/FFFFFF?text=${user.username.charAt(0).toUpperCase()}`}
                          onError={(e) => e.target.src = 'https://placehold.co/40x40/4F46E5/FFFFFF?text=?'}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="w-3 h-3 rounded-full absolute right-0 bottom-0 bg-green-500 border-2 border-zinc-900"></span>
                      </div>
                      <div className="ml-3 truncate">
                        <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                        <p className="text-xs text-gray-400 truncate">Tap to start chat...</p>
                      </div>
                    </div>
                  ))
                )}

              </div>
            </div>
          </div>

          {/* COLUMN 2: Main Chat Window */}
          <div id="main-chat" className="w-full flex-1 flex flex-col bg-zinc-800">
            {/* Header: Chat Info */}
            <header className="flex items-center h-16 border-b border-zinc-700 p-4 justify-between">
              <div className="flex items-center">
                <h2 className="font-bold text-xl">{selectedContact ? selectedContact.username : 'iChats Welcome'}</h2>
                {selectedContact && (
                  <span className="ml-3 text-sm text-green-400">
                    <span className="dot h-2 w-2 bg-green-500 rounded-full inline-block mr-1"></span> Online
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400">
                {socket && socket.connected ? (
                  <span className="text-green-400">Socket Connected</span>
                ) : (
                  <span className="text-red-400">Connection Down</span>
                )}
              </div>
            </header>

            {/* Message Feed */}
            <div ref={messageFeedRef} id="message-feed" className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4">
              {!selectedContact ? (
                <div className="text-center text-gray-400 text-lg m-auto">
                  Select a user from the left sidebar to start a secure chat.
                </div>
              ) : (
                messages.map((message, index) => (
                  <MessageBubble
                    key={index}
                    message={message}
                    senderUsername={
                      // Determine who the message is from for the bubble header
                      message.senderId === currentUser?.id ? currentUser.username : selectedContact.username
                    }
                  />
                ))
              )}
            </div>

            {/* Input/Footer */}
            {selectedContact && (
              <footer className="h-16 p-4 border-t border-zinc-700 flex items-center">
                <input
                  type="text"
                  placeholder={`Message ${selectedContact.username}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage(e);
                  }}
                  className="flex-1 bg-zinc-700 text-gray-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </footer>
            )}
          </div>

          {/* COLUMN 3: Right Panel - Details */}
          <div id="sidebar-details" className={`w-1/5 flex-shrink-0 border-l border-zinc-700 bg-zinc-900 hidden lg:block`}>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase">Security Status</h3>
              <div className="bg-green-900/40 p-4 rounded-xl border border-green-600 flex items-center justify-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-lock text-green-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span className="text-green-400 font-semibold">End-to-End Encrypted</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">All messages are protected by secure hashing protocols.</p>

              <h3 className="text-sm font-medium text-gray-400 my-4 pt-4 border-t border-zinc-700 uppercase">Shared Media</h3>

              {selectedContact ? (
                selectedContact.sharedMedia.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedContact.sharedMedia.map(media => (
                      <img
                        key={media.id}
                        src={media.url}
                        className="w-full h-auto object-cover rounded"
                        alt={media.type}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    No media files shared with {selectedContact.username}.
                  </p>
                )
              ) : (
                <p className="text-gray-500 text-sm italic">
                  Shared media will appear after you select a contact and start chatting.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
    </div>
  );
};

export default App;
