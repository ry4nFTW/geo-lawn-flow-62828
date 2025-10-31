import { useUser } from "@/hooks/useUser";
import ManagerSettings from "@/components/manager/ManagerSettings";
import UserSettings from "@/components/common/UserSettings";

const Settings = () => {
  const { role } = useUser();

  if (role === "manager") return <ManagerSettings />;
  return <UserSettings />;
};

export default Settings;

