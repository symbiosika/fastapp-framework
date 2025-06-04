# FastApp Framework

A powerful, abstracted framework for rapid application development that allows developers to focus on business logic while providing essential infrastructure and API endpoints out of the box.

## Overview

FastApp Framework is designed to accelerate application development by providing:

- A pre-configured web server
- Essential API endpoints
- Database integration
- Authentication and authorization
- File management
- AI capabilities
- Plugin system
- And much more

## Core Features

### Server Configuration

The framework is initialized through the `defineServer` function, which accepts a configuration object:

```typescript
defineServer({
  port: 3000, // Optional: Server port (default: 3000)
  basePath: "/api", // Base path for all API endpoints
  allowedOrigins: ["*"], // CORS configuration
  useStripe: false, // Enable/disable payment features
  useWhatsApp: false, // Enable/disable WhatsApp integration
  // ... more configuration options
});
```

### Built-in Services

The framework provides several pre-built services:

- **AI Service**: AI-related functionality
- **Email Service**: SMTP email handling
- **File Service**: File management and storage
- **Payment Service**: Payment processing (Stripe)
- **Plugin Service**: Plugin system management
- **User Management Service**: User authentication and management
- **WhatsApp Service**: WhatsApp integration
- **Job Service**: Background job processing

### API Endpoints

The framework automatically sets up various API endpoints:

- User Management (`/user/*`)
- Organization Management (`/organisation/*`)
- File Management (`/files/*`)
- AI Features (`/ai/*`)
- Payment Processing (`/payment/*`)
- Plugin Management (`/plugins/*`)
- Webhook Management (`/webhooks/*`)
- And more...

### Database Integration

The framework includes:

- Automatic database schema initialization
- Collection permissions management
- Database connection handling

### Security Features

- Authentication middleware
- CORS protection
- IP restriction capabilities
- License management

## Getting Started

1. Install the framework:

```bash
npm install fastapp-framework
```

2. Create your application entry point:

```typescript
import { defineServer } from "fastapp-framework";

const server = defineServer({
  // Your configuration here
});

// Start the server
server.listen();
```

## Customization

### Adding Custom Routes

```typescript
defineServer({
  customHonoApps: [
    {
      baseRoute: "/custom",
      app: (app) => {
        app.get("/", (c) => c.text("Custom Route"));
      },
    },
  ],
});
```

### Custom Database Schema

```typescript
defineServer({
  customDbSchema: {
    // Your custom schema definitions
  },
});
```

### Custom Jobs

```typescript
defineServer({
  jobHandlers: [
    {
      type: "custom-job",
      handler: async (data) => {
        // Your job logic
      },
    },
  ],
});
```
