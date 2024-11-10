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
  TextField,
  Tooltip
} from '@mui/material';
import { Work, StarRate, School, Phone } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import viLocale from 'date-fns/locale/vi';
import { format } from 'date-fns';
import APIs, { endpoints } from '../../configs/APIs';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
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

const fetchDrugInfo = async (drugName) => {
  try {
    // Fetch RxCUI using the drug name
    const response = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui?name=${drugName}`);
    const rxcui = response.data.idGroup.rxnormId[0]; // Assuming we get the first RxCUI

    // Fetch drug information using RxCUI
    const detailsResponse = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`);
    return detailsResponse.data.properties; // Returns the drug details
  } catch (error) {
    console.error("Error fetching RxNorm data:", error);
    return null;
  }
};

const PatientProfile = () => {
  const [patient, setPatient] = useState(null); // Fetch patient details
  const [selectedDate, setSelectedDate] = useState(new Date());
  const timeSlots = generateTimeSlots(8, 22);
  const [appointments, setAppointments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [user] = useContext(UserContext);

  const [prescriptionData, setPrescriptionData] = useState(null);
  const [openPrescriptionDialog, setOpenPrescriptionDialog] = useState(false); // Hộp thoại riêng cho đơn thuốc
  const [hoveredDrugInfo, setHoveredDrugInfo] = useState(null); // Store the drug info
  const [loading, setLoading] = useState(false); // Loading state for drug info

  const navigate = useNavigate(); // Use navigate for redirection

  const handlePrescriptionClick = async (appointmentId) => {
    try {
      const res = await axios.get(`http://localhost:3000/prescriptions/${appointmentId}`);
      setPrescriptionData(res.data); // Lưu dữ liệu đơn thuốc
      setOpenPrescriptionDialog(true); // Mở hộp thoại đơn thuốc
    } catch (error) {
      console.error("Error fetching prescription:", error);
    }
  };

  const handleClosePrescriptionDialog = () => {
    setOpenPrescriptionDialog(false);
    setPrescriptionData(null); // Đặt lại dữ liệu sau khi đóng
  };

  const handleJoinCall = () => {
    if (selectedAppointment && selectedAppointment.idMeeting) {
      navigate(`/video-call/${selectedAppointment.idMeeting}`); // Redirect to video call with meeting ID
    }
  };

  const fetchPatientAppointments = async (date) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const res = await APIs.get(`${endpoints['appointments']}patient`, {
        params: { patientId: user.patient.id, date: formattedDate },
      });
      setAppointments(res.data); // Update with fetched appointments
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchPatientDetails = async () => {
    try {
      const res = await APIs.get(`${endpoints['patients']}user/${user.id}`);
      setPatient(res.data);
    } catch (error) {
      console.error("Error fetching patient details:", error);
    }
  };

  const handleSlotClick = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenDialog(true); // Mở popup
  };

  useEffect(() => {
    fetchPatientDetails();
    fetchPatientAppointments(new Date()); // Fetch appointments for the current day when the component is mounted
  }, []);

  useEffect(() => {
    fetchPatientAppointments(selectedDate); // Fetch appointments for the selected date
  }, [selectedDate]);

  const handleMouseEnter = async (drugName) => {
    setLoading(true); // Set loading state
    const drugInfo = await fetchDrugInfo(drugName);
    setHoveredDrugInfo(drugInfo); // Update the state with fetched drug information
    setLoading(false); // Turn off loading
  };

  const handleMouseLeave = () => {
    setHoveredDrugInfo(null); // Reset when the user leaves hover
  };

  if (!patient) {
    return <Typography variant="h6">Đang tải thông tin bệnh nhân...</Typography>;
  }

  return (
    <>
      <style>
        {`
         @media print {
          .no-print {
            display: none;
          }

          body {
            margin: 0;
            padding: 0;
            width: 21cm; /* A4 width */
            height: 29.7cm; /* A4 height */
          }

          .printable-area {
            margin: 0;
            padding: 2cm;
            width: 100%;
            height: auto;
            background-color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: left;
            font-size: 5cm  ; /* Larger font size for subtitles */
          }

          h6, h1, h2, h3, h4, h5 {
            text-align: center;
          }
        `}
      </style>

      {/* Dialog riêng cho đơn thuốc */}
      <Dialog open={openPrescriptionDialog} onClose={handleClosePrescriptionDialog}>
        <DialogTitle>Chi tiết đơn thuốc</DialogTitle>
        <DialogContent>
          {prescriptionData ? (
            <>
              <Typography variant="body1"><strong>Chẩn đoán:</strong> {prescriptionData[0].diagnosis}</Typography>
              <Typography variant="body1"><strong>Triệu chứng:</strong> {prescriptionData[0].symptom}</Typography>
              <Typography variant="body1"><strong>Ghi chú:</strong> {prescriptionData[0].note || "Không có"}</Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>Chi tiết thuốc</Typography>
              {prescriptionData[0].details.map((detail) => (
                <Box key={detail.id} sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    {/* Tooltip for medication name */}
                    <Tooltip
                      title={
                        loading ? 'Loading...' : (
                          hoveredDrugInfo ? (
                            <>
                              <Typography variant="body2"><strong>Name:</strong> {hoveredDrugInfo.name}</Typography>
                              <Typography variant="body2"><strong>Synonym:</strong> {hoveredDrugInfo.synonym || "N/A"}</Typography>
                              <Typography variant="body2"><strong>Type:</strong> {hoveredDrugInfo.tty}</Typography>
                            </>
                          ) : "No information available"
                        )
                      }
                      placement="top"
                    >
                      <span
                        style={{ textDecoration: 'underline', cursor: 'pointer' }}
                        onMouseEnter={() => handleMouseEnter(detail.medical)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <strong>Thuốc:</strong> {detail.medical}
                      </span>
                    </Tooltip>
                    | <strong>Sáng:</strong> {detail.morning}
                    | <strong>Trưa:</strong> {detail.noon}
                    | <strong>Chiều:</strong> {detail.afternoon}
                    | <strong>Tối:</strong> {detail.night}
                  </Typography>
                  <Typography variant="body2"><strong>Ghi chú:</strong> {detail.note || "Không có"}</Typography>
                </Box>
              ))}
            </>
          ) : (
            <Typography variant="body2">Không có thông tin đơn thuốc.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.print()} variant="contained" color="primary" className="no-print">In đơn thuốc</Button>
          <Button onClick={handleClosePrescriptionDialog} color="primary" className="no-print">Đóng</Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Avatar alt={`${patient.user.firstName} ${patient.user.lastName}`} src="/patient-image.jpg" sx={{ width: 120, height: 120 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <CardContent>
                <Typography variant="h5" component="div">{`${patient.user.firstName} ${patient.user.lastName}`}</Typography>
                <Typography color="text.secondary">{`Blood Type: ${patient.blood}`}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  <Chip icon={<Phone />} label={`Appointments: ${patient.appointments.length}`} />
                </Box>
              </CardContent>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6">Thời gian</Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={viLocale}>
                <DatePicker
                  label="Choose Date"
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
              <Typography sx={{ mt: 2 }}>Selected Date: {format(selectedDate, 'dd/MM/yyyy')}</Typography>

              <Grid container spacing={1} sx={{ mt: 2 }}>
                {timeSlots.map((slot) => {
                  // Check if the slot is booked
                  const bookedSlot = appointments.find(
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

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6">Lịch sử khám</Typography>

              {patient && patient.appointments ? (
                patient.appointments.slice().reverse().map((appointment) => (
                  <Card key={appointment.id} sx={{ mb: 2, boxShadow: 1, borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body1">
                        <strong>Ngày:</strong> {dayjs(appointment.date).format('DD/MM/YYYY')} | <strong>Giờ:</strong> {dayjs(appointment.startTime).format('HH:mm')}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Ghi chú:</strong> {appointment.note || 'Không có ghi chú'} | <strong>Trạng thái:</strong> {appointment.status}
                      </Typography>
                      {/* Nút xem đơn thuốc riêng biệt */}
                      {appointment.status !== 'scheduled' ? (
                        <Button onClick={() => handlePrescriptionClick(appointment.id)}>Xem đơn thuốc</Button>
                      ) : (
                        <Button disabled>Xem đơn thuốc</Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Typography variant="body2">Không có cuộc hẹn nào được tìm thấy.</Typography>
              )}

            </Box>
          </CardContent>
        </Card>

        {/* Popup hiển thị thông tin cuộc hẹn */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Chi tiết cuộc hẹn</DialogTitle>
          <DialogContent>
            {selectedAppointment ? (
              <>
                <Typography variant="body1">
                  <strong>Tên bác sĩ:</strong> {selectedAppointment.doctor.user.firstName} {selectedAppointment.doctor.user.lastName}
                </Typography>
                <Typography variant="body1">
                  <strong>Thời gian bắt đầu:</strong> {dayjs(selectedAppointment.startTime).format('HH:mm')}
                </Typography>
                <Typography variant="body1">
                  <strong>Thời gian kết thúc:</strong> {dayjs(selectedAppointment.startTime).add(30, 'minute').format('HH:mm')}
                </Typography>
                <Typography variant="body1">
                  <strong>Ghi chú:</strong> {selectedAppointment.note || "Không có"}
                </Typography>
              </>
            ) : (
              <Typography variant="body2">Không có thông tin cuộc hẹn.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleJoinCall} variant="contained" color="primary">Tham Gia cuộc gọi</Button>
            <Button onClick={() => setOpenDialog(false)} color="primary">Đóng</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default PatientProfile;
