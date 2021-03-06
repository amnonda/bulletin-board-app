import React, { useContext } from 'react';
import { Form } from 'react-bootstrap';

import { EnteredListContext, 
    AddNewMarkerContext,
    SetMyFormContext
 } from "../components/PoisView";
 
function AddNewMarkerInLocationForm() {

    const entered_list = useContext(EnteredListContext);
    const addNewMarker = useContext(AddNewMarkerContext);
    const setMyForm = useContext(SetMyFormContext);

    function newMarkerInLocationSubmit() {
        if (entered_list.name_entered && entered_list.desc_entered) {
            // console.log("Name: " + name_entered);
            // console.log("Description: " + desc_entered);
            // console.log("category: " + categoryNames[category_entered]);

            let content = null;
            setMyForm(content);

            addNewMarker(entered_list.name_entered, entered_list.desc_entered, entered_list.category_entered, true);
        }
        else {
            alert("Please Type in Name and Description");
        }
    }


    function newMarkerInLocationCancel() {
        let content = null;
        setMyForm(content);
    }

    return (
        <Form style={{ color: "blue" }}>
            <Form.Label style={{ color: "red" }}>Add New Marker</Form.Label>
            <Form.Group controlId="formUserName">
                <Form.Control type="name" placeholder="Type in your name or nickname" onChange={e => { entered_list.name_entered = e.target.value }} />
            </Form.Group>

            <Form.Group controlId="formUserDescription">
                <Form.Control type="description" placeholder="Type in a short description" onChange={e => { entered_list.desc_entered = e.target.value }} />
            </Form.Group>

            <Form.Label style={{ color: "red" }}>Select A category:</Form.Label>
            <Form.Group controlId="formRadioButtons">
                <Form.Check label="Pen Pal" name="vote" type="radio" id={`inline-radio-1`} onChange={(e) => { entered_list.category_entered = 1 }} />
                <Form.Check label="Lost and Found" name="vote" type="radio" id={`inline-radio-2`} onChange={(e) => { entered_list.category_entered = 2 }} />
                <Form.Check label="Activity Pal" name="vote" type="radio" id={`inline-radio-3`} onChange={(e) => { entered_list.category_entered = 3 }} />
                <Form.Check label="Point of Interest" name="vote" type="radio" id={`inline-radio-4`} onChange={(e) => { entered_list.category_entered = 4 }} />
                <Form.Check label="Find Me" name="vote" type="radio" id={`inline-radio-5`} onChange={(e) => { entered_list.category_entered = 5 }} />
            </Form.Group>

            <Form.Group controlId="formControlButtons">
                <button variant="primary" type="submit" onClick={() => newMarkerInLocationSubmit()}>Submit</button>
                <button variant="primary" type="cancel" onClick={() => newMarkerInLocationCancel()}>Cancel</button>
            </Form.Group>
        </Form>
    )
}

export default AddNewMarkerInLocationForm;