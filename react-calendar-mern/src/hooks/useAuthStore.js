import { useDispatch, useSelector } from "react-redux";
import { calendarApi } from "../api";
import { 
    clearErrorMessage, 
    onChecking, 
    onLogin, 
    onLogout, 
    onLogoutCalendar  
} from "../store";


export const useAuthStore = () => {

    const { status, user, errorMessage } = useSelector(state => state.auth);
    const dispatch = useDispatch();


    /* ==========================================================
       1) 로그인
    ========================================================== */
    const startLogin = async ({ email, password }) => {

        dispatch(onChecking());

        try {
            const { data } = await calendarApi.post('/auth', { email, password });

            // ❗ 실패한 경우
            if (!data.ok) {
                dispatch(onLogout(data.msg || "아이디 또는 비밀번호가 잘못되었습니다."));
                setTimeout(() => dispatch(clearErrorMessage()), 10);
                return;
            }

            // 성공
            localStorage.setItem("token", data.token);
            localStorage.setItem("uid", data.uid); // ★ uid 저장(캘린더 role 계산용)
            localStorage.setItem("token-init-date", new Date().getTime());

            dispatch(onLogin({ name: data.name, uid: data.uid }));

        } catch (error) {
            dispatch(onLogout("아이디 또는 비밀번호가 잘못되었습니다."));
            setTimeout(() => dispatch(clearErrorMessage()), 10);
        }
    };


    /* ==========================================================
       2) 회원가입
    ========================================================== */
    const startRegister = async ({ email, password, name }) => {

        dispatch(onChecking());

        try {
            const { data } = await calendarApi.post('/auth/new', { email, password, name });

            // ❗ 실패 시
            if (!data.ok) {
                dispatch(onLogout(data.msg || "회원가입 실패"));
                setTimeout(() => dispatch(clearErrorMessage()), 10);
                return;
            }

            // 성공
            localStorage.setItem("token", data.token);
            localStorage.setItem("uid", data.uid);
            localStorage.setItem("token-init-date", new Date().getTime());

            dispatch(onLogin({ name: data.name, uid: data.uid }));

        } catch (error) {
            dispatch(onLogout(error.response?.data?.msg || "회원가입 실패"));
            setTimeout(() => dispatch(clearErrorMessage()), 10);
        }
    };


    /* ==========================================================
       3) 토큰 재발급(자동 로그인)
    ========================================================== */
    const checkAuthToken = async () => {

        const token = localStorage.getItem("token");
        if (!token) return dispatch(onLogout());

        try {
            const { data } = await calendarApi.get("/auth/renew");

            // ❗ Spring은 실패해도 200 줄 수 있음 → 반드시 ok 체크
            if (!data.ok) {
                localStorage.clear();
                return dispatch(onLogout());
            }

            // 성공
            localStorage.setItem("token", data.token);
            localStorage.setItem("uid", data.uid);
            localStorage.setItem("token-init-date", new Date().getTime());

            dispatch(onLogin({ name: data.name, uid: data.uid }));

        } catch (error) {
            localStorage.clear();
            dispatch(onLogout());
        }
    };


    /* ==========================================================
       4) 로그아웃
    ========================================================== */
    const startLogout = () => {
        localStorage.clear();
        dispatch(onLogoutCalendar());
        dispatch(onLogout());
    };


    return {
        // state
        errorMessage,
        status, 
        user, 

        // methods
        startLogin,
        startRegister,
        checkAuthToken,
        startLogout,
    };
};
