import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const mailService = axios.create({
  baseURL: process.env.MS_MAIL_BASE_URL,
});

export default mailService;
