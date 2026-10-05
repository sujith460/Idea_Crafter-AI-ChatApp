# 🚀 IdeaCrafter (StartupMentor)

IdeaCrafter is an AI-powered platform designed to bridge the gap between **Entrepreneurs** and **Investors**. By acting as a personalized business and investment advisor, it provides tailored insights, market analysis, pitch feedback, and portfolio strategies. 

**Live Demo:** [IdeaCrafter on Vercel](https://idea-crafter-theta.vercel.app/)

![IdeaCrafter Banner](https://images.unsplash.com/photo-1556761175-5973dc0f32d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

### 🧠 Dual Persona AI Assistant
IdeaCrafter adapts its behavior based on your user profile:
- **For Entrepreneurs:** Get instant feedback on your pitch deck, strategize your fundraising rounds, refine your business model, and analyze market trends.
- **For Investors:** Evaluate potential startup deals, stay updated on industry trends, manage your portfolio strategy, and explore valuation methods.

### 📊 Startup Analyzer
An intelligent analysis tool that tracks your startup's progress. It provides:
- Stage prediction and milestone tracking
- Risk assessment and mitigation strategies
- Actionable recommendations based on your current funding and team size

### 💬 Persistent Chat History
Never lose a great idea. All your conversations with the AI Assistant are securely saved, allowing you to revisit past advice, continue ongoing discussions, or export the chats for your records.

---

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **AI Integration:** [Groq API](https://groq.com/) for lightning-fast, highly capable AI responses
- **Deployment:** [Vercel](https://vercel.com/)

---

## 🚀 Getting Started Locally

### Prerequisites
Make sure you have Node.js (v18+) and npm/yarn/pnpm installed. You will also need accounts for [Supabase](https://supabase.com/) and [Groq](https://console.groq.com/).

### 1. Clone the repository
```bash
git clone https://github.com/santhosh-6938/IdeaCrafter.git
cd IdeaCrafter
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env.local` file in the root directory and add your API keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq AI API Key
GROQ_API_KEY=your_groq_api_key
```

### 4. Database Setup
Run the SQL migration scripts located in the `scripts/` folder inside your Supabase project's SQL Editor to create the necessary tables (`profiles`, `chats`) and set up Row Level Security (RLS).

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

---

## 🛡️ Authentication & Security
IdeaCrafter uses Supabase Auth. To test login locally or in production, ensure your domain (e.g., `http://localhost:3000` or your Vercel URL) is added to the **Redirect URLs** list in your Supabase Dashboard under `Authentication -> URL Configuration`.

---

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
