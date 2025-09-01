import axios from "axios"


//change this to backend URL
const api = axios.create({
    baseURL: "https://potential-engine-r6gxvwjx56v3vq5-5001.app.github.dev"
})

export default api;