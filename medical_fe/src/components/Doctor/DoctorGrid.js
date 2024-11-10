import React, { useContext, useEffect, useState } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    CardActions,
    Button,
    Avatar,
    Box,
    Pagination,
    MenuItem,
    FormControl,
    Select,
    InputLabel,
    Divider,
    Chip
} from '@mui/material';
import APIs, { endpoints } from '../../configs/APIs';
import DoctorCard from './DoctorCard';
import { UserContext } from '../../App';
import Gemini from '../Gemini/Gemini';



const DoctorGrid = () => {
    const [specialties, setSpecialties] = useState([]);
    const [degrees, setDegrees] = useState([]);
    const [doctors, setDoctors] = useState([]);

    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [selectedDegree, setSelectedDegree] = useState('');

    const [user, dispatch] = useContext(UserContext);

    const fetchSpecialty = async () => {
        try {
            const res = await APIs.get(`${endpoints['specialty']}`);
            setSpecialties(res.data);
        } catch (error) {
            console.error('Error fetching specialty:', error);
        }
    };

    const fetchDegree = async () => {
        try {
            const res = await APIs.get(`${endpoints['degrees']}`);
            setDegrees(res.data);
        } catch (error) {
            console.error('Error fetching degrees:', error);
        }
    };

    const fetchDoctor = async () => {
        try {
            const res = await APIs.get(`${endpoints['doctors']}`);
            setDoctors(res.data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    useEffect(() => {
        fetchSpecialty();
        fetchDegree();
        fetchDoctor();
    }, []);

    const handleSpecialtyChange = (event) => {
        setSelectedSpecialty(event.target.value);
    };

    const handleDegreeChange = (event) => {
        setSelectedDegree(event.target.value);
    };

    const filteredDoctors = doctors.filter((doctor) => {
        const matchSpecialty = selectedSpecialty ? doctor.specialty?.id === Number(selectedSpecialty) : true;
        const matchDegree = selectedDegree ? doctor.degree?.id === Number(selectedDegree) : true;
        return matchSpecialty && matchDegree;
    });

    return (
        <>
            <Container>
                <Typography variant="h4" align="center" gutterBottom sx={{ mt: 4 }}>
                    Đặt khám trước qua DTT - Khám bệnh nè
                </Typography>
                <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                    Để được tiếp đón ưu tiên và tư vấn với bác sĩ trực tuyến
                </Typography>
            </Container>
            <Container>
                <Grid container justifyContent="flex-end" spacing={2}>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel id="select-label-2">Chuyên môn:</InputLabel>
                            <Select
                                labelId="select-label-2"
                                id="select-2"
                                label="Chuyên môn"
                                value={selectedSpecialty}
                                onChange={handleSpecialtyChange}
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {specialties.length > 0 && specialties.map((specialty) => (
                                    <MenuItem key={specialty.id} value={specialty.id}>
                                        {specialty.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel id="select-label-1">Học vị:</InputLabel>
                            <Select
                                labelId="select-label-1"
                                id="select-1"
                                label="Học vị"
                                value={selectedDegree}
                                onChange={handleDegreeChange}
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {degrees.length > 0 && degrees.map((deg) => (
                                    <MenuItem key={deg.id} value={deg.id}>
                                        {deg.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Container>
            <Divider>
                <Chip label="Danh sách các bác sĩ" size="small" sx={{ m: 2 }} />
            </Divider>
            <Container>
                <Grid container spacing={3}>
                    {filteredDoctors.map((doctor, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <DoctorCard doctor={doctor} />
                        </Grid>
                    ))}
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination count={filteredDoctors.length > 0 ? Math.ceil(filteredDoctors.length / 10) : 1} color="primary" />
                </Box>
            </Container>
            <Gemini/>
        </>
    );
};

export default DoctorGrid;
