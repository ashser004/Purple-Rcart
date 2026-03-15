# Radius Cart (Purple-Rcart)

**Radius Cart** is a hyper-local marketplace designed for students and local shop owners to buy, sell, and rent items within a 2-5km radius. It fosters a community-driven economy by connecting neighbors and nearby students for quick, trusted transactions.

## 🚀 Features

*   **Hyper-Local Discovery**: Find items and services available within your immediate vicinity using geolocation.
*   **Buy, Sell, & Rent**: Flexible options to purchase items outright, sell your own goods, or rent items for temporary use.
*   **Seller Dashboard**: Dedicated tools for sellers to manage inventory, track orders, and view earnings.
*   **Secure Authentication**: User accounts managed via Firebase Authentication (Google & Email).
*   **Real-time Chat**: Integrated messaging system for buyers and sellers to communicate directly.
*   **Digital Wallet**: Built-in wallet feature for managing payments and transactions.
*   **QR Code Verification**: Secure order pickup and delivery verification using QR codes.
*   **Interactive Maps**: Visualize product locations on an interactive map using Leaflet.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Realtime Database, Authentication)
*   **Storage**: [Cloudinary](https://cloudinary.com/) (Image management)
*   **Maps**: [Leaflet](https://leafletjs.com/) & React-Leaflet
*   **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   npm, yarn, or pnpm
*   A Firebase project
*   A Cloudinary account

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/purple-rcart.git
    cd purple-rcart
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables:**

    Create a `.env.local` file in the root directory and add your Firebase and Cloudinary credentials:

    ```env
    # Firebase Client SDK
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
    NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url

    # Cloudinary
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
├── app/                  # Next.js App Router directory
│   ├── (main)/           # Main application routes (layout with nav)
│   │   ├── chat/         # Chat functionality
│   │   ├── explore/      # Search and discovery
│   │   ├── home/         # Main feed
│   │   ├── profile/      # User profile & settings
│   │   ├── sell/         # Selling interface
│   │   └── ...
│   ├── api/              # API routes (Cloudinary, Wallet, etc.)
│   ├── login/            # Authentication pages
│   └── ...
├── components/           # Reusable UI components
├── lib/                  # Utility functions and contexts
│   ├── auth-context.tsx  # Authentication state management
│   ├── firebase.ts       # Firebase initialization
│   ├── cloudinary.ts     # Image upload logic
│   └── ...
├── public/               # Static assets
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
