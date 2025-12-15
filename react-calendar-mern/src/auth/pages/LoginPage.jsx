import { useEffect } from "react";
import Swal from "sweetalert2";
import { useAuthStore } from "../../hooks/useAuthStore";
import { useForm } from "../../hooks/useForm";
import { Link } from "react-router-dom";
import "./LoginPage.css";

const loginFormFields = {
  loginEmail: "",
  loginPassword: "",
};

export const LoginPage = () => {
  const { startLogin, errorMessage } = useAuthStore();
  const { loginEmail, loginPassword, onInputChange } =
    useForm(loginFormFields);

  const loginSubmit = (event) => {
    event.preventDefault();
    startLogin({ email: loginEmail, password: loginPassword });
  };

  useEffect(() => {
    if (errorMessage !== undefined) {
      Swal.fire("로그인 오류", errorMessage, "error");
    }
  }, [errorMessage]);

  return (
    <div className="auth-container">
      <h2>로그인</h2>
      <form onSubmit={loginSubmit}>
        <input
          type="email"
          placeholder="이메일"
          name="loginEmail"
          value={loginEmail}
          onChange={onInputChange}
        />
        <input
          type="password"
          placeholder="비밀번호"
          name="loginPassword"
          value={loginPassword}
          onChange={onInputChange}
        />

        <div className="checkbox-group">
          <label>
            <input type="checkbox" /> 자동 로그인
          </label>
          <label>
            <input type="checkbox" /> 아이디 저장
          </label>
        </div>

        <button type="submit" className="btn-primary">
          로그인
        </button>
      </form>

      <div className="auth-links">
        <Link to="/find-id">아이디 찾기</Link> |
        <Link to="/find-password"> 비밀번호 찾기</Link> |
        <Link to="/auth/register">회원가입</Link>
      </div>
    </div>
  );
};
