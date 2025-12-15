import { Provider } from "react-redux";
import { AppRouter } from "./router/AppRouter"
import { BrowserRouter } from 'react-router-dom';
import { store } from "./store";
import ChatbotWidget from "./calendar/components/ChatbotWidget"; 


export const CalendarApp = () => {
  return (
    <Provider store = {store}>
      <BrowserRouter>
            <AppRouter />
            <ChatbotWidget/>
      </BrowserRouter>
    </Provider>
  )
}
