This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Running the Frontend (Local Development)

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
