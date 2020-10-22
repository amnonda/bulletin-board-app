import React, { useState, useEffect } from 'react';
import { Map, TileLayer, Popup, Tooltip, Polyline } from "react-leaflet";
import Control from 'react-leaflet-control';
import 'bootstrap/dist/css/bootstrap.min.css';
import L from 'leaflet';
import { DriftMarker } from "leaflet-drift-marker";

import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete';
import '@geoapify/geocoder-autocomplete/styles/minimal.css';

//import data from '../assets/data';
// or:
// import * as poiData from "../assets/data.json";
import axios from 'axios';


import Markers from './PoiMarkers';
import { ManIcon } from './poi-icon';
import Menu from './Menu';
import AddNewMarkerInLocationForm from '../Forms/AddNewMarkerInLocationForm';
import { isWithinBounds, distance } from '../Utilities/HelperFunctions';
import './PoisView.css';

let the_map = null;
// this array must be here outside the PoisView function
// if we put it inside it will keep getting nulled
// we use it to set the markers hook
let local_data = [];

let checked_list = {
    name_checked: false,
    radius_checked: false,
    penpal_checked: false,
    landf_checked: false,
    activitypal_checked: false,
    poi_checked: false,
    findme_checked: false
}

let filterBy_list = {
    filterByName: null,
    filterByRadius: null
}


let entered_list = {
    name_entered: "",
    desc_entered: "",
    radius_entered: 0,
    category_entered: 0
}

let marker_location_determined = null;

// var categoryNames = ["General", "Pen Pal", "Lost and Found", "Activity Pal", "Point of Interest", "Find Me"];

const categories = {
    General: 0,
    PenPal: 1,
    LandF: 2,
    ActivityPal: 3,
    PointOfInterest: 4,
    FindMe: 5
}

var watch_options = {
    enableHighAccuracy: true,
    maximumAge: 60000,
    timeout: 45000
};

const CheckedListContext = React.createContext(checked_list);
const EnteredListContext = React.createContext(entered_list);
const FilterByListContext = React.createContext(filterBy_list);
const SetRefreshWatchdogContext = React.createContext(null);
const SetMyFormContext = React.createContext(null);
const AddNewMarkerContext = React.createContext(null);
const ResetFiltersAndSelectionsContext = React.createContext(null);

// The wake lock sentinel.
// let wakeLock = null;

function PoisView() {
    // console.log("PoisView: started ");

    const url = `http://${process.env.REACT_APP_BE_DB_SERVER_ADDRESS}:${process.env.REACT_APP_BE_DB_SERVER_PORT}/api/pois`;
//L.latLng(31.896, 35.012)
    const [mapCurrentLocation, setMapCurrentLocation] = useState(L.latLng(0,0));
    const [personCurrentLocation, setPersonCurrentLocation] = useState(0,0);
    const [zoom, setZoom] = useState(18);
    const [marker, setMarker] = useState(null);

    // load the marker list from static file (later from DB)
    const [markers, setMarkers] = useState(local_data);
    const [my_form, setMyForm] = useState(null);

    const [positionsHistory, setPositionsHistory] = useState([]);


    // Enable this to get the app returns to current location automaticaly
    const [follow_me, setFollowMe] = useState(true);
    const [refreshWatchdog, setRefreshWatchdog] = useState(0);
    const [lastMapLocation, setLastMapLocation] = useState(L.latLng(0,0));
    const [new_position, handleNewPosition] = useState(L.latLng(0,0));
    const [recordMovement, setRecordMovement] = useState(false);
    // The wake lock sentinel.
    const [wakeLock, setWakeLock] = useState(null);


    useEffect(() => {
        // console.log("PoisView::UseEffect for axios.get called")
        axios.get(url)
            .then(response => {
                if (response.error) {
                    console.log("There was an error please refresh or try again later")
                }
                else {
                    // console.log("response.data: " + response.data);
                    setPoisList(response.data);
                }
            })
            .catch(() => {
                /*request = { loading: false, data: null, error: true }*/
            })
        // This is just an example for a cleanup function that will be called after every
        // render. the name of the function (in this case cleanup) is arbitrary
        // return function cleanup() {
        //   // console.log("CLEANING UP");
        // }
        // }
    }, [url, refreshWatchdog]);

    // if we want to implement the last useEffect with async/await, we
    // will need to replace it with the following:
    // Implementing the lase useEffect with async/await
    // async function getTargetMarker() {
    //     let response = await axios.get(url);

    //     if (response.error) {
    //         console.log("There was an error please refresh or try again later")
    //     }
    //     else {
    //         setPoisList(response.data);
    //     }
    // }

    // useEffect(() => {
    //     getTargetMarker();
    // }, [url, refreshWatchdog]);





    useEffect(() => {
        // console.log("useEffect2 was called");

        navigator.geolocation.watchPosition(function (position) {
            // console.log("calling handleNewPosition");
            handleNewPosition(L.latLng(position.coords.latitude, position.coords.longitude));
        },
            function () { console.log("navigator.geolocation.watchPosition error occured") },
            watch_options);

    }, []);


    useEffect(() => {
        // console.log("useEffect3 for adding marker was called");
        if (marker !== null) {
            let new_marker = { description: marker.description, name: marker.name, category: marker.category, geometry: marker.geometry };
            setMarker(null);
            axios.post(url, new_marker)
                .then(response => {
                    addPoiToList(response.data);
                })
                .catch(() => {/* request = { loading: false, data: null, error: true }*/ })
        }
    }, [marker, url])


    useEffect(() => {
        if (follow_me) {
            // console.log("useEffect4 was called");
            var d = 1000 * distance(lastMapLocation.lat, lastMapLocation.lng, new_position.lat, new_position.lng, 'K');

            let new_position_obj = L.latLng(new_position.lat, new_position.lng);

            setLastMapLocation(new_position_obj);

            // to have less zoom in specific speed decrease (num - zoom) 
            // also the bigger the difference between the two nums - the less the zoom will osilate
            let upper_distance_threshold = Math.pow(2, (24 - zoom));
            let lower_distance_threshold = Math.pow(2, (22 - zoom));
            let new_zoom = 18;
            if (d >= upper_distance_threshold) {
                new_zoom = Math.max(0, (zoom - 1));
                // console.log("distance passed " + d + " Exided upper distance threshold " + 
                // upper_distance_threshold + " setting zoom to " + new_zoom);
                setZoom(new_zoom);
            }
            else if (d < lower_distance_threshold) {
                new_zoom = Math.min(18, (zoom + 1));
                // console.log("distance passed " + d + " Is below lower distance threshold " + 
                // lower_distance_threshold + " setting zoom to " + new_zoom);
                setZoom(new_zoom);
            }

            if (new_position.lat >= the_map.leafletElement.getBounds()._northEast.lat ||
                new_position.lng >= the_map.leafletElement.getBounds()._northEast.lng ||
                new_position.lat <= the_map.leafletElement.getBounds()._southWest.lat ||
                new_position.lng <= the_map.leafletElement.getBounds()._southWest.lng) {
                // console.log("setting map curent location");
                setMapCurrentLocation(new_position_obj);
            }
            setPersonCurrentLocation(new_position_obj);

            if(recordMovement)
            {
                // console.log("adding : " + new_position_obj);
                if (positionsHistory.length === 0)
                    setPositionsHistory([new_position_obj]);
                else if (positionsHistory.length === 1)
                    setPositionsHistory([new_position_obj, new_position_obj]);
                else
                    setPositionsHistory([...positionsHistory, new_position_obj]);
            }
        }
        else {
            // console.log("follow me was false, so I did nothing");
        }

    }, [new_position]);


    function setPoisList(pois_list) {
        // console.log("name: " + name_checked);
        // console.log("radius: " + radius_checked);
        // console.log("PenPal: " + penpal_checked);
        // console.log("L and F: " + landf_checked);
        // console.log("Activity: " + activitypal_checked);
        // console.log("Point of Interest: " + poi_checked);
        // console.log("Find Me: " + findme_checked);
        // console.log("pois_list : " + pois_list.length);
        let filtered_pois_list = [];
        filtered_pois_list = [...pois_list];
        local_data = [];

        if (checked_list.name_checked) {
            pois_list = [...filtered_pois_list];
            filtered_pois_list = [];
            pois_list.map((poi) => {
                if (poi.name === filterBy_list.filterByName)
                    filtered_pois_list.push(poi);
            })
        }
        if (checked_list.radius_checked) {
            pois_list = [...filtered_pois_list];
            filtered_pois_list = [];
            pois_list.map((poi) => {
                // console.log("calculating: " + poi.geometry[0] + "  " + poi.geometry[1])
                if (isWithinBounds(filterBy_list.filterByRadius, mapCurrentLocation, L.latLng(poi.geometry[0])))
                    filtered_pois_list.push(poi);
            })
        }

        if (checked_list.penpal_checked || checked_list.landf_checked || checked_list.activitypal_checked || checked_list.poi_checked || checked_list.findme_checked) {
            pois_list = [...filtered_pois_list];
            filtered_pois_list = [];
            pois_list.map((poi) => {
                if ((checked_list.penpal_checked && poi.category === categories.PenPal) ||
                    (checked_list.landf_checked && poi.category === categories.LandF) ||
                    (checked_list.activitypal_checked && poi.category === categories.ActivityPal) ||
                    (checked_list.poi_checked && poi.category === categories.PointOfInterest) ||
                    (checked_list.findme_checked && poi.category === categories.FindMe)
                )
                    filtered_pois_list.push(poi);

            })
        }

        // console.log("filtered_pois_list : " + filtered_pois_list.length);
        filtered_pois_list.map((poi) => {
            local_data.push({
                name: poi.name, description: poi.description,
                category: poi.category,
                geometry: poi.geometry[0], createdAt: poi.createdAt
            });
        });

        setMarkers([...local_data]);
    }

    function addPoiToList(poi) {
        local_data = [
            ...local_data,
            {
                name: poi.name, description: poi.description,
                category: poi.category,
                geometry: poi.geometry[0], createdAt: poi.createdAt
            },
        ]

        setMarkers([...local_data]);
    }

    function reCenter() {
        // console.log("Re Center was called, panning to where the person is");
        setMapCurrentLocation(personCurrentLocation);
    }

    function toggleFollowMe() {
        setFollowMe(!follow_me);
    }


    function refresh() {
        var current_time = new Date();
        setRefreshWatchdog(current_time);
    }

    function toggleRecordingMovement() {
        let rec_move = recordMovement;
        setRecordMovement(!recordMovement);

        if (rec_move)
            releaseWakeLock();
        else {
            setPositionsHistory([]);
            requestWakeLock();
        }
    }

    function toggleScreenLock() {
        if (!wakeLock) {
            requestWakeLock();
        }
        else {
            releaseWakeLock();
        }
    }

    // This CB is called on onViewportChanged event, when user drags the map with the mouse
    const showNewViewportDetails = (e) => {
        // console.log("Viewport Event fired, zoom and loc set to: " + e.zoom + "  " + e.center);

        setZoom(e.zoom);
        setMapCurrentLocation(L.latLng(e.center));
    }


    function onPlaceSelect(value) {
        if (value != null) {
            // console.log("onSelect event fired, setting map cur loc to: " +
            // value.geometry.coordinates[1] + " : " + value.geometry.coordinates[0]);

            setFollowMe(false);

            setMapCurrentLocation(L.latLng(value.geometry.coordinates[1], value.geometry.coordinates[0]));
        }
    }

    // function onSuggectionChange(value) {
    // }


    const addNewMarkerInLocationForm = (e) => {
        marker_location_determined = e.latlng;
        let content =
            <SetMyFormContext.Provider value={setMyForm}>
                <AddNewMarkerContext.Provider value={addNewMarker}>
                    <EnteredListContext.Provider value={entered_list}>
                        <AddNewMarkerInLocationForm entered_list={entered_list}
                            setMyForm={(content) => { setMyForm(content) }}
                            addNewMarker={(name, desc, category, use_determined_location) => { addNewMarker(name, desc, category, use_determined_location) }} >
                        </AddNewMarkerInLocationForm>
                    </EnteredListContext.Provider>
                </AddNewMarkerContext.Provider>
            </SetMyFormContext.Provider>
        setMyForm(content);
    }


    function addNewMarker(name, desc, category, use_determined_location) {
        let marker_location = null;
        if (use_determined_location)
            marker_location = marker_location_determined;
        else
            marker_location = L.latLng(mapCurrentLocation.lat, mapCurrentLocation.lng);

        // console.log("about to create marker in: " + marker_location);
        setMarker({
            "description": desc,
            "name": name,
            "category": category,
            "geometry": marker_location
        });

        setMapCurrentLocation(marker_location);
    }


    function resetFiltersAndSelections() {
        checked_list.name_checked = false;
        checked_list.radius_checked = false;
        checked_list.penpal_checked = false;
        checked_list.landf_checked = false;
        checked_list.activitypal_checked = false;
        checked_list.poi_checked = false;
        checked_list.findme_checked = false;
        entered_list.name_entered = "";
        entered_list.desc_entered = "";
        entered_list.radius_entered = 0;
        entered_list.category_entered = 0;
    }



    // Function that attempts to request a wake lock.
    const requestWakeLock = async () => {
        try {
            let wl = await navigator.wakeLock.request('screen');
            setWakeLock(wl);
            wl.addEventListener('release', () => {
                setWakeLock(null);
                console.log('Wake Lock was released');
            });
            console.log('Wake Lock is active');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    };


    // Function that attempts to release the wake lock.
    const releaseWakeLock = async () => {
        if (!wakeLock) {
            console.log('There is no Wake Lock');
            return;
        }
        try {
            console.log('releasing Wake Lock in progress');
            await wakeLock.release();
            console.log('releasing Wake Lock  progress completed');
            setWakeLock(null);
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    };

    // const staticPositions1 = [ [ 31.928998227020065, 35.012678524962217 ], 
    // [ 31.928848674763591, 35.0126287881665 ], 
    // [ 31.928629964583797, 35.012638464250044 ], 
    // [ 31.928422760198293, 35.012663918176946 ], 
    // [ 31.928149062199842, 35.012715488835601 ] ];

    // function addToPositionsHistory(new_pos) {
    //     console.log("adding : " + new_pos);
    //     positionsHistory = [
    //         ...positionsHistory,
    //         {
    //             new_pos
    //         },
    //     ]
    // }
    return (
        // same like : https://{s}.tile.osm.org/{z}/{x}/{y}.png

        <Map className="leaflet-container" ref={(ref) => { the_map = ref; }} center={mapCurrentLocation} zoom={zoom}
            // animate={true} duration={5} easeLinearity={0.1} noMoveStart={false} onMoveend={onMoveEnd}
            onClick={addNewMarkerInLocationForm}
            onViewportChanged={showNewViewportDetails}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* <TileLayer
            url="http://tile.stamen.com/terrain/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://stamen.com">Stamen Design</a> contributors'
          />      */}

            {/* <TileLayer
            url="http://tile.stamen.com/toner/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://stamen.com">Stamen Design</a> contributors'
          />       */}

            <Control position="topleft">
                <button style={{ zIndex: "100" }}
                    // className="badge badge-primary mr-2"
                    onClick={() => reCenter()}
                >
                    ReCenter
            </button>
            </Control>
            <Control position="topleft">
                <button style={{ zIndex: "100", color: follow_me ? "green" : "red" }}
                    // className="badge badge-primary mr-2"
                    onClick={() => toggleFollowMe()}
                >
                    {follow_me ? "Tracking is On" : "Tracking is Off"}
                </button>
            </Control>
            <Control position="topleft">
                <button style={{ zIndex: "100" }}
                    // className="badge badge-primary mr-2"
                    onClick={() => refresh()}
                >
                    Refresh
            </button>
            </Control>
            <Control position="topleft">
                <button style={{ zIndex: "100", color: recordMovement ? "green" : "red" }}
                    // className="badge badge-primary mr-2"
                    onClick={() => toggleRecordingMovement()}
                >
                    {recordMovement ? "Recording is On" : "Recording is Off"}
                </button>
            </Control>
            <Control position="topleft">
                <button style={{ zIndex: "100", color: wakeLock ? "green" : "red" }}
                    // className="badge badge-primary mr-2"
                    onClick={() => toggleScreenLock()}
                >
                    {wakeLock ? "Screen Lock is On" : "Screen Lock is Off"}
                </button>
            </Control>
            <Control position="topright">
                <GeoapifyContext apiKey={process.env.REACT_APP_GEOAPIFY_MAPS_API_KEY} 
                className="address-locator">
                    <GeoapifyGeocoderAutocomplete placeholder="Move to Location:"
                        placeSelect={onPlaceSelect}
                        // suggestionsChange={onSuggectionChange}
                        >

                    </GeoapifyGeocoderAutocomplete>
                </GeoapifyContext>
            </Control>
            <Control position="topright">
                <CheckedListContext.Provider value={checked_list}>
                    <EnteredListContext.Provider value={entered_list}>
                        <FilterByListContext.Provider value={filterBy_list}>
                            <SetRefreshWatchdogContext.Provider value={setRefreshWatchdog}>
                                <SetMyFormContext.Provider value={setMyForm}>
                                    <AddNewMarkerContext.Provider value={addNewMarker}>
                                        <ResetFiltersAndSelectionsContext.Provider value={resetFiltersAndSelections}>
                                            <Menu
                                                checked_list={checked_list}
                                                entered_list={entered_list}
                                                filterBy_list={filterBy_list}
                                                setRefreshWatchdog={(current_time) => { setRefreshWatchdog(current_time) }}
                                                setMyForm={(content) => { setMyForm(content) }}
                                                addNewMarker={(name, desc, category, use_determined_location) => { addNewMarker(name, desc, category, use_determined_location) }}
                                                resetFiltersAndSelections={() => { resetFiltersAndSelections() }}>
                                            </Menu>
                                        </ResetFiltersAndSelectionsContext.Provider>
                                    </AddNewMarkerContext.Provider>
                                </SetMyFormContext.Provider>
                            </SetRefreshWatchdogContext.Provider>
                        </FilterByListContext.Provider>
                    </EnteredListContext.Provider>
                </CheckedListContext.Provider>
            </Control>

            <Control position="topright">
                {my_form}
            </Control>
            {/* <Markers pois={data.pois}> </Markers> */}
            <Markers pois={markers}> </Markers>

            <Polyline positions={positionsHistory} color="red" />

            <DriftMarker
                position={personCurrentLocation}
                icon={ManIcon}
                duration={1000}
            // keepAtCenter={true}
            >
                <Popup>
                    You Are Here !
            </Popup>
                <Tooltip>To get true location <br /> Must be in FollowMe Mode</Tooltip>
            </DriftMarker>

        </Map>
    );
}

export {
    PoisView, CheckedListContext,
    EnteredListContext,
    FilterByListContext,
    SetRefreshWatchdogContext,
    SetMyFormContext,
    AddNewMarkerContext,
    ResetFiltersAndSelectionsContext
};