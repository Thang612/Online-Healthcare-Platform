import React, { useContext, useState } from 'react';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { Container, FormControl, FormGroup, Input, InputLabel } from '@mui/material';
import { UserContext } from '../../App';  // Context lưu trạng thái người dùng
import APIs, { endpoints } from '../../configs/APIs';  // APIs đã được cấu hình sẵn
import Cookies from 'js-cookie'; // Để lưu trữ token dưới dạng cookie
import axios from 'axios'; // Sử dụng axios để gửi yêu cầu

const UserLogin = () => {
  const fields = [{
      label: "Tên đăng nhập",
      type: "text",
      field: "email"
  }, {
      label: "Mật khẩu",
      type: "password",
      field: "password"
  }];
  
  const [users, setUser] = useState({});
  const [user, dispatch] = useContext(UserContext);
  const nav = useNavigate();

  // Hàm thay đổi khi nhập dữ liệu vào form
  const change = (e, field) => {
      setUser(current => {
          return { ...current, [field]: e.target.value }
      });
  }

  // Hàm lấy thông tin user từ API /auth/profile
  const fetchUserProfile = async (token) => {
    try {
      // Gửi request kèm token trong header
      let res = await axios.get('http://localhost:3000/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}` // Truyền Bearer token
        }
      });

      console.info("User profile:", res.data);
      return res.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }

  // Hàm xử lý khi người dùng nhấn nút "Đăng nhập"
  const login = async (e) => {
      e.preventDefault();
      try {
          // Gửi yêu cầu đăng nhập
          let res = await APIs.post(`${endpoints['login']}`, { ...users });
          console.info(res.data);

          // Lưu access_token vào cookie
          Cookies.set("access_token", res.data.access_token, { expires: 1 }); // Lưu trong 1 ngày
          Cookies.set("refresh_token", res.data.refresh_token, { expires: 7 }); // Lưu refresh token trong 7 ngày

          // Lấy access_token để lấy thông tin người dùng
          const accessToken = res.data.access_token;
          const userProfile = await fetchUserProfile(accessToken);

          // Cập nhật thông tin người dùng vào context
          dispatch({
              type: "login",
              payload: userProfile.user
          });

          console.log(userProfile.user)

          if(userProfile.user.doctor)
            nav("/doctorprofile");
          if(userProfile.user.patient)
            nav("/patientprofile")
      } catch (ex) {
          console.error(ex);
      }
  }

  return (
    <Container>
      <h1 className="text-center text-info mt-1">ĐĂNG NHẬP NGƯỜI DÙNG</h1>
      <form onSubmit={login}>
        {fields.map((f) => (
          <FormControl key={f.field} fullWidth margin="normal">
            <InputLabel htmlFor={f.field}>{f.label}</InputLabel>
            <Input
              id={f.field}
              onChange={(e) => change(e, f.field)}
              value={users[f.field] || ''}
              type={f.type}
              placeholder={f.label}
            />
          </FormControl>
        ))}
        <FormGroup>
          <Button type="submit" variant="contained" color="primary">
            Đăng nhập
          </Button>
        </FormGroup>
      </form>
    </Container>
  );
};

export default UserLogin;
