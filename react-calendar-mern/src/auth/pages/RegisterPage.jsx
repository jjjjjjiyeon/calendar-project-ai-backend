import { useEffect } from "react";
import Swal from "sweetalert2";
import { useAuthStore } from "../../hooks/useAuthStore";
import { useForm } from "../../hooks/useForm";
import { Link } from "react-router-dom";
import "./LoginPage.css";

const registerFormFields = {
  registerName: "",
  registerEmail: "",
  registerPassword: "",
  registerPassword2: "",
};

export const RegisterPage = () => {
  const { startRegister, errorMessage } = useAuthStore();
  const {
    registerEmail,
    registerName,
    registerPassword,
    registerPassword2,
    onInputChange,
  } = useForm(registerFormFields);

  const registerSubmit = (event) => {
    event.preventDefault();
    if (registerPassword !== registerPassword2) {
      Swal.fire("회원가입 오류", "비밀번호가 일치하지 않습니다.", "error");
      return;
    }
    startRegister({
      name: registerName,
      email: registerEmail,
      password: registerPassword,
    });
  };

  useEffect(() => {
    if (errorMessage !== undefined) {
      Swal.fire("회원가입 오류", errorMessage, "error");
    }
  }, [errorMessage]);

  return (
    <div className="auth-container">
      <h2>회원가입</h2>
      <form onSubmit={registerSubmit}>
        <input
          type="text"
          placeholder="이름"
          name="registerName"
          value={registerName}
          onChange={onInputChange}
        />
        <input
          type="email"
          placeholder="이메일"
          name="registerEmail"
          value={registerEmail}
          onChange={onInputChange}
        />
        <input
          type="password"
          placeholder="비밀번호"
          name="registerPassword"
          value={registerPassword}
          onChange={onInputChange}
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          name="registerPassword2"
          value={registerPassword2}
          onChange={onInputChange}
        />

        <button type="submit" className="btn-primary">
          회원가입
        </button>
      </form>

      <div className="auth-links">
        <Link to="/auth/login">이미 계정이 있으신가요? 로그인하기</Link>
      </div>
    </div>
  );
};
