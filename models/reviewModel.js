const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty']
    },
    rating: {
        type: Number,
        min: [1,'Rating must be above 1.0'],
        max: [5,'Rating must be below 5.0']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true,'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true,'Review must belong to a user']
    },
    
},
{
    toJSON: { virtuals: true },//para criar um item calculado criado fora do schema
    toObject: { virtuals: true }
}
);

// para limitar o usuario para fazer 1 comentario por tour 
reviewSchema.index({ tour:1, user:1 }, { unique:true })

reviewSchema.pre(/^find/, function(next){

    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    //   })
      this.populate({
        path: 'user',
        select: 'name photo'
      });

    next()
})

reviewSchema.statics.calcAverageRatings = async function(tourId) {
   const stats = await this.aggregate([
        {
            $match : {tour:tourId}//encontra tour pelo id
        },
        {
            $group: {
                _id: '$tour',//agrupar os reviews por id da tour
                nRating: {$sum: 1},// conta os reviews da tour
                avRating:{$avg: '$rating'}//para calcular o rating
            }
        }
    ]);
    if(stats.length > 0){
        
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity:stats[0].nRating,
            ratingsAverage:stats[0].avRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity:0,
            ratingsAverage:4.5
        });
    }
};

// para calcular o rating ja com o novo review
reviewSchema.post('save', function(next){
    this.constructor.calcAverageRatings(this.tour)
})

// para atualizar ou deleter um review e recalcular o rating
reviewSchema.pre(/^findOneAnd/,async function(next){
    this.r = await this.findOne();//cria r na query com o documento da query para utilizar no post abaixo
    next()
})

reviewSchema.post(/^findOneAnd/,async function(next){
    await this.r.constructor.calcAverageRatings(this.r.tour)
})

const Review = mongoose.model('Review',reviewSchema);

module.exports = Review