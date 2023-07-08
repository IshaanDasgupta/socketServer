const express = require('express');
const { registerUser, loginUser, fetchUser, updateUser, deleteUser, logoutUser , fetchProfile, fetchUserByEmail } = require('../controller/userController');
const { verifyToken } = require('../utils/verification');

const router = express.Router();

router.post('/register' , registerUser);
router.post('/login' , loginUser);
router.post('/logout' , verifyToken , logoutUser);
router.post('/fetchUserByEmail' , fetchUserByEmail);
router.get('/:id' , fetchUser);
router.get('/profile' , verifyToken , fetchProfile);
router.put('/' , verifyToken , updateUser);
router.delete('/', verifyToken , deleteUser);

module.exports = router;