import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js"; // Import the User model
import { getReceiverSocketId, io } from "../socket/socket.js";
import axios from 'axios';

const LLM_API_URL = 'https://api.openai.com/v1/completions'; // replace with actual API

const mockApiResponse = (message) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ data: { response: `Automated response to: ${message}` } });
        }, 2000); // mock 2 seconds delay
    });
};

const sendAutomatedResponse = async (message) => {
    console.log('Sending automated response for message:', message); // Add log here
    try {
        const response = await Promise.race([
            axios.post(LLM_API_URL, { message }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
        ]);
        console.log('Automated response received:', response.data.response); // Add log here
        return response.data.response;
    } catch (error) {
        if (error.message === 'timeout') {
            return 'User is currently unavailable.';
        }
        console.error('Error in sendAutomatedResponse: ', error.message);
        return 'Error in generating response.';
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        const receiver = await User.findById(receiverId); // Ensure the User model is used correctly
        if (!receiver) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message,
        });

        if (receiver.status === 'BUSY') {
            console.log('Recipient is busy, sending automated response'); // Add log here
            const automatedResponse = await sendAutomatedResponse(message);
            const autoMessage = new Message({
                senderId: receiverId,
                receiverId: senderId,
                message: automatedResponse,
            });
            await autoMessage.save();
            io.to(getReceiverSocketId(senderId)).emit('newMessage', autoMessage);
        }

        conversation.messages.push(newMessage._id);

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        await Promise.all([conversation.save(), newMessage.save()]);

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] },
        }).populate("messages");

        if (!conversation) return res.status(200).json([]);

        const messages = conversation.messages;

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
