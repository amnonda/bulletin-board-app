import React from 'react';
import {Popup} from 'react-leaflet';

function MarkerPopup(props) {
  const { name, createdAt } = props.data;
  var date = new Date(createdAt);
  var created_time = date.getTime();
  var current_time = new Date();
  var age_of_marker = getAgeOfMarker();

  function getAgeOfMarker() {
    let str = "";
    let minutes = Math.floor((current_time - created_time) / 60000);
    let hours = 0;
    let days = 0;
    if (minutes >= 60) {
      hours = Math.floor(minutes / 60);
      if (hours >= 24) {
        days = Math.floor(hours / 24);
        str = `${days} days ago`;
      }
      else
        str = `${hours} hours ago`;
    }
    else
      str = `${minutes} minutes ago`;

    return str;
  }

  // The MarkerPopup component just opens the popup when a marker is 
  // clicked on the map and it displays the venue name in the popup.
  return  (<Popup>
    <div className='poup-text'>Spotted {age_of_marker} by {name}</div>
  </Popup>);
};

export default MarkerPopup;
