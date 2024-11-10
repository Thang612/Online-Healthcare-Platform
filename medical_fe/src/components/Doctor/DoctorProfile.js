import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Work, StarRate, School, Phone } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import viLocale from 'date-fns/locale/vi';
import { format } from 'date-fns';
import APIs, { endpoints } from '../../configs/APIs';
import { UserContext } from '../../App';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const generateTimeSlots = (start, end) => {
  const slots = [];
  let current = new Date();
  current.setHours(start, 0, 0, 0);
  const endDate = new Date();
  endDate.setHours(end, 0, 0, 0);

  while (current <= endDate) {
    const hours = current.getHours().toString().padStart(2, '0');
    const minutes = current.getMinutes().toString().padStart(2, '0');
    slots.push(`${hours}:${minutes}`);
    current.setMinutes(current.getMinutes() + 30);
  }

  return slots;
};

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const timeSlots = generateTimeSlots(8, 22);
  const [user] = useContext(UserContext);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);

  const navigate = useNavigate(); // Dùng để điều hướng


  const handleJoinCall = () => {
    if (selectedSlotInfo && selectedSlotInfo.idMeeting) {
      navigate(`/video-call/${selectedSlotInfo.idMeeting}`); // Điều hướng đến trang video call với idMeeting
    }
  };

  const fetchBookedSlots = async (date) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const res = await APIs.get(`${endpoints['appointments']}doctor`, {
        params: { doctorId: user.doctor.id, date: formattedDate },
      });
      setBookedSlots(res.data);
      console.log(bookedSlots)
    } catch (error) {
      console.error("Lỗi khi lấy danh sách slot đã đặt:", error);
    }
  };
  const fetchDoctorDetails = async () => {
    try {
      const res = await APIs.get(`${endpoints['doctors']}user/${user.id}`);
      setDoctor(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin bác sĩ:", error);
    }
  };

  const handleSlotClick = (slotInfo) => {
    setSelectedSlotInfo(slotInfo); // Lưu thông tin của slot đã chọn
    setOpenDialog(true); // Mở popup
  };



  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSlotInfo(null);
  };

  useEffect(() => {
    fetchDoctorDetails();
    fetchBookedSlots(new Date()); // Lấy slot cho ngày hiện tại khi component mount
  }, []);

  useEffect(() => {
    fetchBookedSlots(selectedDate);
  }, [selectedDate]);

  if (!doctor) {
    return <Typography variant="h6">Đang tải thông tin bác sĩ...</Typography>;
  }

  return (
    <>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Avatar alt={`${doctor.user.firstName} ${doctor.user.lastName}`} src="/doctor-image.jpg" sx={{ width: 120, height: 120 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <CardContent>
                <Typography variant="h5" component="div">{`${doctor.user.firstName} ${doctor.user.lastName}`}</Typography>
                <Typography color="text.secondary">{doctor.specialty.name}</Typography>
                <Typography color="primary" sx={{ mt: 1 }}>{`${doctor.fee}đ`}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  <Chip icon={<Phone />} label={`Lượt gọi khám: ${doctor.appointments.length || 0}`} />
                  <Chip icon={<School />} label={`Học vị: ${doctor.degree.name}`} />
                  <Chip icon={<Work />} label={`Kinh nghiệm: ${doctor.experience || 0} năm`} />
                  <Chip icon={<StarRate />} label={`Đánh giá: ${doctor.rating || 0} (0 đánh giá)`} />
                </Box>
              </CardContent>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>

            <Box sx={{ p: 3 }}>
              <Typography variant="h6">Lịch khám</Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={viLocale}>
                <DatePicker
                  label="Chọn ngày"
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
              <Typography sx={{ mt: 2 }}>Ngày đã chọn: {format(selectedDate, 'dd/MM/yyyy')}</Typography>

              <Grid container spacing={1} sx={{ mt: 2 }}>
                {timeSlots.map((slot) => {
                  // Check if the slot is booked
                  const bookedSlot = bookedSlots.find(
                    (booking) => dayjs(booking.startTime).format('HH:mm') === slot
                  );

                  // Only render the slot if it is booked
                  return (
                    <Grid item xs={6} sm={4} md={3} key={slot}>
                      <Button
                        variant="outlined"
                        fullWidth
                        color={bookedSlot ? "primary" : "error"}
                        disabled={!bookedSlot} // Disable if not booked
                        onClick={() => bookedSlot && handleSlotClick(bookedSlot)}
                      >
                        {slot}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </CardContent>
        </Card>

        {/* Popup hiển thị thông tin cuộc hẹn */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Chi tiết cuộc hẹn</DialogTitle>
          <DialogContent>
            {selectedSlotInfo ? (
              <>
                <Typography variant="body1">
                  <strong>Tên bệnh nhân: </strong> {selectedSlotInfo.patient.user.firstName} {selectedSlotInfo.patient.user.lastName}
                </Typography>
                <Typography variant="body1">
                  <strong>Thời gian bắt đầu:</strong> {dayjs(selectedSlotInfo.startTime).format('HH:mm')}
                </Typography>
                <Typography variant="body1">
                  <strong>Thời gian kết thúc:</strong> {dayjs(selectedSlotInfo.startTime).add(30, 'minute').format('HH:mm') }
                </Typography>
                <Typography variant="body1">
                  <strong>Ghi chú:</strong> {selectedSlotInfo.note || "Không có"}
                </Typography>
              </>
            ) : (
              <Typography variant="body2">Không có thông tin cuộc hẹn.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleJoinCall} variant="contained" color="primary">Tham Gia cuộc gọi</Button>
            <Button onClick={handleCloseDialog} color="primary">Đóng</Button>
          </DialogActions>
        </Dialog>

      </Container>
    </>
  );
};

export default DoctorProfile;
