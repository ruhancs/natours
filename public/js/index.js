import '@babel/polyfill';//para navegadores antigos
import { displayMap } from './mapbox';
import { login } from './login';
import { updateSettings } from './updateSettings';
import { logout } from './login';
import { bookTour } from './stripe';

// DOM ELEMENTS
const mapBox = document.getElementById('map')
const loginForm = document.querySelector('.form--login')
const updateDataForm = document.querySelector('.form-user-data')
const updatePasswordForm = document.querySelector('.form-user-password')
const logOutBtn = document.querySelector('.nav__el--logout')//botao do logout 
const bookBtn = document.getElementById('book-tour')//botao em tour.pug para o checkout

if(mapBox){
    // para pegar os dados de tour.locations inseridos no id map no tour.pug
    const locations = JSON.parse( mapBox.dataset.locations)
    
    displayMap(locations)
}

if(loginForm){
    // pegar os dados do usuario e delegar a açao
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        login(email,password)
    })   
}

if(updateDataForm) {
    updateDataForm.addEventListener('submit', e => {
        e.preventDefault();
        // criar formulario
        const form = new FormData();
        form.append('name',document.getElementById('name').value)
        form.append('email',document.getElementById('email').value)
        form.append('photo',document.getElementById('photo').files[0])

        updateSettings(form,'data')
    })
}

if(updatePasswordForm){
    updatePasswordForm.addEventListener('submit',async e => {
        e.preventDefault();
        document.querySelector('.btn--save--password').textContent = 'Updating...'
        const passwordCurrent = document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('password-confirm').value
        await updateSettings({passwordCurrent,password,passwordConfirm},'password')
        document.querySelector('.btn--save--password').textContent = 'Save password'

        document.getElementById('password-current').value=''
        document.getElementById('password').value=''
        document.getElementById('password-confirm').value=''
    })
}

if (logOutBtn){
    logOutBtn.addEventListener('click',logout);
}

if(bookBtn)
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
// pegar o id da tour armazenado no botao em tour.pug no atributo: data-tour-id=`${tour.id}`
        const tourId = e.target.dataset.tourId; //id da tour
        bookTour(tourId);
    })