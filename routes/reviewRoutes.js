const express = require('express');
const reviewController = require('./../controllers/reviewController')
const authController = require('./../controllers/authController')

const router = express.Router({ mergeParams: true })

// mergeParams para enviar as rotas marcada para reviewRoutes para get ou post ('/')
// GET /tour/id25347/reviews 
// POST /reviews

router.use(authController.protect);

router
    .route('/')
    .get(reviewController.getallReviews)
    .post(authController.restrictTo('user'),reviewController.setTourUserIds,reviewController.createReview)

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user','admin'),reviewController.updateReview)
    .delete(authController.restrictTo('user','admin'),reviewController.deleteReview)

module.exports = router