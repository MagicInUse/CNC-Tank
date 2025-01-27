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
        <div>
            <h3>ESP32 Tests</h3>
            <pre style={{ textAlign: 'left' }}>{JSON.stringify(testData, null, 2)}</pre>
            <button onClick={() => sendCommand('ON')}>Turn ON</button>
            <button onClick={() => sendCommand('OFF')}>Turn OFF</button>
        </div>
    );
}

export default Tester;