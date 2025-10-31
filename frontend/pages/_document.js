import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Aura FHE Social DApp - Created with ❤️ by Auranode" />
        <meta name="theme-color" content="#6C5CE7" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="bg-gradient-to-br from-aura-dark via-gray-900 to-aura-secondary">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
