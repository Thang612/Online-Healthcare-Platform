import React, { useState, useEffect, useContext } from 'react';
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
  DialogContentText,
  DialogActions,
  TextField,
  List,
  Modal,
  Fade,
} from '@mui/material';
import {Work, StarRate, School, Phone } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import viLocale from 'date-fns/locale/vi';
import { format } from 'date-fns';
import APIs, { endpoints } from '../../configs/APIs';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { database, ref, push, onValue, set } from '../FireBase/firebase';

import Backdrop from '@mui/material/Backdrop';
import Comment from './Comment';
import { UserContext } from '../../App';

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

const DoctorDetail = () => {
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const timeSlots = generateTimeSlots(8, 22);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openSymptomDialog, setOpenSymptomDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [startTime, setStartTime] = useState(null);
  const { doctorId } = useParams();
  const [bookedSlots, setBookedSlots] = useState([]);
  const [note, setNote] = useState('');

  const [newComment, setNewComment] = useState(''); // Bình luận mới
  const [comments, setComments] = useState([]); // Danh sách bình luận

  const [user] = useContext(UserContext)

  const fetchBookedSlots = async (date) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const res = await APIs.get(`${endpoints['appointments']}doctor`, {
        params: { doctorId, date: formattedDate },
      });
      setBookedSlots((res.data).map(booking => dayjs(booking.startTime).format('HH:mm')));
      console.log(bookedSlots)
    } catch (error) {
      console.error("Lỗi khi lấy danh sách slot đã đặt:", error);
    }
  };

  const fetchDoctorDetails = async () => {
    try {
      const res = await APIs.get(`${endpoints['doctors']}${doctorId}`);
      setDoctor(res.data);
      
      const commentRes = await APIs.get(`${endpoints['reviews']}doctor/${doctorId}`); // Thêm endpoint bình luận
      setComments(commentRes.data); // Lưu danh sách bình luận
    } catch (error) {
      console.error("Lỗi khi lấy thông tin bác sĩ hoặc bình luận:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if(!user ||!user.patient){
      alert('Bạn cần đăng nhập với vai trò bác sĩ');
      return;
    }
    try {
      const res = await APIs.post(`${endpoints['reviews']}add`, {
        content: newComment,
        doctorId,
        patientId: 1, // Cập nhật thông tin bệnh nhân phù hợp
      });
      setComments([ res.data, ...comments]); // Cập nhật danh sách bình luận
      setNewComment(''); // Xóa nội dung bình luận sau khi gửi
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
    }
  };
  
  

  useEffect(() => {
    fetchDoctorDetails();
    fetchBookedSlots(new Date());
  }, [doctorId]);

  useEffect(() => {
    fetchBookedSlots(selectedDate);
  }, [selectedDate]);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setOpenConfirmDialog(true);
    setStartTime(`${format(selectedDate, 'yyyy-MM-dd')}T${slot}:00`);
  };

  const handleConfirmAppointment = () => {
    setOpenConfirmDialog(false);
    setOpenSymptomDialog(true); // Mở dialog triệu chứng
  };

  const handleSymptomSubmit = () => {
    setOpenSymptomDialog(false);
    setOpenPaymentDialog(true);
  };

  const handleApprove = async (order) => {
    setDialogMessage("Thanh toán thành công qua PayPal!");
    setOpenPaymentDialog(false);
    setOpenConfirmDialog(false);  
  
    try {
      // Gọi API để tạo lịch hẹn trên server của bạn
      const response = await APIs.post(`${endpoints['appointments']}`, {
        appointments: {
          doctorId: doctor.id,
          patientId: 1, // Bạn cần cập nhật `patientId` từ dữ liệu của bệnh nhân
          startTime: startTime,
          status: 'scheduled',
          date: new Date(),
          note: note,
        },
        payment: {
          status: order.status,
          totalAmount: order.purchase_units[0].amount.value,
          idPayment: order.id,
        },
      });
  
      push(ref(database, "message"), {
        type: "msgDoctor",
        userId: doctor.user.id,
        title: "Bạn đã được đặt lịch vào ngày " + startTime,
        message: {
          appointments: {
            
            patientId: 1, // Bạn cần cập nhật `patientId` từ dữ liệu của bệnh nhân
            startTime: startTime,
            status: 'scheduled',
            date: new Date(),
            note: note,
          },
          payment: {
            status: order.status,
            totalAmount: order.purchase_units[0].amount.value,
            idPayment: order.id,
          },
        },
        time: new Date().toLocaleString()
      });

      fetchBookedSlots(selectedDate)
      console.log(response);
      handleOpenModal();

    } catch (error) {
      console.error(error);
    }
  };
  

  const handleCloseDialog = () => {
    setOpenConfirmDialog(false);
  };

  const [openModal, setOpenModal] = useState(false); // Thêm trạng thái modal
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  if (!doctor) {
    return <Typography variant="h6">Đang tải thông tin bác sĩ...</Typography>;
  }

  return (
    <>
    <Modal
  open={openModal}
  onClose={handleCloseModal}
  closeAfterTransition
  BackdropComponent={Backdrop}
  BackdropProps={{
    timeout: 500,
  }}
>
  <Fade in={openModal}>
    <Box sx={style}>
      <Typography id="transition-modal-title" variant="h6" component="h2">
        Thanh toán thành công
      </Typography>
      <Typography id="transition-modal-description" sx={{ mt: 2 }}>
        Cảm ơn bạn đã thanh toán. Lịch khám của bạn đã được đặt thành công.
      </Typography>
      <Button onClick={handleCloseModal} variant="contained" sx={{ mt: 2 }}>
        Đóng
      </Button>
    </Box>
  </Fade>
</Modal>

      <Dialog open={openConfirmDialog} onClose={handleCloseDialog}>
        <DialogTitle>{"Xác nhận đặt lịch"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn đặt lịch vào slot {selectedSlot} ngày {format(selectedDate, 'dd/MM/yyyy')}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleConfirmAppointment} autoFocus>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSymptomDialog} onClose={() => setOpenSymptomDialog(false)}>
        <DialogTitle>{"Nhập triệu chứng"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Triệu chứng"
            type="text"
            fullWidth
            variant="outlined"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSymptomDialog(false)}>Hủy</Button>
          <Button onClick={handleSymptomSubmit} color="primary">Tiếp tục thanh toán</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>{"Thanh toán với PayPal"}</DialogTitle>
        <DialogContent>
          <PayPalScriptProvider options={{ clientId: 'ATpjUjaxfhH7tz2Ck2Qt51OKYOggjZj70hFVsyScAEyl3LaT-jj07QjV8FLgPjCcmypxcNcdfatuMz3c' }}>
            
            <PayPalButtons
              style={{
                color: "blue",
                layout: "horizontal",
                height: 25,
                tagline: false, 
                shape: "pill",
              }}
              createOrder={(data, actions) => {
                const feeInUSD = (parseFloat((doctor.fee)/ 23000)).toFixed(2);
                return actions.order.create({
                  purchase_units: [{
                    description: "Thanh toán hoạt động",
                    amount: { value: feeInUSD },
                  }],
                });
              }}
              onApprove={async (data, actions) => {
                const order = await actions.order.capture();
                handleApprove(order);
              }}
              onCancel={() => alert("Thanh toán đã bị hủy")}
              onError={(err) => console.error("Paypal checkout onError", err)}
            />
          </PayPalScriptProvider>
        </DialogContent>
      </Dialog>

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
          <Divider />
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
            <Grid container spacing={1} sx={{ mt: 2 }}>
              {timeSlots.map((slot) => (
                <Grid item xs={6} sm={4} md={3} key={slot}>
                  <Button
                    variant="outlined"
                    fullWidth
                    color={bookedSlots.includes(slot) ? "error" : "primary"}
                    disabled={bookedSlots.includes(slot)}
                    onClick={() => handleSlotClick(slot)}
                  >
                    {slot}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>


          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
  <TextField
    fullWidth
    label="Bình luận của bạn"
    value={newComment}
    onChange={(e) => setNewComment(e.target.value)}
  />
  <Button variant="contained" onClick={handleCommentSubmit}>Gửi</Button>
</Box>
<List sx={{ mt: 2 }}>
  {comments.map((comment) => (
    <Comment comment={comment} />
  ))}
</List>

        </Card>

      </Container>
    </>
  );
};

export default DoctorDetail;