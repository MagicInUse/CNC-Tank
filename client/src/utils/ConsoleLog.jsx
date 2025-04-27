import { useContext } from 'react';
import { ConsoleContext } from '../context/ConsoleContext';

export const useConsoleLog = () => {
    const { addMessage } = useContext(ConsoleContext);

    return {
        logRequest: (content) => addMessage('info', content),
        logResponse: (content) => addMessage('success', content),
        logError: (content) => addMessage('error', content)
    };
};

// // Usage example in any component:
// import { useConsoleLog } from '../utils/ConsoleLog';
//
// const SomeComponent = () => {
//     const { logRequest, logResponse, logError } = useConsoleLog();
//
//     const handleAction = async () => {
//         logRequest('Sending request...');
//         try {
//             // ... API call
//             logResponse('Request successful');
//         } catch (error) {
//             logError(`Error: ${error.message}`);
//         }
//     };
// };