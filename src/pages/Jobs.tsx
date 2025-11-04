//pages/src/jobs.tsx
import { useUser } from "@/hooks/useUser";
import ManagerJobCalendar from "@/components/manager/ManagerJobCalendar";
import EmployeeJobList from "@/components/employee/EmployeeJobList";
import CustomerJobHistory from "@/components/customer/CustomerJobHistory";
import { ManagerJobCalendar } from "@/components/manager/ManagerJobCalendar";
import EmployeeJobList from "@/components/employee/EmployeeJobList";
import CustomerJobHistory from "@/components/customer/CustomerJobHistory";


const Jobs = () => {
  const { role } = useUser();

  if (role === "manager") return <ManagerJobCalendar />;
  if (role === "employee") return <EmployeeJobList />;
  return <CustomerJobHistory />;
};

export default Jobs;

