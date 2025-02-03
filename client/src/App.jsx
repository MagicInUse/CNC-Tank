import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConsoleProvider } from './context/ConsoleContext';
import Dashboard from './pages/Dashboard';

function App() {
    return (
        <ConsoleProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                </Routes>
            </BrowserRouter>
        </ConsoleProvider>
    );
}

export default App;