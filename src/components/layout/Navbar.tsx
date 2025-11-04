// src/components/layout/Navbar.tsx

import { Link } from "react-router-dom";
import { useUser } from "@/hooks/useUser";

const Navbar = () => {
  const { role } = useUser();

  return (
    <nav className="bg-primary text-white px-4 py-3 flex gap-4">
      <Link to="/">Home</Link>

      {role === "manager" && (
        <>
          <Link to="/customers">Customers</Link>
          <Link to="/jobs">Jobs</Link>
          <Link to="/reports">Reports</Link>
          <Link to="/settings">Settings</Link>
        </>
      )}

      {role === "customer" && (
        <>
          <Link to="/portal">Portal</Link>
          <Link to="/customer">My Account</Link>
        </>
      )}

      <span className="ml-auto font-semibold capitalize">{role} View</span>
    </nav>
  );
};

export default Navbar;
