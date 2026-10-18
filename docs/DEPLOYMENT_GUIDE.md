# EcoNexa — Production Deployment Guide

This guide details deploying the three modular tiers of EcoNexa:
1. **Frontend**: React (Vite) on Vercel / Netlify
2. **Backend**: Node.js & Socket.IO on Render / Railway / AWS EC2
3. **Database**: MongoDB Atlas Cloud
4. **AI/ML Service**: FastAPI on Render / Railway / Docker / AWS

---

## 1. MongoDB Atlas Setup

1. Create a free M0 or production cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Security > Database Access**, create a user (e.g. `smartwaste_admin`).
3. Under **Security > Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`) or enter your backend server's static IP.
4. Go to **Database > Connect > Drivers > Node.js** and copy your connection string:
   ```
   mongodb+srv://smartwaste_admin:<PASSWORD>@cluster0.abcde.mongodb.net/smartwaste?retryWrites=true&w=majority
   ```

---

## 2. Deploying Python ML Service (FastAPI)

### Option A: Render / Railway
1. Set the root directory to `ml_service/`.
2. Build command:
   ```bash
   pip install -r requirements.txt
   python model_trainer.py
   ```
3. Start command:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port $PORT
   ```
4. Copy the public service URL (e.g. `https://smartwaste-ml.onrender.com`).

---

## 3. Deploying Node.js Express Backend

### Option A: Render / Railway / Heroku
1. Set root directory to `backend/`.
2. Environment Variables:
   | Variable | Example Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `5000` | Server listening port |
   | `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas URI |
   | `JWT_SECRET` | `super_secure_random_hash_2026` | Auth signing secret |
   | `CLIENT_URL` | `https://smartwaste.vercel.app` | Allowed CORS frontend URL |
   | `ML_SERVICE_URL` | `https://smartwaste-ml.onrender.com` | Python ML endpoint |
   | `IOT_API_KEY` | `iot_smartwaste_sensor_auth_key_8899` | Hardware sensor key |
   | `SIMULATOR_INTERVAL_MS` | `5000` | Sensor polling cycle |

3. Build & Start:
   ```bash
   npm install
   npm start
   ```

---

## 4. Deploying Frontend (Vercel / Netlify)

1. Connect your repository to [Vercel](https://vercel.com).
2. Set root directory to `frontend`.
3. Framework Preset: **Vite**.
4. Environment Variables:
   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://smartwaste-backend.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://smartwaste-backend.onrender.com` |
5. Click **Deploy**. Vercel will run `npm run build` and publish your modern UI to global edge CDN.
