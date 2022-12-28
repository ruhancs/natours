import axios from 'axios'
import {showAlert} from './alerts'

// exporta para o index.js
export const login =async (email,password) => {

    try {
        // necessita do axios cdn no base.pug ou a biblioteca instalada
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/users/login',
            data: {
                email,
                password
            }
        })
        // se o usuario foi logado com sucesso
        if(res.data.status === 'success') {
            showAlert('success','Logged in successfuly');
            // apos o tempo carrega a home page
            window.setTimeout(()=>{
                location.assign('/');
            },1500);
        }
    } catch(err){
        showAlert('error',err.response.data.message)
    }   
}

export const logout =async () => {
    console.log('logout')
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://localhost:3000/api/v1/users/logout'
        })
        // recarregar a pagina com o token invalido caso o logout ocorra com sucesso
        if(res.data.status === 'success') location.reload(true)
    } catch(err) {
        showAlert('error', 'Error logging out, try again')
    }
}
