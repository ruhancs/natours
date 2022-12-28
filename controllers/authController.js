const crypto = require('crypto');
const { promisify } = require('util')//para utilizar jwt utilizar a promise ao verificar o token
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');//para nao precisar usar o try catch
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');


const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user,statusCode, res) => {
    const token = signToken(user._id)

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000 
        ),//expires em 90 dias convertido de ms
        httpOnly:true
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true
// criar cookie para salvar o token do usuario de forma mais segura
    res.cookie('jwt',token,cookieOptions)

    // remover a senha da saida
    user.password = undefined

    res.status(statusCode).json({
        status:'success',
        token,
        data: {
            user
        }
    })
}

exports.signup =catchAsync( async(req,res,next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    })
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url)
    console.log(newUser.email)
    await new Email(newUser,url).sendWelcome()
// cria token para o usuario cadastrado acessar os dados da api
    createSendToken(newUser,201, res) 

})

exports.login = catchAsync (async (req,res,next)=>{
    const { email, password } = req.body;

    if(!email || !password){//checa se foi inserido email e senha
        return next(new AppError('Please provide email and password',400))//envia o erro para a funçao globalError
    }

// procura o email no DB e inseri no resultado a senha 
    const user = await User.findOne({ email:email }).select('+password')

    if(!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password',401))
    }

    createSendToken(user,200, res)
})

exports.logout = (req,res)=>{
    res.clearCookie('jwt')
    res.status(200).json({status: 'success'})
}

exports.protect = catchAsync(async (req,res,next)=>{
// verificar se tem token na requisiçao, o header deve iniciar com 'Bearer' e depois o token
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) { //para pegar cookie vindo da pagina
        token = req.cookies.jwt
    }

    if(!token){
        return next(new AppError('You are not authorized please insert a token on headers',401))
    }
    
    // verificar se o token e valido
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    
    // verificar se o usuario existe
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('The user belonging to this user does no exist',401))
    }

    // verificar se o usuario mudou a senha
    if(currentUser.changePasswordAfter(decoded.iat)){//iat é o timestamp do token
        return next(new AppError('User recently changed password! Please log in again',401))
    }
    req.user = currentUser;
    // inserir nas templates o usuario
    res.locals.user = currentUser
    next()
});

// only for rendered pages verifica se o usuario esta logado
exports.isLoggedIn = catchAsync(async (req,res,next)=>{
    
    if (req.cookies.jwt) { //para pegar cookie vindo da pagina
          
    // verificar se o token e valido
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)
    
    // verificar se o usuario existe
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next()
    }

    // verificar se o usuario mudou a senha
    if(currentUser.changePasswordAfter(decoded.iat)){//iat é o timestamp do token
        return next()
    }
    // usuario esta logado
    // inserir nas templates o usuario
    res.locals.user = currentUser
    return next()
    }
    // usuario nao logado nao inseri o usuario nas templates
    next()
});


exports.restrictTo = (...roles) => {
    return (req,res,next) => {
        // roles ['admin', 'lead-guide']
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to this action',403))
        }
        next()
    }
}

exports.forgotPassword = catchAsync( async (req,res,next) => {
    // get user based on Posted email
    const user = await User.findOne({ email: req.body.email})
    if(!user){
        return next(new AppError('User not found',404))
    }

    // Generate the random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })//validateBeforeSave para desabilitar os validadores do DB

    
    try{
        // Send it to user's email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
        await new Email(user,resetURL).sendPasswordReset()
    
         res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
         })
     } catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false })

        return next(new AppError('There was an error sending the email. Try again later',500))
     }

})


exports.resetPassword =catchAsync(async (req,res, next) => {
    // Get the user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user =await User.findOne({passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()}})//se o toke estiver expirado nao retorn o user
    
    // If token has not expired, and there is user, set the new password
    if(!user) {
        return next(new AppError('Token is invalid or has expired',400))
    }
    
    // Update changedPasswodAt property for the user
    user.password= req.body.password
    user.passwordConfirm= req.body.passwordConfirm
    user.passwordResetToken= undefined
    user.passwordResetExpires= undefined
    await user.save()

    // log the user in, send JWT
    createSendToken(newUser,200, res)
})

exports.updatePassword = catchAsync(async (req,res,next) => {
    // Get user from collection
    const user = await User.findById(req.user.id).select('+password')

    // check if POSTed password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong',401))
    }
    // update password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()
    
    // log user in, send JWT
    createSendToken(user,200, res)
})