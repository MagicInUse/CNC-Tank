# CNC-Tank# CNC-Tank

CNC-Tank is a comprehensive full-stack application designed to control and monitor CNC machines. This project leverages modern web technologies and microcontroller programming to provide a seamless and interactive user experience for CNC machine operations.

## Features

### Frontend
- **Real-time Monitoring**: Visualize the CNC machine's position and status in real-time using a dynamic map interface.
- **Interactive Console**: Send commands and receive feedback through an integrated console.
- **Configuration Management**: Easily configure machine settings and preferences through a user-friendly interface.
- **File Comparison**: Compare G-code files to ensure accuracy and consistency in CNC operations.
- **OTA Updates**: Perform over-the-air firmware updates for the CNC machine directly from the web interface.

### Backend
- **RESTful API**: A robust API to handle machine commands, status checks, and configuration updates.
- **WebSocket Integration**: Real-time communication between the server and client for instant updates and notifications.
- **ESP32 Integration**: Direct control and monitoring of the CNC machine using an ESP32 microcontroller.
- **GRBL Configuration**: Manage and validate GRBL settings to ensure precise machine operations.
- **Error Handling**: Comprehensive error handling and logging to ensure smooth and reliable operations.

## Technologies Used

### Frontend
- **React**: A powerful JavaScript library for building user interfaces.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **Vite**: A fast build tool and development server for modern web projects.
- **Socket.IO Client**: Real-time bidirectional event-based communication.

### Backend
- **Node.js**: A JavaScript runtime built on Chrome's V8 engine.
- **Express**: A minimal and flexible Node.js web application framework.
- **Socket.IO**: Enables real-time, bidirectional, and event-based communication.
- **Axios**: A promise-based HTTP client for making API requests.
- **ESP32**: A low-cost, low-power system on a chip microcontroller with integrated Wi-Fi and dual-mode Bluetooth.

## Getting Started

### Prerequisites
- Node.js and npm installed on your machine.
- An ESP32 microcontroller with the necessary firmware.

### Installation
- Application not ready for deployment. No installation instructions.

## Usage

### Frontend
- Navigate to the dashboard to monitor and control the CNC machine.
- Use the configuration menu to update machine settings.
- Upload G-code files for comparison and validation.
- Perform OTA updates through the firmware update page.

### Backend
- The server handles API requests for machine commands and status updates.
- WebSocket connections provide real-time communication between the client and server.
- The ESP32 microcontroller executes commands and reports status back to the server.

## Contributing

We welcome contributions from the community. Please follow these steps to contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

## Contact

For any inquiries or feedback, please direct message on [GitHub](https://github.com/MagicInUse).

---

Thank you for your interest in CNC-Tank! We hope this project demonstrates our commitment to delivering high-quality, innovative solutions in the field of CNC machine control and monitoring.