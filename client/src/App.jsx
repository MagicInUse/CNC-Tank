import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConsoleProvider } from './context/ConsoleContext';
import { MachineProvider } from './context/MachineContext';
import Dashboard from './pages/Dashboard';
import OTAU from './pages/OTAU';
import InteractiveCalibration from './pages/InteractiveCalibration';

function App() {
    return (
        <ConsoleProvider>
            <MachineProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/update" element={<OTAU />} />
                        <Route path="/cal" element={<InteractiveCalibration />} />
                    </Routes>
                </BrowserRouter>
            </MachineProvider>
        </ConsoleProvider>
    );
}

export default App;