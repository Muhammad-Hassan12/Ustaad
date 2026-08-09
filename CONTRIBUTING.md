# Contributing to Ustaad

First off, thank you for considering contributing to Ustaad! It's people like you that make Ustaad such a great tool for Pakistani tech talent.

## How can I contribute?

### 1. Reporting Bugs
This section guides you through submitting a bug report.
- Check the issues to see if the bug has already been reported.
- If not, open a new issue. Include a clear and descriptive title.
- Describe the exact steps which reproduce the problem in as many details as possible.

### 2. Suggesting Enhancements
- Open an issue detailing the enhancement.
- Explain why this enhancement would be useful to most users.
- You can refer to the **Future Roadmap** section in the `README.md` for ideas on what we are currently planning.

### 3. Pull Requests
1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Project Setup

Please refer to the `README.md` for instructions on how to set up the project locally. 

- The backend is a **FastAPI** application requiring Python 3.10+.
- The frontend is a **Next.js 14** application requiring Node.js 18+.
- You will need API keys for Gemini, Serper.dev, and a Supabase project.

## Code Style

### Python (Backend)
- We follow standard PEP-8 guidelines.
- Please format your code using [Black](https://github.com/psf/black) or [Ruff](https://astral.sh/ruff).
- Ensure all functions include type hints.

### TypeScript/React (Frontend)
- We use ESLint and Prettier for code formatting. Run `npm run lint` before submitting a PR.
- Ensure strict TypeScript typing where applicable.

## Testing

Before submitting a PR, make sure you test your changes.

**Backend Tests:**
Navigate to the `backend` directory and run the test suite using pytest:
```bash
cd backend
pytest
```

If you add a new agent or modify the pipeline, please add corresponding tests.

## Questions?
If you have any questions, feel free to open an issue or start a discussion.

Thank you for contributing!
