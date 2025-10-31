import { Link } from "react-router-dom";
import { useUser } from "@/hooks/useUser";

const Navbar = () => {
  const { role } = useUser();

  return (
    <nav className="bg-primary text-white px-4 py-3 flex gap-4">
      <Link to="/">Home</Link>
      <Link to="/customers">Customers</Link>
      <Link to="/jobs">Jobs</Link>
      <Link to="/reports">Reports</Link>
      <Link to="/settings">Settings</Link>
      {role === "manager" && <span className="ml-auto font-bold">Manager Mode</span>}
    </nav>
  );
};

export default Navbar;
