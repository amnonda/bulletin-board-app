import React, { useState, useEffect, useContext } from 'react';
import { Map, TileLayer, Popup, Tooltip, Polygon, Polyline } from "react-leaflet";
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
    maximumAge: 0,
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
                console.log("adding : " + new_position_obj);
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
            return;
        }
        try {
            await wakeLock.release();
            setWakeLock(null);
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    };

    // const staticPositions1 = [ [ 31.928998227020065, 35.012678524962217 ], [ 31.928848674763591, 35.0126287881665 ], [ 31.928629964583797, 35.012638464250044 ], [ 31.928422760198293, 35.012663918176946 ], [ 31.928149062199842, 35.012715488835601 ], [ 31.927957476459403, 35.012811711449663 ], [ 31.927784654199661, 35.012938625244273 ], [ 31.92760815428648, 35.013040270781991 ], [ 31.927518485847762, 35.013091713045325 ], [ 31.927184394639048, 35.013328807455343 ], [ 31.926980366502852, 35.013452591339236 ], [ 31.926884977323843, 35.013590286367863 ], [ 31.926814729385774, 35.013764039878145 ], [ 31.926626563589031, 35.013917872557348 ], [ 31.926497716456174, 35.014060814612732 ], [ 31.926448992606146, 35.014114570270406 ], [ 31.926269329223933, 35.014302009721012 ], [ 31.926055416474048, 35.0144916007602 ], [ 31.925992375420583, 35.014560602694109 ], [ 31.925885862791708, 35.014678243726761 ], [ 31.925732822555437, 35.014818123788876 ], [ 31.925614675369948, 35.014817609985206 ], [ 31.924727947548382, 35.01481412828373 ], [ 31.924877151968153, 35.014429495450484 ], [ 31.925095568608404, 35.014083569007879 ], [ 31.925164034744347, 35.01394244262819 ], [ 31.925264151025493, 35.013734443456476 ], [ 31.925338306782569, 35.013341460841465 ], [ 31.925470389470894, 35.013135176131845 ], [ 31.925574196622725, 35.012988066968367 ], [ 31.925546754915123, 35.012915905231969 ], [ 31.925651262595613, 35.012856069183263 ], [ 31.925711952524884, 35.012824255700009 ], [ 31.925774830236256, 35.012796216121009 ], [ 31.925830891606373, 35.012774383014628 ], [ 31.925867197530158, 35.012761809003235 ], [ 31.92590007275904, 35.012751810476415 ], [ 31.925939693490497, 35.012740214336487 ], [ 31.92599193204166, 35.01272723678373 ], [ 31.926365012796273, 35.012637477662564 ], [ 31.926418252069075, 35.012622560648799 ], [ 31.926465490517279, 35.012607421731003 ], [ 31.926522105324827, 35.012587035002865 ], [ 31.92658340558126, 35.01256178761909 ], [ 31.926657621681392, 35.012523898575507 ], [ 31.926736412633053, 35.012478528064539 ], [ 31.926810292237937, 35.012433482245639 ], [ 31.92706001485839, 35.012271161194589 ], [ 31.927133403326442, 35.012230818859015 ], [ 31.927190129544846, 35.012203621677683 ], [ 31.927250311373149, 35.012160135001485 ], [ 31.927287699728771, 35.012129356266241 ], [ 31.927326853380043, 35.012093846419544 ], [ 31.927369980785392, 35.01204853828733 ], [ 31.927446311158511, 35.011998108862121 ], [ 31.927520347411451, 35.011960130089184 ], [ 31.927611033066503, 35.011923068992841 ], [ 31.92776769588871, 35.011859484504411 ], [ 31.927840259264079, 35.011833950532859 ], [ 31.927901222217292, 35.011816196677996 ], [ 31.928173676792048, 35.011749122014726 ], [ 31.928207845610024, 35.011739552585736 ], [ 31.928284148320662, 35.011714223790973 ], [ 31.928335793851736, 35.011693935582569 ], [ 31.928391321337122, 35.01166926290623 ], [ 31.928479258861606, 35.011626595522619 ], [ 31.928631045163689, 35.011553164968595 ], [ 31.928705841613427, 35.011524615563046 ], [ 31.928736724372703, 35.011515069562497 ], [ 31.928778060658834, 35.01150396844241 ], [ 31.928821269650987, 35.01149463045982 ], [ 31.928863276900464, 35.0114875214837 ], [ 31.928910025801292, 35.011481710936677 ], [ 31.928959466412556, 35.011479060257413 ], [ 31.92895988150878, 35.011340604257205 ], [ 31.929503901389231, 35.010625522225913 ], [ 31.929647531461418, 35.010511766492433 ], [ 31.930030755001218, 35.010207642452086 ], [ 31.930185682218172, 35.010110926982483 ], [ 31.930622012790386, 35.009838545886295 ], [ 31.93104590457539, 35.009574677909077 ], [ 31.931481359508217, 35.009303659791625 ], [ 31.932155388734932, 35.008884203588975 ], [ 31.932229179452639, 35.008235478863766 ], [ 31.933175778000609, 35.007878613628369 ], [ 31.933188111880432, 35.007874050319492 ], [ 31.933194925856631, 35.007871606579668 ], [ 31.933201768957309, 35.007869204095114 ], [ 31.93320864163467, 35.007866845416457 ], [ 31.933215539695345, 35.007864528771107 ], [ 31.933222468376803, 35.007862256074459 ], [ 31.933229422677121, 35.007860027362332 ], [ 31.933236403623815, 35.007857841575868 ], [ 31.933243411648183, 35.007855699763502 ], [ 31.933250445081006, 35.007853601786975 ], [ 31.933257504145109, 35.007851548696264 ], [ 31.933264586325043, 35.007849539457899 ], [ 31.933271692677499, 35.00784757511588 ], [ 31.933278822354188, 35.007845654624608 ], [ 31.933285976215763, 35.007843779930971 ], [ 31.933293150692242, 35.007841949107549 ], [ 31.933300347061197, 35.007840164098203 ], [ 31.933307566560535, 35.007838423992622 ], [ 31.933314805436785, 35.007836728667504 ], [ 31.933322064746596, 35.007835079166929 ], [ 31.933329342403701, 35.007833475355602 ], [ 31.933336641742861, 35.007831917209606 ], [ 31.933343957972488, 35.007830404913532 ], [ 31.933351292343153, 35.007828938458415 ], [ 31.933358643602338, 35.007827517702976 ], [ 31.933366013014995, 35.00782614368981 ], [ 31.933373398065774, 35.007824815385368 ], [ 31.933380798560611, 35.007823533842553 ], [ 31.933388214901959, 35.007822298006884 ], [ 31.933395645437079, 35.007821108941874 ], [ 31.933403090384678, 35.007819967397216 ], [ 31.933410548471448, 35.00781887172924 ], [ 31.933418019720369, 35.007817823590505 ], [ 31.933425502858006, 35.007816821337547 ], [ 31.933432997896907, 35.007815865871676 ], [ 31.933440504857791, 35.007814958695034 ], [ 31.933448021208625, 35.007814097572362 ], [ 31.933455549262723, 35.007813283989391 ], [ 31.933463085685423, 35.007812517969873 ], [ 31.933470631508462, 35.007811798755538 ], [ 31.933478185270948, 35.007811126206354 ], [ 31.933477889371295, 35.007811599762553 ], [ 31.933567589976553, 35.007805709342987 ], [ 31.933670879252836, 35.007808511982274 ], [ 31.933761988290931, 35.007819375743578 ], [ 31.933835939648225, 35.007833906133064 ], [ 31.933911193284138, 35.007853743000721 ], [ 31.934008741493179, 35.007885823240264 ], [ 31.934095326146823, 35.007925069683138 ], [ 31.934166007137284, 35.007967953374132 ], [ 31.934230554264195, 35.00801535202042 ], [ 31.934303937946189, 35.00807772798297 ], [ 31.934399812202605, 35.008166520842435 ], [ 31.934479476294135, 35.008238596953552 ], [ 31.934562889107048, 35.008315075875279 ], [ 31.933730454183623, 35.008562031832026 ], [ 31.933090052582492, 35.009185907100109 ], [ 31.932832560773511, 35.009499608810925 ], [ 31.932371859921267, 35.009963606000268 ], [ 31.931954826094886, 35.010385648774628 ], [ 31.931953609235171, 35.010386543414823 ], [ 31.931534685056738, 35.010790915756145 ], [ 31.931089902739066, 35.011221976521872 ], [ 31.930053178264279, 35.012225631509692 ], [ 31.930053986063334, 35.012229621947773 ], [ 31.930426350785785, 35.01257957041509 ], [ 31.930873540209993, 35.012917465162834 ], [ 31.930997189110363, 35.01341625800063 ], [ 31.931159783848449, 35.013529382851344 ], [ 31.930777353000613, 35.014413639686856 ], [ 31.930537844446937, 35.014964641809121 ], [ 31.930444376372327, 35.014961765969821 ], [ 31.930237503702904, 35.014847184538416 ], [ 31.93011391249002, 35.014709859091367 ], [ 31.929969422448897, 35.014465828932059 ], [ 31.929846718169208, 35.014289662004677 ], [ 31.929767768724608, 35.014176539025739 ], [ 31.929665310238084, 35.0139669503461 ], [ 31.929608707356627, 35.013746139114856 ], [ 31.929525040423746, 35.013480993694854 ], [ 31.929439759116738, 35.013153626305202 ], [ 31.929403603763822, 35.01301420553728 ], [ 31.929329214721, 35.012886009950149 ], [ 31.929198183526984, 35.012785100683457 ], [ 31.928998227020065, 35.012678524962217 ] ];
    // const staticPositions2 = [ [ 31.928998227020065, 35.012678524962217 ], [ 31.928848674763591, 35.0126287881665 ], [ 31.928629964583797, 35.012638464250044 ], [ 31.928422760198293, 35.012663918176946 ], [ 31.928149062199842, 35.012715488835601 ], [ 31.927957476459403, 35.012811711449663 ], [ 31.927784654199661, 35.012938625244273 ], [ 31.92760815428648, 35.013040270781991 ], [ 31.927518485847762, 35.013091713045325 ], [ 31.927184394639048, 35.013328807455343 ], [ 31.926980366502852, 35.013452591339236 ], [ 31.926884977323843, 35.013590286367863 ], [ 31.926814729385774, 35.013764039878145 ], [ 31.926626563589031, 35.013917872557348 ], [ 31.926497716456174, 35.014060814612732 ], [ 31.926448992606146, 35.014114570270406 ], [ 31.926269329223933, 35.014302009721012 ], [ 31.926055416474048, 35.0144916007602 ], [ 31.925992375420583, 35.014560602694109 ], [ 31.925885862791708, 35.014678243726761 ], [ 31.925732822555437, 35.014818123788876 ], [ 31.925614675369948, 35.014817609985206 ], [ 31.924727947548382, 35.01481412828373 ], [ 31.924877151968153, 35.014429495450484 ] ];

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
                    {follow_me ? "Tracking..." : "Track Movement"}
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
                    {recordMovement ? "Stop Recording" : "Record Movement"}
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