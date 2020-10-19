import L from 'leaflet';

// This file creates an object for the custom marker icon for the leaflet map. 
// In our case we use an svg file/src/assets/poi_icon.svg to create 
// the PoiIcon object for the map markers.
export const PoiIcon = L.icon({
  iconUrl: require('../assets/poi_icon.svg'),
  iconRetinaUrl: require('../assets/poi_icon.svg'),
  iconAnchor: null,
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  iconSize: [35, 35],
  className: 'leaflet-venue-icon'
});


export const ManIcon = L.icon({
  iconUrl: require('../assets/person-walking.png'),
  iconRetinaUrl: require('../assets/person-walking.png'),
  iconAnchor: null,
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  iconSize: [35, 35],
  className: 'leaflet-venue-icon'
});


// An alternative will be a self made icon, in which case we do not need to import L from 'leaflet'
// but we need to import { Icon } from "leaflet";
// and it will look like this:
// export const PoiIcon = new Icon({
//     iconUrl: "../assets/poi_icon.svg",
//     iconSize: [25, 25]
//   });