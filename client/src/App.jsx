import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tester from './pages/Tester';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/test" element={<Tester />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;