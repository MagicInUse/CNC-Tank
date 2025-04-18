import React, { useState } from 'react';
import axios from 'axios';

const OTAU = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setStatus('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsUploading(true);
        setStatus('Checking update status...');

        if (!file) {
            setStatus('Please select a firmware file');
            setIsUploading(false);
            return;
        }

        if (!file.name.endsWith('.bin')) {
            setStatus('Error: Only .bin files are allowed');
            setIsUploading(false);
            return;
        }

        try {
            // First check if device is ready for update
            const statusCheck = await axios.get('http://localhost:3001/api/update');
            if (!statusCheck.data.status === 'ready') {
                throw new Error('Device not ready for update');
            }

            setStatus('Updating firmware... This may take up to 30 seconds.');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Ensure message is shown for at least 1 second

            const formData = new FormData();
            formData.append('firmware', file, file.name);

            const response = await axios.post('http://localhost:3001/api/update', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setStatus(`Uploading: ${percentCompleted}%`);
                    if (percentCompleted === 100) {
                        setTimeout(() => {
                            setStatus('Installing firmware...');
                        }, 2000);
                    }
                },
                timeout: 30000
            });
            
            if (response.data.success) {
                setStatus('Update successful! Device is rebooting...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 5000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            setStatus(`Error: ${errorMessage}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">CNC Tank Firmware Update</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="file"
                        accept=".bin"
                        onChange={handleFileChange}
                        className="border p-2 rounded"
                        disabled={isUploading}
                    />
                </div>
                <button
                    type="submit"
                    className={`text-white px-4 py-2 rounded ${
                        isUploading || !file
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600'
                    }`}
                    disabled={isUploading || !file}
                >
                    {isUploading ? 'Uploading...' : 'Upload Firmware'}
                </button>
                {status && (
                    <div className={`mt-4 p-2 border rounded ${
                        status.includes('Error') ? 'bg-red-900' : 'bg-green-700'
                    }`}>
                        {status}
                    </div>
                )}
            </form>
        </div>
    );
};

export default OTAU;