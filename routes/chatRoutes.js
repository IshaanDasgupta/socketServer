const express = require('express');
const { createChat, fetchChatForUser, fetchChat } = require('../controller/chatController');

const router = express.Router();

router.post('/' , createChat);
router.get('/:userID' , fetchChatForUser);
router.get('/:user1/:user2' , fetchChat);

module.exports = router;