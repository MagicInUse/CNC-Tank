import React from 'react';
import LocationCoordinates from '../components/LocationCoordinates';
import Console from '../components/Console';
import MovementControls from '../components/MovementControls';
import ConfigMenu from '../components/ConfigMenu';
import Map from '../components/Map';
// import FileCompare from '../components/FileCompare';
// import ObjectsInfo from '../components/ObjectsInfo';
import NCInfo from '../components/NCInfo';
import { ConsoleProvider } from '../context/ConsoleContext';

const Dashboard = () => {
    return (
        <ConsoleProvider>
            <ConfigMenu />
            <LocationCoordinates />
            <Console />
            <MovementControls />
            {/* <FileCompare /> */}
            {/* <ObjectsInfo /> */}
            <NCInfo />
            <Map />
        </ConsoleProvider>
    );
};

export default Dashboard;