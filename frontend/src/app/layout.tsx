import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fexa - 基本情報技術者試験過去問データベース',
  description: 'IPAが公開している基本情報技術者試験の過去問をAPI経由で検索・閲覧できるシステム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <header style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderBottom: '1px solid #e9ecef' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ margin: 0, color: '#333' }}>🎯 Fexa</h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
              基本情報技術者試験過去問データベース
            </p>
          </div>
        </header>
        
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          {children}
        </main>

        <footer style={{ backgroundColor: '#f8f9fa', padding: '2rem 1rem', marginTop: '3rem', borderTop: '1px solid #e9ecef', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>
            © 2024 Fexa - 基本情報技術者試験過去問データベース
          </p>
        </footer>
      </body>
    </html>
  );
}