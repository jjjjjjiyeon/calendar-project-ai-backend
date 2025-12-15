import { useAuthStore } from "../../hooks/useAuthStore";
import "./Navbar.css";

export const Navbar = () => {
  const { startLogout, user } = useAuthStore();

  return (
    <div className="navbar">
      <div className="navbar-left">
        <i className="fas fa-calendar-alt"></i>
        <span>캘린더</span>
      </div>

      <div className="navbar-right">
        <span>{user.name}</span>
        <button onClick={startLogout}>로그아웃</button>
      </div>
    </div>
  );
};
