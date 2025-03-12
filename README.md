# Rick Time Task Tracker

A modern task management application built with React, TypeScript, and Supabase.

## Features

- Create, edit, and delete tasks
- Track time spent on tasks
- Sort tasks by different criteria
- Priority-based task management
- Responsive design for desktop and mobile
- Dark mode support

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: React Hooks
- **Styling**: TailwindCSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/rick-time-task-tracker.git
   cd rick-time-task-tracker
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Database Schema

The application uses the following tables in Supabase:

### Tasks Table
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `name`: String
- `priority`: String (P1, P2, P3, P4)
- `is_running`: Boolean
- `last_start_time`: Timestamp
- `total_elapsed_time`: String (HH:MM:SS)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Task History Table
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `task_id`: UUID (foreign key to tasks)
- `start_date`: Date
- `elapsed_time`: String (HH:MM:SS)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## License

MIT

## Acknowledgements

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) 