import { Link } from "react-router-dom";

const LawnmeLandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900">
      <h1 className="text-5xl font-bold mb-6">Welcome to LawnMe Dashboard</h1>
      <p className="text-lg mb-8 text-center max-w-md">
        This is your internal tool for managing customers, jobs, reports, and more.
      </p>
      <div className="flex gap-4">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          Go to Dashboard
        </Link>
        <Link to="/customers" className="text-blue-600 hover:underline">
          View Customers
        </Link>
      </div>
    </div>
  );
};

export default LawnmeLandingPage;

