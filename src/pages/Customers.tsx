
import { useUser } from "@/hooks/useUser"; // (or however you get current user)
import ManagerCustomerView from "@/components/manager/ManagerCustomerView";
import CustomerSelfView from "@/components/customer/CustomerPortal";

const Customers = () => {
  const { role } = useUser(); // returns { role: 'manager' | 'employee' | 'customer' }

  if (role === "manager") return <ManagerCustomerView />;
  if (role === "employee") return <div>Employee customer summary</div>;
  return <CustomerSelfView />;
};

export default Customers;
