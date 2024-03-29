const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');


exports.setTourUserIds = (req,res,next) => {
    if(!req.body.tour) req.body.tour= req.params.tourId
    // user vem da middleware authController.protect
    if(!req.body.user) req.body.user = req.user.id
    next()
} 

exports.getallReviews = factory.getAll(Review)

exports.getReview = factory.getOne(Review)

exports.createReview = factory.creatOne(Review)

exports.updateReview = factory.updateOne(Review)

exports.deleteReview = factory.deleteOne(Review)