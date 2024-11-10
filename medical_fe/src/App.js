import './App.css';
import UserLogin from './components/Auth/UserLogin';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Common/Header';
import { VideoRoom } from './components/VideoCall/VideoRoom';
import { createContext, useEffect, useReducer, useState } from 'react';
import UserReducer from './reducers/UserReducer';
import DoctorGrid from './components/Doctor/DoctorGrid';
import DoctorDetail from './components/Doctor/DoctorDetail';
import DoctorProfile from './components/Doctor/DoctorProfile';
import { onValue, ref } from 'firebase/database';
import { database } from './components/FireBase/firebase';
import MessageBox from './components/FireBase/MessageBox';
import { Alert, Snackbar } from '@mui/material';
import PatientProfile from './components/Patient/PaitentProfile';

export const UserContext = createContext();

function App() {
  const [user, dispatch] = useReducer(UserReducer);
  const [message, setMessage] = useState([]); // State để lưu thông điệp
  const [lastMsg, setLastMsg] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false); // State để điều khiển Snackbar


  useEffect(() => {
    const messagesRef = ref(database, "message");
    let msg = [];
    let lastMsgTemp = '';
    onValue(messagesRef, (data) => {
      msg = []; // Reset msg mỗi lần có thay đổi

      if (user) {
        data.forEach((d) => {
          if (d.val().userId === user.id && d.val().type === 'msgDoctor') {
            msg.push(d.val().title);
            lastMsgTemp = d.val().title;
          }
        });
      }
      // Cập nhật state với thông điệp mới nhất
      if (msg) {
        setMessage(msg);
      }

      setLastMsg(lastMsgTemp)
      setOpenSnackbar(true); // Mở Snackbar nếu có thông điệp

    });
  }, [user]); // Thêm user vào dependencies

  useEffect(() => {
    if (message) {
      console.log(message); // In thông điệp mới nhất
    }
  }, [message]); // Theo dõi sự thay đổi của message

  useEffect(() => {
    setCurrentMessage(lastMsg); // Cập nhật thông điệp hiện tại
  }, [lastMsg])

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return; // Không đóng nếu người dùng nhấn ra ngoài
    }

    setOpenSnackbar(false); 
  };

  return (
    <UserContext.Provider value={[user, dispatch]}>
      <BrowserRouter>
        <Header /> {/* Thêm Header nếu cần */}
        <Routes>
          <Route path="/" element={<DoctorGrid />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/video-call/:idMeeting" element={<VideoRoom />} />
          <Route path="/doctordetail/:doctorId" element={<DoctorDetail />} />
          <Route path="/doctorprofile/" element={<DoctorProfile />} />
          <Route path="/patientprofile/" element={<PatientProfile/>} />
        </Routes>

        <MessageBox messages={message} /> {/* Add the Material-UI message box */}
        {/* Hộp thông báo Snackbar */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000} // Thời gian hiển thị hộp thông báo (ms)
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} // Hiển thị ở góc trái bên dưới
        >
          <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
            {currentMessage}
          </Alert>
        </Snackbar>

      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;
