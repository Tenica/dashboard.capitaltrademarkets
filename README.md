# BTC Investment Admin Panel

Admin panel for managing the BTC Investment Backend system.

## Features

- User Authentication (Login/Logout)
- Dashboard with statistics
- Invoice Management (View, Confirm, Cancel)
- Withdrawal Management (View, Confirm)
- Pending Confirmations (Credits and Withdrawals)
- Create Investment Plans
- System Wallet Management

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- btcInvBackend running on http://localhost:3001

## Installation

1. Navigate to the project directory:
```bash
cd btcinvadmin
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Make sure the backend (btcInvBackend) is running on port 3001

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Backend API Endpoints

The admin panel connects to the following backend routes:

### Authentication
- POST `/auth/login-user` - Login
- POST `/auth/create-user` - Create user
- POST `/auth/logout-user` - Logout

### Invoices
- GET `/invoice/view-all-invoice` - View all invoices
- GET `/invoice/view-one-invoice/:id` - View single invoice
- POST `/invoice/confirm-invoice/:id` - Confirm invoice
- POST `/invoice/cancel-invoice/:id` - Cancel invoice

### Withdrawals
- GET `/withdrawal/view-all-withdrawal-request` - View all withdrawals
- GET `/withdrawal/view-one-withdrawal-request/:id` - View single withdrawal
- POST `/withdrawal/confirm-withdrawal-request/:id` - Confirm withdrawal

### Pending Confirmations
- GET `/pending-confirmation/view-all-pending-confirmation` - View pending credits
- GET `/pending-confirmation/view-all-pending-withdrawal` - View pending withdrawals

### Plans
- POST `/plan/create-plan` - Create investment plan

### System Wallet
- POST `/system-wallet/create-system-wallet` - Create system wallet

### Investments
- GET `/investment/update-investment` - Update investments

### Wallet
- GET `/wallet/view-user-wallet` - View user wallet

## Default Admin Credentials

You will need to create an admin user in the backend first or use existing credentials.

## Project Structure

```
btcinvadmin/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js
│   │   └── PrivateRoute.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── Invoices.js
│   │   ├── Withdrawals.js
│   │   ├── PendingConfirmations.js
│   │   └── CreatePlan.js
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   └── App.css
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Runs the test suite

## Technologies Used

- React 18
- React Router DOM 6
- Axios for API calls
- CSS for styling

## Notes

- The API base URL is configured as `http://localhost:3001` in `src/services/api.js`
- Authentication tokens are stored in localStorage
- All routes except `/login` are protected and require authentication
