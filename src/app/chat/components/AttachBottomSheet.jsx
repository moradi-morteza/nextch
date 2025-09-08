"use client";

import { useEffect } from "react";
import { Drawer, Box, Typography } from "@mui/material";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";

export default function AttachBottomSheet({ 
  open, 
  onClose, 
  onCameraCapture, 
  onPickImages, 
  onPickFile,
  isMobile,
  hasCamera 
}) {
  const options = [
    ...(isMobile && hasCamera ? [{
      id: 'camera',
      label: 'دوربین',
      icon: <PhotoCameraRoundedIcon sx={{ fontSize: 32 }} />,
      action: onCameraCapture,
      accept: 'image/*',
      capture: 'environment',
      color: '#ef4444' // red
    }] : []),
    {
      id: 'images',
      label: isMobile ? 'گالری' : 'تصاویر',
      icon: isMobile ? <PhotoLibraryRoundedIcon sx={{ fontSize: 32 }} /> : <ImageRoundedIcon sx={{ fontSize: 32 }} />,
      action: onPickImages,
      accept: 'image/*',
      multiple: true,
      color: '#06b6d4' // cyan
    },
    {
      id: 'file',
      label: 'فایل',
      icon: <InsertDriveFileRoundedIcon sx={{ fontSize: 32 }} />,
      action: onPickFile,
      accept: '*/*',
      color: '#8b5cf6' // violet
    }
  ];

  const handleOptionClick = (option) => {
    // Create a hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = option.accept;
    if (option.multiple) input.multiple = true;
    if (option.capture) input.capture = option.capture;
    
    input.onchange = (e) => {
      option.action(e);
      onClose();
    };
    
    input.click();
  };

  // Handle back button to close bottom sheet
  useEffect(() => {
    if (!open) return;

    const handlePopState = (event) => {
      event.preventDefault();
      onClose();
    };

    // Push a new state when bottom sheet opens
    window.history.pushState({ bottomSheet: true }, '');
    
    // Listen for back button
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up: go back if we added a state and sheet is still open
      if (window.history.state?.bottomSheet) {
        window.history.back();
      }
    };
  }, [open, onClose]);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }
      }}
    >
      <Box sx={{ pb: 2 }}>
        {/* Handle bar */}
        <Box
          sx={{
            width: 32,
            height: 4,
            backgroundColor: '#ddd',
            borderRadius: 2,
            mx: 'auto',
            mt: 1,
            mb: 2
          }}
        />
        
        {/* Title */}
        <Typography 
          variant="h6" 
          sx={{ 
            textAlign: 'center',
            fontFamily: 'inherit',
            mb: 1,
            color: '#1f2937'
          }}
        >
          پیوست فایل
        </Typography>

        {/* Options - Horizontal Layout */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          alignItems: 'center',
          px: 3,
          py: 2 
        }}>
          {options.map((option) => (
            <Box
              key={option.id}
              onClick={() => handleOptionClick(option)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                minWidth: '80px',
                py: 1.5,
                px: 1,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                  transform: 'scale(1.05)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              {/* Icon Circle */}
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: option.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  color: 'white'
                }}
              >
                {option.icon}
              </Box>
              
              {/* Label */}
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: 500,
                  textAlign: 'center'
                }}
              >
                {option.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Drawer>
  );
}