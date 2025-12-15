import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';
import ScheduleInterview from './ScheduleInterview';

// API Base URL - use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatWindow = ({ applicationId, jobId, jobTitle, candidateName, candidateEmail, candidateId, recruiterId, recruiterName, companyName, onClose, userRole }) => {
  const { user } = useUserStore();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
    // Set up interval to poll for new messages (real-time alternative to WebSocket)
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [applicationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/messages/${applicationId}`);
      setMessages(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
  e.preventDefault();

  if (!inputValue.trim()) {
    toast.error('Please type a message');
    return;
  }

  setSending(true);
  try {
    if (!user || !user._id) {
      toast.error('User not logged in');
      return;
    }

    const messageData = {
      applicationId,
      jobId,

      senderId: user._id,
      senderName: user.name,
      senderRole: user.role === 'employee' ? 'candidate' : user.role.toLowerCase(), // Convert 'employee' to 'candidate'
      senderEmail: user.email,

      recipientId: userRole === 'recruiter' ? candidateId : recruiterId,
      recipientName: userRole === 'recruiter' ? candidateName : recruiterName,
      recipientEmail: userRole === 'recruiter' ? candidateEmail : user.email,

      content: inputValue,
      messageType: 'text'
    };

    console.log('📤 Message payload:', messageData);

    await axios.post(`${API_BASE_URL}/api/messages`, messageData, {
      withCredentials: true
    });

    setInputValue('');
    fetchMessages();
  } catch (err) {
    console.error('❌ Error sending message:', err.response?.data || err.message);
    toast.error('Failed to send message');
  } finally {
    setSending(false);
  }
};


  const handleScheduleInterview = async (interviewDetails) => {
    try {
      // Use user from Zustand store
      if (!user || !user._id) {
        toast.error('User not logged in');
        return;
      }

      await axios.post(`${API_BASE_URL}/api/interviews`, {
        ...interviewDetails,
        applicationId,
        jobId,
        jobTitle,
        recruiterId: user._id,
        recruiterName: user.name,
        recruiterEmail: user.email,
        candidateId: userRole === 'recruiter' ? candidateId : user._id,
        companyName,
        candidateEmail,
        candidateName
      });

      toast.success('Interview scheduled successfully!');
      setShowScheduleModal(false);

      // Send system message in chat
      await axios.post(`${API_BASE_URL}/api/messages`, {
        applicationId,
        jobId,
        senderId: user._id,
        senderName: user.name,
        senderRole: user.role,
        senderEmail: user.email,
        recipientId: userRole === 'recruiter' ? candidateId : recruiterId,
        recipientName: userRole === 'recruiter' ? candidateName : recruiterName,
        recipientEmail: userRole === 'recruiter' ? candidateEmail : recruiterName,
        content: `📅 Interview scheduled for ${interviewDetails.interviewDate} at ${interviewDetails.interviewTime}`,
        messageType: 'system'
      });

      fetchMessages();
    } catch (err) {
      console.error('Error scheduling interview:', err);
      toast.error('Failed to schedule interview');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl h-96 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Chat</h2>
            <p className="text-sm text-blue-100">{jobTitle} - {candidateName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 px-3 py-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 flex ${msg.messageType === 'system' ? 'justify-center' : msg.senderRole === 'recruiter' ? 'justify-start' : 'justify-end'}`}
              >
                {msg.messageType === 'system' ? (
                  <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg max-w-xs text-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.senderRole === 'recruiter' ? 'bg-blue-500 text-white rounded-bl-none' : 'bg-gray-300 text-gray-900 rounded-br-none'}`}>
                    <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                    <p>{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Buttons and Input */}
        {userRole === 'recruiter' && (
          <div className="px-4 py-2 border-b border-gray-200 bg-white">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
            >
              📅 Schedule Interview
            </button>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex gap-2">
          <input
            ref={messageInputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <ScheduleInterview
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleScheduleInterview}
          jobTitle={jobTitle}
        />
      )}
    </div>
  );
};

export default ChatWindow;
