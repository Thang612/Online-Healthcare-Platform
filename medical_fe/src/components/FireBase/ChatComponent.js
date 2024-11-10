import { useState, useEffect, useRef, useContext } from "react";
import { database, ref, query, orderByChild, equalTo, push, onValue } from "./firebase"; // Import necessary Firebase functions
import { Box, Typography, List, ListItem, ListItemText, TextField, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { UserContext } from "../../App";
import axios from "axios";

function ChatComponent({ idMeeting }) {
  const [inpMessage, setInpMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const input = useRef();
  const [user] = useContext(UserContext);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [openPrescriptionDialog, setOpenPrescriptionDialog] = useState(false); // Hộp thoại riêng cho đơn thuốc
  

  useEffect(() => {
    const messageQuery = query(
      ref(database, "message"),
      orderByChild("idMeeting"), // Query based on idMeeting
      equalTo(idMeeting) // Only get messages for the specific idMeeting
    );

    onValue(messageQuery, (dataSnapshot) => {
      let getMsg = [];
      dataSnapshot.forEach((d) => {
        getMsg.push(d.val());
      });
      setMessages(getMsg);
    });
  }, [idMeeting]); // Re-run the query if idMeeting changes

  const handleSendMessage = () => {
    if (inpMessage.trim() !== "") {
      const messageData = {
        idMeeting: idMeeting,
        name: user.doctor ? 'Bác sĩ' : 'Bệnh nhân',
        message: inpMessage,
        time: new Date().toLocaleString(),
      };
      push(ref(database, "message"), messageData);
      setInpMessage("");
    }
  };

  const formatMessage = (msg) => {
    if (typeof msg === 'object') {
      return JSON.stringify(msg); // Handle case where the message is an object
    }
    return msg; // Otherwise, just return the message
  };

  const handlePrescription= async (idMeeting) =>{
    try {
      const res = await axios.get(`http://localhost:3000/prescriptions/meeting/${idMeeting}`);
      setPrescriptionData(res.data); // Lưu dữ liệu đơn thuốc
      setOpenPrescriptionDialog(true); // Mở hộp thoại đơn thuốc
    } catch (error) {
      console.error("Error fetching prescription:", error);
    }
  }

  const handleClosePrescriptionDialog = () => {
    setOpenPrescriptionDialog(false);
    setPrescriptionData(null); // Đặt lại dữ liệu sau khi đóng
  };

  return (
    <>
    <style>{`
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

  

  /* Custom font size for better layout */
  h6, h1, h2, h3, h4, h5 {
    text-align: center;
  }
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
              <strong>Thuốc:</strong> {detail.medical} | <strong>Sáng:</strong> {detail.morning} | <strong>Trưa:</strong> {detail.noon} | <strong>Chiều:</strong> {detail.afternoon} | <strong>Tối:</strong> {detail.night}
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

    <Box sx={{ position: "relative", height: "70vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
  <Typography variant="h5" gutterBottom>
    Xin chào {user.doctor ? 'Bác sĩ' : 'Bệnh nhân'}
  </Typography>
  
  <Box sx={{ flexGrow: 1, overflowY: "auto", width: "100%" }}>
  <List sx={{ width: "100%" }}>
  {messages.map((msg, index) => (
    <ListItem key={index} sx={{ backgroundColor: "#f3f3f3", borderRadius: 2, marginBottom: 1, padding: 2 }}>
      <ListItemText
        primary={
          <>
            <Typography variant="subtitle2" component="span">
              {msg.name}:{" "}
            </Typography>
            {formatMessage(msg.message)}
          </>
        }
        secondary={
          <>
            <Typography variant="caption" component="span">
              - {msg.time}
            </Typography>
            {/* Điều kiện để hiển thị nút nếu msg.check là true */}
            {msg.check && (
              <Button onClick={() => handlePrescription(msg.idMeeting)}>
                Đơn thuốc
              </Button>
            )}
          </>
        }
      />
    </ListItem>
  ))}
</List>
  </Box>

  <Box
    sx={{
      width:'100%',
      display: "flex",
      alignItems: "center",
      padding: "10px",
      backgroundColor: "#fff",
      boxShadow: "0 -1px 5px rgba(0, 0, 0, 0.1)"
    }}
  >
    <TextField
      fullWidth
      label="Type a message"
      variant="outlined"
      value={inpMessage}
      onChange={(e) => setInpMessage(e.target.value)}
      inputRef={input}
      sx={{ marginRight: 1 }}
    />
    <IconButton color="primary" onClick={handleSendMessage} sx={{ height: 56 }}>
      <SendIcon />
    </IconButton>
  </Box>
</Box>
</>
  );
}

export default ChatComponent;
