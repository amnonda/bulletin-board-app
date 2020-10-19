import React from 'react';
import {PoisView} from './components/PoisView';

import MarkersByUrl from './components/MarkersByUrl';

// import logo from './logo.svg';
import './App.css';

import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom"



function App() {

  // return (

  //   <PoisView></PoisView>
      
  // );


  return (
      <Router>
          <Switch>
            <Route exact path="/">
            <PoisView></PoisView>
            </Route>
            <Route path="/:name">
              <MarkersByUrl></MarkersByUrl>
            </Route>
          </Switch>

      </Router>
  );
}

export default App;
