import React, { useState, useRef, useContext } from 'react';
import { Box, TextField, Button, Typography, List, ListItem, ListItemText, CircularProgress, Paper } from '@mui/material';
import axios from 'axios';
import { UserContext } from '../../App';
import { push, ref } from 'firebase/database';
import { database } from '../FireBase/firebase';


const PrescriptionComponent = ({ idMeeting }) => {
    const [diagnosis, setDiagnosis] = useState(''); // Thêm state cho Chẩn đoán
    const [symptom, setSymptom] = useState(''); // Thêm state cho Triệu chứng  
  const [searchTerm, setSearchTerm] = useState('');
  const [medications, setMedications] = useState([]);
  const [selectedMedications, setSelectedMedications] = useState([
    {
      name: "Paracetamol",
      morning: 1,
      noon: 0,
      afternoon: 1,
      night: 0,
      note: "Uống với nước",
    },
    {
      name: "Siro ho",
      morning: 0,
      noon: 1,
      afternoon: 0,
      night: 1,
      note: "Sau bữa ăn",
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [prescriptionNote, setPrescriptionNote] = useState('Nghỉ ngơi trong 2 ngày');
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [user] = useContext(UserContext)

  const inputRef = useRef();

  // Function to search medications using RxNorm Approximate Term Search API
  const searchMedications = async () => {
    if (searchTerm.length < 4) return; // Only search if at least 4 characters
    setLoading(true);
    try {
      // Fetch medication suggestions using RxNorm Approximate Term Search API
      const response = await axios.get(
        `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${searchTerm}&maxEntries=10`
      );
      
      // Map through the results to get name and source
      const suggestions = response.data.approximateGroup.candidate.map(
        (candidate) => ({
          name: candidate.name || 'Không xác định',
          source: candidate.source
        })
      );

      setMedications(suggestions);
      setShowSuggestions(true); // Show the suggestions list
    } catch (error) {
      console.error('Lỗi khi tìm thuốc:', error);
      alert('Lỗi khi tìm thuốc');
    }
    setLoading(false);
  };

  // Function to handle typing in the search input and trigger search after 4 characters
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length >= 4) {
      searchMedications();
    } else {
      setMedications([]);
      setShowSuggestions(false); // Hide suggestions if input has less than 4 characters
    }
  };

  // Function to add a medication to the selected list with default dosages
  const addMedication = (medication) => {
    // Check if the medication is already in the selectedMedications list
    if (!selectedMedications.some((m) => m.name === medication.name)) {
      setSelectedMedications([
        ...selectedMedications,
        {
          name: medication.name,
          morning: 0,
          noon: 0,
          afternoon: 0,
          night: 0,
          note: '',
        },
      ]);
    }
    setShowSuggestions(false); // Hide suggestions when a medication is selected
  };

  // Function to update dosage and note for a medication
  const updateMedication = (name, field, value) => {
    setSelectedMedications(
      selectedMedications.map((med) =>
        med.name === name ? { ...med, [field]: value } : med
      )
    );
    console.log(selectedMedications)
  };

  // Function to remove a medication from the list
  const removeMedication = (name) => {
    setSelectedMedications(selectedMedications.filter((med) => med.name !== name));
  };

  // Function to submit the prescription to the backend API
  const submitPrescription = async () => {
    if (!selectedMedications.length || !diagnosis || !symptom) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
  
    setSubmitting(true);
    try {
      // Cập nhật prescriptionData với dữ liệu từ state
      const prescriptionData = {
        diagnosis, // Sử dụng giá trị từ state
        symptom,   // Sử dụng giá trị từ state
        note: prescriptionNote,
        details: selectedMedications.map((med) => ({
          medical: med.name,
          morning: parseInt(med.morning),  // Đảm bảo giá trị là số
          noon: parseInt(med.noon),
          afternoon: parseInt(med.afternoon),
          night: parseInt(med.night),  
          note: med.note || '', // Đảm bảo trường này không để trống
        })),
      };
  
      console.log(prescriptionData); // Kiểm tra xem dữ liệu đúng chưa
      await axios.post(`http://localhost:3000/prescriptions/${idMeeting}`, prescriptionData);
      alert('Đơn thuốc đã được gửi thành công');
      const messageData = {
        idMeeting: idMeeting,
        name: user.doctor ? 'Bác sĩ' : 'Bệnh nhân',
        message: "Đã lên đơn thuốc cho bạn",
        check: 'true',
        time: new Date().toLocaleString(),
      };
      push(ref(database, "message"), messageData);
      await axios.patch(`http://localhost:3000/appointments/${idMeeting}/status`, {
        status: 'done',
      });
      setSelectedMedications([]);
      setPrescriptionNote('');
      setDiagnosis(''); // Reset Chẩn đoán
      setSymptom('');   // Reset Triệu chứng
    } catch (error) {
      console.error('Lỗi khi gửi đơn thuốc:', error);
      alert('Không thể gửi đơn thuốc');
    }
    setSubmitting(false);
  };
  

  return (
    <Box sx={{ padding: 4, maxWidth: '600px', margin: 'auto' }}>
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Tạo đơn thuốc
      </Typography>
      <TextField
        fullWidth
        label="Chẩn đoán"
        value={diagnosis}
        onChange={(e) => setDiagnosis(e.target.value)}
        sx={{ marginBottom: 2 }}
      />

      {/* Trường nhập Triệu chứng */}
      <TextField
        fullWidth
        label="Triệu chứng"
        value={symptom}
        onChange={(e) => setSymptom(e.target.value)}
        sx={{ marginBottom: 2 }}
      />
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          label="Tìm thuốc"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          ref={inputRef}
          sx={{ marginBottom: 2 }}
        />
        <Button variant="contained" onClick={searchMedications} sx={{ marginBottom: 2 }}>
          Tìm thuốc
        </Button>
        {loading && <CircularProgress sx={{ marginLeft: 2 }} />}

        {/* Suggestions List */}
        {showSuggestions && medications.length > 0 && (
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 10,
              border: '1px solid #ddd',
              boxShadow: 3,
            }}
          >
            <List>
              {medications.map((medication, index) => (
                <ListItem key={index} button onClick={() => addMedication(medication)}>
                  <ListItemText primary={`${medication.name} - ${medication.source}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      <Typography variant="h6" sx={{ marginTop: 4 }}>
        Thuốc đã chọn:
      </Typography>
      <List>
        {selectedMedications.map((med) => (
          <ListItem key={med.name} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <ListItemText primary={med.name} />
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                label="Buổi sáng"
                type="number"
                value={med.morning}
                onChange={(e) => updateMedication(med.name, 'morning', e.target.value)}
                sx={{ width: '80px' }}
              />
              <TextField
                label="Buổi trưa"
                type="number"
                value={med.noon}
                onChange={(e) => updateMedication(med.name, 'noon', e.target.value)}
                sx={{ width: '80px' }}
              />
              <TextField
                label="Buổi chiều"
                type="number"
                value={med.afternoon}
                onChange={(e) => updateMedication(med.name, 'afternoon', e.target.value)}
                sx={{ width: '80px' }}
              />
              <TextField
                label="Buổi tối"
                type="number"
                value={med.night}
                onChange={(e) => updateMedication(med.name, 'night', e.target.value)}
                sx={{ width: '80px' }}
              />
            </Box>
            <TextField
              fullWidth
              label="Ghi chú"
              value={med.note}
              onChange={(e) => updateMedication(med.name, 'note', e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" color="error" onClick={() => removeMedication(med.name)}>
              Xóa
            </Button>
          </ListItem>
        ))}
      </List>

      <TextField
        fullWidth
        label="Ghi chú đơn thuốc"
        value={prescriptionNote}
        onChange={(e) => setPrescriptionNote(e.target.value)}
        multiline
        rows={4}
        sx={{ marginTop: 4 }}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={submitPrescription}
        disabled={submitting}
        sx={{ marginTop: 4 }}
      >
        {submitting ? <CircularProgress size={24} /> : 'Gửi đơn thuốc'}
      </Button>
    </Box>
  );
};

export default PrescriptionComponent;