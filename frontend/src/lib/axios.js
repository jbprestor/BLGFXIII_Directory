import axios from "axios"


//change this to backend URL
const api = axios.create({
    baseURL: "https://cuddly-xylophone-wjxpw69g425pg7-5001.app.github.dev"
})

export default api;