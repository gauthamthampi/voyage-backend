// socket.js
import { Server as SocketIOServer } from 'socket.io';
import Message from '../models/message.js';
import User from '../models/users.js';

const socketManager = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    const updateUserStatus = async (email, online) => {
      await User.findOneAndUpdate(
        { email },
        { online, lastSeen: online ? Date.now() : null }
      );
      io.emit('updateUserStatus', { email, online }); // Notify all clients
    };

    socket.on('joinRoom', async (room) => {
      console.log(`Joining room: ${room}`);
      socket.join(room);

      const [senderEmail, receiverEmail] = room.split('-');
      const messages = await Message.find({
        $or: [
          { senderEmail, receiverEmail },
          { senderEmail: receiverEmail, receiverEmail: senderEmail },
        ],
      }).sort({ timestamp: 1 });

      await Message.updateMany(
        { receiverEmail: senderEmail, senderEmail: receiverEmail, read: false },
        { $set: { read: true } }
      );

      const sender = await User.findOne({ email: senderEmail });
      const receiver = await User.findOne({ email: receiverEmail });

      const defaultProfilePic = '/images/defaultdp.jpg';

      const formattedMessages = messages.map((msg) => ({
        sender: msg.senderEmail,
        receiver: msg.receiverEmail,
        text: msg.text,
        profilePic: msg.senderEmail === senderEmail ? (sender.profilePic || defaultProfilePic) : (receiver.profilePic || defaultProfilePic),
      }));

      socket.emit('previousMessages', formattedMessages);

      socket.emit('getPreviousChats', senderEmail);
    });

    socket.on('getUserDetails', async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        socket.emit('userDetails', {
          name: user.name,
          profilePic: user.profilePic || '/images/defaultdp.jpg',
          online: user.online,
          lastSeen: user.lastSeen,
        });
      }
    });

    socket.on('getPreviousChats', async (email) => {
      const userMessages = await Message.find({
        $or: [{ senderEmail: email }, { receiverEmail: email }],
      }).sort({ timestamp: -1 });

      const chatSummaries = {};

      for (const msg of userMessages) {
        const otherEmail = msg.senderEmail === email ? msg.receiverEmail : msg.senderEmail;
        if (!chatSummaries[otherEmail]) {
          const otherUser = await User.findOne({ email: otherEmail });
          chatSummaries[otherEmail] = {
            email: otherEmail,
            name: otherUser.name,
            profilePic: otherUser.profilePic || '/images/defaultdp.jpg',
            lastMessage: msg.text,
            newMessageCount: 0,
          };
        }
        if (!msg.read && msg.receiverEmail === email) {
          chatSummaries[otherEmail].newMessageCount += 1;
        }
      }

      const chatList = Object.values(chatSummaries);
      socket.emit('previousChats', chatList);
    });

    socket.on('chatMessage', async ({ room, senderEmail, message }) => {
      console.log(`Message received: ${message} from ${senderEmail} in room ${room}`);

      const [receiverEmail] = room.split('-').filter((email) => email !== senderEmail);
      const newMessage = new Message({ senderEmail, receiverEmail, text: message });
      await newMessage.save();

      const sender = await User.findOne({ email: senderEmail });

      const defaultProfilePic = '/images/defaultdp.jpg';

      io.to(room).emit('message', {
        sender: senderEmail,
        receiver: receiverEmail,
        text: message,
        profilePic: sender.profilePic || defaultProfilePic,
      });

      io.to(receiverEmail).emit('notifyNewMessage', {
        sender: senderEmail,
        message: message,
        timestamp: newMessage.timestamp,
      });

      io.emit('getPreviousChats', senderEmail);
    });

    socket.on('markMessagesAsRead', async ({ senderEmail, receiverEmail }) => {
      await Message.updateMany(
        { receiverEmail, senderEmail, read: false },
        { $set: { read: true } }
      );

      io.emit('getPreviousChats', senderEmail);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
      const email = socket.handshake.query.email;
      if (email) {
        updateUserStatus(email, false);
      }
    });

    socket.on('userOnline', async (email) => {
      await updateUserStatus(email, true);
    });

    socket.on('userOffline', async (email) => {
      await updateUserStatus(email, false);
    });
  });
};

export default socketManager;
