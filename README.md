# HomeMatch

HomeMatch is a real estate home browser web application that enables users to efficiently explore and compare residential properties through intelligent search, filtering, and personalized browsing features.

## Running the Frontend Locally

### 1. Install Volta (if not already installed)

Volta ensures the correct Node version is used automatically:
**Mac / Linux**

```bash
curl https://get.volta.sh | bash
```

**Windows (using Winget)**

```powershell
winget install Volta.Volta
```

- After installation, restart your terminal or PowerShell.
- Volta will automatically use the Node version pinned in the repo.

### 2. Clone the repository (if not done yet)

```bash
git clone https://github.com/Tohutson/HomeMatch.git
cd HomeMatch/frontend
```

### 3. Install dependencies

Volta will automatically use the pinned Node version from the repo:

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).