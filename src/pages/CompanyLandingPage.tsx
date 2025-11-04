import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CompanyLandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
      <h1 className="text-6xl font-bold mb-8">YNM</h1>
      <p className="text-lg text-gray-700 mb-6 text-center max-w-md">
        Welcome to YNM — your trusted partner for lawn and landscape services.
      </p>
      <Button
        className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-md text-lg"
        onClick={() => navigate("/portal")}
      >
        Request Service
      </Button>
    </div>
  );
};

export default CompanyLandingPage;

