# Rakyzu Converter

**Rakyzu Converter** is a free, privacy-first, browser-based web application for image and video processing. All operations execute locally in the user's browser. No files are uploaded to any remote server.

## Features (Planned / In Progress)

1. **Website Foundation** – Complete branding, navigation, responsive layout, and homepage under the name **Rakyzu Converter**.
2. **Image Compression** – Adjustable quality, dimensions, and format preferences.
3. **Video Compression** – User-configurable settings, maximum file size 500 MB.
4. **AI HD Background Removal** – Open-source AI models running client-side.
5. **AI Photo Enhancement** – Convert blurry photos to higher definition using open-source AI.
6. **Format Conversion** – Bidirectional conversion among JPG, PNG, SVG, WebP, and ICO/Favicon.
7. **Rare / Unique Tools** – Additional specialized utilities not commonly found on other websites.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Source Control**: GitHub
- **Client-side Libraries** (selected):
  - `browser-image-compression`
  - `@ffmpeg/ffmpeg` + `@ffmpeg/util`
  - `@imgly/background-removal`
  - Lucide React (icons)

## Getting Started (Local Development)

```bash
# Clone the repository
git clone <your-repo-url>
cd rakyzu-converter

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment on Vercel

1. Push the repository to GitHub.
2. Import the project in the Vercel dashboard.
3. Vercel will automatically detect Next.js and configure the build.
4. Deploy.

### Custom Domain Configuration

1. In the Vercel project dashboard, navigate to **Settings → Domains**.
2. Enter your custom domain (for example, `converter.rakyzu.com` or `rakyzuconverter.com`).
3. Follow the DNS instructions provided by Vercel (usually adding a CNAME or A record at your domain registrar).
4. Once DNS propagates, Vercel issues an SSL certificate automatically.

No code changes are required for a custom domain; configuration is performed entirely through the Vercel interface.

## Project Structure

```
rakyzu-converter/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles + Tailwind
├── components/
│   ├── Header.tsx
│   └── Footer.tsx
├── lib/
│   └── utils.ts
├── public/
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Development Guidelines

- Features are implemented one at a time.
- If any single feature approaches 3,000 lines of code, it will be split and completed in stages upon request.
- All media processing prioritizes client-side execution for privacy.

## License

This project is provided for development and educational purposes. Specific licensing will be determined by the project owner.

---

**Rakyzu Converter** – Free. Private. Powerful.
