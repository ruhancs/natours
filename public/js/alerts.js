
export const hideAlert = () => {
    // para visualizar os alertas
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
}

// type is 'success' or 'error'
export const showAlert = (type,msg) => {
    hideAlert();// habilita o alerta
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    // inseri a div de alerta logo no inicio do body
    document.querySelector('body').insertAdjacentHTML('afterbegin',markup);
    window.setTimeout(hideAlert,5000);// desabilita o alerta
};