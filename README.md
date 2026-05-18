# Task Management SaaS - Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

Update the following:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Your JWT secret key
- `FRONTEND_URL`: Your frontend URL (http://localhost:3000 for development)
- `NODEMAILER_USER`: Your Gmail address
- `NODEMAILER_PASSWORD`: Your Gmail app password

### 3. MongoDB Setup
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Copy the connection string
3. Update `MONGODB_URI` in `.env`

### 4. Gmail Setup for Email
1. Enable 2-step verification in your Gmail account
2. Generate an app password
3. Use the app password in `NODEMAILER_PASSWORD`

### 5. Run the Server
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/setup-password` - Setup password with invite token
- `GET /api/v1/auth/me` - Get current user (protected)

### Employees
- `GET /api/v1/employees` - Get all employees (admin only)
- `POST /api/v1/employees` - Add new employee (admin only)
- `PUT /api/v1/employees/:id` - Update employee (admin only)
- `DELETE /api/v1/employees/:id` - Delete employee (admin only)
- `GET /api/v1/employees/search` - Search employees (admin only)
- `GET /api/v1/employees/:id` - Get employee details

### Tasks
- `POST /api/v1/tasks` - Create task (admin only)
- `GET /api/v1/tasks` - Get all tasks (admin only)
- `GET /api/v1/tasks/my-tasks` - Get my tasks (employee)
- `GET /api/v1/tasks/analytics` - Get task analytics (admin)
- `GET /api/v1/tasks/search` - Search tasks
- `PUT /api/v1/tasks/:id/status` - Update task status
- `PUT /api/v1/tasks/:id` - Update task (admin only)
- `DELETE /api/v1/tasks/:id` - Delete task (admin only)
- `GET /api/v1/tasks/:id` - Get task details

### Notifications
- `GET /api/v1/notifications` - Get notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/mark-all-read` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

## Socket.io Events

### Client Events
- `userOnline` - Send when user comes online
- `taskAssigned` - Send when task is assigned
- `taskUpdated` - Send when task is updated
- `taskCompleted` - Send when task is completed

### Server Events
- `userStatusChanged` - User online/offline status
- `newTaskNotification` - New task assigned
- `taskStatusChanged` - Task status updated
- `taskCompleted` - Task completed

## Architecture

- **Models**: User, Task, Notification
- **Controllers**: Authentication, Employee, Task, Notification management
- **Middleware**: Authentication (JWT), Authorization (Role-based), Error handling
- **Utils**: Email sending, Token generation
- **Routes**: RESTful API endpoints
