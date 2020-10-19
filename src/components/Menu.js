import React from 'react';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import AddNewMarkerForm from '../Forms/AddNewMarkerForm';
import SetFilterForm from '../Forms/SetFilterForm';

function Menu(props) {

    const {checked_list, entered_list, filterBy_list, 
        setRefreshWatchdog, setMyForm, addNewMarker, resetFiltersAndSelections} = props;

    function addNewMarkerForm() {
        let content =
            <AddNewMarkerForm setMyForm={(content) => { setMyForm(content) }}
                entered_list={entered_list}
                addNewMarker={(name, desc, category, use_determined_location) => { addNewMarker(name, desc, category, use_determined_location) }}
            ></AddNewMarkerForm>
        setMyForm(content);
    }



    function setFilterForm() {
        resetFiltersAndSelections();

        let content =
            <SetFilterForm checked_list={checked_list}
                entered_list={entered_list}
                filterBy_list={filterBy_list}
                setRefreshWatchdog={(current_time) => { setRefreshWatchdog(current_time) }}
                setMyForm={(content) => { setMyForm(content) }}
                addNewMarker={(name, desc, category, use_determined_location) => { addNewMarker(name, desc, category, use_determined_location) }}
                resetFiltersAndSelections={() => { resetFiltersAndSelections() }} ></SetFilterForm>

        setMyForm(content);
    }


    function resetFilters() {
        resetFiltersAndSelections();

        var current_time = new Date();
        setRefreshWatchdog(current_time);
    }


    return (

        <DropdownButton id="dropdown-basic-button" title="Menu" drop={"left"} >
            {/* <Dropdown.Item href="/poiform">Add Marker</Dropdown.Item> */}
            <Dropdown.Item onClick={() => addNewMarkerForm()}>Add Marker...</Dropdown.Item>
            <Dropdown.Item onClick={() => setFilterForm()}>Filter By...</Dropdown.Item>
            <Dropdown.Item onClick={() => resetFilters()}>Reset Filters</Dropdown.Item>
            {/* <Dropdown.Divider /> */}
            {/* <Dropdown.Item onClick={() => menu()}>Sugest New Category</Dropdown.Item> */}
        </DropdownButton>
    );
}

export default Menu;