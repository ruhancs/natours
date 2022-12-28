const Tour = require('./../models/tourModel')
const Booking = require('./../models/bookingModel')
const User = require('./../models/userModel')
const Review = require('./../models/reviewModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')

exports.getOverview =catchAsync(async (req,res,next) => {
  // Get tour data from collection
  const tours = await Tour.find()

  // build template

  res.status(200).render('overview', {
    title: 'All tours',
    tours: tours
  })
})

exports.getTour =catchAsync( async (req,res,next) => {
  const tour = await Tour.findOne({slug:req.params.slug}).populate({
      path:'reviews',
      fields: 'review rating user'
  })

  if(!tour) {
    return next(new AppError('There is no tour with that name'))
  }

  res.status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' http://127.0.0.1:3000/"
  )
    .render('tour', {
    title: `${tour.name} Tour`,
    tour:tour
    })
})

exports.getLoginForm = (req,res) => {
  res.status(200).render('login', {title:'Log into your account '})
}

exports.getAccount = (req,res) => {
  res.status(200).render('account',{
    title: 'Your account'
  });
}

exports.getMyTours = catchAsync(async(req,res,next) => {
  // Find all bookings
  const bookings = await Booking.find({ user:req.user.id })

  // find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour)
  // fazer a busca de todos ids de tour armazenado em toursIDs
  const tours = await Tour.find({ _id: { $in:tourIDs } })

  // utilizar o overview para mostrar as tours pagas do usuario
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  })
})

exports.updateUserData =catchAsync( async (req,res,next) => {
  const updateUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  },
  {
    new: true,
    runValidators:true
  })
  res.status(200).render('account',{
    title:'Your account',
    user: updateUser
  })
})

