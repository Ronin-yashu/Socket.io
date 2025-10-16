import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  senderUsername: { 
    type: String, 
    required: true 
  },
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['text', 'image', 'file'], 
    default: 'text' 
  },
  fileName: { 
    type: String, 
    default: null 
  },
  fileType: { 
    type: String, 
    default: null 
  },
  fileSize: { 
    type: Number, 
    default: null 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  delivered: { 
    type: Boolean, 
    default: false 
  },
  read: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ senderId: 1, recipientId: 1, timestamp: -1 });

export const Message = mongoose.model('Message', messageSchema);