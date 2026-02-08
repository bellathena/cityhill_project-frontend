import { useEffect, useState } from "react";
import api from "../lib/axios";

const Dashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        console.log("response:", res);
        setUsers(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.fullName} ({user.username})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
