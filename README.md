# Cozy Quiz Nook

A cozy, dark-themed AI-powered quiz application that creates quizzes on
virtually any topic using the Google Gemini API. You can also generate
quizzes from your own study documents.

## Features

-   **AI-generated quizzes:** Create questions for a topic of your
    choice.
-   **Customizable quizzes:** Choose the number of questions and
    difficulty.
-   **Document-based quizzes:** Upload supported TXT, MD, PDF, or DOCX
    files to generate questions from their content.
-   **Hints and explanations:** Get hints while answering and
    explanations when reviewing answers.
-   **Quiz results:** Review your score and answers after completing a
    quiz.
-   **Study-friendly interface:** A cozy dark theme with separate areas
    for quiz creation and other study features.

## Tech Stack

-   HTML, CSS, and JavaScript
-   Node.js and Express
-   Google Gemini API using the `@google/genai` JavaScript SDK
-   Multer for file uploads
-   `pdf-parse` and `mammoth` for extracting PDF and DOCX text

## Run Locally

### Requirements

-   Node.js (18 or later recommended)
-   npm
-   A Google Gemini API key

### 1. Clone the repository

``` bash
git clone https://github.com/YOUR_USERNAME/cozy-quiz-nook.git
cd cozy-quiz-nook
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a file named `.env` in the project root (the same folder as
`package.json`):

``` env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
PORT=3000
```

Get an API key from [Google AI
Studio](https://aistudio.google.com/app/apikey).

**Keep your API key private.** Never commit `.env` or place the key in
frontend files. Ensure `.gitignore` excludes `.env`.

### 4. Start the application

``` bash
npm start
```

Open <http://localhost:3000>.

## Deploy on Render

This project requires a Node.js web service because Gemini API requests
are handled by the Express backend.

1.  Push the project to GitHub.
2.  In [Render](https://render.com/), choose **New + → Web Service**.
3.  Connect the GitHub repository.
4.  Configure the service:

  -----------------------------------------------------------------------
  Setting                             Value
  ----------------------------------- -----------------------------------
  Runtime                             Node

  Build command                       `npm install`

  Start command                       `npm start`

  Root directory                      Leave blank if `package.json` is in
                                      the repository root
  -----------------------------------------------------------------------

5.  Add these environment variables in Render:

  Name               Value
  ------------------ -------------------------
  `GEMINI_API_KEY`   Your Gemini API key
  `GEMINI_MODEL`     `gemini-3.5-flash-lite`

Do not set `PORT` manually on Render; the platform supplies it.

6.  Create the Web Service and wait for deployment to finish.
7.  Open the public URL provided by Render.

Free hosting plans may spin down after inactivity, so the first request
after a quiet period can take longer.

## Supported Document Formats

-   `.txt`
-   `.md`
-   `.pdf` (text-based PDFs; scanned PDFs may require OCR)
-   `.docx`

Uploaded document size and extracted text are limited by the
application.

## Project Structure

``` text
cozy-quiz-nook/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server/
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
```

## Security Notes

-   Keep `GEMINI_API_KEY` on the server in environment variables.
-   Do not commit `.env` or expose API keys in browser-side JavaScript.
-   If an API key is accidentally published, revoke it in Google AI
    Studio and create a replacement.
-   Gemini API availability, quotas, and rate limits depend on your
    Google AI Studio account and current plan.

## License

No license has been specified yet. Add a `LICENSE` file if you want to
publish this project under an open-source license.
