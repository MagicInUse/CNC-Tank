import React from 'react';
import LocationCoordinates from '../components/LocationCoordinates';
import Console from '../components/Console';
import MovementControls from '../components/MovementControls';
import ConfigMenu from '../components/ConfigMenu';
import Map from '../components/Map';
// import FileCompare from '../components/FileCompare';
// import ObjectsInfo from '../components/ObjectsInfo';
import NCInfo from '../components/NCInfo';

const Dashboard = () => {
    return (
        <>
            <ConfigMenu />
            <LocationCoordinates />
            <Console />
            <MovementControls />
            {/* <FileCompare /> */}
            {/* <ObjectsInfo /> */}
            <NCInfo />
            <Map />
        </>
    );
};

export default Dashboard;