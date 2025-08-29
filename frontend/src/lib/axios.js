import axios from "axios"

const api = axios.create({
    baseURL: "https://automatic-tribble-grqpw6gp9pq39jqx-5001.app.github.dev/api/directory"
})

export default api;