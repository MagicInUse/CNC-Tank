import React from 'react';
import LocationCoordinates from '../components/LocationCoordinates';
import MovementControls from '../components/MovementControls';
import ConfigMenu from '../components/ConfigMenu';
import Tester from './Tester';

const Dashboard = () => {
    return (
        <>
            <ConfigMenu />
            <LocationCoordinates />
            <MovementControls />
        </>
    );
};

export default Dashboard;