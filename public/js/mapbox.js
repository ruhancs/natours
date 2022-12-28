

export const displayMap = (locations) =>{
    mapboxgl.accessToken = 'pk.eyJ1IjoicnVoYW5jcyIsImEiOiJjbGMwdm9pcnIwMTRyNDJxdDh3c2FwdWc4In0.0wzwyddNelA3emiAmy76jw';
 
var map = new mapboxgl.Map({
    container: 'map',//mesmo id do elemento em tour que ira mostrar o mapa
    style: 'mapbox://styles/ruhancs/clc0x8jqs002514myn67oxuzl',
    scrollZoom: false // desativar o zoom pelo scroll
    // center: [-118.233933,34.032740],
    // zoom: 6
});

// area para ser mostrada no mapa
const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
    // criar elemento div para adicionar marcador
    const el = document.createElement('div');
    el.className = 'marker';

    // adiciona a marca
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
    //inserir o array da lat e lng da tour no mapbox para inserir a marca
    }).setLngLat(loc.coordinates).addTo(map)

    // add popup para identificar a localizaçao
    new mapboxgl.Popup({
        // 30px
        offset: 30
    }).setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map)

    // extends map bounds to include current locations
    bounds.extend(loc.coordinates)
});

map.fitBounds(bounds,{
    padding:{
        // padding para o mapa em px
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
    }
});
}

