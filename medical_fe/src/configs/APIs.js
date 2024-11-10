import axios from "axios";

const BASE_URL = 'http://localhost:3000';

export const endpoints = {
    login: '/auth/login/',
    specialty: '/specialty/',
    degrees: '/degrees/',
    doctors: '/doctors/',
    appointments: '/appointments/',
    user:'/user/',
    reviews:'/reviews/',
    patients:'/patients/'
};

export default axios.create({
    baseURL: BASE_URL
});
