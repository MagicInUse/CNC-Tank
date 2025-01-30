import React from 'react';
import LocationCoordinates from '../components/LocationCoordinates';
import MovementControls from '../components/MovementControls';
import ConfigMenu from '../components/ConfigMenu';
import FileCompare from '../components/FileCompare';
import Tester from './Tester';

const Dashboard = () => {
    return (
        <>
            <ConfigMenu />
            <LocationCoordinates />
            <MovementControls />
            <FileCompare />
        </>
    );
};

export default Dashboard;