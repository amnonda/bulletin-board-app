import React from 'react'
import { Marker, Tooltip } from 'react-leaflet';
import { PoiIcon } from './poi-icon';
import MarkerPopup from './MarkerPopup';

// Note: poi is short for PointOfInterest
function PoiMarkers(props) {
    // we get props (poi data) from the parent component MapView.js and save it in pois. 
    const { pois } = props;

    // We use the map function to create markers for each poi.
    const markers = pois.map((poi, index) => (
        // We pass the position and the icon props to each Marker component so it contains the 
        // custom marker icon and the latitude and longitude from poi.geometry.
        // Inside each marker, we pass poi to the data props of the MarkerPopup component.
        <Marker key={index} position={poi.geometry} icon={PoiIcon} >
            <Tooltip direction="right" offset={[0, 10]} opacity={1}>
                <span>{poi["description"]}</span>
            </Tooltip>

            <MarkerPopup data={poi} />
        </Marker>
    ));

    return (
        <div>{markers}</div>
    );
};

export default PoiMarkers;
