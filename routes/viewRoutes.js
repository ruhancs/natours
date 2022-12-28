const express = require('express');
const viewController = require('./../controllers/viewController')
const authController = require('./../controllers/authController')
const bookingController = require('./../controllers/bookingController')

const router = express.Router()
  
// verificar em todas rotas se o usuario esta logado
// router.use(authController.isLoggedIn)

// bookingController.createBookingCheckout para verificar se foi realizado pagamento se nao foi passa para proxima middleware
router.get('/',
    bookingController.createBookingCheckout,
    authController.isLoggedIn,
    viewController.getOverview
    )
router.get('/tour/:slug',authController.isLoggedIn,viewController.getTour)
router.get('/login',authController.isLoggedIn, viewController.getLoginForm)
router.get('/me',authController.protect, viewController.getAccount)
router.get('/my-tours',authController.protect, viewController.getMyTours)

router.post('/submit-user-data',authController.protect,viewController.updateUserData)

module.exports = router

