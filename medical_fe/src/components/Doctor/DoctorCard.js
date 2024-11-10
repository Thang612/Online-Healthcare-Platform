import {
    Card,
    CardContent,
    Typography,
    CardActions,
    Button,
    Avatar,
    Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DoctorCard = ({ doctor }) => {
    const fullName = `${doctor.user?.lastName || 'Unknown'} ${doctor.user?.firstName || ''}`.trim();
    const specialty = doctor.specialty?.name || 'Chưa có chuyên môn';
    const degree = doctor.degree?.name || 'Chưa có học vị';
    const appointments = doctor.appointments || []; // This is an array
    const nav = useNavigate('')

    return (
        <Card sx={{ maxWidth: 345 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
                <Avatar
                    alt={fullName}
                    src={doctor.imageUrl || ''}
                    sx={{ width: 80, height: 80 }}
                />
            </Box>
            <CardContent>
                <Typography gutterBottom variant="h6" component="div" align="center">
                    {fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                    Chuyên môn: {specialty}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                    Học vị: {degree}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                    Kinh nghiệm: {doctor.experience} năm
                </Typography>
                {/* Render appointments if they exist */}
                {appointments.length > 0 ? (
                    <Box>
                        <Typography variant="body2" color="text.secondary" align="center">
                            Cuộc hẹn:{appointments.length}
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary" align="center">
                        Không có cuộc hẹn nào.
                    </Typography>
                )}
            </CardContent>
            <CardActions sx={{ justifyContent: 'center' }}>
                <Button variant="contained" color="primary" onClick={()=>{nav(`/doctordetail/${doctor.id}`)}}>Đặt khám</Button>
            </CardActions>
        </Card>
    );
};

export default DoctorCard