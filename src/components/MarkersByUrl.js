import React, { useState, useEffect } from 'react';
import { Map, TileLayer } from "react-leaflet";
import 'bootstrap/dist/css/bootstrap.min.css';
import L from 'leaflet';
import Markers from './PoiMarkers';
import './PoisView.css';
import '@geoapify/geocoder-autocomplete/styles/minimal.css';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { DriftMarker } from "leaflet-drift-marker";
import { ManIcon } from './poi-icon';


// this array must be here outside the PoisView function
// if we put it inside it will keep getting nulled
// we use it to set the markers hook
let local_data = [];
const FindMeCategory = 5;

var watch_options = {
    enableHighAccuracy: false,
    maximumAge: 60000,
    timeout: 45000
};

// table for [low_dis, high_dis, zoom_level]
const zoomByDistance = [
    [0, 0.1, 18],
    [0.1, 0.2, 17],
    [0.2, 0.4, 16],
    [0.4, 1.25, 15],
    [1.25, 2.5, 14],
    [2.5, 5, 13],
    [5, 10, 12],
    [10, 20, 11],
    [20, 40, 10],
    [40, 80, 9],
    [80, 160, 8],
    [160, 320, 7],
    [320, 640, 6],
    [640, 1280, 5],
    [1280, 2560, 4],
    [2560, 5120, 3]
]

function MarkersByUrl() {

    const { name } = useParams();

    const url = `${process.env.REACT_APP_BE_DB_SERVER_ADDRESS}:${process.env.REACT_APP_BE_DB_SERVER_PORT}/api/pois`;

    const [startingPoint, setStartingPoint] = useState(L.latLng(31.896, 35.012));
    const [mapCenter, setMapCenter] = useState(L.latLng(31.896, 35.012));

    const [zoom, setZoom] = useState(18);

    // load the marker list from static file (later from DB)
    const [markers, setMarkers] = useState(local_data);

    const [personCurrentLocation, setPersonCurrentLocation] = useState(L.latLng(31.896, 35.012));

    const [new_position, setMapPosition] = useState(L.latLng(31.896, 35.012));

    useEffect(() => {
        axios.get(url)
            .then(response => {
                if (response.error) {
                    console.log("There was an error please refresh or try again later")
                }
                else {
                    setPoisList(response.data);
                }
            })
            .catch(() => {
            })
    }, [url]);

    useEffect(() => {
        // console.log("useEffect2 was called");

        navigator.geolocation.watchPosition(function (position) {
            setMapPosition(L.latLng(position.coords.latitude, position.coords.longitude));

            setPersonCurrentLocation(L.latLng(position.coords.latitude, position.coords.longitude));
        }, function () { console.log("navigator.geolocation.clearWatch error occured") }, watch_options);

    }, []);



    useEffect(() => {
        // console.log("B. the starting point is: " + startingPoint);

        // a mobile screen length is twice as long as its width, so we must choose the right zoom 
        // value to accomodate both dimentions
        // This is not a mistake, we want to evaluate the latitude distance because this is the 
        // most narrow part of a mobile phone
        var lng_d = distance(startingPoint.lat, startingPoint.lng, startingPoint.lat, new_position.lng, 'K');
        var lat_d = distance(startingPoint.lat, startingPoint.lng, new_position.lat, startingPoint.lng, 'K');

        // console.log("distance between source and target is: " + lng_d + "x" + lat_d);
        let lng_new_zoom = 18;
        let lat_new_zoom = 18;

        let i = 0;
        for (i = 0; i < zoomByDistance.length; i++) {
            if (lng_d >= zoomByDistance[i][0] && lng_d < zoomByDistance[i][1]) {
                lng_new_zoom = zoomByDistance[i][2];
                break;
            }
        }


        for (i = 0; i < zoomByDistance.length; i++) {
            if (lat_d >= zoomByDistance[i][0] && lat_d < zoomByDistance[i][1]) {
                lat_new_zoom = zoomByDistance[i][2];
                break;
            }
        }

        if (lat_new_zoom > 18)
            lat_new_zoom = 18;

        let chosen_zoom = Math.min(lng_new_zoom, lat_new_zoom);

        // console.log("longwise zoom: " + lat_new_zoom + "  widewise zoom: " + lng_new_zoom);
        setZoom(chosen_zoom);

        let mid_lat = Math.min(new_position.lat, startingPoint.lat) +
            ((Math.max(new_position.lat, startingPoint.lat) -
                Math.min(new_position.lat, startingPoint.lat)) / 2);

        let mid_lng = Math.min(new_position.lng, startingPoint.lng) +
            ((Math.max(new_position.lng, startingPoint.lng) -
                Math.min(new_position.lng, startingPoint.lng)) / 2);

        // console.log("map center is: " + L.latLng(mid_lat, mid_lng));
        setMapCenter(L.latLng(mid_lat, mid_lng));
    }, [new_position]);




    function setPoisList(pois_list) {
        local_data = [];
        pois_list.map((poi) => {
            if (poi.name === name && poi.category === FindMeCategory) {
                local_data.push({
                    name: poi.name, description: poi.description,
                    category: poi.category,
                    geometry: poi.geometry[0], createdAt: poi.createdAt
                });
            }
        });

        setMarkers([...local_data]);

        let markers_found = local_data.length;
        // console.log("size is: " + markers_found);
        if (markers_found !== 0) {
            let s_point = L.latLng(local_data[markers_found - 1].geometry.lat,
                local_data[markers_found - 1].geometry.lng);
            setStartingPoint(s_point);
            // console.log("starting point set to: " + s_point);
        }
        else
            setTimeout(alertTimer, 1000);
    }

    function alertTimer() {
        alert("Could not find any marker named: " + name + " in the FindMe category");
    }


    function distance(lat1, lon1, lat2, lon2, unit) {
        if ((lat1 === lat2) && (lon1 === lon2)) {
            return 0;
        }
        else {
            var radlat1 = Math.PI * lat1 / 180;
            var radlat2 = Math.PI * lat2 / 180;
            var theta = lon1 - lon2;
            var radtheta = Math.PI * theta / 180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit === "K") { dist = dist * 1.609344 }
            if (unit === "N") { dist = dist * 0.8684 }
            return dist;
        }
    }


    return (

        <Map className="leaflet-container" center={mapCenter} zoom={zoom}>

            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <Markers pois={markers}> </Markers>

            <DriftMarker
                position={personCurrentLocation}
                icon={ManIcon}
                duration={1000}
            >
            </DriftMarker>

        </Map>
    );
}

export default MarkersByUrl;
