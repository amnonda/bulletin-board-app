import React, { useContext } from 'react';
import { Form } from 'react-bootstrap';

import { CheckedListContext ,
    EnteredListContext, 
    FilterByListContext, 
    SetRefreshWatchdogContext, 
    SetMyFormContext, 
    ResetFiltersAndSelectionsContext
 } from "../components/PoisView";


function GetFilterValuesForm() {

        const checked_list = useContext(CheckedListContext);
        const entered_list = useContext(EnteredListContext);
        const filterBy_list = useContext(FilterByListContext);
        const setRefreshWatchdog = useContext(SetRefreshWatchdogContext);
        const setMyForm = useContext(SetMyFormContext);
        const resetFiltersAndSelections = useContext(ResetFiltersAndSelectionsContext);

    function filterValuesSubmit() {

        let content = null;
        setMyForm(content);

        if (checked_list.name_checked || checked_list.radius_checked ||
            checked_list.penpal_checked || checked_list.landf_checked ||
            checked_list.activitypal_checked || checked_list.poi_checked ||
            checked_list.findme_checked)


            if (entered_list.name_entered)
                filterBy_list.filterByName = entered_list.name_entered;
            else
                checked_list.name_checked = false;

        if (entered_list.radius_entered !== 0)
            filterBy_list.filterByRadius = entered_list.radius_entered;
        else
            checked_list.radius_checked = false;

        // console.log("name: " + name_checked);
        // console.log("radius: " + radius_checked);
        // console.log("PenPal: " + penpal_checked);
        // console.log("L and F: " + landf_checked);
        // console.log("Activity: " + activitypal_checked);
        // console.log("Point of Interest: " + poi_checked);
        // console.log("Find Me: " + findme_checked);

        var current_time = new Date();
        setRefreshWatchdog(current_time);
    }


    function filterValuesCancel() {
        // console.log("reseted all filters");
        resetFiltersAndSelections();
        let content = null;
        setMyForm(content);
    }


    return (
        <Form style={{ color: "blue" }}>
            {(checked_list.name_checked || checked_list.radius_checked) &&
                <Form.Label style={{ color: "red" }}>Set Filter values</Form.Label>}

            {checked_list.name_checked &&
                <Form.Group controlId="formNameFilterValue">
                    <Form.Control type="name" placeholder="Type in your name or nickname"
                        onChange={e => { entered_list.name_entered = e.target.value }} />
                </Form.Group>
            }

            {checked_list.radius_checked &&
                <Form.Group controlId="formRadiusFilterValue">
                    <Form.Control type="name" placeholder="Type in radius value"
                        onChange={e => { entered_list.radius_entered = e.target.value }} />
                </Form.Group>
            }
            <Form.Group controlId="formFilterValueButtons">
                <button variant="primary" type="submit" onClick={() => filterValuesSubmit()}>Submit</button>
                <button variant="primary" type="cancel" onClick={() => filterValuesCancel()}>Cancel</button>
            </Form.Group>
        </Form>
    )
}

export default GetFilterValuesForm;