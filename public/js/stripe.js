import axios from 'axios';
import {showAlert} from './alerts'

// Stripe vem do tour.pug script(src="https://js.stripe.com/v3/")
const stripe = Stripe('pk_test_51M14TyGHL44D8tR4PW9EZajUqGreiYctTbmU7CesM0l79xOEt7laTjrTasJ3jBmoRCbePeYiHN8t5b97AYIqDbkq00Gr8OUMUJ')

export const bookTour =(async tourId => {
    try{
        // Get checkout session from endpoint /checkout-session/:tourId
        const session = await axios(
            `http://localhost:3000/api/v1/booking/checkout-session/${tourId}`
            )
            console.log(session)
    
        // Create checkout form + charge credit card 
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    }catch(err){
        console.log(err);
        showAlert('error', err)
    }
})