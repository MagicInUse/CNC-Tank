import { useState, useEffect } from 'react';

function Tester() {
    const [testData, setTestData] = useState(null);

    useEffect(() => {
        fetch('/api/test-data')
            .then((res) => res.json())
            .then((data) => setTestData(data))
            .catch((err) => console.error(err));
    }, []);

    const sendCommand = (command) => {
        fetch('/api/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command }),
        }).then((res) => console.log(res.status));
    };

    return (
        <div className="w-screen px-4 flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md text-center">
                <h3>ESP32 Tests</h3>
                <pre className="text-left">{JSON.stringify(testData, null, 2)}</pre>
                <button className="m-1" type="button" onClick={() => sendCommand('ON')}>Turn ON</button>
                <button className="m-1" type="button" onClick={() => sendCommand('OFF')}>Turn OFF</button>
            </div>
        </div>
    );
}

export default Tester;