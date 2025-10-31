import { useUser } from "@/hooks/useUser";
import ManagerReports from "@/components/manager/ManagerReports";
import EmployeeStats from "@/components/employee/EmployeeStats";
const Reports = () => {
  const { role } = useUser();
  if (role === "manager") return <ManagerReports />;
  if (role === "employee") return <EmployeeStats />;
  return <div>No reports available for customers.</div>;
};

export default Reports;
