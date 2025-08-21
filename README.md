# Real-Time Chat Application

A simple, elegant real-time chat application built with Node.js, Express, and Socket.IO. This application allows multiple users to chat in real-time with a modern, responsive interface.

## Features

- **Real-time messaging** - Messages appear instantly for all connected users
- **Modern UI** - Clean, WhatsApp-inspired design with smooth animations
- **Responsive design** - Works seamlessly on desktop and mobile devices
- **Auto-scroll** - Automatically scrolls to show the latest messages


## Getting Started

### Prerequisites

- Node.js (version 12 or higher)
- npm (comes with Node.js)

### Installation

1. Clone or download the project files
2. Install dependencies:
   ```bash
   npm install express socket.io
   ```

### Project Structure

```
connecto/
├── index.js          # Server-side code
├── public/
│   └── index.html    # Client-side code (HTML, CSS, JS)
└── README.md         # This file
```

### Running the Application

1. Start the server:
   ```bash
   node index.js
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:9000
   ```

3. Open multiple browser tabs or share the URL with others to test the real-time chat functionality!

## Technology Stack

### Backend
- Node.js
- Express.js
- Socket.IO (for real-time communication)
- HTTP server

### Frontend
- HTML5
- CSS3 (with animations and responsive design)
- Vanilla JavaScript
- Socket.IO client

## How It Works

1. **Connection**: When users open the app, they automatically connect to the chat room
2. **Sending Messages**: Users type messages and click "Send" or press Enter
3. **Real-time Broadcasting**: Messages are instantly broadcast to all connected users
4. **Message Status**: Shows pending status for messages, then updates with timestamp when delivered
5. **Visual Feedback**: Smooth animations and different styles for sent vs received messages

## UI Features

- **Message Bubbles**: Different colors and alignment for sent (green, right) vs received (white, left) messages
- **Timestamps**: All messages show the time they were sent
- **Smooth Animations**: Fade-in effect for new messages
- **Modern Styling**: Clean, professional appearance with subtle shadows and rounded corners
- **Responsive Layout**: Adapts to different screen sizes

## Customization

You can easily customize the application by modifying:

- **Colors**: Update the CSS color scheme in the `<style>` section
- **Port**: Change the port number in `index.js` (default: 9000)
- **Message Format**: Modify the message structure in the Socket.IO event handlers
- **UI Layout**: Adjust the HTML structure and CSS styling


## License

This project is open source and available under the MIT License.

## Contributing

Feel free to fork this project and submit pull requests for any improvements!
