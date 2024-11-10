import React, { useState } from 'react';
import { Drawer, IconButton, List, ListItem, ListItemText, Box, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Import icon for demonstration

const MessageBox = ({ messages }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = (open) => {
    setIsOpen(open);
  };

  return (
    <>
      {/* IconButton to toggle drawer */}
      <IconButton
        onClick={() => toggleDrawer(!isOpen)}
        sx={{ position: 'fixed', bottom: 10, left: 10, backgroundColor: 'primary.main', color: 'white' }}
      >
        <NotificationsIcon />
      </IconButton>

      {/* Drawer component to display messages */}
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={() => toggleDrawer(false)}
        PaperProps={{
          sx: { width: 300 },
        }}
      >
        <Box
          sx={{ padding: 2, display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          {/* IconButton for closing the drawer */}
          <IconButton
            onClick={() => toggleDrawer(false)}
            sx={{ alignSelf: 'flex-end', marginBottom: 2, backgroundColor: 'primary.main', color: 'white' }}
          >
            <CloseIcon />
          </IconButton>

          <List>
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <ListItem 
                  key={index} 
                  sx={{ 
                    padding: 1, 
                    borderRadius: 1, 
                    backgroundColor: 'background.paper', 
                    marginBottom: 1,
                    boxShadow: 1 // Add shadow for better visibility
                  }}
                >
                  <NotificationsIcon sx={{ marginRight: 1}} /> {/* Example icon */}
                  <ListItemText primary={msg} />
                  <Divider/>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No Notice" />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default MessageBox;
