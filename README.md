# BLGFXIII_Directory
This is all about BLGF XIII work 
Disclaimer, Not for use of Everyone!!! Exclusively for BLGF Caraga!
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/jbprestor/BLGFXIII_Directory?utm_source=oss&utm_medium=github&utm_campaign=jbprestor%2FBLGFXIII_Directory&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Deployment

### Vercel (Free Hosting)

This project is configured for deployment on Vercel (Frontend + Serverless Backend).

1.  **Push to GitHub**: Ensure your code is on GitHub.
2.  **Import Project in Vercel**: Connect your GitHub repo.
3.  **Project Settings**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `./` (Root)
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `frontend/dist`
    *   **Install Command**: `npm install` (Standard)
4.  **Environment Variables**:
    Add the following variables in Vercel > Settings > Environment Variables:
    *   `MONGO_URI`: Your MongoDB connection string.
    *   `JWT_SECRET`: Your secret key.
    *   `VITE_CLIENT_API_URL`: `/api` (Since backend is on the same domain via rewrites)
    *   `VITE_VERCEL_ENV`: `true` (Important! Tells backend to run in serverless mode)

### Local Development
To run locally:
1.  Frontend: `cd frontend && npm run dev`
2.  Backend: `cd backend && npm run dev`