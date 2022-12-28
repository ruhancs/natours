const multer = require('multer')//para fazer uploads de imagem
const sharp = require('sharp')// formatar a imagem
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

// para salvar a imagem no diretorio
// const multerStorage = multer.diskStorage({
//   // req=atual requisiçao, file= arquivo inserido, cb= equivale ao next
//   destination: (req,file,cb) => {
//     // primeiro argumeto e para err segundo e para destino da img
//     cb(null, 'public/img/users');
//   },
//   // nome que o file sera armazenado
//   filename: (req, file, cb) => {
//     // userID-timestamp-extenssao do arquivo
//     const ext = file.mimetype.split('/')[1]//extenssao do file
//     cb(null,`user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// });

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

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto =catchAsync( async (req,res,next) => {
  if(!req.file) return next()

  // criar o filename para quando a imagem e salva em memoria
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
  //carregar a imagem carregada da memoria e formatar
  await sharp(req.file.buffer)
    .resize(500,500)
    .toFormat('jpeg')
    .jpeg({ quality:90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
})

const filterObj= (obj, ...allowedFields) => {
  const newObj={}
  Object.keys(obj).forEach(el => {// cria um array com todas chaves do obj e percorre sobre ela 
    if(allowedFields.includes(el)) newObj[el]= obj[el];
  })
  return newObj;
}

exports.getMe = catchAsync( async(req,res,next) => {
  req.params.id = req.user.id
  next()
})

exports.updateMe=catchAsync(async(req,res,next) => {
  // req.file arquivo inserido

  //  create error if user POSTed password data
  if(req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password update. Use updateMyPassword',400))
  }
  // filtrar req.body para utilizar somente o parametros requeridos
  const filterBody = filterObj(req.body,'name', 'email')
  // se tiver atualizado a foto iseri a photo no filterBody
  if(req.file) filterBody.photo = req.file.filename
  // update user
  const upadateUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new:true,runValidators:true})
  

  res.status(200).json({
    status: 'success',
    data: {
      upadateUser
    }
  })
})

exports.deletMe = catchAsync( async(req,res,next) => {
  await User.findByIdAndUpdate(req.user.id,{active:false})

  res.status(204).json({
    status: 'success'
  })
})


exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};

exports.getAllUsers = factory.getAll(User)

exports.getUser = factory.getOne(User)

//  Do not update password with this
exports.updateUser = factory.updateOne(User)

exports.deleteUser = factory.deleteOne(User)