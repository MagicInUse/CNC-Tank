import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConsoleProvider } from './context/ConsoleContext';
import { MachineProvider } from './context/MachineContext';
import Dashboard from './pages/Dashboard';

function App() {
    return (
        <ConsoleProvider>
            <MachineProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                    </Routes>
                </BrowserRouter>
            </MachineProvider>
        </ConsoleProvider>
    );
}

export default App;