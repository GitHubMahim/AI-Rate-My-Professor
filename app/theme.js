import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
    palette: {
        mode: mode,
        primary: {
            main: mode === 'light' ? '#556cd6' : '#e0e0e0',
        },
        secondary: {
            main: mode === 'light' ? '#474444' : '#474444',
        },
        error: {
            main: '#ff1744',
        },
        background: {
            default: mode === 'dark' ? '#121212' : '#e0e0e0',
            paper: mode === 'dark' ? '#333' : '#fff',
        },
    },
});
