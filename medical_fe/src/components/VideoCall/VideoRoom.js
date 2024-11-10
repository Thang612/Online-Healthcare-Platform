import React, { useContext, useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { VideoPlayer } from './VideoPlayer'; // Adjust the correct path to VideoPlayer
import { Box, Button, Fab, TextField } from '@mui/material';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useConnectionState } from 'agora-rtc-react';
import { UserContext } from '../../App';
import PrescriptionComponent from '../RxNom/PrescriptionComponent';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ChatIcon from '@mui/icons-material/Chat';
import ChatComponent from '../FireBase/ChatComponent';


const APP_ID = '718f01f1af4847bfa65a2cb1bb454b00'; // Replace with your Agora APP ID

const createAgoraClient = (onVideoTrack, onUserDisconnected) => {
  const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

  client.on('user-published', async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    if (mediaType === 'video') {
      onVideoTrack(user);
    }
  });

  client.on('user-left', (user) => {
    onUserDisconnected(user);
  });

  return client;
};

export const VideoRoom = () => {
  const { idMeeting } = useParams(); // Get idMeeting from URL
  const [users, setUsers] = useState([]);
  const [uid, setUid] = useState(null);
  const [client, setClient] = useState(null);
  const [localTracks, setLocalTracks] = useState([]);
  const [screenTrack, setScreenTrack] = useState(null); // State to manage screen share track
  const [channel, setChannel] = useState('');

  const [user] = useContext(UserContext)

  const [isPrescriptionVisible, setPrescriptionVisible] = useState(false); // State to control Prescription visibility
  const [isChatVisible, setChatVisible] = useState(false); // State to control Chat visibility

  // Toggle visibility of PrescriptionComponent
  const togglePrescription = () => {
    setPrescriptionVisible(!isPrescriptionVisible);
  };

  const toggleChat = () => {
    setChatVisible(!isChatVisible); // Toggle chat visibility
  };

  useEffect(() => {
    setChannel(idMeeting); // Update channel with idMeeting from URL
    const onVideoTrack = (user) => {
      setUsers((prev) => [...prev, user]);
    };

    const onUserDisconnected = (user) => {
      setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    };

    const agoraClient = createAgoraClient(onVideoTrack, onUserDisconnected);
    setClient(agoraClient);

    return () => {
      if (agoraClient) {
        agoraClient.leave(); // Disconnect from room
      }
    };
  }, []);

  const joinRoom = async () => {
    // Check if the client is already connecting or connected
    if (client.connectionState === 'CONNECTING' || client.connectionState === 'CONNECTED') {
      console.warn('Client is already connecting/connected to a room.');
      return;
    }
  
    if (!channel) {
      alert("Please enter a room code!");
      return;
    }
  
    try {
      const response = await axios.get(`http://localhost:3000/videocall/generate-token`, {
        params: {
          channel,
          uid: 0,
        },
      });
  
      const { token } = response.data;
  
      if (!token) {
        throw new Error('Token is undefined');
      }
  
      const { uid: newUid } = await client.join(APP_ID, channel, token);
      setUid(newUid);
  
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      await client.publish(tracks);
  
      setLocalTracks(tracks);
      setUsers((prev) => [...prev, { uid: newUid, videoTrack: tracks[1], audioTrack: tracks[0] }]);
    } catch (error) {
      console.error("Failed to join the room:", error);
    }
  };
  

  const leaveRoom = async () => {
    if (client) {
      await client.leave();

      localTracks.forEach(track => {
        track.stop();
        track.close();
      });

      if (screenTrack) {
        screenTrack.stop();
        screenTrack.close();
        setScreenTrack(null);
      }

      setLocalTracks([]);
      setUid(null);
      setUsers([]);
    }
  };

  const startScreenSharing = async () => {
    try {
      // Unpublish the camera track for remote participants
      if (localTracks.length > 0) {
        await client.unpublish(localTracks[1]); // Unpublish the video track (camera) for remote users
        console.log('Camera track unpublished');
      }

      // Start screen sharing
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1", // Screen resolution setting
        optimizationMode: 'detail', // Optimized for screen details
      });

      console.log('Screen sharing track created:', screenTrack);

      // Publish screen sharing track for remote participants
      await client.publish(screenTrack);
      console.log('Screen sharing track published');

      setScreenTrack(screenTrack);

      // Keep showing local camera feed only for yourself (local view)
      setUsers((prev) => [...prev.filter(user => user.uid !== uid), { uid, videoTrack: localTracks[1], local: true }]);

      // Add screen sharing track to user list for rendering
      setUsers((prev) => [...prev, { uid: 'screen', videoTrack: screenTrack }]);
    } catch (error) {
      console.error("Failed to start screen sharing:", error);
    }
  };

  const stopScreenSharing = async () => {
    if (screenTrack) {
      await client.unpublish(screenTrack);
      screenTrack.stop();
      screenTrack.close();
      setScreenTrack(null);

      // Re-publish the camera track for remote participants after screen sharing is stopped
      if (localTracks.length > 0) {
        await client.publish(localTracks[1]); // Re-publish the video track (camera)
        console.log('Camera track re-published');
      }

      // Remove the screen sharing track from the user list
      setUsers((prev) => prev.filter(user => user.uid !== 'screen'));
    }
  };

  return (
    <>
    {user?.doctor && ( // Chỉ hiển thị nếu user.doctor tồn tại
  <>
    <Fab
      color="primary"
      aria-label="toggle-prescription"
      onClick={togglePrescription}
      sx={{ position: 'absolute', bottom: '140px', right: '20px' }} // Điều chỉnh vị trí nếu cần
    >
      <MedicalServicesIcon />
    </Fab>

    {/* PrescriptionComponent placed with absolute positioning */}
    {isPrescriptionVisible && (
      <Box
        sx={{
          zIndex:'99',
          position: 'absolute',
          top: '50px',
          right: '0',
          width: '400px', // Điều chỉnh kích thước nếu cần
          height: '60vh', // Đặt chiều cao cố định
          backgroundColor: '#fff',
          borderLeft: '1px solid #ddd',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          overflowY: 'auto', // Cho phép cuộn nội dung bên trong
        }}
      >
        <PrescriptionComponent idMeeting={channel} />
      </Box>
    )}
  </>
)}

    {/* Chat Toggle Button */}
    <Fab
            color="secondary"
            aria-label="toggle-chat"
            onClick={toggleChat}
            sx={{ position: 'absolute', bottom: '70px', right: '20px' }}
          >
            <ChatIcon />
          </Fab>

          {/* ChatComponent */}
          {isChatVisible && (
            <Box
              sx={{
                zIndex: '99',
                position: 'absolute',
                top: '50px',
                left: '0',
                width: '400px',
                height: '70vh',
                backgroundColor: '#fff',
                borderRight: '1px solid #ddd',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                padding: '16px',
                overflowY: 'auto',
              }}
            >
              <ChatComponent idMeeting={channel}/>
            </Box>
          )}

    <Box sx={{ display: 'flex', flexDirection: 'column', height: '80vh', width: '100vw', backgroundColor: '#f0f0f0' }}>
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {/* Render local user's video track */}
        {users
          .filter((user) => user.uid !== 'screen') // Filter out screen sharing to avoid duplication
          .map((user, index) => (
            <VideoPlayer
              key={user.uid}
              user={user}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)',
              }}
            />
          ))}

        {/* Render screen share track in a smaller window */}
        {screenTrack && (
          <VideoPlayer
            user={{ uid: 'screen', videoTrack: screenTrack }}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              width: '300px',
              height: '200px',
              borderRadius: '8px',
              boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)',
            }}
          />
        )}
      </Box>

      <Box sx={{ padding: '16px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)', position: 'fixed', bottom: '0', width:'100vw' }}>
        <TextField
          label="Room Code"
          variant="outlined"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          sx={{ flex: 1, marginRight: '16px' }}
          disabled={true} // Room code can't be edited, as it's from the URL
        />
        <Button variant="contained" onClick={joinRoom}>
          Join Room
        </Button>
        <Button variant="outlined" onClick={leaveRoom} sx={{ marginLeft: '16px' }}>
          Leave Room
        </Button>
        <Button
          variant="contained"
          onClick={screenTrack ? stopScreenSharing : startScreenSharing}
          sx={{ marginLeft: '16px' }}
        >
          {screenTrack ? 'Stop Sharing' : 'Share Screen'}
        </Button>
      </Box>
    </Box>

    </>
  );
};