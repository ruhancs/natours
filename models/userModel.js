const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
        
    },
    email: {
        type: String,
        required: [true, 'A user must have a email'],
        unique: true,
        lowercase: true,//transforma tudo para lowercase
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    password: {
        type: String,
        required: [true, 'A user must have a password'],
        minlength: 8,
        select: false //para nao mostrar a senha na saida
    },
    role: {
        type: String,
        default: "user"
    },
    passwordConfirm: {
        type: String,
        required: [true, 'the user must have confirm the password'],
        validate: {
            validator: function(el) {
                return el === this.password; //el=passwordConfirm, this.password=password
            },
            message: 'Password are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

// MIDDLEWARE PRE SAVE para encriptografar a senha antes de inserir no DB
userSchema.pre('save', async function(next){
    if(!this.isModified('password')){// se a senha nao foi modificada nao faz nada
        return next()
    }

    this.password = await bcrypt.hash(this.password, 12)//gerar a senha encriptografada para o DB
    this.passwordConfirm = undefined//nao precisa inserir o passwordConfirm ao DB
    next()
})

userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next()

    this.passwordChangedAt= Date.now() -1000
    next()
})

userSchema.pre(/^find/, function(next){
    this.find({active: {$ne: false}})
    next()
})

// comparar a senha digitada pelo usuario no login com a senha criptografada no DB
// essa funçao fica disponivel em qualquer lugar que utilizar o User DB
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changePasswordAfter =  function(JWTTimestamp) {
    if(this.passwordChangedAt) {
//timestamp em segundos do passwordChangedAt
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);

        return JWTTimestamp < changedTimestamp
    }
    return false
}

userSchema.methods.createPasswordResetToken = function() {
    // gerar token 32bytes e converte para string hexadecimal
    const resetToken = crypto.randomBytes(32).toString('hex');

    // encriptografar o token para inserir no DB
    this.passwordResetToken = crypto.createHash('sha256')
                                    .update(resetToken)
                                    .digest('hex');
    
    // expira em 10 minutos
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000
    console.log({resetToken}, this.passwordResetToken)

    return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User