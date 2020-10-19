import React from 'react';
import { Form } from 'react-bootstrap';
import GetFilterValuesForm from '../Forms/GetFilterValuesForm';

function SetFilterForm(props) {

    const {checked_list, entered_list, filterBy_list, 
        setRefreshWatchdog, setMyForm, addNewMarker, resetFiltersAndSelections} = props;

    function filterSetSubmit() {
        // console.log("name: " + name_checked);
        // console.log("radius: " + radius_checked);
        // console.log("PenPal: " + penpal_checked);
        // console.log("L and F: " + landf_checked);
        // console.log("Activity: " + activitypal_checked);
        // console.log("Point of Interest: " + poi_checked);
        // console.log("Find Me: " + findme_checked);
        let content = null;
        setMyForm(content);

        if (checked_list.name_checked || checked_list.radius_checked || checked_list.penpal_checked || checked_list.landf_checked || checked_list.activitypal_checked || checked_list.poi_checked || checked_list.findme_checked)
            // filter_set = true;

            if (checked_list.name_checked || checked_list.radius_checked)
                getFilterValuesForm();
            else {
                var current_time = new Date();
                setRefreshWatchdog(current_time);
            }
    }


    function filterSetCancel() {
        // console.log("reseted all filters");
        resetFiltersAndSelections();
        let content = null;
        setMyForm(content);
    }


    function getFilterValuesForm() {
        let content =
            <GetFilterValuesForm setMyForm={(content) => { setMyForm(content) }}
                setRefreshWatchdog={(current_time) => { setRefreshWatchdog(current_time) }}
                resetFiltersAndSelections={() => { resetFiltersAndSelections() }}
                checked_list={checked_list}
                entered_list={entered_list}
                filterBy_list={filterBy_list}>
            </GetFilterValuesForm>

        setMyForm(content);
    }


    return (
        <Form style={{ color: "blue" }}>
            <Form.Label style={{ color: "red" }}>Set your filter</Form.Label>
            <Form.Group controlId="filterCategories1">
                <Form.Check inline label="name" type="checkbox" id={`inline-checkbox-1`} onChange={e => { checked_list.name_checked = e.currentTarget.checked }} />
                <Form.Check inline label="radius" type="checkbox" id={`inline-checkbox-2`} onChange={e => { checked_list.radius_checked = e.currentTarget.checked }} />
            </Form.Group>

            <Form.Label style={{ color: "red" }}>Categories</Form.Label>
            <Form.Group controlId="filterCategories2">
                <Form.Check label="PenPal" type="checkbox" id={`inline-checkbox-3`} onChange={e => { checked_list.penpal_checked = e.currentTarget.checked }} />
                <Form.Check label="Lost and Found" type="checkbox" id={`inline-checkbox-4`} onChange={e => { checked_list.landf_checked = e.currentTarget.checked }} />
                <Form.Check label="Activity Pals" type="checkbox" id={`inline-checkbox-5`} onChange={e => { checked_list.activitypal_checked = e.currentTarget.checked }} />
                <Form.Check label="Point of Interest" type="checkbox" id={`inline-checkbox-6`} onChange={e => { checked_list.poi_checked = e.currentTarget.checked }} />
                <Form.Check label="Find Me" type="checkbox" id={`inline-checkbox-7`} onChange={e => { checked_list.findme_checked = e.currentTarget.checked }} />
            </Form.Group>
            {/* <Form.Check disabled label="Activity Pals" type="checkbox" id={`inline-checkbox-5`} />   */}
            <Form.Group controlId="filterCategories2">
                <button variant="primary" type="submit" onClick={() => filterSetSubmit()}>Submit</button>
                <button variant="primary" type="cancel" onClick={() => filterSetCancel()}>Cancel</button>
            </Form.Group>
        </Form>
    )
}

export default SetFilterForm;