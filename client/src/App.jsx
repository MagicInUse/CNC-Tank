import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Tester from './pages/Tester';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Tester />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;