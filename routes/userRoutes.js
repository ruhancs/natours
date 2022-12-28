const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController')
const reviewController = require('./../controllers/reviewController')

const router = express.Router();

router.post('/signup',authController.signup)//cria o suario
router.post('/login',authController.login)
router.get('/logout',authController.logout)

router.post('/forgotPassword',authController.forgotPassword)
router.patch('/resetPassword/:token',authController.resetPassword)

router.use(authController.protect)//para proteger todas rotas abaixo par somente logado acessar

router.patch('/updateMyPassword', authController.updatePassword)

router.get('/me',userController.getMe,userController.getUser)
// 'photo' e o nome do campo que ira armazenar a foto no form, inseri informaçoes do file no req 
router.patch('/updateMe',userController.uploadUserPhoto,userController.resizeUserPhoto, userController.updateMe)
router.delete('/deleteMe', userController.deletMe)

router.use(authController.restrictTo('admin'))

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);



module.exports = router;
