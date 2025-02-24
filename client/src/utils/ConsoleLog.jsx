import { useContext } from 'react';
import { ConsoleContext } from '../context/ConsoleContext';

export const useConsoleLog = () => {
    const { addMessage } = useContext(ConsoleContext);

    return {
        logRequest: (content) => addMessage('blue', content),
        logResponse: (content) => addMessage('green', content),
        logError: (content) => addMessage('red', content)
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