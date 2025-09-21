import SimpleSidebar from "./SimpleSidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <SimpleSidebar />
      <main style={{ 
        flex: 1,
        marginLeft: '250px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <div style={{ 
          flex: 1,
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto'
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}