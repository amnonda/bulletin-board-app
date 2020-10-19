import React, { useContext } from 'react';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import AddNewMarkerForm from '../Forms/AddNewMarkerForm';
import SetFilterForm from '../Forms/SetFilterForm';

import { CheckedListContext ,
    EnteredListContext, 
    SetRefreshWatchdogContext, 
    SetMyFormContext, 
    ResetFiltersAndSelectionsContext,
    AddNewMarkerContext
 } from "./PoisView";

function Menu() {

    const checked_list = useContext(CheckedListContext);
    const entered_list = useContext(EnteredListContext);
    const setRefreshWatchdog = useContext(SetRefreshWatchdogContext);
    const setMyForm = useContext(SetMyFormContext);
    const resetFiltersAndSelections = useContext(ResetFiltersAndSelectionsContext);
    const addNewMarker = useContext(AddNewMarkerContext);

    function addNewMarkerForm() {
        let content =
            <EnteredListContext.Provider value={entered_list}>
                <SetMyFormContext.Provider value={setMyForm}>
                    <AddNewMarkerContext.Provider value={addNewMarker}>
                        <AddNewMarkerForm></AddNewMarkerForm>
                    </AddNewMarkerContext.Provider>
                </SetMyFormContext.Provider>
            </EnteredListContext.Provider>
        setMyForm(content);
    }



    function setFilterForm() {
        resetFiltersAndSelections();
        let content =
            <CheckedListContext.Provider value={checked_list}>
                <SetRefreshWatchdogContext.Provider value={setRefreshWatchdog}>
                    <SetMyFormContext.Provider value={setMyForm}>
                        <ResetFiltersAndSelectionsContext.Provider value={resetFiltersAndSelections}>
                            <SetFilterForm></SetFilterForm>
                        </ResetFiltersAndSelectionsContext.Provider>
                    </SetMyFormContext.Provider>
                </SetRefreshWatchdogContext.Provider>
            </CheckedListContext.Provider>
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
            {/* <Dropdown.Item onClick={() => addNewMarkerForm()}>Add Marker...</Dropdown.Item>
            <Dropdown.Item onClick={() => setFilterForm()}>Filter By...</Dropdown.Item>
            <Dropdown.Item onClick={() => resetFilters()}>Reset Filters</Dropdown.Item> */}
            <Dropdown.Item onClick={() => addNewMarkerForm()}>Add Marker...</Dropdown.Item>
            <Dropdown.Item onClick={() => setFilterForm()}>Filter By...</Dropdown.Item>
            <Dropdown.Item onClick={() => resetFilters()}>Reset Filters</Dropdown.Item>
            {/* <Dropdown.Divider /> */}
            {/* <Dropdown.Item onClick={() => menu()}>Sugest New Category</Dropdown.Item> */}
        </DropdownButton>
    );
}

export default Menu;