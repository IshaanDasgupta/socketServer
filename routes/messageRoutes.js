const express = require('express');
const { createMessage, fetchMessageOfChat } = require('../controller/messageController');

const router = express.Router();

router.post('/' , createMessage);
router.get('/:chatID' , fetchMessageOfChat);

module.exports = router;