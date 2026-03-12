# EmailJS Setup Guide — Parental Leave Planner

This guide walks you through setting up [EmailJS](https://www.emailjs.com/) so the **Email to Me** button on your results page can send the timeline summary to the user's inbox. EmailJS is free for a limited number of emails per month and works entirely from the browser (no backend required).

---

## Step 1: Create an EmailJS account

1. Go to **https://www.emailjs.com**
2. Click **Sign Up** and create an account (email + password).
3. Confirm your email if asked.

---

## Step 2: Add an email service

EmailJS needs to know *which* email account will send the messages (e.g. your Gmail).

1. In the dashboard, open **Email Services** (left sidebar).
2. Click **Add New Service**.
3. Choose a provider (e.g. **Gmail**).
4. Follow the prompts to connect your email (you may need to enable “Less secure app access” or use an App Password for Gmail).
5. After saving, you’ll see a **Service ID** (e.g. `service_abc123`). **Copy this** — you’ll need it later.

---

## Step 3: Create an email template

The template defines the subject and body of the email. Our app will fill in variables like the user’s email and a short summary.

1. In the dashboard, open **Email Templates**.
2. Click **Create New Template**.
3. Set:
   - **Name:** e.g. `Parental Leave Summary`
   - **Subject:** e.g. `Your Parental Leave Timeline`
   - **Content:** use the variables below so EmailJS can fill them in.

Example content:

```text
Your Parental Leave Planner timeline summary is attached below.

Sent to: {{to_email}}

{{summary}}
```

4. In the **Variables** section (or in the body), make sure these variables exist (EmailJS will create them when you use `{{variable_name}}` in the template):
   - `to_email` — the address we send to
   - `summary` — short text summary of the timeline

5. Save the template and **copy the Template ID** (e.g. `template_xyz789`).

---

## Step 4: Get your public key

1. In the dashboard, go to **Account** → **API Keys** (or **Profile** → **API Keys**).
2. Copy your **Public Key** (e.g. `AbCdEfGh123456`).  
   ⚠️ Use only the **public** key in your app. Never put your **private** key in frontend code.

---

## Step 5: Add keys to your project

1. In your project root, open or create the file **`.env.local`** (it’s git-ignored so your keys stay local).
2. Add these three lines, using your real values from Steps 2–4:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz789
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=AbCdEfGh123456
```

3. Replace `service_abc123`, `template_xyz789`, and `AbCdEfGh123456` with your actual Service ID, Template ID, and Public Key.
4. Save the file and **restart your dev server** (`npm run dev`) so Next.js picks up the new env vars.

---

## Step 6: Use “Email to Me” in the app

1. Run the app and go through the form to the **Results** page.
2. Click **Email to Me**.
3. Enter your email and click **Send**.
4. Check your inbox (and spam) for the message. The body will contain the summary and the address it was sent to.

---

## Troubleshooting

- **“Missing required keys”**  
  Make sure `.env.local` has all three `NEXT_PUBLIC_*` variables and that you’ve restarted `npm run dev`.

- **Email not received**  
  Check the EmailJS dashboard **Email History** to see if the email was sent or if there was an error. Also check your spam folder and that the service (e.g. Gmail) is connected correctly.

- **Rate limits**  
  The free plan has a monthly limit. If you hit it, the request may fail; check the EmailJS dashboard for usage.

---

## Security note

The **public** key is meant to be used in the browser; EmailJS uses it to throttle and identify your account. For a production app with high traffic, consider sending email from a backend (e.g. API route or serverless function) so you don’t expose the public key in heavy or automated use.
