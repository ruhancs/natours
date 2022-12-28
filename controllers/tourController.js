const multer = require('multer')//para fazer uploads de imagem
const sharp = require('sharp')// formatar a imagem
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// para salvar a imagem na memoria
const multerStorage = multer.memoryStorage()

// testar se o arquivo do upload e uma imagem
const multerFilter = (req,file, cb) => {
  if (file.mimetype.startsWith('image')){
    cb(null, true)
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false)
  }
}

// diretorio para adicionar as imagens, nao inseri no db 
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  // campos do database das imagens ,recebe 1 imagem em imageCover e 3 em image
  {name:'imageCover', maxCount:1},
  {name:'images', maxCount:3}
])

// para receber multiplas imagens em 1 campo do db
// upload.array('images',5)

exports.resizeTourImages =catchAsync( async (req,res,next) => {
  console.log(req.files)

  if(!req.files.imageCover || !req.files.images) {
    return next()
  }

  // Cover image
  const imagesCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000,1333)
    .toFormat('jpeg')
    .jpeg({ quality:90 })
    .toFile(`public/img/tours/${imagesCoverFilename}`);
  // inserir o nome da imageCover no req.body para utilizar no updateOne
  req.body.imageCover= imagesCoverFilename

  // Images
  req.body.images = []//criar o req.body.images para inserir as imagens
  await Promise.all(req.files.images.map(async(file,index) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`
    await sharp(file.buffer)
      .resize(2000,1333)
      .toFormat('jpeg')
      .jpeg({ quality:90 })
      .toFile(`public/img/tours/${filename}`);

    // inserir o nome das images no req.body para utilizar no updateOne
    req.body.images.push(filename)
  }))

  next()
})

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour)

exports.getTour = factory.getOne(Tour, { path: 'reviews'})

exports.createTour = factory.creatOne(Tour)

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour)

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit' url
// /tours-within/distance/233/center/34.032740, -118.233933/unit=mi
exports.getToursWithin = catchAsync( async (req,res,next) => {
  const { distance,latlng,unit } = req.params
  const [ lat,lng ]= latlng.split(',')

  // converssao da distancia para procura de milhas ou km para radius
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng',400))
  }

// $geoWithin para encontrar documentos ,  $centerSphere: [[lng, lat]] utiliza longitude latitude e o radius da busca
  const tours = await Tour.find({ 
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } 
  })
  
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
})

exports.getDistances = catchAsync(async (req,res,next) =>{
  const { latlng,unit } = req.params
  const [ lat,lng ]= latlng.split(',')

  // converter de metros para milhas ou km
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng',400))
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1 ]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier //para converter o valor do campo de distance em km
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  })
})